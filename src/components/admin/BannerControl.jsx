// src/components/admin/BannerControl.jsx
// Drop into AdminPanel.jsx wherever clinic settings are edited.
// Usage: <BannerControl clinic={clinic} onUpdate={updated => setClinic(updated)} />

import { useState } from "react";
import { updateClinic } from "../../lib/supabase";

const TYPE_OPTIONS = [
  { value: "info",      label: "ℹ️ Notice" },
  { value: "holiday",   label: "🏖️ Holiday" },
  { value: "emergency", label: "🚨 Emergency" },
];

export default function BannerControl({ clinic, onUpdate }) {
  const [enabled, setEnabled] = useState(clinic.banner_enabled || false);
  const [message, setMessage] = useState(clinic.banner_message || "");
  const [type, setType]       = useState(clinic.banner_type || "info");
  const [saving, setSaving]   = useState(false);

  const save = async (updates) => {
    setSaving(true);
    try {
      const updated = await updateClinic(clinic.id, updates);
      onUpdate?.(updated);
    } catch (e) {
      alert(e.message || "Could not update banner.");
    }
    setSaving(false);
  };

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    save({ banner_enabled: next, banner_message: message, banner_type: type });
  };

  const saveMessage = () => save({ banner_enabled: enabled, banner_message: message, banner_type: type });

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Site banner</div>
        <button
          onClick={toggle}
          disabled={saving}
          style={{
            width: 46, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
            background: enabled ? "#16a34a" : "#cbd5e1", position: "relative", transition: "background 0.15s",
          }}
          aria-label="Toggle banner"
        >
          <span style={{
            position: "absolute", top: 3, left: enabled ? 23 : 3, width: 20, height: 20,
            borderRadius: "50%", background: "white", transition: "left 0.15s",
          }} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setType(opt.value)}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: type === opt.value ? "2px solid #1565c0" : "1px solid #e2e8f0",
              background: type === opt.value ? "#eff6ff" : "white",
              color: type === opt.value ? "#1565c0" : "#64748b",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="e.g. Closed on 15th Aug for Independence Day. Reopens 16th Aug, 9 AM."
        rows={2}
        style={{ width: "100%", borderRadius: 8, border: "1px solid #e2e8f0", padding: 10, fontSize: 13, fontFamily: "inherit", marginBottom: 8, resize: "vertical" }}
      />
      <button
        onClick={saveMessage}
        disabled={saving}
        style={{ background: "#0f172a", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
      >
        {saving ? "Saving…" : "Save banner"}
      </button>
      {!enabled && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>Banner is off — toggle on to show it on your site.</div>}
    </div>
  );
}
