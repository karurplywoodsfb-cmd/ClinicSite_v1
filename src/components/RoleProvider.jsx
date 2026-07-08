// src/components/RoleProvider.jsx
import { createContext, useContext } from "react";
import { useStaffRole } from "../hooks/useStaffRole";

const RoleContext = createContext(null);

export function RoleProvider({ clinic, user, children }) {
  const roleData = useStaffRole(clinic, user);
  return <RoleContext.Provider value={roleData}>{children}</RoleContext.Provider>;
}

export function useRoleContext() {
  const context = useContext(RoleContext);

  // Safe fallback mirrors PlanEnforcementProvider's approach — if the
  // provider isn't mounted (e.g. a clinic with no staff table rows at all,
  // or an older part of the tree), default to full access rather than
  // locking the owner out of their own clinic.
  if (!context) {
    return {
      role: "owner",
      doctorId: null,
      loading: false,
      permissions: [],
      hasPermission: () => true,
      refresh: () => {},
    };
  }
  return context;
}
