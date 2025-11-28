import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';
import jsPDF from "https://esm.sh/jspdf@2.5.2";
import autoTable from "https://esm.sh/jspdf-autotable@3.8.4";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

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

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getPeriodLabel = (period: string) => {
  const labels: Record<string, string> = {
    'this-month': 'Este Mês',
    'last-month': 'Mês Passado',
    'this-year': 'Este Ano',
    'last-year': 'Ano Passado',
    'all-time': 'Todo o Período'
  };
  return labels[period] || period;
};

const generatePDF = (shows: any[], profile: any, period: string, userRole: string, totals: any) => {
  const doc = new jsPDF.jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Relatório Financeiro', 14, 20);
  doc.setFontSize(12);
  doc.text(`${userRole === 'artist' ? 'Artista' : 'Músico'}: ${profile.name}`, 14, 30);
  doc.text(`Período: ${getPeriodLabel(period)}`, 14, 38);
  
  // Resumo financeiro
  doc.text(`Total de Shows: ${totals.totalShows}`, 14, 50);
  doc.text(`Receita: R$ ${formatCurrency(totals.totalRevenue)}`, 14, 58);
  doc.text(`Despesas: R$ ${formatCurrency(totals.totalExpenses)}`, 14, 66);
  doc.text(`Lucro Líquido: R$ ${formatCurrency(totals.totalProfit)}`, 14, 74);
  
  // Tabela de shows
  autoTable(doc, {
    startY: 85,
    head: [['#', 'Data', 'Local', 'Cachê', 'Despesas', 'Lucro']],
    body: shows.map((show, i) => [
      i + 1,
      new Date(show.date_local).toLocaleDateString('pt-BR'),
      show.venue_name,
      `R$ ${formatCurrency(Number(show.fee))}`,
      `R$ ${formatCurrency(show.totalExpenses || 0)}`,
      `R$ ${formatCurrency(show.profit || 0)}`
    ])
  });
  
  return doc.output('arraybuffer');
};

const generateXLSX = (shows: any[], profile: any, period: string, userRole: string, totals: any) => {
  const summaryData = [
    ['Relatório Financeiro'],
    [`${userRole === 'artist' ? 'Artista' : 'Músico'}: ${profile.name}`],
    [`Período: ${getPeriodLabel(period)}`],
    [],
    ['Resumo'],
    ['Total de Shows', totals.totalShows],
    ['Receita', `R$ ${formatCurrency(totals.totalRevenue)}`],
    ['Despesas', `R$ ${formatCurrency(totals.totalExpenses)}`],
    ['Lucro Líquido', `R$ ${formatCurrency(totals.totalProfit)}`],
    [],
    ['#', 'Data', 'Local', 'Cachê', 'Despesas', 'Lucro'],
    ...shows.map((show, i) => [
      i + 1,
      new Date(show.date_local).toLocaleDateString('pt-BR'),
      show.venue_name,
      Number(show.fee),
      show.totalExpenses || 0,
      show.profit || 0
    ])
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
  
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

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

    // Prepare shows with calculated expenses data for PDF/XLSX
    const showsWithData = shows.map(show => {
      let showExpenses = 0;
      let showProfit = 0;

      if (userRole === 'artist') {
        const teamExp = Array.isArray(show.expenses_team) 
          ? show.expenses_team.reduce((s: number, e: any) => s + (Number(e.cost) || 0), 0) 
          : 0;
        const otherExp = Array.isArray(show.expenses_other)
          ? show.expenses_other.reduce((s: number, e: any) => s + (Number(e.cost) || Number(e.amount) || 0), 0)
          : 0;
        const locoExp = locomotionExpenses.find(exp => exp.show_id === show.id);
        showExpenses = teamExp + otherExp + (locoExp ? Number(locoExp.cost) : 0);
        showProfit = Number(show.fee) - showExpenses;
      } else {
        if (Array.isArray(show.expenses_team)) {
          const myEntry = show.expenses_team.find((e: any) => e.musicianId === user.id);
          if (myEntry) {
            showProfit = Number(myEntry.cost) || 0;
          }
        }
      }

      return {
        ...show,
        totalExpenses: showExpenses,
        profit: showProfit
      };
    });

    const totals = {
      totalShows,
      totalRevenue,
      totalExpenses,
      totalProfit
    };

    // Generate file based on format
    let attachmentContent: string;
    let attachmentFilename: string;

    if (format === 'pdf') {
      const pdfBuffer = generatePDF(showsWithData, profile, period, userRole, totals);
      attachmentContent = base64Encode(pdfBuffer as ArrayBuffer);
      attachmentFilename = `relatorio-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
    } else {
      const xlsxBuffer = generateXLSX(showsWithData, profile, period, userRole, totals);
      attachmentContent = base64Encode(xlsxBuffer as ArrayBuffer);
      attachmentFilename = `relatorio-${period}-${new Date().toISOString().split('T')[0]}.xlsx`;
    }

    // Send email with attachment
    const { data, error } = await resend.emails.send({
      from: 'Sou Artista <onboarding@resend.dev>',
      to: [profile.email],
      subject: `Relatório ${format.toUpperCase()} - ${getPeriodLabel(period)}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
              .content { background: #f9fafb; padding: 30px; border-radius: 8px; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">📊 Seu Relatório Está Pronto!</h1>
              </div>
              
              <div class="content">
                <p>Olá, <strong>${profile.name}</strong>!</p>
                <p>Seu relatório financeiro do período <strong>${getPeriodLabel(period)}</strong> está anexado neste email.</p>
                <p><strong>Resumo:</strong></p>
                <ul>
                  <li>Total de Shows: ${totalShows}</li>
                  <li>Receita Total: R$ ${formatCurrency(totalRevenue)}</li>
                  <li>Despesas Totais: R$ ${formatCurrency(totalExpenses)}</li>
                  <li>Lucro Líquido: R$ ${formatCurrency(totalProfit)}</li>
                </ul>
                <p>O arquivo <strong>${format.toUpperCase()}</strong> está anexado para você baixar e consultar.</p>
              </div>
              
              <div class="footer">
                <p>Sou Artista - Organize suas apresentações 🎵</p>
              </div>
            </div>
          </body>
        </html>
      `,
      attachments: [
        {
          content: attachmentContent,
          filename: attachmentFilename,
        }
      ]
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
