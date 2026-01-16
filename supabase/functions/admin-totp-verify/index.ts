import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as OTPAuth from "https://esm.sh/otpauth@9.2.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const ALERT_THRESHOLD = 3; // Send alert after 3 failed attempts

// Send security alert email
async function sendSecurityAlert(
  userEmail: string,
  userName: string,
  failedAttempts: number,
  isLocked: boolean
) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not configured - skipping security alert");
    return;
  }

  const resend = new Resend(resendApiKey);
  const adminEmails = ["admin@souartista.com"]; // Add admin emails here

  const subject = isLocked 
    ? "🚨 ALERTA: Conta Admin BLOQUEADA"
    : "⚠️ Alerta: Tentativas suspeitas de login admin";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; border: 2px solid ${isLocked ? '#dc2626' : '#f59e0b'}; overflow: hidden;">
                <tr>
                  <td style="padding: 40px; text-align: center; background: ${isLocked ? '#fef2f2' : '#fffbeb'};">
                    <h1 style="color: ${isLocked ? '#dc2626' : '#f59e0b'}; margin: 0; font-size: 28px; font-weight: 700;">
                      ${isLocked ? '🚨 Conta Admin Bloqueada' : '⚠️ Alerta de Segurança'}
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #333333; font-size: 16px; margin: 0 0 16px 0;">
                      <strong>Usuário:</strong> ${userName} (${userEmail})
                    </p>
                    <p style="color: #333333; font-size: 16px; margin: 0 0 16px 0;">
                      <strong>Tentativas falhas:</strong> ${failedAttempts}
                    </p>
                    <p style="color: #333333; font-size: 16px; margin: 0 0 16px 0;">
                      <strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </p>
                    ${isLocked ? `
                      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-top: 24px;">
                        <p style="color: #dc2626; font-size: 14px; margin: 0;">
                          <strong>⚠️ A conta foi bloqueada por ${LOCKOUT_MINUTES} minutos devido a múltiplas tentativas falhas.</strong>
                        </p>
                      </div>
                    ` : `
                      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin-top: 24px;">
                        <p style="color: #92400e; font-size: 14px; margin: 0;">
                          Múltiplas tentativas de login com código TOTP incorreto foram detectadas. 
                          Verifique se é uma tentativa legítima ou se há atividade suspeita.
                        </p>
                      </div>
                    `}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px 40px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
                      Sou Artista - Sistema de Segurança Admin
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: "Sou Artista Segurança <noreply@souartista.app>",
      to: adminEmails,
      subject,
      html: htmlContent,
    });
    console.log(`Security alert sent for ${userEmail}`);
  } catch (error) {
    console.error("Failed to send security alert:", error);
  }
}

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

    // Get user profile for email alerts
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single();

    const userName = userProfile?.name || 'Admin';
    const userEmail = userProfile?.email || user.email || 'unknown';

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

      const newFailedCount = failedAttempts + 1;
      const attemptsRemaining = MAX_ATTEMPTS - newFailedCount;
      const isNowLocked = attemptsRemaining <= 0;

      // Send security alert after threshold or on lockout
      if (newFailedCount === ALERT_THRESHOLD || isNowLocked) {
        await sendSecurityAlert(userEmail, userName, newFailedCount, isNowLocked);
      }
      
      if (isNowLocked) {
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
