import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPEmailRequest {
  email: string;
  token: string;
  type: "signup" | "magiclink";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, token, type }: OTPEmailRequest = await req.json();

    console.log("Sending OTP email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Nova <onboarding@resend.dev>",
      to: [email],
      subject: "Seu código de verificação - Nova",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Código de Verificação</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #0A0118; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0118; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1B0D29 0%, #0A0118 100%); border-radius: 16px; border: 1px solid rgba(185, 111, 255, 0.2); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, rgba(185, 111, 255, 0.1) 0%, transparent 100%);">
                        <h1 style="color: #B96FFF; margin: 0; font-size: 32px; font-weight: 700;">
                          Nova
                        </h1>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <h2 style="color: #FFFFFF; font-size: 24px; margin: 0 0 16px 0; font-weight: 600;">
                          Bem-vindo ao Nova! 🎉
                        </h2>
                        
                        <p style="color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                          Use o código abaixo para verificar seu email e começar a usar o Nova:
                        </p>

                        <!-- OTP Code Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                          <tr>
                            <td align="center">
                              <div style="background: rgba(185, 111, 255, 0.1); border: 2px solid #B96FFF; border-radius: 12px; padding: 24px; display: inline-block;">
                                <p style="color: rgba(255, 255, 255, 0.6); font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">
                                  Seu código de verificação
                                </p>
                                <p style="color: #B96FFF; font-size: 36px; font-weight: 700; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                  ${token}
                                </p>
                              </div>
                            </td>
                          </tr>
                        </table>

                        <p style="color: rgba(255, 255, 255, 0.5); font-size: 14px; line-height: 1.6; margin: 0;">
                          Este código expira em 60 minutos. Se você não solicitou este código, pode ignorar este email com segurança.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 40px; background: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(185, 111, 255, 0.1);">
                        <p style="color: rgba(255, 255, 255, 0.4); font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                          © 2025 Nova. Todos os direitos reservados.<br>
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

    return new Response(JSON.stringify(emailResponse), {
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
