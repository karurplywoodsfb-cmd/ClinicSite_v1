// src/components/PermissionGate.jsx
// Mirrors PlanGate.tsx's visual style, but gates by role/permission instead
// of subscription tier. No "upgrade" CTA — just a clear "not your role" state.

import { useRoleContext } from "./RoleProvider";
import { ROLE_LABELS } from "../config/permissions";

export function PermissionGate({ permission, children, fallback }) {
  const { hasPermission, role, loading } = useRoleContext();

  if (loading) return null; // avoid a flash of the locked state while resolving
  if (hasPermission(permission)) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  return (
    <div style={{ position: "relative" }}>
      <div style={{
        position: "absolute", inset: 0, background: "rgba(248,250,252,0.9)",
        backdropFilter: "blur(4px)", borderRadius: 12,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", zIndex: 10, padding: 24, textAlign: "center",
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#475569", margin: "0 0 4px" }}>
          Not available for your role
        </p>
        <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
          Signed in as: <strong>{ROLE_LABELS[role] || "Unknown"}</strong>
        </p>
      </div>
      <div style={{ opacity: 0.35, pointerEvents: "none", userSelect: "none" }}>
        {children}
      </div>
    </div>
  );
}
