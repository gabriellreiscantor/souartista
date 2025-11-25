// Dados fake estáticos para o modo de demonstração
// Estes dados nunca mudam, independente de filtros ou ações do usuário

export const demoUser = {
  id: 'demo-user-123',
  name: 'João Silva Demo',
  email: 'demo@suartista.com',
  photo_url: null,
};

export const demoShows = [
  {
    id: 'demo-show-1',
    uid: 'demo-user-123',
    venue_name: 'Bar do Zé',
    date_local: '2024-12-15',
    time_local: '21:00',
    fee: 800,
    is_private_event: false,
    expenses_team: [
      { name: 'Carlos Drummer', instrument: 'Bateria', cost: 200 },
      { name: 'Ana Bassist', instrument: 'Baixo', cost: 180 },
    ],
    expenses_other: [
      { description: 'Transporte', cost: 50 },
      { description: 'Alimentação', cost: 80 },
    ],
    team_musician_ids: ['demo-musician-1', 'demo-musician-2'],
    created_at: '2024-12-01T10:00:00',
    updated_at: '2024-12-01T10:00:00',
  },
  {
    id: 'demo-show-2',
    uid: 'demo-user-123',
    venue_name: 'Casa de Shows Central',
    date_local: '2024-12-20',
    time_local: '20:00',
    fee: 1500,
    is_private_event: false,
    expenses_team: [
      { name: 'Carlos Drummer', instrument: 'Bateria', cost: 300 },
      { name: 'Ana Bassist', instrument: 'Baixo', cost: 280 },
      { name: 'Pedro Guitar', instrument: 'Guitarra', cost: 300 },
    ],
    expenses_other: [
      { description: 'Transporte', cost: 100 },
      { description: 'Som', cost: 200 },
    ],
    team_musician_ids: ['demo-musician-1', 'demo-musician-2', 'demo-musician-3'],
    created_at: '2024-12-02T10:00:00',
    updated_at: '2024-12-02T10:00:00',
  },
  {
    id: 'demo-show-3',
    uid: 'demo-user-123',
    venue_name: 'Restaurante Villa',
    date_local: '2024-12-28',
    time_local: '19:30',
    fee: 1200,
    is_private_event: true,
    expenses_team: [
      { name: 'Carlos Drummer', instrument: 'Bateria', cost: 250 },
      { name: 'Ana Bassist', instrument: 'Baixo', cost: 230 },
    ],
    expenses_other: [
      { description: 'Transporte', cost: 70 },
    ],
    team_musician_ids: ['demo-musician-1', 'demo-musician-2'],
    created_at: '2024-12-05T10:00:00',
    updated_at: '2024-12-05T10:00:00',
  },
  {
    id: 'demo-show-4',
    uid: 'demo-user-123',
    venue_name: 'Pub Rock City',
    date_local: '2025-01-10',
    time_local: '22:00',
    fee: 900,
    is_private_event: false,
    expenses_team: [
      { name: 'Carlos Drummer', instrument: 'Bateria', cost: 220 },
      { name: 'Pedro Guitar', instrument: 'Guitarra', cost: 220 },
    ],
    expenses_other: [
      { description: 'Transporte', cost: 60 },
    ],
    team_musician_ids: ['demo-musician-1', 'demo-musician-3'],
    created_at: '2024-12-08T10:00:00',
    updated_at: '2024-12-08T10:00:00',
  },
  {
    id: 'demo-show-5',
    uid: 'demo-user-123',
    venue_name: 'Teatro Municipal',
    date_local: '2025-01-15',
    time_local: '20:00',
    fee: 2000,
    is_private_event: false,
    expenses_team: [
      { name: 'Carlos Drummer', instrument: 'Bateria', cost: 400 },
      { name: 'Ana Bassist', instrument: 'Baixo', cost: 380 },
      { name: 'Pedro Guitar', instrument: 'Guitarra', cost: 400 },
      { name: 'Maria Keys', instrument: 'Teclado', cost: 380 },
    ],
    expenses_other: [
      { description: 'Transporte', cost: 150 },
      { description: 'Equipamento', cost: 300 },
    ],
    team_musician_ids: ['demo-musician-1', 'demo-musician-2', 'demo-musician-3', 'demo-musician-4'],
    created_at: '2024-12-10T10:00:00',
    updated_at: '2024-12-10T10:00:00',
  },
];

export const demoUpcomingShows = [
  {
    id: 'demo-show-4',
    venue_name: 'Pub Rock City',
    date_local: '2025-01-10',
    time_local: '22:00',
    fee: 900,
  },
  {
    id: 'demo-show-5',
    venue_name: 'Teatro Municipal',
    date_local: '2025-01-15',
    time_local: '20:00',
    fee: 2000,
  },
  {
    id: 'demo-show-6',
    venue_name: 'Festa Corporativa',
    date_local: '2025-01-25',
    time_local: '19:00',
    fee: 1800,
  },
];

export const demoArtistStats = {
  totalShows: 24,
  totalRevenue: 28500,
  totalCosts: 12300,
  netProfit: 16200,
  upcomingShows: 8,
  loading: false,
};

export const demoMusicianStats = {
  totalShows: 18,
  totalEarnings: 8640,
  averagePerShow: 480,
  upcomingShows: 5,
  loading: false,
};

export const demoMonthlyData = {
  months: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  revenue: [2100, 1800, 2400, 2200, 2600, 2300, 2800, 2500, 2700, 2400, 2900, 3200],
  costs: [900, 800, 1100, 950, 1200, 1000, 1300, 1100, 1250, 1050, 1350, 1450],
  profit: [1200, 1000, 1300, 1250, 1400, 1300, 1500, 1400, 1450, 1350, 1550, 1750],
  shows: [4, 3, 5, 4, 5, 4, 6, 5, 5, 4, 6, 7],
};

export const demoLocomotionData = [
  {
    id: 'demo-loco-1',
    type: 'uber' as const,
    cost: 45,
    distance_km: null,
    price_per_liter: null,
    vehicle_consumption: null,
    show_id: 'demo-show-1',
    created_at: '2024-12-15T21:00:00',
  },
  {
    id: 'demo-loco-2',
    type: 'km' as const,
    cost: 120,
    distance_km: 80,
    price_per_liter: 6.0,
    vehicle_consumption: 10,
    show_id: 'demo-show-2',
    created_at: '2024-12-20T20:00:00',
  },
  {
    id: 'demo-loco-3',
    type: 'van' as const,
    cost: 200,
    distance_km: null,
    price_per_liter: null,
    vehicle_consumption: null,
    show_id: 'demo-show-3',
    created_at: '2024-12-28T19:30:00',
  },
];

export const demoWeekSchedule = [
  { day: 'Seg', shows: 0 },
  { day: 'Ter', shows: 1 },
  { day: 'Qua', shows: 0 },
  { day: 'Qui', shows: 2 },
  { day: 'Sex', shows: 3 },
  { day: 'Sab', shows: 4 },
  { day: 'Dom', shows: 1 },
];
