-- ==============================================================================
-- SCRIPT DE RÉPARATION DES PERMISSIONS (RLS) SUR LA TABLE VEHICLES
-- Ce script va s'assurer que vous avez bien le droit de LECTURE, AJOUT, 
-- MODIFICATION et SUPPRESSION sur les véhicules.
-- ==============================================================================

-- 1. On supprime les anciennes règles qui pourraient bloquer
DROP POLICY IF EXISTS "vehicles_select" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_insert" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_update" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_delete" ON public.vehicles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.vehicles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.vehicles;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.vehicles;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.vehicles;

-- 2. On recrée des règles propres et totalement ouvertes pour les utilisateurs connectés
CREATE POLICY "vehicles_select" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicles_insert" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vehicles_update" ON public.vehicles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vehicles_delete" ON public.vehicles FOR DELETE TO authenticated USING (true);

-- 3. On s'assure que la sécurité RLS est bien activée
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
