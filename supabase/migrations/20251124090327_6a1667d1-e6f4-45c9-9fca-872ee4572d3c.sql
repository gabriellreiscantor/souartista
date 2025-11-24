-- Create musician_instruments table
CREATE TABLE public.musician_instruments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_uid UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_musician_instruments_owner FOREIGN KEY (owner_uid) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.musician_instruments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own instruments"
ON public.musician_instruments
FOR ALL
USING (auth.uid() = owner_uid);

-- Create musician_venues table
CREATE TABLE public.musician_venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_uid UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_musician_venues_owner FOREIGN KEY (owner_uid) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.musician_venues ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own venues"
ON public.musician_venues
FOR ALL
USING (auth.uid() = owner_uid);