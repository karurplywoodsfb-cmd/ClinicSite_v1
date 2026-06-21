// src/components/PlanUpgradeModal.tsx
// FIX: Removed lucide-react (not installed). Uses emoji + inline styles only.
//      Removed all Tailwind class names.
//      Pricing now reads from planConfig (INR).

import React from "react";
import { PLAN_PRICING, PLAN_FEATURES, PLAN_DISPLAY_EMOJI } from "../config/planConfig";
import type { PlanTier } from "../config/planConfig";

interface PlanUpgradeModalProps {
  isOpen:       boolean;
  onClose:      () => void;
  requiredPlan: PlanTier;
  featureName:  string;
}

export function PlanUpgradeModal({ isOpen, onClose, requiredPlan, featureName }: PlanUpgradeModalProps) {
  if (!isOpen) return null;

  const pricing  = PLAN_PRICING[requiredPlan];
  const feature  = PLAN_FEATURES.find(f => f.name === featureName);
  const emoji    = PLAN_DISPLAY_EMOJI[requiredPlan];

  const highlights = PLAN_FEATURES
    .filter(f => (f.premium !== f.free) || (requiredPlan === "enterprise" && f.enterprise !== f.free))
    .slice(0, 6);

  function formatLimit(f: typeof PLAN_FEATURES[0]): string {
    const val = f[requiredPlan];
    if (typeof val === "boolean") return val ? "✅ Yes" : "❌ No";
    return Number(val) > 100000 ? "Unlimited" : String(val);
  }

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:9999, padding:16,
    }}>
      <div style={{
        background:"white", borderRadius:16, maxWidth:440, width:"100%",
        padding:24, boxShadow:"0 24px 64px rgba(0,0,0,0.2)",
        fontFamily:"'DM Sans',sans-serif",
      }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h2 style={{ fontSize:18, fontWeight:700, color:"#0b2545", margin:0 }}>
            {emoji} Upgrade Required
          </h2>
          <button onClick={onClose} style={{
            background:"none", border:"none", fontSize:18, cursor:"pointer",
            color:"#94a3b8", lineHeight:1, padding:4,
          }}>✕</button>
        </div>

        {/* Feature info */}
        <div style={{
          background:"#eff6ff", border:"1px solid #bfdbfe",
          borderRadius:10, padding:"12px 16px", marginBottom:16,
        }}>
          <p style={{ fontSize:13, color:"#1e40af", margin:0, lineHeight:1.5 }}>
            <strong>{feature?.description || "This feature"}</strong> requires the{" "}
            <strong>{pricing.label} plan</strong> (₹{pricing.monthly.toLocaleString("en-IN")}/mo).
          </p>
        </div>

        {/* Feature list */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, color:"#64748b", fontWeight:600, marginBottom:8, letterSpacing:.5 }}>
            WHAT YOU UNLOCK
          </div>
          {highlights.map(f => (
            <div key={f.name} style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"6px 0", borderBottom:"1px solid #f1f5f9",
              fontSize:13, color:"#334155",
            }}>
              <span style={{ color:"#22c55e", fontSize:14 }}>✓</span>
              <span style={{ flex:1 }}>{f.description}</span>
              <span style={{ fontWeight:600, color:"#0b2545", fontSize:12 }}>
                {formatLimit(f)}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:10 }}>
          <button
            onClick={() => { window.location.href = "/pricing"; }}
            style={{
              flex:1, padding:"11px 16px", background:"#1565c0", color:"white",
              border:"none", borderRadius:10, fontSize:14, fontWeight:600,
              cursor:"pointer", fontFamily:"inherit",
            }}>
            ⬆️ Upgrade to {pricing.label}
          </button>
          <button
            onClick={onClose}
            style={{
              padding:"11px 16px", background:"white", color:"#64748b",
              border:"1.5px solid #dce8f5", borderRadius:10, fontSize:14,
              cursor:"pointer", fontFamily:"inherit",
            }}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
