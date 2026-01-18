import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPushToUser } from '../_shared/fcm-sender.ts';
import { 
  getCurrentTimeInTimezone, 
  getRelativeDatesInTimezone,
  getMinutesUntilShow
} from '../_shared/timezone-utils.ts';

// ===== NOTIFICATION OFFSET SYSTEM =====
// All notifications are based on time offset from show start time
// No notifications should be based on "day change" logic
const NOTIFICATION_WINDOWS = {
  '7_days': { min: 10050, max: 10110 },     // 7 days ± 30min (10080 min = 7 days)
  '3_days': { min: 4290, max: 4350 },       // 3 days ± 30min (4320 min = 3 days)
  '1_day': { min: 1410, max: 1470 },        // 1 day ± 30min (1440 min = 24h)
  '3_hours': { min: 165, max: 195 },        // 3 hours ± 15min (180 min = 3h)
  '30_minutes': { min: 25, max: 35 },       // 30 min ± 5min
};

// Special: "HOJE tem show" fires at 9 AM on show day (fixed time, not offset)
const TODAY_MORNING_HOUR = 9;
const TODAY_MORNING_WINDOW = { minMinute: 0, maxMinute: 10 };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

interface Show {
  id: string;
  uid: string;
  venue_name: string;
  date_local: string;
  time_local: string;
  team_musician_ids: string[];
  profiles: { name: string; timezone: string | null }[] | null;
}

interface UserDevice {
  user_id: string;
  timezone: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[check-show-reminders] Starting timezone-aware check...');

    // Fetch all shows in a reasonable date range (7 days ahead using UTC as baseline)
    const now = new Date();
    const maxDate = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const minDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch shows with owner profile
    const { data: shows, error: showsError } = await supabase
      .from('shows')
      .select('id, uid, venue_name, date_local, time_local, team_musician_ids, profiles:uid (name, timezone)')
      .gte('date_local', minDate)
      .lte('date_local', maxDate)
      .order('date_local', { ascending: true });

    if (showsError) {
      console.error('[check-show-reminders] Error fetching shows:', showsError);
      throw showsError;
    }

    console.log(`[check-show-reminders] Found ${shows?.length || 0} shows in date range`);

    // Get all user devices with timezones for quick lookup
    const { data: userDevices, error: devicesError } = await supabase
      .from('user_devices')
      .select('user_id, timezone')
      .not('fcm_token', 'is', null);

    if (devicesError) {
      console.error('[check-show-reminders] Error fetching devices:', devicesError);
    }

    // Create timezone lookup map (prefer device timezone, fallback to profile)
    const userTimezones: Record<string, string> = {};
    for (const device of userDevices || []) {
      if (device.timezone) {
        userTimezones[device.user_id] = device.timezone;
      }
    }

    // Get profiles for team musicians
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, timezone');

    if (!profilesError && allProfiles) {
      for (const profile of allProfiles) {
        if (!userTimezones[profile.id] && profile.timezone) {
          userTimezones[profile.id] = profile.timezone;
        }
      }
    }

    let notificationsSent = 0;

    for (const show of shows || []) {
      const allUserIds = [show.uid, ...(show.team_musician_ids || [])];
      
      for (const userId of allUserIds) {
        // Get user's timezone
        const userTimezone = userTimezones[userId] || 
                            show.profiles?.[0]?.timezone || 
                            DEFAULT_TIMEZONE;

        // ===== NEW: Calculate minutes until show (date + time based) =====
        const minutesUntilShow = getMinutesUntilShow(
          show.date_local,
          show.time_local || '20:00', // fallback to 20:00 if no time
          userTimezone
        );

        console.log(`[check-show-reminders] Show ${show.id} for user ${userId}: minutesUntilShow=${minutesUntilShow}, tz=${userTimezone}`);

        // Determine notification types based on TIME OFFSET (not date comparison)
        const notificationTypes: string[] = [];

        // 7 days before (10080 min ± 30min)
        if (minutesUntilShow >= NOTIFICATION_WINDOWS['7_days'].min && 
            minutesUntilShow <= NOTIFICATION_WINDOWS['7_days'].max) {
          notificationTypes.push('7_days');
        }

        // 3 days before (4320 min ± 30min) - NEW!
        if (minutesUntilShow >= NOTIFICATION_WINDOWS['3_days'].min && 
            minutesUntilShow <= NOTIFICATION_WINDOWS['3_days'].max) {
          notificationTypes.push('3_days');
        }

        // 1 day before (1440 min ± 30min)
        if (minutesUntilShow >= NOTIFICATION_WINDOWS['1_day'].min && 
            minutesUntilShow <= NOTIFICATION_WINDOWS['1_day'].max) {
          notificationTypes.push('1_day');
        }

        // "HOJE tem show" - Fires at 9:00 AM on show day (NOT at midnight!)
        // Only if show is TODAY and current time is between 9:00 and 9:10
        const { today } = getRelativeDatesInTimezone(userTimezone);
        const localTime = getCurrentTimeInTimezone(userTimezone);
        const currentHour = localTime.getHours();
        const currentMinute = localTime.getMinutes();
        
        if (show.date_local === today && 
            currentHour === TODAY_MORNING_HOUR && 
            currentMinute >= TODAY_MORNING_WINDOW.minMinute && 
            currentMinute <= TODAY_MORNING_WINDOW.maxMinute) {
          notificationTypes.push('today');
        }

        // 3 hours before (180 min ± 15min)
        if (minutesUntilShow >= NOTIFICATION_WINDOWS['3_hours'].min && 
            minutesUntilShow <= NOTIFICATION_WINDOWS['3_hours'].max) {
          notificationTypes.push('3_hours');
        }

        // 30 minutes before (30 min ± 5min)
        if (minutesUntilShow >= NOTIFICATION_WINDOWS['30_minutes'].min && 
            minutesUntilShow <= NOTIFICATION_WINDOWS['30_minutes'].max) {
          notificationTypes.push('30_minutes');
        }

        // Process each notification type
        for (const notificationType of notificationTypes) {
          // Check if already sent
          const { data: existingLog } = await supabase
            .from('show_notification_logs')
            .select('id')
            .eq('show_id', show.id)
            .eq('user_id', userId)
            .eq('notification_type', notificationType)
            .single();

          if (existingLog) {
            console.log(`[check-show-reminders] Already sent ${notificationType} for show ${show.id} to user ${userId}`);
            continue;
          }

          // Insert log first (prevents race conditions)
          const { error: logError } = await supabase
            .from('show_notification_logs')
            .insert({
              show_id: show.id,
              user_id: userId,
              notification_type: notificationType,
            });

          if (logError) {
            console.log(`[check-show-reminders] Log exists for ${notificationType}, skipping:`, logError.message);
            continue;
          }

          // Build notification message
          const isOwner = userId === show.uid;
          const artistName = show.profiles?.[0]?.name || 'o artista';
          let title = '';
          let message = '';

          switch (notificationType) {
            case '7_days':
              title = '📅 Show em 1 semana!';
              message = isOwner
                ? `Seu show no ${show.venue_name} em 7 dias! Já se preparou?`
                : `Show com ${artistName} no ${show.venue_name} em 7 dias! Já se preparou?`;
              break;
            case '3_days':
              title = '📆 Show em 3 dias!';
              message = isOwner
                ? `Seu show no ${show.venue_name} em 3 dias! Já verificou tudo?`
                : `Show com ${artistName} no ${show.venue_name} em 3 dias! Já verificou tudo?`;
              break;
            case '1_day':
              title = '⏰ Amanhã é dia de show!';
              message = isOwner
                ? `Amanhã tem seu show no ${show.venue_name} às ${show.time_local}`
                : `Amanhã tem show com ${artistName} no ${show.venue_name} às ${show.time_local}`;
              break;
            case 'today':
              title = '🎸 HOJE tem show!';
              message = isOwner
                ? `Hoje tem seu show no ${show.venue_name} às ${show.time_local} - Arrase!`
                : `Hoje tem show com ${artistName} no ${show.venue_name} às ${show.time_local} - Arrase!`;
              break;
            case '3_hours':
              title = isOwner ? '🚨 Faltam 3 horas para seu show!' : '🚨 Faltam 3 horas para o show!';
              message = isOwner
                ? `Seu show no ${show.venue_name} às ${show.time_local} - Hora de se preparar!`
                : `Show com ${artistName} no ${show.venue_name} às ${show.time_local} - Hora de se preparar!`;
              break;
            case '30_minutes':
              title = isOwner ? '⚡ Faltam 30 minutos!' : '⚡ Faltam 30 minutos para o show!';
              message = isOwner
                ? `Seu show no ${show.venue_name} às ${show.time_local} está quase começando!`
                : `Show com ${artistName} no ${show.venue_name} às ${show.time_local} está quase começando!`;
              break;
          }

          // Create in-app notification
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              title,
              message,
              link: show.uid === userId ? '/artist/shows' : '/musician/shows',
              user_id: userId,
            });

          if (notifError) {
            console.error(`[check-show-reminders] Error creating notification:`, notifError);
            continue;
          }

          // Send push notification
          try {
            const pushResult = await sendPushToUser({
              supabaseAdmin: supabase,
              userId,
              title,
              body: message,
              link: show.uid === userId ? '/artist/shows' : '/musician/shows',
              source: 'show_reminder',
            });
            console.log(`[check-show-reminders] Push for ${userId} (tz: ${userTimezone}): sent=${pushResult.sent}, failed=${pushResult.failed}`);
          } catch (pushError) {
            console.error(`[check-show-reminders] Push error:`, pushError);
          }

          notificationsSent++;
          console.log(`[check-show-reminders] Sent ${notificationType} for show ${show.id} to ${userId} (timezone: ${userTimezone})`);
        }
      }
    }

    console.log(`[check-show-reminders] Completed. Sent ${notificationsSent} notifications.`);

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent,
        showsChecked: shows?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[check-show-reminders] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
