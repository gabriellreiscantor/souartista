import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerifyOTPRequest = await req.json();

    console.log("Verifying OTP for:", email);

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Find valid OTP code
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.error("Error fetching OTP:", otpError);
      throw new Error("Failed to verify OTP");
    }

    if (!otpData) {
      console.log("Invalid or expired OTP code");
      return new Response(
        JSON.stringify({ error: "Código inválido ou expirado" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Valid OTP found, marking as used...");

    // Mark OTP as used
    const { error: updateError } = await supabaseAdmin
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpData.id);

    if (updateError) {
      console.error("Error updating OTP:", updateError);
      throw new Error("Failed to update OTP");
    }

    console.log("Finding user by email...");

    // Find user by email and confirm their email
    const { data: { users }, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (getUserError) {
      console.error("Error listing users:", getUserError);
      throw new Error("Failed to find user");
    }

    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.error("User not found for email:", email);
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("User found, updating email confirmation...");

    // Update user to mark email as confirmed
    const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (updateUserError) {
      console.error("Error confirming email:", updateUserError);
      throw new Error("Failed to confirm email");
    }

    console.log("Email confirmed successfully for user:", user.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Email verificado com sucesso!" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao verificar código" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
