-- ==============================================================================
-- ATTENTION DANGER : CE SCRIPT MODIFIE LES CONTRAINTES DE CLÉ ÉTRANGÈRE
-- POUR PERMETTRE LA SUPPRESSION D'UN VÉHICULE.
-- SI VOUS SUPPRIMEZ UN VÉHICULE, TOUS SES BORDEREAUX DE PRODUCTION, 
-- SES DÉPENSES DE CARBURANT ET SES LAVAGES SERONT DÉFINITIVEMENT EFFACÉS !
-- ==============================================================================

-- 1. Productions
ALTER TABLE public.productions DROP CONSTRAINT IF EXISTS productions_vehicle_id_fkey;
ALTER TABLE public.productions
  ADD CONSTRAINT productions_vehicle_id_fkey
  FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id)
  ON DELETE CASCADE;

-- 2. Dépenses de Carburant (Fuel Expenses)
ALTER TABLE public.fuel_expenses DROP CONSTRAINT IF EXISTS fuel_expenses_vehicle_id_fkey;
ALTER TABLE public.fuel_expenses
  ADD CONSTRAINT fuel_expenses_vehicle_id_fkey
  FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id)
  ON DELETE CASCADE;

-- 3. Lavages (Washes)
ALTER TABLE public.washes DROP CONSTRAINT IF EXISTS washes_vehicle_id_fkey;
ALTER TABLE public.washes
  ADD CONSTRAINT washes_vehicle_id_fkey
  FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id)
  ON DELETE CASCADE;

-- Optionnel : s'assurer que les politiques RLS autorisent la suppression
DROP POLICY IF EXISTS "vehicles_delete" ON public.vehicles;
CREATE POLICY "vehicles_delete" ON public.vehicles FOR DELETE TO authenticated USING (true);
