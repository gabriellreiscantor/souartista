import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportRequest {
  period: string;
  format: 'pdf' | 'xlsx';
  userRole: 'artist' | 'musician';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token and create supabase client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email, name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    const { period, format, userRole }: ReportRequest = await req.json();

    console.log(`Generating ${format} report for ${userRole}: ${profile.email}`);

    // Get date range
    const getDateRange = (period: string) => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      switch (period) {
        case 'this-month':
          return { start: startOfMonth, end: endOfMonth };
        case 'last-month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          return { start: lastMonth, end: lastMonthEnd };
        case 'this-week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return { start: weekStart, end: weekEnd };
        case 'this-year':
          return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
        case 'year-2025':
          return { start: new Date(2025, 0, 1), end: new Date(2025, 11, 31) };
        case 'all-time':
          return { start: new Date(2000, 0, 1), end: now };
        default:
          return { start: startOfMonth, end: endOfMonth };
      }
    };

    const { start, end } = getDateRange(period);
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Fetch data based on role
    let shows: any[] = [];
    let locomotionExpenses: any[] = [];

    if (userRole === 'artist') {
      const { data: showsData } = await supabaseClient
        .from('shows')
        .select('*')
        .eq('uid', user.id)
        .gte('date_local', formatDate(start))
        .lte('date_local', formatDate(end))
        .order('date_local', { ascending: false });

      const { data: expensesData } = await supabaseClient
        .from('locomotion_expenses')
        .select('*')
        .eq('uid', user.id);

      shows = showsData || [];
      locomotionExpenses = expensesData || [];
    } else {
      const { data: showsData } = await supabaseClient
        .from('shows')
        .select('*')
        .contains('team_musician_ids', [user.id])
        .gte('date_local', formatDate(start))
        .lte('date_local', formatDate(end))
        .order('date_local', { ascending: false });

      shows = showsData || [];
    }

    const getPeriodLabel = (period: string) => {
      switch (period) {
        case 'this-month': return 'Este Mês';
        case 'last-month': return 'Mês Passado';
        case 'this-week': return 'Esta Semana';
        case 'this-year': return 'Este Ano';
        case 'year-2025': return 'Ano de 2025';
        case 'all-time': return 'Todo o Período';
        default: return 'Este Mês';
      }
    };

    const formatCurrency = (value: number) => {
      return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Calculate totals
    const totalShows = shows.length;
    let totalRevenue = 0;
    let totalExpenses = 0;

    if (userRole === 'artist') {
      totalRevenue = shows.reduce((sum, show) => sum + Number(show.fee), 0);
      totalExpenses = shows.reduce((sum, show) => {
        const teamExp = Array.isArray(show.expenses_team) 
          ? show.expenses_team.reduce((s: number, e: any) => s + (Number(e.cost) || 0), 0) 
          : 0;
        const otherExp = Array.isArray(show.expenses_other)
          ? show.expenses_other.reduce((s: number, e: any) => s + (Number(e.cost) || Number(e.amount) || 0), 0)
          : 0;
        const locoExp = locomotionExpenses.find(exp => exp.show_id === show.id);
        return sum + teamExp + otherExp + (locoExp ? Number(locoExp.cost) : 0);
      }, 0);
    } else {
      shows.forEach(show => {
        if (Array.isArray(show.expenses_team)) {
          const myEntry = show.expenses_team.find((e: any) => e.musicianId === user.id);
          if (myEntry) {
            totalRevenue += Number(myEntry.cost) || 0;
          }
        }
        if (Array.isArray(show.expenses_other)) {
          totalExpenses += show.expenses_other.reduce((s: number, e: any) => s + (Number(e.cost) || 0), 0);
        }
      });
    }

    const totalProfit = totalRevenue - totalExpenses;
    const averageTicket = totalShows > 0 ? totalProfit / totalShows : 0;

    // Build show details HTML
    const showsHTML = shows.slice(0, 20).map((show, index) => {
      const showDate = new Date(show.date_local).toLocaleDateString('pt-BR');
      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px; text-align: left;">${index + 1}</td>
          <td style="padding: 12px; text-align: left;">${showDate}</td>
          <td style="padding: 12px; text-align: left;">${show.venue_name}</td>
          <td style="padding: 12px; text-align: right;">R$ ${formatCurrency(Number(show.fee))}</td>
        </tr>
      `;
    }).join('');

    // Send email with HTML report
    const { data, error } = await resend.emails.send({
      from: 'Sou Artista <onboarding@resend.dev>',
      to: [profile.email],
      subject: `Relatório ${format.toUpperCase()} - ${getPeriodLabel(period)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; color: #1f2937; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 32px; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; }
            .summary { background: #f9fafb; border-left: 4px solid #8B5CF6; padding: 20px; margin-bottom: 30px; border-radius: 5px; }
            .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .summary-row:last-child { border-bottom: none; }
            .summary-label { font-weight: 600; color: #4b5563; }
            .summary-value { font-weight: 700; color: #1f2937; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            th { background: #8B5CF6; color: white; padding: 15px; text-align: left; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Relatório Financeiro</h1>
            <p>${userRole === 'artist' ? 'Artista' : 'Músico'}: ${profile.name}</p>
            <p>Período: ${getPeriodLabel(period)}</p>
          </div>

          <div class="summary">
            <h2 style="margin-top: 0; color: #8B5CF6;">Resumo Financeiro</h2>
            <div class="summary-row">
              <span class="summary-label">Total de Shows:</span>
              <span class="summary-value">${totalShows}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">${userRole === 'artist' ? 'Receita Bruta' : 'Cachê Total'}:</span>
              <span class="summary-value">R$ ${formatCurrency(totalRevenue)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Despesas:</span>
              <span class="summary-value">R$ ${formatCurrency(totalExpenses)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Lucro Líquido:</span>
              <span class="summary-value" style="color: ${totalProfit >= 0 ? '#10b981' : '#ef4444'};">R$ ${formatCurrency(totalProfit)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Ticket Médio:</span>
              <span class="summary-value">R$ ${formatCurrency(averageTicket)}</span>
            </div>
          </div>

          <h2 style="color: #1f2937;">Detalhes dos Shows</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Data</th>
                <th>Local</th>
                <th style="text-align: right;">Cachê</th>
              </tr>
            </thead>
            <tbody>
              ${showsHTML}
            </tbody>
          </table>

          ${shows.length > 20 ? `<p style="margin-top: 10px; color: #6b7280; font-style: italic;">* Mostrando os primeiros 20 shows de ${totalShows} no total</p>` : ''}

          <div class="footer">
            <p><strong>Relatório gerado automaticamente pelo sistema Sou Artista</strong></p>
            <p>${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            <p style="margin-top: 10px;">
              💡 <strong>Dica:</strong> Para obter o relatório completo em ${format === 'pdf' ? 'PDF' : 'Excel'} com todos os detalhes e gráficos, 
              acesse a plataforma e faça o download diretamente pelo aplicativo.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Relatório enviado para seu e-mail!',
        emailId: data?.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-report-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao enviar relatório',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
