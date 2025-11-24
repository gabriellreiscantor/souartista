import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FirebaseShow {
  id: string;
  venueName: string;
  dateLocal: string;
  timeLocal?: string;
  time?: string;
  fee: number;
  duration: string;
  isPrivateEvent: boolean;
  expenses: {
    team: Array<{
      name: string;
      instrument: string;
      cost: number;
      musicianId: string;
    }>;
    other: Array<{
      description: string;
      amount?: number;
      cost?: number;
    }>;
  };
  teamMusicianIds: string[];
  createdAt: { seconds: number };
  updatedAt: { seconds: number };
  uid: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se é o usuário correto (Gabriell)
    if (user.id !== 'fe46f651-275b-4ea9-a877-df4103236e74') {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas Gabriell pode importar dados.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { shows: firebaseShows } = await req.json();

    if (!Array.isArray(firebaseShows)) {
      return new Response(JSON.stringify({ error: 'Formato de dados inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📦 Recebido ${firebaseShows.length} shows do Firebase`);

    // Consolidar nomes de venues
    const consolidateVenueName = (name: string): string => {
      const normalized = name.trim().toLowerCase();
      
      if (normalized.includes('alô bebidas') || normalized.includes('alo bebidas')) return 'Alô Bebidas';
      if (normalized.includes('raiznejo')) return 'Raiznejo';
      if (normalized.includes('musiva')) return 'Musiva';
      if (normalized.includes('ditado popular')) return 'Ditado Popular';
      if (normalized.includes('pub 65')) return 'Pub 65';
      if (normalized.includes('zenaide')) return 'Zenaide';
      if (normalized.includes('farol bar')) return 'Farol Bar';
      if (normalized.includes('tatu bola')) return 'Tatu Bola';
      if (normalized.includes('sapezal')) return 'SAPEZAL';
      
      return name.trim();
    };

    // 1. CRIAR MÚSICOS
    console.log('🎵 Criando músicos...');
    
    const musiciansToCreate = [
      { fbId: 'aoCb00zoDYDkFKqA7E9I', name: 'João Negão', instrument: 'Percussionista', default_fee: 150 },
      { fbId: 'Zk28dsDKxZvpluX0uR5z', name: 'Cristiano', instrument: 'Taxa Contratante', default_fee: 150 },
      { fbId: 'qvqH56vG1h7GSUSNBhQm', name: 'Freelancer - Violão', instrument: 'Violão', default_fee: 200 },
      { fbId: '2wpTwJcoUyfxAuNB27lj', name: 'Freelancer - Baterista', instrument: 'Baterista', default_fee: 200 },
      { fbId: '1Jc9uIh40RnHqiyxnOZc', name: 'Freelancer - Guitarrista', instrument: 'Guitarrista', default_fee: 250 },
      { fbId: 'wxlLEuKHuGGRceJRAojl', name: 'Freelancer - Baixista', instrument: 'Baixista', default_fee: 250 },
      { fbId: 'g9aFwgXLfW5bBthJZMlh', name: 'Freelancer - Sanfoneiro', instrument: 'Sanfoneiro', default_fee: 400 },
    ];

    const { data: createdMusicians, error: musiciansError } = await supabaseClient
      .from('musicians')
      .insert(
        musiciansToCreate.map((m) => ({
          name: m.name,
          instrument: m.instrument,
          default_fee: m.default_fee,
          owner_uid: user.id,
        }))
      )
      .select();

    if (musiciansError) {
      console.error('❌ Erro ao criar músicos:', musiciansError);
      throw new Error(`Erro ao criar músicos: ${musiciansError.message}`);
    }

    console.log(`✅ ${createdMusicians.length} músicos criados`);

    // Criar mapa Firebase ID → Supabase ID
    const musicianMap: Record<string, string> = {};
    createdMusicians.forEach((musician, i) => {
      musicianMap[musiciansToCreate[i].fbId] = musician.id;
    });

    console.log('🗺️ Mapa de músicos:', musicianMap);

    // 2. CRIAR VENUES
    console.log('🏠 Criando venues...');
    
    const uniqueVenues = new Set<string>();
    firebaseShows.forEach((show: FirebaseShow) => {
      uniqueVenues.add(consolidateVenueName(show.venueName));
    });

    const venuesArray = Array.from(uniqueVenues);
    console.log(`📍 Venues únicos: ${venuesArray.length}`, venuesArray);

    const { data: createdVenues, error: venuesError } = await supabaseClient
      .from('venues')
      .insert(
        venuesArray.map((venueName) => ({
          name: venueName,
          owner_uid: user.id,
        }))
      )
      .select();

    if (venuesError) {
      console.error('❌ Erro ao criar venues:', venuesError);
      throw new Error(`Erro ao criar venues: ${venuesError.message}`);
    }

    console.log(`✅ ${createdVenues.length} venues criados`);

    // 3. TRANSFORMAR E INSERIR SHOWS
    console.log('🎪 Transformando shows...');
    
    const transformedShows = firebaseShows.map((fbShow: FirebaseShow) => {
      // Transformar expenses.team - mapear IDs
      const expensesTeam = (fbShow.expenses?.team || []).map((exp) => ({
        name: exp.name,
        instrument: exp.instrument,
        cost: exp.cost,
        musicianId: musicianMap[exp.musicianId] || exp.musicianId, // Usar novo ID ou manter original
      }));

      // Transformar expenses.other - renomear amount para cost
      const expensesOther = (fbShow.expenses?.other || []).map((exp) => ({
        description: exp.description,
        cost: exp.amount || exp.cost || 0,
      }));

      // Mapear team_musician_ids
      const teamMusicianIds = (fbShow.teamMusicianIds || [])
        .map((fbId) => musicianMap[fbId])
        .filter((id) => id !== undefined);

      // Converter duration para número
      const durationHours = Math.abs(parseFloat(fbShow.duration)) || 3;

      return {
        uid: user.id,
        venue_name: consolidateVenueName(fbShow.venueName),
        date_local: fbShow.dateLocal,
        time_local: fbShow.timeLocal || fbShow.time || '20:00',
        fee: fbShow.fee || 0,
        duration_hours: durationHours,
        is_private_event: fbShow.isPrivateEvent || false,
        expenses_team: expensesTeam,
        expenses_other: expensesOther,
        team_musician_ids: teamMusicianIds,
        created_at: new Date(fbShow.createdAt.seconds * 1000).toISOString(),
        updated_at: new Date(fbShow.updatedAt.seconds * 1000).toISOString(),
      };
    });

    console.log(`🔄 ${transformedShows.length} shows transformados`);

    // Inserir shows
    const { data: insertedShows, error: showsError } = await supabaseClient
      .from('shows')
      .insert(transformedShows)
      .select();

    if (showsError) {
      console.error('❌ Erro ao inserir shows:', showsError);
      throw new Error(`Erro ao inserir shows: ${showsError.message}`);
    }

    console.log(`✅ ${insertedShows.length} shows inseridos`);

    // 4. CALCULAR ESTATÍSTICAS
    const totalShows = insertedShows.length;
    const receitaBruta = insertedShows.reduce((sum, show) => sum + Number(show.fee), 0);
    
    const despesasTotais = insertedShows.reduce((sum, show) => {
      const despesasEquipe = (show.expenses_team as any[]).reduce(
        (s, exp) => s + Number(exp.cost),
        0
      );
      const despesasOutras = (show.expenses_other as any[]).reduce(
        (s, exp) => s + Number(exp.cost),
        0
      );
      return sum + despesasEquipe + despesasOutras;
    }, 0);

    const report = {
      success: true,
      musicians_created: createdMusicians.length,
      venues_created: createdVenues.length,
      shows_imported: totalShows,
      receita_bruta: receitaBruta,
      despesas_totais: despesasTotais,
      lucro_liquido: receitaBruta - despesasTotais,
    };

    console.log('📊 Relatório final:', report);

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Erro geral:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar importação';
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
