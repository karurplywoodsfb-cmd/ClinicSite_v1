// src/config/permissions.ts
// RBAC permission matrix. Mirrors planConfig.ts's style: a plain data table
// plus small helper functions, used by <PermissionGate> and nav filtering.
//
// Roles:
//   owner        — clinic account holder, full access (implicit via clinics.owner_id)
//   doctor       — sees only their own patients/calendar/history; ONLY role that can
//                  write/edit prescriptions (medico-legal — see edit_medical_records)
//   nurse        — can view + print prescriptions the doctor already wrote; cannot
//                  create or edit one
//   receptionist — manages calendar, queue, check-ins; no financials, no medical records
//   accountant   — billing/financial reports only; no medical records, no calendar edits

export type Role = "owner" | "doctor" | "nurse" | "receptionist" | "accountant";

export type PermissionKey =
  | "view_financials"       // payments, subscriptions, billing reports
  | "manage_staff"          // invite/remove staff, change roles
  | "manage_calendar"       // book/reschedule/cancel appointments across all doctors
  | "manage_own_calendar"   // doctor managing only their own slots
  | "manage_queue"          // receptionist queue actions (call next/skip/snooze)
  | "view_medical_records"  // EMR/prescriptions — read + print only
  | "edit_medical_records"  // create/edit a prescription — doctor only, medico-legal
  | "manage_billing"        // create/send OPD invoices — not doctor (billing isn't clinical)
  | "manage_clinic_settings"// banner, domain, theme, plan/billing
  | "view_all_doctors";     // see every doctor's calendar, not just one's own

const MATRIX: Record<Role, PermissionKey[]> = {
  owner: [
    "view_financials", "manage_staff", "manage_calendar", "manage_own_calendar",
    "manage_queue", "view_medical_records", "manage_billing", "manage_clinic_settings", "view_all_doctors",
    // Deliberately NOT edit_medical_records — only a role="doctor" clinic_staff row
    // can write/edit a prescription, even for the clinic owner. If the owner is
    // themselves the prescribing doctor, give them a second clinic_staff row with
    // role="doctor" (linked to their doctors.id) rather than relying on owner access.
  ],
  doctor: [
    "manage_own_calendar", "view_medical_records", "edit_medical_records",
  ],
  nurse: [
    "view_medical_records",
  ],
  receptionist: [
    "manage_calendar", "manage_queue", "manage_billing", "view_all_doctors",
  ],
  accountant: [
    "view_financials", "manage_billing",
  ],
};

export function hasPermission(role: Role | null | undefined, permission: PermissionKey): boolean {
  if (!role) return false;
  return MATRIX[role]?.includes(permission) ?? false;
}

export function getPermissions(role: Role | null | undefined): PermissionKey[] {
  if (!role) return [];
  return MATRIX[role] || [];
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  doctor: "Doctor",
  nurse: "Nurse",
  receptionist: "Receptionist",
  accountant: "Accountant",
};
