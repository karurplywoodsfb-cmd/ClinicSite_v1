-- supabase/migrations/20260717_add_nurse_role.sql
-- ─────────────────────────────────────────────────────────────────
-- Adds "nurse" as a valid clinic_staff role. Previously the check
-- constraint only allowed doctor / receptionist / accountant, so a
-- nurse account could never be invited even though the frontend
-- permission matrix now expects one (view + print prescriptions,
-- no edit rights).
-- Apply with: supabase db push
-- ─────────────────────────────────────────────────────────────────

alter table public.clinic_staff
  drop constraint if exists clinic_staff_role_check;

alter table public.clinic_staff
  add constraint clinic_staff_role_check
  check (role = ANY (ARRAY['doctor'::text, 'nurse'::text, 'receptionist'::text, 'accountant'::text]));
