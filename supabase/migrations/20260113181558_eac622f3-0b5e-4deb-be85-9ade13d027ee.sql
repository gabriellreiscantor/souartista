-- Create expense category enum
CREATE TYPE public.expense_category AS ENUM (
  'equipamento',
  'acessorio', 
  'manutencao',
  'vestuario',
  'marketing',
  'formacao',
  'software',
  'outros'
);

-- Create additional_expenses table
CREATE TABLE public.additional_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uid UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category expense_category NOT NULL,
  description TEXT NOT NULL,
  cost NUMERIC NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  show_id UUID REFERENCES public.shows(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.additional_expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to manage their own expenses
CREATE POLICY "Users can manage own additional expenses"
ON public.additional_expenses
FOR ALL
USING (auth.uid() = uid)
WITH CHECK (auth.uid() = uid);

-- Create index for faster queries by user and date
CREATE INDEX idx_additional_expenses_uid_date ON public.additional_expenses(uid, expense_date DESC);
CREATE INDEX idx_additional_expenses_category ON public.additional_expenses(category);