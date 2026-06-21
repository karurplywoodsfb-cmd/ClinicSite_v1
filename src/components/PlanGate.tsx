// src/components/PlanGate.tsx
// FIX: Removed all Tailwind class names → inline styles only.

import React from "react";
import { usePlanContext } from "./PlanEnforcementProvider";
import type { PlanTier } from "../config/planConfig";
import { PLAN_DISPLAY_EMOJI } from "../config/planConfig";

interface PlanGateProps {
  feature:      string;
  requiredPlan?: PlanTier;
  children:     React.ReactNode;
  fallback?:    React.ReactNode;
}

export function PlanGate({ feature, requiredPlan = "premium", children, fallback }: PlanGateProps) {
  const { canUseFeature, limits } = usePlanContext();

  if (canUseFeature(feature, requiredPlan)) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  const emoji = PLAN_DISPLAY_EMOJI[requiredPlan];

  return (
    <div style={{ position:"relative" }}>
      {/* Overlay */}
      <div style={{
        position:"absolute", inset:0, background:"rgba(248,250,252,0.85)",
        backdropFilter:"blur(4px)", borderRadius:12,
        display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", zIndex:10, padding:24, textAlign:"center",
      }}>
        <div style={{ fontSize:28, marginBottom:8 }}>🔒</div>
        <p style={{ fontSize:14, fontWeight:600, color:"#475569", margin:"0 0 4px" }}>
          {emoji} {requiredPlan === "premium" ? "Premium" : "Enterprise"} Feature
        </p>
        <p style={{ fontSize:12, color:"#94a3b8", margin:"0 0 12px" }}>
          Your plan: <strong>{limits?.plan ?? "Free"}</strong>
        </p>
        <button
          onClick={() => { window.location.href = "/pricing"; }}
          style={{
            padding:"8px 18px", background:"#1565c0", color:"white",
            border:"none", borderRadius:8, fontSize:13, fontWeight:600,
            cursor:"pointer", fontFamily:"inherit",
          }}>
          Upgrade Plan
        </button>
      </div>

      {/* Blurred children */}
      <div style={{ opacity:.35, pointerEvents:"none", userSelect:"none" }}>
        {children}
      </div>
    </div>
  );
}
