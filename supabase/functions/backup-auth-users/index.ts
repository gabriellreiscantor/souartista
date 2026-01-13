import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Production Supabase (source)
    const prodUrl = Deno.env.get("SUPABASE_URL")!;
    const prodServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Backup Supabase (destination)
    const backupUrl = Deno.env.get("BACKUP_SUPABASE_URL");
    const backupServiceKey = Deno.env.get("BACKUP_SUPABASE_SERVICE_ROLE_KEY");

    if (!backupUrl || !backupServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Backup Supabase credentials not configured",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const prodClient = createClient(prodUrl, prodServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const backupClient = createClient(backupUrl, backupServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log("Starting auth users backup...");

    // Use Admin API to list all users
    const allUsers: any[] = [];
    let page = 1;
    const perPage = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: { users }, error } = await prodClient.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        throw new Error(`Failed to list users: ${error.message}`);
      }

      if (users && users.length > 0) {
        allUsers.push(...users);
        page++;
        hasMore = users.length === perPage;
      } else {
        hasMore = false;
      }
    }

    console.log(`Found ${allUsers.length} users to backup`);

    if (allUsers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No users to backup",
          count: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare users for backup
    const usersToBackup = allUsers.map((user) => ({
      id: user.id,
      email: user.email,
      encrypted_password: user.encrypted_password || null,
      email_confirmed_at: user.email_confirmed_at || null,
      created_at: user.created_at,
      updated_at: user.updated_at || null,
      raw_app_meta_data: user.app_metadata || null,
      raw_user_meta_data: user.user_metadata || null,
      phone: user.phone || null,
      phone_confirmed_at: user.phone_confirmed_at || null,
      last_sign_in_at: user.last_sign_in_at || null,
      backed_up_at: new Date().toISOString(),
    }));

    // Upsert users to backup database
    const { error: upsertError } = await backupClient
      .from("auth_users_backup")
      .upsert(usersToBackup, { onConflict: "id" });

    if (upsertError) {
      throw new Error(`Failed to backup users: ${upsertError.message}`);
    }

    console.log(`Successfully backed up ${usersToBackup.length} users`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Backed up ${usersToBackup.length} auth users`,
        count: usersToBackup.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Auth backup error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
