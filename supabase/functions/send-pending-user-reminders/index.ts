import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPushToUser } from "../_shared/fcm-sender.ts";
import { isWithinPushWindow } from "../_shared/timezone-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

// Reminder messages for pending users
const REMINDERS = {
  "1_day": {
    title: "🎸 Seu trial grátis está esperando!",
    body: "Você tem 7 dias para testar o Sou Artista sem pagar nada. Comece agora e organize seus shows!",
  },
  "3_days": {
    title: "⭐ Não perca a oportunidade!",
    body: "Teste grátis por 7 dias! Gerencie suas apresentações, músicos e finanças em um só lugar.",
  },
  "7_days": {
    title: "🚀 Última chance de testar grátis!",
    body: "Ainda dá tempo! Ative seu trial de 7 dias e descubra como organizar melhor sua carreira musical.",
  },
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

    // Get all pending users with their timezone from user_devices
    const { data: pendingUsers, error: usersError } = await supabase
      .from("profiles")
      .select(`
        id,
        name,
        email,
        created_at,
        timezone,
        status_plano
      `)
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

    // Get device timezones for users
    const userIds = pendingUsers.map((u) => u.id);
    const { data: devices } = await supabase
      .from("user_devices")
      .select("user_id, timezone")
      .in("user_id", userIds)
      .not("timezone", "is", null);

    // Create a map of user_id -> timezone
    const userTimezones: Record<string, string> = {};
    devices?.forEach((d) => {
      if (d.timezone) {
        userTimezones[d.user_id] = d.timezone;
      }
    });

    // Get already sent reminders
    const { data: sentReminders } = await supabase
      .from("pending_user_reminder_logs")
      .select("user_id, reminder_type")
      .in("user_id", userIds);

    // Create a set of "user_id:reminder_type" for quick lookup
    const sentSet = new Set(
      sentReminders?.map((r) => `${r.user_id}:${r.reminder_type}`) || []
    );

    const now = new Date();
    let remindersSent = 0;
    let errors = 0;

    for (const user of pendingUsers) {
      try {
        const userTimezone = userTimezones[user.id] || user.timezone || DEFAULT_TIMEZONE;

        // Check if within push window (8h-21h)
        if (!isWithinPushWindow(userTimezone)) {
          console.log(`⏰ Outside push window for user ${user.id} (${userTimezone})`);
          continue;
        }

        // Calculate days since account creation
        const createdAt = new Date(user.created_at);
        const daysSinceCreation = Math.floor(
          (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Determine which reminder to send
        let reminderType: string | null = null;

        if (daysSinceCreation >= 7) {
          reminderType = "7_days";
        } else if (daysSinceCreation >= 3) {
          reminderType = "3_days";
        } else if (daysSinceCreation >= 1) {
          reminderType = "1_day";
        }

        if (!reminderType) {
          continue; // User created account less than 1 day ago
        }

        // Check if already sent this reminder
        if (sentSet.has(`${user.id}:${reminderType}`)) {
          continue; // Already sent this reminder
        }

        const reminder = REMINDERS[reminderType as keyof typeof REMINDERS];

        console.log(`📨 Sending ${reminderType} reminder to user ${user.id} (${user.email})`);

        // Create in-app notification
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

        // Send push notification
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

        // Log the reminder as sent
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
