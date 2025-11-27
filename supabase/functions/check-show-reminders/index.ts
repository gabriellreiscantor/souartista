import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Show {
  id: string;
  uid: string;
  venue_name: string;
  date_local: string;
  time_local: string;
  team_musician_ids: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[check-show-reminders] Starting check...');

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinutes;

    // Busca todos os shows nos próximos 7 dias
    const { data: shows, error: showsError } = await supabase
      .from('shows')
      .select('id, uid, venue_name, date_local, time_local, team_musician_ids')
      .gte('date_local', today)
      .lte('date_local', in7Days)
      .order('date_local', { ascending: true });

    if (showsError) {
      console.error('[check-show-reminders] Error fetching shows:', showsError);
      throw showsError;
    }

    console.log(`[check-show-reminders] Found ${shows?.length || 0} upcoming shows`);

    let notificationsSent = 0;

    for (const show of shows || []) {
      const userIds = [show.uid, ...(show.team_musician_ids || [])];
      
      // Determina os tipos de notificação para este show
      const notificationTypes: string[] = [];
      
      if (show.date_local === in7Days) {
        notificationTypes.push('7_days');
      }
      if (show.date_local === in1Day) {
        notificationTypes.push('1_day');
      }
      if (show.date_local === today) {
        notificationTypes.push('today');
        
        // Verifica se é cerca de 3 horas antes
        if (show.time_local) {
          const [hours, minutes] = show.time_local.split(':').map(Number);
          const showTimeInMinutes = hours * 60 + minutes;
          const diffMinutes = showTimeInMinutes - currentTimeInMinutes;
          
          // Se está entre 2h45 e 3h15 antes do show
          if (diffMinutes >= 165 && diffMinutes <= 195) {
            notificationTypes.push('3_hours');
          }
        }
      }

      // Envia notificações
      for (const notificationType of notificationTypes) {
        for (const userId of userIds) {
          // Verifica se já enviou essa notificação
          const { data: existingLog } = await supabase
            .from('show_notification_logs')
            .select('id')
            .eq('show_id', show.id)
            .eq('user_id', userId)
            .eq('notification_type', notificationType)
            .single();

          if (existingLog) {
            console.log(`[check-show-reminders] Notification already sent: ${notificationType} for show ${show.id} to user ${userId}`);
            continue;
          }

          // Cria mensagem personalizada
          let title = '';
          let message = '';
          
          switch (notificationType) {
            case '7_days':
              title = '📅 Show em 1 semana!';
              message = `Show no ${show.venue_name} em 7 dias! Já se preparou?`;
              break;
            case '1_day':
              title = '⏰ Amanhã é dia de show!';
              message = `Amanhã tem show no ${show.venue_name} às ${show.time_local}`;
              break;
            case 'today':
              title = '🎸 HOJE tem show!';
              message = `Hoje tem show no ${show.venue_name} às ${show.time_local} - Arrase!`;
              break;
            case '3_hours':
              title = '🚨 Faltam 3 horas para o show!';
              message = `${show.venue_name} às ${show.time_local} - Hora de se preparar!`;
              break;
          }

          // Cria notificação user-specific
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              title,
              message,
              link: show.uid === userId ? '/artist/shows' : '/musician/shows',
              user_id: userId, // Notificação específica para este usuário
            });

          if (notifError) {
            console.error(`[check-show-reminders] Error creating notification:`, notifError);
            continue;
          }

          // Envia push notification
          try {
            await supabase.functions.invoke('send-push-notification', {
              body: {
                userId,
                title,
                body: message,
                link: show.uid === userId ? '/artist/shows' : '/musician/shows',
              },
            });
          } catch (pushError) {
            console.error(`[check-show-reminders] Error sending push:`, pushError);
          }

          // Registra log
          const { error: logError } = await supabase
            .from('show_notification_logs')
            .insert({
              show_id: show.id,
              user_id: userId,
              notification_type: notificationType,
            });

          if (logError) {
            console.error(`[check-show-reminders] Error creating log:`, logError);
          } else {
            notificationsSent++;
            console.log(`[check-show-reminders] Sent ${notificationType} notification for show ${show.id} to user ${userId}`);
          }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
