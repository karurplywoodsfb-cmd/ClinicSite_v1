-- supabase/migrations/20260717_prescription_rls_fix.sql
-- ─────────────────────────────────────────────────────────────────
-- Two fixes to public.prescriptions RLS:
--
-- 1. There was no SELECT policy at all for nurse/receptionist/accountant
--    roles — only "owner" (full access) and "doctor" (own patients only)
--    could read a row. Any other role got zero rows back with no error,
--    which is why prescriptions looked "unfetchable." Adds nurse
--    view-only access across the whole clinic (needed so a nurse can
--    pull up any doctor's prescription to print it).
--
-- 2. prescriptions_owner_all previously granted the clinic owner full
--    INSERT/UPDATE/DELETE — meaning "only doctor can enter/edit" was
--    NOT actually enforced at the database level for an owner account.
--    Replaces it with owner SELECT-only. Entry/edit stays exclusively
--    on prescriptions_doctor_write / prescriptions_doctor_update,
--    which already correctly restrict to role='doctor' + own patients.
--
-- ⚠️  BEHAVIORAL CHANGE: if you (as clinic owner) currently write your
--     own prescriptions under the "owner" role, this migration removes
--     that ability. Make sure your account also has a clinic_staff row
--     with role='doctor' linked to your doctors.id — otherwise nobody
--     will be able to write prescriptions after this runs.
-- ─────────────────────────────────────────────────────────────────

-- 1. Nurse: view-only, clinic-wide (not limited to one doctor's patients)
drop policy if exists prescriptions_nurse_select on public.prescriptions;
create policy prescriptions_nurse_select
  on public.prescriptions
  for select
  using (staff_role(clinic_id) = 'nurse');

-- 2. Owner: view-only from now on (was ALL — insert/update/delete removed)
drop policy if exists prescriptions_owner_all on public.prescriptions;
create policy prescriptions_owner_select
  on public.prescriptions
  for select
  using (clinic_id in (select id from clinics where owner_id = auth.uid()));
