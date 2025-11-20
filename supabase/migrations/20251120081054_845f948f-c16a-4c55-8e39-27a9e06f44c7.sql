-- Create enum types
CREATE TYPE public.user_role AS ENUM ('artist', 'musician');
CREATE TYPE public.expense_type AS ENUM ('uber', 'km', 'van', 'onibus', 'aviao');

-- Create users/profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  cpf TEXT,
  phone TEXT,
  birth_date TEXT,
  photo_url TEXT,
  role user_role,
  status_plano TEXT DEFAULT 'inactive',
  is_verified BOOLEAN DEFAULT FALSE
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create shows table
CREATE TABLE public.shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  venue_name TEXT NOT NULL,
  date_local DATE NOT NULL,
  time_local TEXT NOT NULL,
  is_private_event BOOLEAN DEFAULT FALSE,
  fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  expenses_team JSONB DEFAULT '[]'::JSONB,
  expenses_other JSONB DEFAULT '[]'::JSONB,
  team_musician_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on shows
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;

-- Shows policies
CREATE POLICY "Users can view own shows"
  ON public.shows FOR SELECT
  USING (auth.uid() = uid OR auth.uid()::TEXT = ANY(team_musician_ids));

CREATE POLICY "Users can create own shows"
  ON public.shows FOR INSERT
  WITH CHECK (auth.uid() = uid);

CREATE POLICY "Users can update own shows"
  ON public.shows FOR UPDATE
  USING (auth.uid() = uid);

CREATE POLICY "Users can delete own shows"
  ON public.shows FOR DELETE
  USING (auth.uid() = uid);

-- Create musicians table (artist's team)
CREATE TABLE public.musicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_uid UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  instrument TEXT NOT NULL,
  default_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on musicians
ALTER TABLE public.musicians ENABLE ROW LEVEL SECURITY;

-- Musicians policies
CREATE POLICY "Users can manage own musicians"
  ON public.musicians FOR ALL
  USING (auth.uid() = owner_uid);

-- Create artists table (for musicians)
CREATE TABLE public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_uid UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on artists
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

-- Artists policies
CREATE POLICY "Users can manage own artists"
  ON public.artists FOR ALL
  USING (auth.uid() = owner_uid);

-- Create venues table
CREATE TABLE public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_uid UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on venues
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Venues policies
CREATE POLICY "Users can manage own venues"
  ON public.venues FOR ALL
  USING (auth.uid() = owner_uid);

-- Create locomotion_expenses table
CREATE TABLE public.locomotion_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  show_id UUID REFERENCES public.shows(id) ON DELETE SET NULL,
  type expense_type NOT NULL,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  distance_km DECIMAL(10,2),
  price_per_liter DECIMAL(10,2),
  vehicle_consumption DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on locomotion_expenses
ALTER TABLE public.locomotion_expenses ENABLE ROW LEVEL SECURITY;

-- Locomotion expenses policies
CREATE POLICY "Users can manage own expenses"
  ON public.locomotion_expenses FOR ALL
  USING (auth.uid() = uid);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.shows
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_shows_uid ON public.shows(uid);
CREATE INDEX idx_shows_date ON public.shows(date_local DESC);
CREATE INDEX idx_shows_uid_date ON public.shows(uid, date_local DESC);
CREATE INDEX idx_musicians_owner ON public.musicians(owner_uid);
CREATE INDEX idx_artists_owner ON public.artists(owner_uid);
CREATE INDEX idx_venues_owner ON public.venues(owner_uid);
CREATE INDEX idx_locomotion_uid ON public.locomotion_expenses(uid);
CREATE INDEX idx_locomotion_show ON public.locomotion_expenses(show_id);