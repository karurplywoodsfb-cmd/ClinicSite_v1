// src/components/admin/BranchesPage.jsx
// AdminPanel "Branches" tab — multi-location management (Enterprise plan gated).
// Extracted from AdminPanel.jsx as part of the admin-panel split.

import { supabase } from "../../lib/supabase";

const FIELDS = [
  { label:"BRANCH NAME",    key:"name" },
  { label:"ADDRESS",        key:"address" },
  { label:"PHONE",          key:"phone" },
  { label:"WHATSAPP",       key:"whatsapp" },
  { label:"GOOGLE MAPS URL", key:"maps_url" },
];

export default function BranchesPage({ clinic, branches, setBranches, planContext, onRequestUpgrade }) {
  if (!planContext.canUseFeature("team_management")) {
    return (
      <div style={{ maxWidth:680 }}>
        <div style={{ textAlign:"center", padding:"60px 20px" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📍</div>
          <div style={{ fontSize:18, fontWeight:700, color:"#e2e8f0", marginBottom:8 }}>
            Multi-Branch — Enterprise Feature
          </div>
          <div style={{ fontSize:14, color:"#64748b", maxWidth:380, margin:"0 auto 24px", lineHeight:1.7 }}>
            Manage multiple clinic locations under one account.
            Each branch has its own address, phone, and hours.
          </div>
          <button onClick={onRequestUpgrade} style={{
            background:"#1565c0", color:"white", border:"none",
            borderRadius:10, padding:"12px 28px", fontSize:14, fontWeight:600, cursor:"pointer",
          }}>👑 Upgrade to Enterprise — ₹1,999/mo</button>
        </div>
      </div>
    );
  }

  const addBranch = async () => {
    const { data } = await supabase.from("clinic_branches").insert({
      clinic_id:   clinic.id,
      name:        `${clinic.name} — Branch ${branches.length + 1}`,
      address:     "",
      phone:       clinic.phone || "",
      whatsapp:    clinic.whatsapp || "",
      is_active:   true,
      created_at:  new Date().toISOString(),
    }).select().single();
    if (data) setBranches(p => [...p, data]);
  };

  const toggleActive = async (b, val) => {
    await supabase.from("clinic_branches").update({ is_active: val }).eq("id", b.id);
    setBranches(p => p.map(x => x.id === b.id ? { ...x, is_active: val } : x));
  };

  const deleteBranch = async (b) => {
    if (!window.confirm("Delete this branch?")) return;
    await supabase.from("clinic_branches").delete().eq("id", b.id);
    setBranches(p => p.filter(x => x.id !== b.id));
  };

  const saveField = async (b, key, value) => {
    await supabase.from("clinic_branches").update({ [key]: value }).eq("id", b.id);
  };

  return (
    <div style={{ maxWidth:680 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ fontSize:13, color:"#64748b" }}>
          {branches.length} branch{branches.length !== 1 ? "es" : ""} registered
        </div>
        <button onClick={addBranch} style={{
          background:"#1565c0", color:"white", border:"none",
          borderRadius:8, padding:"8px 18px", fontSize:13, fontWeight:600, cursor:"pointer",
        }}>+ Add Branch</button>
      </div>

      {branches.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 0", color:"#475569", fontSize:14 }}>
          No branches yet. Click "Add Branch" to create one.
        </div>
      )}

      {branches.map((b, i) => (
        <div key={b.id} style={{
          background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.08)",
          borderRadius:12, padding:20, marginBottom:14,
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#e2e8f0" }}>
              📍 Branch {i + 1}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#64748b", cursor:"pointer" }}>
                <input type="checkbox" checked={b.is_active}
                  onChange={e => toggleActive(b, e.target.checked)}/> Active
              </label>
              <button onClick={() => deleteBranch(b)} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)",
                color:"#f87171", borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer" }}>
                🗑 Delete
              </button>
            </div>
          </div>
          {FIELDS.map(f => (
            <div key={f.key} style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontFamily:"monospace", color:"#475569", marginBottom:5, fontWeight:600 }}>{f.label}</div>
              <input value={b[f.key] || ""} placeholder={f.label.toLowerCase()}
                onChange={e => setBranches(p => p.map(x => x.id === b.id ? { ...x, [f.key]: e.target.value } : x))}
                onBlur={e => saveField(b, f.key, e.target.value)}
                style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                  color:"#e2e8f0", borderRadius:8, padding:"10px 12px", fontSize:13,
                  fontFamily:"inherit", boxSizing:"border-box" }}/>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
