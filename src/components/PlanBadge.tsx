// src/components/PlanBadge.tsx
// FIX: Removed inline SVG icons and Tailwind. Uses emoji from planConfig.

import React from "react";
import { usePlanContext } from "./PlanEnforcementProvider";
import { PLAN_DISPLAY_EMOJI } from "../config/planConfig";

const BADGE_STYLES = {
  free:       { background:"#f1f5f9", color:"#475569", border:"1px solid #e2e8f0" },
  premium:    { background:"#eff6ff", color:"#1d4ed8", border:"1px solid #bfdbfe" },
  enterprise: { background:"#faf5ff", color:"#7c3aed", border:"1px solid #e9d5ff" },
};

export function PlanBadge() {
  const { limits } = usePlanContext();
  if (!limits) return null;

  const plan  = limits.plan;
  const style = BADGE_STYLES[plan];
  const emoji = PLAN_DISPLAY_EMOJI[plan];

  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:999,
      fontSize:12, fontWeight:600, fontFamily:"inherit",
      ...style,
    }}>
      {emoji} {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </span>
  );
}
