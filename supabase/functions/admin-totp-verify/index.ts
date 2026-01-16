import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as OTPAuth from "https://esm.sh/otpauth@9.2.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado - não é administrador' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for lockout - count failed attempts in last 15 minutes
    const lockoutTime = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString();
    
    const { data: recentAttempts, error: attemptsError } = await supabase
      .from('admin_totp_attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('success', false)
      .gte('attempted_at', lockoutTime)
      .order('attempted_at', { ascending: false });

    if (attemptsError) {
      console.error('Error checking attempts:', attemptsError);
    }

    const failedAttempts = recentAttempts?.length || 0;

    // If locked out, return time remaining
    if (failedAttempts >= MAX_ATTEMPTS) {
      const oldestAttempt = recentAttempts?.[recentAttempts.length - 1];
      if (oldestAttempt) {
        const unlockTime = new Date(new Date(oldestAttempt.attempted_at).getTime() + LOCKOUT_MINUTES * 60 * 1000);
        const minutesRemaining = Math.ceil((unlockTime.getTime() - Date.now()) / 60000);
        
        return new Response(
          JSON.stringify({ 
            error: `Muitas tentativas. Aguarde ${minutesRemaining} minuto${minutesRemaining > 1 ? 's' : ''}.`,
            locked: true,
            minutesRemaining,
            verified: false
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get the code from request body
    const { code } = await req.json();

    if (!code || code.length !== 6) {
      return new Response(
        JSON.stringify({ error: 'Código inválido - deve ter 6 dígitos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's TOTP secret
    const { data: totpData, error: totpError } = await supabase
      .from('admin_totp_secrets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (totpError || !totpData) {
      return new Response(
        JSON.stringify({ error: 'TOTP não configurado. Configure primeiro.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the TOTP code
    const totp = new OTPAuth.TOTP({
      issuer: "Sou Artista Admin",
      label: user.email || "Admin",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(totpData.totp_secret),
    });

    const delta = totp.validate({ token: code, window: 1 });

    if (delta === null) {
      // Record failed attempt
      await supabase
        .from('admin_totp_attempts')
        .insert({
          user_id: user.id,
          success: false
        });

      const attemptsRemaining = MAX_ATTEMPTS - failedAttempts - 1;
      
      if (attemptsRemaining <= 0) {
        return new Response(
          JSON.stringify({ 
            error: `Código errado. Bloqueado por ${LOCKOUT_MINUTES} minutos.`,
            locked: true,
            minutesRemaining: LOCKOUT_MINUTES,
            verified: false
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: `Código errado. ${attemptsRemaining} tentativa${attemptsRemaining > 1 ? 's' : ''} restante${attemptsRemaining > 1 ? 's' : ''}.`,
          attemptsRemaining,
          verified: false
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record successful attempt and clear old failed attempts
    await supabase
      .from('admin_totp_attempts')
      .insert({
        user_id: user.id,
        success: true
      });

    // If this is the first verification, mark as verified
    if (!totpData.is_verified) {
      await supabase
        .from('admin_totp_secrets')
        .update({ is_verified: true })
        .eq('user_id', user.id);
    }

    return new Response(
      JSON.stringify({ 
        verified: true,
        message: 'Acesso autorizado!'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-totp-verify:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
