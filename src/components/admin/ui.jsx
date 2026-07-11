// src/components/admin/ui.jsx
// Small shared UI primitives used across several AdminPanel pages
// (Appointments, Services, Clinic Info, Doctor Profile, ...). Extracted
// from AdminPanel.jsx as part of the admin-panel split so page components
// don't each need their own copy.

export function Badge({ status }) {
  const map = {
    confirmed: { bg:"rgba(34,197,94,0.12)",  border:"rgba(34,197,94,0.3)",  color:"#22c55e", label:"Confirmed"  },
    pending:   { bg:"rgba(245,158,11,0.12)", border:"rgba(245,158,11,0.3)", color:"#f59e0b", label:"Pending"    },
    completed: { bg:"rgba(100,116,139,0.12)",border:"rgba(100,116,139,0.3)",color:"#64748b", label:"Completed"  },
    cancelled: { bg:"rgba(239,68,68,0.12)",  border:"rgba(239,68,68,0.3)",  color:"#ef4444", label:"Cancelled"  },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ background:s.bg, border:`1px solid ${s.border}`, color:s.color,
      borderRadius:20, padding:"3px 10px", fontSize:11, fontFamily:"monospace", fontWeight:600 }}>
      {s.label}
    </span>
  );
}

export function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width:40, height:22, borderRadius:11, cursor:"pointer", transition:"background .25s", flexShrink:0,
      background: value ? "#22c55e" : "rgba(255,255,255,0.12)",
      border: `1px solid ${value ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.15)"}`,
      position:"relative",
    }}>
      <div style={{
        width:16, height:16, borderRadius:"50%", background:"white",
        position:"absolute", top:2, left: value ? 20 : 2,
        transition:"left .25s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)",
      }}/>
    </div>
  );
}

export function Field({ label, value, onChange, multiline, hint, warn, mono }) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <label style={{ fontSize:12, color:"#64748b", fontFamily:"monospace", fontWeight:600, letterSpacing:.5 }}>{label}</label>
        {hint && <span style={{ fontSize:11, color:"#334155" }}>{hint}</span>}
      </div>
      {multiline
        ? <textarea value={value || ""} onChange={e => onChange(e.target.value)} rows={3}
            style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${warn?"rgba(245,158,11,0.4)":"rgba(255,255,255,0.1)"}`, color:"#e2e8f0", borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily: mono?"monospace":"inherit", resize:"vertical", outline:"none", boxSizing:"border-box", lineHeight:1.6 }}/>
        : <input value={value || ""} onChange={e => onChange(e.target.value)}
            style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:`1px solid ${warn?"rgba(245,158,11,0.4)":"rgba(255,255,255,0.1)"}`, color:"#e2e8f0", borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily: mono?"monospace":"inherit", outline:"none", boxSizing:"border-box" }}/>
      }
    </div>
  );
}

export function SaveBtn({ saved, saving, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={saving || disabled} style={{
      background: saved ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg,#1565c0,#1e88e5)",
      border: `1px solid ${saved ? "rgba(34,197,94,0.4)" : "rgba(30,136,229,0.5)"}`,
      color: saved ? "#22c55e" : "white",
      borderRadius:8, padding:"10px 24px", fontSize:13, fontWeight:600,
      cursor: saving || disabled ? "not-allowed" : "pointer",
      fontFamily:"inherit", transition:"all .2s", opacity: disabled ? .5 : 1,
    }}>
      {saving ? "Saving..." : saved ? "✓ Saved" : "Save Changes"}
    </button>
  );
}
