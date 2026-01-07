import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPushToUser } from '../_shared/fcm-sender.ts';
import { 
  getCurrentTimeInTimezone, 
  getRelativeDatesInTimezone,
  getMinutesUntilShowTime
} from '../_shared/timezone-utils.ts';

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

        // Calculate dates relative to user's timezone
        const { today, tomorrow, in7Days } = getRelativeDatesInTimezone(userTimezone);

        // Determine notification types for this user/show combination
        const notificationTypes: string[] = [];

        if (show.date_local === in7Days) {
          notificationTypes.push('7_days');
        }
        if (show.date_local === tomorrow) {
          notificationTypes.push('1_day');
        }
        if (show.date_local === today) {
          notificationTypes.push('today');
          
          // Check if ~3 hours before the show in user's timezone
          if (show.time_local) {
            const minutesUntilShow = getMinutesUntilShowTime(show.time_local, userTimezone);
            
            // Between 2h45 and 3h15 before the show
            if (minutesUntilShow >= 165 && minutesUntilShow <= 195) {
              notificationTypes.push('3_hours');
            }
          }
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
