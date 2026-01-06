import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPushToUser } from '../_shared/fcm-sender.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lista de 15 dicas de engajamento
const ENGAGEMENT_TIPS = [
  {
    id: 'tip_cadastre_shows',
    title: '📅 Atualize seus shows!',
    message: 'Lembre-se de cadastrar seus shows para manter seu calendário sempre atualizado e não perder nenhuma apresentação!',
    link: '/artist/shows'
  },
  {
    id: 'tip_relatorios',
    title: '📊 Confira seus relatórios',
    message: 'Já viu seus relatórios? Acompanhe sua evolução financeira e veja quanto você ganhou!',
    link: '/artist/reports'
  },
  {
    id: 'tip_locais',
    title: '📍 Cadastre seus locais',
    message: 'Cadastre os locais onde você costuma tocar para agilizar o registro de novos shows!',
    link: '/artist/venues'
  },
  {
    id: 'tip_musicos',
    title: '🎵 Gerencie sua equipe',
    message: 'Mantenha sua lista de músicos atualizada para facilitar na hora de montar a formação!',
    link: '/artist/musicians'
  },
  {
    id: 'tip_transporte',
    title: '🚗 Controle de locomoção',
    message: 'Registre suas despesas de transporte para ter um relatório completo dos seus custos!',
    link: '/artist/transportation'
  },
  {
    id: 'tip_calendario',
    title: '📆 Visualize seu calendário',
    message: 'Use a visão de calendário para ter uma perspectiva completa da sua agenda de shows!',
    link: '/artist/calendar'
  },
  {
    id: 'tip_perfil',
    title: '👤 Complete seu perfil',
    message: 'Mantenha seu perfil sempre atualizado com foto e informações profissionais!',
    link: '/artist/profile'
  },
  {
    id: 'tip_caches',
    title: '💰 Acompanhe seus cachês',
    message: 'Veja o total de cachês do mês e compare com meses anteriores nos relatórios!',
    link: '/artist/reports'
  },
  {
    id: 'tip_eventos_privados',
    title: '🎉 Shows privados',
    message: 'Não esqueça de marcar eventos privados como casamentos e festas para um relatório mais preciso!',
    link: '/artist/shows'
  },
  {
    id: 'tip_despesas',
    title: '💸 Registre despesas',
    message: 'Anote as despesas de cada show para saber seu lucro real!',
    link: '/artist/shows'
  },
  {
    id: 'tip_exportar',
    title: '📤 Exporte relatórios',
    message: 'Você pode exportar seus relatórios em PDF para compartilhar ou guardar!',
    link: '/artist/reports'
  },
  {
    id: 'tip_dicas_gerais',
    title: '💡 Dica do SouArtista',
    message: 'Quanto mais shows você cadastrar, mais preciso será seu acompanhamento financeiro!',
    link: '/artist/dashboard'
  },
  {
    id: 'tip_backup',
    title: '☁️ Seus dados estão seguros',
    message: 'Todos os seus shows e dados são salvos automaticamente na nuvem!',
    link: '/artist/dashboard'
  },
  {
    id: 'tip_suporte',
    title: '🆘 Precisa de ajuda?',
    message: 'Tem dúvidas? Acesse o suporte para falar diretamente com nossa equipe!',
    link: '/artist/support'
  },
  {
    id: 'tip_novidades',
    title: '🚀 Novidades',
    message: 'Fique de olho nas atualizações do app! Sempre estamos melhorando para você!',
    link: '/artist/updates'
  }
];

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🎯 Starting engagement tips job...');

    // Buscar usuários ativos (com plano ativo)
    const { data: activeUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, status_plano')
      .eq('status_plano', 'active');

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      throw usersError;
    }

    console.log(`📋 Found ${activeUsers?.length || 0} active users`);

    let tipsSent = 0;
    let usersSkipped = 0;

    for (const user of activeUsers || []) {
      try {
        // Verificar se o usuário recebeu alguma dica nos últimos 3 dias
        const threeDaysAgo = new Date(Date.now() - THREE_DAYS_MS).toISOString();
        
        const { data: recentTip, error: recentError } = await supabase
          .from('engagement_tip_logs')
          .select('sent_at')
          .eq('user_id', user.id)
          .gte('sent_at', threeDaysAgo)
          .limit(1);

        if (recentError) {
          console.error(`❌ Error checking recent tips for user ${user.id}:`, recentError);
          continue;
        }

        // Se recebeu dica recentemente, pular
        if (recentTip && recentTip.length > 0) {
          console.log(`⏭️ User ${user.id} received tip recently, skipping`);
          usersSkipped++;
          continue;
        }

        // Buscar quais dicas o usuário já recebeu
        const { data: receivedTips, error: receivedError } = await supabase
          .from('engagement_tip_logs')
          .select('tip_id')
          .eq('user_id', user.id);

        if (receivedError) {
          console.error(`❌ Error fetching received tips for user ${user.id}:`, receivedError);
          continue;
        }

        const receivedTipIds = (receivedTips || []).map(t => t.tip_id);
        
        // Filtrar dicas não recebidas
        let availableTips = ENGAGEMENT_TIPS.filter(tip => !receivedTipIds.includes(tip.id));

        // Se todas foram recebidas, limpar o log e reiniciar o ciclo
        if (availableTips.length === 0) {
          console.log(`🔄 User ${user.id} received all tips, resetting cycle`);
          
          await supabase
            .from('engagement_tip_logs')
            .delete()
            .eq('user_id', user.id);
          
          availableTips = ENGAGEMENT_TIPS;
        }

        // Escolher dica aleatória
        const randomIndex = Math.floor(Math.random() * availableTips.length);
        const selectedTip = availableTips[randomIndex];

        console.log(`📨 Sending tip "${selectedTip.id}" to user ${user.id}`);

        // Criar notificação no banco
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            title: selectedTip.title,
            message: selectedTip.message,
            link: selectedTip.link,
          });

        if (notifError) {
          console.error(`❌ Error creating notification for user ${user.id}:`, notifError);
          continue;
        }

        // Enviar push notification diretamente via FCM (não via functions.invoke)
        try {
          const pushResult = await sendPushToUser({
            supabaseAdmin: supabase,
            userId: user.id,
            title: selectedTip.title,
            body: selectedTip.message,
            link: selectedTip.link,
          });
          console.log(`📱 Push result for ${user.id}: sent=${pushResult.sent}, failed=${pushResult.failed}`);
        } catch (pushError) {
          console.warn(`⚠️ Push notification failed for user ${user.id}:`, pushError);
          // Continua mesmo se push falhar
        }

        // Registrar no log
        const { error: logError } = await supabase
          .from('engagement_tip_logs')
          .insert({
            user_id: user.id,
            tip_id: selectedTip.id,
          });

        if (logError) {
          console.error(`❌ Error logging tip for user ${user.id}:`, logError);
        }

        tipsSent++;
      } catch (userError) {
        console.error(`❌ Error processing user ${user.id}:`, userError);
      }
    }

    console.log(`✅ Engagement tips job completed: ${tipsSent} tips sent, ${usersSkipped} users skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        tipsSent,
        usersSkipped,
        totalUsers: activeUsers?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in engagement tips job:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
