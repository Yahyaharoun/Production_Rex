-- ==============================================================================
-- MIGRATION: Nouveaux Modules (Carburant, Lavage, Autres Dépenses, Véhicules)
-- ==============================================================================

-- 1. Ajout des nouveaux champs sur la table `vehicles`
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS production_type text CHECK (production_type IN ('VIP', 'CLASSIQUE')),
ADD COLUMN IF NOT EXISTS driver_titulaire_id uuid REFERENCES public.drivers(id),
ADD COLUMN IF NOT EXISTS driver_titulaire_name text;

-- 2. Création de la table `fuel_expenses` (Carburant)
CREATE TABLE IF NOT EXISTS public.fuel_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time time NOT NULL,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  ligne text NOT NULL,
  agence_id text,
  vehicle_id uuid REFERENCES public.vehicles(id),
  immatriculation text NOT NULL,
  category text NOT NULL CHECK (category IN ('VIP', 'CLASSIQUE')),
  amount numeric NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Création de la table `other_expenses` (Autres Dépenses)
CREATE TABLE IF NOT EXISTS public.other_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time time NOT NULL,
  author_id uuid NOT NULL,
  author_name text NOT NULL,
  agence_id text,
  ligne text NOT NULL,
  label text NOT NULL,
  motif text NOT NULL,
  unit_price numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  total numeric NOT NULL,
  status text NOT NULL DEFAULT 'EN_ATTENTE' CHECK (status IN ('EN_ATTENTE', 'VALIDEE', 'REJETEE')),
  validator_id uuid,
  validator_name text,
  validated_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Création de la table `washes` (Contrôle Lavage)
CREATE TABLE IF NOT EXISTS public.washes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time time NOT NULL,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id),
  immatriculation text NOT NULL,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  agence_id text,
  ligne text,
  amount numeric NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- ==============================================================================
-- SECURITE ET RLS (Row Level Security)
-- ==============================================================================

ALTER TABLE public.fuel_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.other_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.washes ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- FUEL EXPENSES POLICIES
-- ------------------------------------------------------------------------------
-- Lecture: Tout le monde peut lire les dépenses de sa propre agence ou toutes si ADMIN/PDG
CREATE POLICY "lecture_fuel_expenses" ON public.fuel_expenses
FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('PDG', 'ADMIN')) OR
  agence_id = (SELECT agence_id FROM users WHERE id = auth.uid())
);

-- Insertion: Caissières, Chefs, PDG
CREATE POLICY "insertion_fuel_expenses" ON public.fuel_expenses
FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('PDG', 'ADMIN', 'CHEF_AGENCE', 'CAISSIERE'))
);

-- Modification: PDG / ADMIN / CHEF
CREATE POLICY "modification_fuel_expenses" ON public.fuel_expenses
FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('PDG', 'ADMIN', 'CHEF_AGENCE'))
);

-- Suppression: PDG / ADMIN / CHEF
CREATE POLICY "suppression_fuel_expenses" ON public.fuel_expenses
FOR DELETE
USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('PDG', 'ADMIN', 'CHEF_AGENCE'))
);

-- ------------------------------------------------------------------------------
-- OTHER EXPENSES POLICIES
-- ------------------------------------------------------------------------------
-- Lecture: Tout le monde peut lire les dépenses de sa propre agence ou toutes si ADMIN/PDG
CREATE POLICY "lecture_other_expenses" ON public.other_expenses
FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('PDG', 'ADMIN')) OR
  agence_id = (SELECT agence_id FROM users WHERE id = auth.uid())
);

-- Insertion: Caissières, Chefs, PDG
CREATE POLICY "insertion_other_expenses" ON public.other_expenses
FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('PDG', 'ADMIN', 'CHEF_AGENCE', 'CAISSIERE'))
);

-- Modification: PDG / ADMIN / CHEF (pour validation/rejet)
CREATE POLICY "modification_other_expenses" ON public.other_expenses
FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('PDG', 'ADMIN', 'CHEF_AGENCE'))
);

-- ------------------------------------------------------------------------------
-- WASHES POLICIES
-- ------------------------------------------------------------------------------
-- Lecture: Tout le monde peut lire les lavages de sa propre agence ou toutes si ADMIN/PDG
CREATE POLICY "lecture_washes" ON public.washes
FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('PDG', 'ADMIN')) OR
  agence_id = (SELECT agence_id FROM users WHERE id = auth.uid())
);

-- Insertion: Chefs, Caissières, PDG
CREATE POLICY "insertion_washes" ON public.washes
FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM users WHERE role IN ('PDG', 'ADMIN', 'CHEF_AGENCE', 'CAISSIERE'))
);
