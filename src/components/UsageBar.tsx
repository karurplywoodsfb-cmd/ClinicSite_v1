// src/components/UsageBar.tsx
// FIX: Removed all Tailwind class names → inline styles only.

import React from "react";
import { usePlanContext } from "./PlanEnforcementProvider";

interface UsageBarProps {
  feature: string;
  label:   string;
}

export function UsageBar({ feature, label }: UsageBarProps) {
  const { getRemaining, getUsagePercent, limits } = usePlanContext();

  const percent     = getUsagePercent(feature);
  const remaining   = getRemaining(feature);
  const rawLimit    = limits?.features[feature as keyof typeof limits.features];
  const isUnlimited = typeof rawLimit === "number" && rawLimit > 100000;

  const barColor = isUnlimited
    ? "#a855f7"
    : percent > 90 ? "#ef4444"
    : percent > 70 ? "#f59e0b"
    : "#22c55e";

  return (
    <div style={{
      background:"white", padding:"12px 16px", borderRadius:10,
      border:"1px solid #e8eef6", boxShadow:"0 1px 4px rgba(11,37,69,0.04)",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <span style={{ fontSize:13, fontWeight:500, color:"#334155" }}>{label}</span>
        <span style={{ fontSize:12, color:"#94a3b8" }}>
          {isUnlimited ? "Unlimited" : `${remaining} remaining`}
        </span>
      </div>
      <div style={{ width:"100%", background:"#f1f5f9", borderRadius:999, height:6 }}>
        <div style={{
          height:6, borderRadius:999, transition:"width .5s ease",
          background: barColor,
          width: `${isUnlimited ? 100 : Math.min(percent, 100)}%`,
        }} />
      </div>
    </div>
  );
}
