import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPEmailRequest {
  email: string;
}

// Generate a 6-digit OTP code
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: OTPEmailRequest = await req.json();

    console.log("Generating OTP for:", email);

    // Create Supabase client with service role
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

    // Generate OTP code
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    const { error: dbError } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        email,
        code: otpCode,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (dbError) {
      console.error("Error saving OTP to database:", dbError);
      throw new Error("Failed to save OTP code");
    }

    console.log("OTP saved to database, sending email...");

    // Send email with OTP
    const emailResponse = await resend.emails.send({
      from: "Seu Artista <noreply@souartista.app>",
      to: [email],
      subject: "Seu código de verificação - Seu Artista",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Código de Verificação</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; border: 2px solid #B96FFF; overflow: hidden; box-shadow: 0 4px 12px rgba(185, 111, 255, 0.15);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #f8f5ff 0%, #ffffff 100%);">
                        <h1 style="color: #B96FFF; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(185, 111, 255, 0.1);">
                          Seu Artista
                        </h1>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <h2 style="color: #333333; font-size: 24px; margin: 0 0 16px 0; font-weight: 600;">
                          Bem-vindo ao Seu Artista! 🎉
                        </h2>
                        
                        <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                          Use o código abaixo para verificar seu email e começar a usar o Seu Artista:
                        </p>

                        <!-- OTP Code Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                          <tr>
                            <td align="center">
                              <div style="background: linear-gradient(135deg, #f8f5ff 0%, #fff 100%); border: 3px solid #B96FFF; border-radius: 12px; padding: 24px; display: inline-block; box-shadow: 0 4px 12px rgba(185, 111, 255, 0.2);">
                                <p style="color: #999999; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                                  Seu código de verificação
                                </p>
                                <p style="color: #B96FFF; font-size: 36px; font-weight: 700; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(185, 111, 255, 0.15);">
                                  ${otpCode}
                                </p>
                              </div>
                            </td>
                          </tr>
                        </table>

                        <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 0;">
                          Este código expira em 10 minutos. Se você não solicitou este código, pode ignorar este email com segurança.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 40px; background: #f8f5ff; border-top: 2px solid #f0e6ff;">
                        <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                          © 2025 Seu Artista. Todos os direitos reservados.<br>
                          Este é um email automático, por favor não responda.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending OTP email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
