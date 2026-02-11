import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPushToUser } from "../_shared/fcm-sender.ts";
import { isWithinPushWindow } from "../_shared/timezone-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

// 10 reminder messages for pending users (expanded schedule)
const REMINDERS: Record<string, { title: string; body: string }> = {
  "1_day": {
    title: "🎸 Bem-vindo ao SouArtista!",
    body: "Bem-vindo ao SouArtista! Faça sua assinatura e organize seus shows.",
  },
  "2_days": {
    title: "🎵 Você sabia?",
    body: "Sabia que você pode cadastrar shows, músicos e locais? Faça sua assinatura!",
  },
  "3_days": {
    title: "⭐ Músicos organizados ganham mais!",
    body: "Músicos organizados ganham mais. Comece a usar o SouArtista hoje!",
  },
  "4_days": {
    title: "📝 Chega de papel!",
    body: "Cansado de anotar shows no papel? O SouArtista resolve isso. Assine agora!",
  },
  "5_days": {
    title: "📊 Relatórios automáticos",
    body: "Relatórios de cachê, gastos e lucro. Tudo automático no SouArtista.",
  },
  "7_days": {
    title: "🚀 Já faz uma semana!",
    body: "Já faz uma semana! Ainda dá tempo de organizar sua carreira. Assine!",
  },
  "10_days": {
    title: "💜 Sentimos sua falta!",
    body: "Sentimos sua falta! O SouArtista está pronto pra te ajudar. Faça sua assinatura.",
  },
  "14_days": {
    title: "🎤 Sua carreira merece!",
    body: "Sua carreira musical merece organização. Volte pro SouArtista!",
  },
  "21_days": {
    title: "🔥 Não fique pra trás!",
    body: "Ainda pensando? Músicos já estão usando o SouArtista. Não fique pra trás!",
  },
  "30_days": {
    title: "🎯 Última chamada!",
    body: "Última chamada! Faça sua assinatura e transforme sua carreira.",
  },
};

// Map days to reminder types
const DAY_TO_REMINDER: Record<number, string> = {
  1: "1_day",
  2: "2_days",
  3: "3_days",
  4: "4_days",
  5: "5_days",
  7: "7_days",
  10: "10_days",
  14: "14_days",
  21: "21_days",
  30: "30_days",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔔 Starting pending user reminders check...");

    const { data: pendingUsers, error: usersError } = await supabase
      .from("profiles")
      .select("id, name, email, created_at, timezone, status_plano")
      .eq("status_plano", "pending");

    if (usersError) {
      console.error("Error fetching pending users:", usersError);
      throw usersError;
    }

    console.log(`Found ${pendingUsers?.length || 0} pending users`);

    if (!pendingUsers || pendingUsers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No pending users found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = pendingUsers.map((u) => u.id);

    const { data: devices } = await supabase
      .from("user_devices")
      .select("user_id, timezone")
      .in("user_id", userIds)
      .not("timezone", "is", null);

    const userTimezones: Record<string, string> = {};
    devices?.forEach((d) => {
      if (d.timezone) {
        userTimezones[d.user_id] = d.timezone;
      }
    });

    const { data: sentReminders } = await supabase
      .from("pending_user_reminder_logs")
      .select("user_id, reminder_type")
      .in("user_id", userIds);

    const sentSet = new Set(
      sentReminders?.map((r) => `${r.user_id}:${r.reminder_type}`) || []
    );

    const now = new Date();
    let remindersSent = 0;
    let errors = 0;

    // Sorted day thresholds descending so we pick the highest applicable
    const sortedDays = Object.keys(DAY_TO_REMINDER)
      .map(Number)
      .sort((a, b) => b - a);

    for (const user of pendingUsers) {
      try {
        const userTimezone = userTimezones[user.id] || user.timezone || DEFAULT_TIMEZONE;

        if (!isWithinPushWindow(userTimezone)) {
          console.log(`⏰ Outside push window for user ${user.id} (${userTimezone})`);
          continue;
        }

        const createdAt = new Date(user.created_at);
        const daysSinceCreation = Math.floor(
          (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Find the highest day threshold the user qualifies for
        let reminderType: string | null = null;
        for (const day of sortedDays) {
          if (daysSinceCreation >= day) {
            const type = DAY_TO_REMINDER[day];
            if (!sentSet.has(`${user.id}:${type}`)) {
              reminderType = type;
            }
            break;
          }
        }

        if (!reminderType) {
          continue;
        }

        const reminder = REMINDERS[reminderType];

        console.log(`📨 Sending ${reminderType} reminder to user ${user.id} (${user.email})`);

        const { error: notifError } = await supabase.from("notifications").insert({
          title: reminder.title,
          message: reminder.body,
          link: "/subscribe",
          user_id: user.id,
          created_by: user.id,
        });

        if (notifError) {
          console.error(`Error creating notification for user ${user.id}:`, notifError);
        }

        try {
          await sendPushToUser({
            supabaseAdmin: supabase,
            userId: user.id,
            title: reminder.title,
            body: reminder.body,
            data: { type: "pending_reminder", link: "/subscribe" },
            source: "marketing",
          });
        } catch (pushError) {
          console.error(`Error sending push to user ${user.id}:`, pushError);
        }

        const { error: logError } = await supabase
          .from("pending_user_reminder_logs")
          .insert({
            user_id: user.id,
            reminder_type: reminderType,
          });

        if (logError) {
          console.error(`Error logging reminder for user ${user.id}:`, logError);
        } else {
          remindersSent++;
          console.log(`✅ Sent ${reminderType} reminder to ${user.email}`);
        }
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        errors++;
      }
    }

    console.log(`🏁 Finished: ${remindersSent} reminders sent, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${remindersSent} pending user reminders`,
        sent: remindersSent,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-pending-user-reminders:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
