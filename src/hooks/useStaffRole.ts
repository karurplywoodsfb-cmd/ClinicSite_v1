// src/hooks/useStaffRole.js
// Resolves the current user's role for a given clinic:
//   - clinic.owner_id === user.id  → 'owner' (no DB round-trip needed)
//   - otherwise                    → looked up via the staff_role() RPC,
//     which checks the clinic_staff table (see migration 0003)
//
// Mirrors the shape of usePlanEnforcement so it slots into the same
// Provider/Context pattern already used for plan gating.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { getPermissions, hasPermission as checkPermission } from "../config/permissions";

export function useStaffRole(clinic, user) {
  const [role, setRole]         = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    if (!clinic?.id || !user?.id) {
      setRole(null);
      setDoctorId(null);
      setLoading(false);
      return;
    }

    // Fast path — no RPC needed for the account holder.
    if (clinic.owner_id === user.id) {
      setRole("owner");
      setDoctorId(null);
      setLoading(false);
      return;
    }

    try {
      const [{ data: r }, { data: d }] = await Promise.all([
        supabase.rpc("staff_role", { p_clinic_id: clinic.id }),
        supabase.rpc("staff_doctor_id", { p_clinic_id: clinic.id }),
      ]);
      setRole(r || null);
      setDoctorId(d || null);
    } catch (e) {
      console.error("[useStaffRole]", e.message);
      setRole(null);
    }
    setLoading(false);
  }, [clinic?.id, clinic?.owner_id, user?.id]);

  useEffect(() => { load(); }, [load]);

  return {
    role,
    doctorId,
    loading,
    permissions: getPermissions(role),
    hasPermission: (key) => checkPermission(role, key),
    refresh: load,
  };
}
