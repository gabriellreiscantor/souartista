import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPushToUser } from '../_shared/fcm-sender.ts';
import { isWithinPushWindow, getTodayStartInTimezone } from '../_shared/timezone-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

// Mensagens de CONVERSÃO - para quem NÃO assinou (20 mensagens)
const CONVERSION_MESSAGES = [
  { id: 'conv_1', title: '🎸 Organize seus shows!', message: 'Artistas profissionais usam o Sou Artista para gerenciar a agenda. Assine o Pro!' },
  { id: 'conv_2', title: '💰 Quanto você ganhou esse mês?', message: 'Com o Sou Artista Pro você sabe exatamente seus ganhos. Comece agora!' },
  { id: 'conv_3', title: '📅 Não perca mais shows!', message: 'Cadastre sua agenda no Sou Artista e nunca mais esqueça um compromisso.' },
  { id: 'conv_4', title: '🎤 Sua carreira merece organização', message: 'Relatórios, agenda, gastos... Tudo em um só lugar. Assine o Pro!' },
  { id: 'conv_5', title: '⏰ Tempo é dinheiro!', message: 'Pare de usar planilhas. O Sou Artista organiza tudo pra você automaticamente.' },
  { id: 'conv_6', title: '🚗 Controle seus gastos', message: 'Transporte, alimentação, equipe... Saiba exatamente quanto você gasta por show.' },
  { id: 'conv_7', title: '📊 Relatórios profissionais', message: 'Impressione contratantes com relatórios detalhados. Assine o Sou Artista Pro!' },
  { id: 'conv_8', title: '🎵 Músicos de sucesso usam', message: 'Junte-se a centenas de artistas que já organizam seus shows com o Sou Artista.' },
  { id: 'conv_9', title: '💼 Leve sua carreira a sério', message: 'Gerenciar shows nunca foi tão fácil. Experimente o Sou Artista Pro!' },
  { id: 'conv_10', title: '📱 Tudo na palma da mão', message: 'Cadastre shows, veja relatórios e controle gastos direto do celular. Assine!' },
  { id: 'conv_11', title: '🎹 Seu talento, nossa organização', message: 'Foque na música, a gente cuida da burocracia. Sou Artista Pro!' },
  { id: 'conv_12', title: '💵 Saiba seu lucro real', message: 'Cachê menos despesas = seu lucro real. Descubra com o Sou Artista Pro.' },
  { id: 'conv_13', title: '📆 Agenda inteligente', message: 'Lembretes automáticos, organização visual. Sua agenda como deveria ser.' },
  { id: 'conv_14', title: '🏆 Artistas organizados ganham mais', message: 'Estatísticas mostram: organização = mais shows. Comece hoje!' },
  { id: 'conv_15', title: '🎯 Metas claras, resultados reais', message: 'Acompanhe sua evolução mês a mês com o Sou Artista Pro.' },
  { id: 'conv_16', title: '⭐ Você merece o melhor', message: 'O app feito por músicos, para músicos. Assine o Sou Artista Pro!' },
  { id: 'conv_17', title: '🔥 Oferta especial esperando', message: 'Comece a organizar seus shows hoje mesmo. É mais barato que você imagina!' },
  { id: 'conv_18', title: '📈 Cresça na carreira', message: 'Dados organizados = decisões melhores. O Sou Artista Pro te ajuda a crescer.' },
  { id: 'conv_19', title: '🎸 Chega de bagunça!', message: 'Anotações perdidas, cachês esquecidos... Isso acaba com o Sou Artista Pro.' },
  { id: 'conv_20', title: '💡 Trabalhe de forma inteligente', message: 'Menos tempo organizando, mais tempo tocando. Assine agora!' },
];

// Mensagens de ENGAJAMENTO - para quem JÁ assinou (30 mensagens)
const ENGAGEMENT_MESSAGES = [
  { id: 'eng_1', title: '📅 Olá! Sua agenda te espera', message: 'Não esqueça de atualizar seus shows dessa semana!' },
  { id: 'eng_2', title: '🎤 Já cadastrou os shows?', message: 'Mantenha sua agenda sempre atualizada para não perder nada.' },
  { id: 'eng_3', title: '📊 Seus relatórios estão prontos!', message: 'Veja quanto você ganhou esse mês. Toque para conferir.' },
  { id: 'eng_4', title: '🚗 Registre suas despesas', message: 'Lembre-se de anotar os gastos de transporte do último show.' },
  { id: 'eng_5', title: '💰 Como foi o último show?', message: 'Registre os detalhes enquanto ainda lembra de tudo!' },
  { id: 'eng_6', title: '📆 Início de semana!', message: 'Que tal revisar sua agenda e confirmar os próximos shows?' },
  { id: 'eng_7', title: '🎵 Dica: Cadastre locais', message: 'Salve os locais que você mais toca para agilizar o cadastro.' },
  { id: 'eng_8', title: '💼 Organize sua equipe', message: 'Cadastre os músicos que tocam com você para facilitar os relatórios.' },
  { id: 'eng_9', title: '📈 Seu mês está indo bem?', message: 'Confira seus ganhos e compare com o mês passado!' },
  { id: 'eng_10', title: '⭐ Você está mandando bem!', message: 'Continue registrando seus shows para ter relatórios completos.' },
  { id: 'eng_11', title: '🎸 Fim de semana chegando!', message: 'Revise os shows confirmados e prepare-se para arrasar.' },
  { id: 'eng_12', title: '📱 Tudo atualizado?', message: 'Uma agenda organizada é o segredo do sucesso. Confira a sua!' },
  { id: 'eng_13', title: '💵 Fechamento do mês', message: 'Já conferiu quanto ganhou esse mês? Os números estão te esperando!' },
  { id: 'eng_14', title: '🎹 Novos locais?', message: 'Se tocou em um lugar novo, não esqueça de cadastrar!' },
  { id: 'eng_15', title: '📊 Relatório mensal', message: 'Veja a evolução dos seus shows mês a mês. Dados que inspiram!' },
  { id: 'eng_16', title: '🚌 Despesas de transporte', message: 'Registrar gastos ajuda a entender seu lucro real. Já anotou?' },
  { id: 'eng_17', title: '🎤 Próximo show se aproxima!', message: 'Confirme os detalhes e esteja preparado para brilhar.' },
  { id: 'eng_18', title: '💡 Dica rápida', message: 'Use a função de duplicar show para cadastrar eventos recorrentes.' },
  { id: 'eng_19', title: '📅 Agenda da semana', message: 'Quantos shows você tem essa semana? Confira agora!' },
  { id: 'eng_20', title: '🏆 Continue assim!', message: 'Artistas organizados se destacam. Você está no caminho certo!' },
  { id: 'eng_21', title: '💰 Quanto rendeu?', message: 'Veja o resumo financeiro dos seus últimos shows.' },
  { id: 'eng_22', title: '🎵 Músicos parceiros', message: 'Cadastre os músicos da sua banda para controle de pagamentos.' },
  { id: 'eng_23', title: '📈 Meta do mês', message: 'Quantos shows você quer fazer esse mês? Acompanhe seu progresso!' },
  { id: 'eng_24', title: '⏰ Hora de organizar', message: 'Dedique 5 minutos para atualizar sua agenda. Seu futuro eu agradece!' },
  { id: 'eng_25', title: '🎸 Semana produtiva?', message: 'Registre os shows realizados e mantenha seu histórico completo.' },
  { id: 'eng_26', title: '📊 Análise financeira', message: 'Compare seus ganhos com os gastos e otimize seus lucros.' },
  { id: 'eng_27', title: '🎹 Novo mês, novas metas!', message: 'Comece o mês com a agenda em dia. Cadastre seus shows!' },
  { id: 'eng_28', title: '💼 Profissionalismo', message: 'Uma agenda organizada passa credibilidade. Continue assim!' },
  { id: 'eng_29', title: '🚗 Quilometragem', message: 'Registre os km rodados para ter controle preciso das despesas.' },
  { id: 'eng_30', title: '⭐ Você faz a diferença!', message: 'Obrigado por usar o Sou Artista. Sua organização inspira!' },
];

// Mensagens especiais para usuários inativos (não abriram o app há 7+ dias)
const INACTIVE_USER_MESSAGES = [
  { id: 'inactive_1', title: '👋 Sentimos sua falta!', message: 'Faz tempo que você não aparece. Sua agenda está te esperando!' },
  { id: 'inactive_2', title: '🎵 Voltou a tocar?', message: 'Não esqueça de registrar seus shows no Sou Artista!' },
  { id: 'inactive_3', title: '📅 Sua agenda quer atenção', message: 'Atualize seus shows e mantenha tudo organizado.' },
  { id: 'inactive_4', title: '💭 Lembrou de nós?', message: 'O Sou Artista está aqui para te ajudar. Volte quando quiser!' },
  { id: 'inactive_5', title: '🎤 Bora organizar?', message: 'Alguns minutos no app = meses de organização. Vale a pena!' },
];

// Mensagens para novos usuários que nunca cadastraram shows
const NEW_USER_MESSAGES = [
  { id: 'new_1', title: '🎯 Primeiro passo!', message: 'Cadastre seu primeiro show e comece a organizar sua carreira.' },
  { id: 'new_2', title: '📅 Comece agora', message: 'É super fácil! Adicione seu primeiro show em menos de 1 minuto.' },
  { id: 'new_3', title: '💡 Dica de iniciante', message: 'Comece cadastrando os shows que você já tem confirmados.' },
  { id: 'new_4', title: '🎸 Pronto para começar?', message: 'Seu app está configurado. Só falta adicionar seus shows!' },
  { id: 'new_5', title: '⭐ Bem-vindo!', message: 'Cadastre seu primeiro show e descubra o poder da organização.' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[send-marketing-notifications] 🚀 Starting timezone-aware marketing notification job');

    // Get all users with their timezone
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, status_plano, last_seen_at, created_at, timezone')
      .not('id', 'is', null);

    if (usersError) {
      console.error('[send-marketing-notifications] ❌ Error fetching users:', usersError);
      throw usersError;
    }

    console.log(`[send-marketing-notifications] 📊 Found ${users?.length || 0} users`);

    // Get users who have devices registered with their timezones
    const { data: devicesData, error: devicesError } = await supabaseAdmin
      .from('user_devices')
      .select('user_id, timezone')
      .not('fcm_token', 'is', null);

    if (devicesError) {
      console.error('[send-marketing-notifications] ❌ Error fetching devices:', devicesError);
      throw devicesError;
    }

    // Create timezone lookup from devices (more accurate than profile)
    const deviceTimezones: Record<string, string> = {};
    const usersWithDevices = new Set<string>();
    for (const device of devicesData || []) {
      usersWithDevices.add(device.user_id);
      if (device.timezone) {
        deviceTimezones[device.user_id] = device.timezone;
      }
    }
    
    console.log(`[send-marketing-notifications] 📱 Users with devices: ${usersWithDevices.size}`);

    // Get show counts per user
    const { data: showCounts } = await supabaseAdmin
      .from('shows')
      .select('uid');

    const userShowCounts: Record<string, number> = {};
    if (showCounts) {
      showCounts.forEach(show => {
        userShowCounts[show.uid] = (userShowCounts[show.uid] || 0) + 1;
      });
    }

    let sentCount = 0;
    let skippedCount = 0;
    let outsideWindowCount = 0;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const user of users || []) {
      // Skip users without devices
      if (!usersWithDevices.has(user.id)) {
        skippedCount++;
        continue;
      }

      // Get user's timezone (prefer device, fallback to profile, then default)
      const userTimezone = deviceTimezones[user.id] || user.timezone || DEFAULT_TIMEZONE;

      // Check if user is within push notification window (8:00 - 21:00 local time)
      if (!isWithinPushWindow(userTimezone)) {
        console.log(`[send-marketing-notifications] ⏰ Skipping ${user.id} - outside push window (tz: ${userTimezone})`);
        outsideWindowCount++;
        continue;
      }

      // Get start of today in user's timezone for daily limit check
      const todayStartUTC = getTodayStartInTimezone(userTimezone);

      // Check if user received a marketing notification TODAY in their timezone
      const { data: recentLogs } = await supabaseAdmin
        .from('marketing_notification_logs')
        .select('id, sent_at')
        .eq('user_id', user.id)
        .gte('sent_at', todayStartUTC.toISOString())
        .limit(1);

      if (recentLogs && recentLogs.length > 0) {
        console.log(`[send-marketing-notifications] ⏭️ Skipping ${user.id} - already received today (tz: ${userTimezone})`);
        skippedCount++;
        continue;
      }

      // Determine user type and select appropriate message
      let selectedMessage: { id: string; title: string; message: string } | null = null;
      let notificationType = 'engagement';
      let link = '/app-hub';

      const isActive = user.status_plano === 'active' || user.status_plano === 'ativo';
      const lastSeen = user.last_seen_at ? new Date(user.last_seen_at) : null;
      const isInactive = lastSeen && lastSeen < sevenDaysAgo;
      const hasShows = (userShowCounts[user.id] || 0) > 0;

      // Get messages already sent to this user
      const { data: sentMessages } = await supabaseAdmin
        .from('marketing_notification_logs')
        .select('message_id')
        .eq('user_id', user.id);

      const sentMessageIds = new Set(sentMessages?.map(m => m.message_id) || []);

      // Priority logic for message selection
      if (!isActive) {
        notificationType = 'conversion';
        link = '/subscribe';
        
        const availableMessages = CONVERSION_MESSAGES.filter(m => !sentMessageIds.has(m.id));
        if (availableMessages.length > 0) {
          selectedMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];
        } else {
          selectedMessage = CONVERSION_MESSAGES[Math.floor(Math.random() * CONVERSION_MESSAGES.length)];
        }
      } else if (isInactive) {
        notificationType = 'engagement';
        link = '/app-hub';
        
        const availableMessages = INACTIVE_USER_MESSAGES.filter(m => !sentMessageIds.has(m.id));
        if (availableMessages.length > 0) {
          selectedMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];
        } else {
          selectedMessage = INACTIVE_USER_MESSAGES[Math.floor(Math.random() * INACTIVE_USER_MESSAGES.length)];
        }
      } else if (!hasShows) {
        notificationType = 'engagement';
        link = '/artist/shows';
        
        const availableMessages = NEW_USER_MESSAGES.filter(m => !sentMessageIds.has(m.id));
        if (availableMessages.length > 0) {
          selectedMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];
        } else {
          selectedMessage = NEW_USER_MESSAGES[Math.floor(Math.random() * NEW_USER_MESSAGES.length)];
        }
      } else {
        notificationType = 'engagement';
        link = '/artist/dashboard';
        
        const availableMessages = ENGAGEMENT_MESSAGES.filter(m => !sentMessageIds.has(m.id));
        if (availableMessages.length > 0) {
          selectedMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];
        } else {
          selectedMessage = ENGAGEMENT_MESSAGES[Math.floor(Math.random() * ENGAGEMENT_MESSAGES.length)];
        }
      }

      if (!selectedMessage) {
        console.log(`[send-marketing-notifications] ⏭️ No message available for ${user.id}`);
        skippedCount++;
        continue;
      }

      console.log(`[send-marketing-notifications] 📤 Sending to ${user.id} (tz: ${userTimezone}): ${selectedMessage.id}`);

      // Create in-app notification
      await supabaseAdmin.from('notifications').insert({
        title: selectedMessage.title,
        message: selectedMessage.message,
        link: link,
        user_id: user.id,
        created_by: user.id,
      });

      // Send push notification
      try {
        const pushResult = await sendPushToUser({
          supabaseAdmin,
          userId: user.id,
          title: selectedMessage.title,
          body: selectedMessage.message,
          link: link,
          source: 'marketing',
        });
        console.log(`[send-marketing-notifications] Push for ${user.id}: sent=${pushResult.sent}, failed=${pushResult.failed}`);
      } catch (pushError) {
        console.error(`[send-marketing-notifications] ⚠️ Push failed for ${user.id}:`, pushError);
      }

      // Log the sent notification
      await supabaseAdmin.from('marketing_notification_logs').insert({
        user_id: user.id,
        notification_type: notificationType,
        message_id: selectedMessage.id,
      });

      sentCount++;
    }

    console.log(`[send-marketing-notifications] ✅ Completed: ${sentCount} sent, ${skippedCount} skipped, ${outsideWindowCount} outside window`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Marketing notifications sent: ${sentCount}, skipped: ${skippedCount}, outside_window: ${outsideWindowCount}`,
        sent: sentCount,
        skipped: skippedCount,
        outsideWindow: outsideWindowCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[send-marketing-notifications] ❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
