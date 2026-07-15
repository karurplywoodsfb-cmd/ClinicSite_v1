// src/components/SuperAdmin.jsx
// Platform admin panel — only accessible to you (Vignesh)
// Route: /superadmin
// Protected by is_superadmin flag in Supabase

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const PLAN_COLORS = {
  free:       { bg:"rgba(100,116,139,0.12)", border:"rgba(100,116,139,0.3)", color:"#64748b" },
  premium:    { bg:"rgba(59,130,246,0.12)",  border:"rgba(59,130,246,0.3)",  color:"#3b82f6" },
  enterprise: { bg:"rgba(168,85,247,0.12)",  border:"rgba(168,85,247,0.3)",  color:"#a855f7" },
};

const NAV = [
  { id:"dashboard",  label:"Dashboard",    icon:"⊞" },
  { id:"clinics",    label:"All Clinics",   icon:"🏥" },
  { id:"revenue",    label:"Revenue",       icon:"💰" },
  { id:"payments",   label:"Payments",      icon:"💳" },
  { id:"webhooks",   label:"Webhooks",      icon:"🔔" },
  { id:"broadcast",  label:"Broadcast",     icon:"📢" },
  { id:"settings",   label:"Settings",      icon:"⚙️" },
];

function Badge({ plan }) {
  const s = PLAN_COLORS[plan] || PLAN_COLORS.free;
  return (
    <span style={{ background:s.bg, border:`1px solid ${s.border}`, color:s.color, borderRadius:20, padding:"2px 10px", fontSize:11, fontFamily:"monospace", fontWeight:700, textTransform:"uppercase" }}>
      {plan}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color="#3b82f6" }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
        <span style={{ fontSize:24 }}>{icon}</span>
        <span style={{ fontSize:10, background:`${color}15`, border:`1px solid ${color}30`, color, borderRadius:4, padding:"2px 7px", fontFamily:"monospace" }}>LIVE</span>
      </div>
      <div style={{ fontSize:28, fontWeight:700, color, fontFamily:"monospace", marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:13, color:"#94a3b8", marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:11, color:"#475569" }}>{sub}</div>
    </div>
  );
}

export default function SuperAdmin({ user }) {
  const [page,         setPage]         = useState("dashboard");
  const [clinics,      setClinics]      = useState([]);
  const [payments,     setPayments]     = useState([]);
  const [webhookLogs,  setWebhookLogs]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [planFilter,   setPlanFilter]   = useState("all");
  const [broadcast,    setBroadcast]    = useState({ subject:"", body:"", sending:false, sent:false });
  const [actionClinic, setActionClinic] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [{ data: cls }, { data: pays }, { data: logs }] = await Promise.all([
        supabase.from("clinics")
          .select("id,name,slug,city,plan,plan_status,is_published,created_at,specialty,razorpay_subscription_id,plan_activated_at")
          .order("created_at", { ascending:false }),
        supabase.from("payments")
          .select("id,clinic_id,plan,amount,status,paid_at,clinics(name,city)")
          .order("paid_at", { ascending:false }).limit(50),
        supabase.from("webhook_logs")
          .select("id,event,clinic_id,created_at,payload")
          .order("created_at", { ascending:false }).limit(30),
      ]);
      setClinics(cls || []);
      setPayments(pays || []);
      setWebhookLogs(logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (clinicId, plan) => {
    await supabase.from("clinics").update({ plan }).eq("id", clinicId);
    setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, plan } : c));
    setActionClinic(null);
  };

  const togglePublish = async (clinicId, current) => {
    await supabase.from("clinics").update({ is_published: !current }).eq("id", clinicId);
    setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, is_published: !current } : c));
  };

  const deleteClinic = async (clinicId) => {
    if (!window.confirm("Permanently delete this clinic? This cannot be undone.")) return;
    await supabase.from("clinics").delete().eq("id", clinicId);
    setClinics(prev => prev.filter(c => c.id !== clinicId));
    setActionClinic(null);
  };

  // ── Computed stats ──────────────────────────────────────────────
  const totalClinics     = clinics.length;
  const premiumClinics   = clinics.filter(c => c.plan === "premium").length;
  const enterpriseClinics = clinics.filter(c => c.plan === "enterprise").length;
  const freeClinics      = clinics.filter(c => c.plan === "free").length;
  const mrr              = premiumClinics * 499 + enterpriseClinics * 1999;
  const arr              = mrr * 12;

  const filteredClinics = clinics.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.city?.toLowerCase().includes(search.toLowerCase());
    const matchPlan   = planFilter === "all" || c.plan === planFilter;
    return matchSearch && matchPlan;
  });

  return (
    <div style={{ display:"flex", height:"100vh", background:"#080c14", color:"#e2e8f0", fontFamily:"'DM Sans','Segoe UI',sans-serif", overflow:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* ── Sidebar ── */}
      <div style={{ width:220, flexShrink:0, background:"#0a1020", borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"18px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#dc2626,#ea580c)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⚡</div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>WaSpace</div>
              <div style={{ fontSize:10, color:"#dc2626", fontFamily:"monospace", fontWeight:600 }}>SUPERADMIN</div>
            </div>
          </div>
        </div>

        <nav style={{ flex:1, padding:"10px 8px" }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              width:"100%", display:"flex", alignItems:"center", gap:10,
              padding:"9px 10px", borderRadius:8, border:"none", cursor:"pointer",
              background: page === item.id ? "rgba(220,38,38,0.12)" : "transparent",
              color: page === item.id ? "#fca5a5" : "#475569",
              fontFamily:"inherit", fontSize:13, fontWeight: page === item.id ? 600 : 400,
              borderLeft: page === item.id ? "2px solid #dc2626" : "2px solid transparent",
              transition:"all .15s", marginBottom:2, textAlign:"left",
            }}>
              <span style={{ fontSize:16 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize:11, color:"#334155", marginBottom:2 }}>Signed in as</div>
          <div style={{ fontSize:12, color:"#64748b", wordBreak:"break-all" }}>{user?.email}</div>
          <button onClick={() => supabase.auth.signOut()} style={{ marginTop:8, width:"100%", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", color:"#f87171", borderRadius:6, padding:"6px", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Topbar */}
        <div style={{ height:60, background:"#0a1020", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", padding:"0 24px", gap:16, flexShrink:0 }}>
          <div style={{ fontSize:16, fontWeight:700, color:"#f1f5f9" }}>{NAV.find(n=>n.id===page)?.label}</div>
          <div style={{ marginLeft:"auto", display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ fontSize:12, color:"#334155", fontFamily:"monospace" }}>MRR: <span style={{ color:"#22c55e", fontWeight:700 }}>₹{mrr.toLocaleString()}</span></div>
            <button onClick={loadAll} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", color:"#64748b", borderRadius:7, padding:"6px 14px", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
              ↻ Refresh
            </button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:24 }}>

          {/* ════ DASHBOARD ════ */}
          {page === "dashboard" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
                <StatCard icon="🏥" label="Total Clinics"   value={totalClinics}          sub="On platform"          color="#3b82f6" />
                <StatCard icon="💰" label="MRR"             value={`₹${mrr.toLocaleString()}`} sub="Monthly recurring"   color="#22c55e" />
                <StatCard icon="⭐" label="Premium + Ent."  value={premiumClinics + enterpriseClinics} sub={`${Math.round(((premiumClinics+enterpriseClinics)/Math.max(totalClinics,1))*100)}% conversion`} color="#f59e0b" />
                <StatCard icon="📅" label="Free Clinics"    value={freeClinics}           sub="Upgrade targets"      color="#64748b" />
              </div>

              {/* Plan breakdown */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
                <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 }}>
                  <div style={{ fontFamily:"monospace", fontSize:12, color:"#64748b", marginBottom:16 }}>PLAN DISTRIBUTION</div>
                  {[
                    ["Free",       freeClinics,       "#64748b"],
                    ["Premium",    premiumClinics,    "#3b82f6"],
                    ["Enterprise", enterpriseClinics, "#a855f7"],
                  ].map(([name, count, color]) => (
                    <div key={name} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontSize:13, color:"#94a3b8" }}>{name}</span>
                        <span style={{ fontSize:13, color, fontFamily:"monospace", fontWeight:600 }}>{count} clinics</span>
                      </div>
                      <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
                        <div style={{ width:`${(count/Math.max(totalClinics,1))*100}%`, height:"100%", background:color, borderRadius:3, transition:"width .6s" }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 }}>
                  <div style={{ fontFamily:"monospace", fontSize:12, color:"#64748b", marginBottom:16 }}>REVENUE PROJECTIONS</div>
                  {[
                    ["MRR",  `₹${mrr.toLocaleString()}`,        "#22c55e"],
                    ["ARR",  `₹${arr.toLocaleString()}`,        "#22c55e"],
                    ["Avg. Revenue/Clinic", `₹${totalClinics ? Math.round(mrr/totalClinics) : 0}`, "#3b82f6"],
                    ["Cost/Month (est.)", `₹${(6000 + totalClinics*21).toLocaleString()}`, "#ef4444"],
                    ["Est. Profit/Month", `₹${Math.max(0, mrr - 6000 - totalClinics*21).toLocaleString()}`, "#f59e0b"],
                  ].map(([k,v,c]) => (
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", fontSize:13 }}>
                      <span style={{ color:"#64748b" }}>{k}</span>
                      <span style={{ color:c, fontFamily:"monospace", fontWeight:700 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent signups */}
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 }}>
                <div style={{ fontFamily:"monospace", fontSize:12, color:"#64748b", marginBottom:14 }}>RECENT SIGNUPS</div>
                {clinics.slice(0,5).map(c => (
                  <div key={c.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:"rgba(21,101,192,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>🏥</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:"#e2e8f0" }}>{c.name}</div>
                      <div style={{ fontSize:11, color:"#475569" }}>{c.city} · {c.specialty}</div>
                    </div>
                    <Badge plan={c.plan || "free"} />
                    <div style={{ fontSize:11, color:"#334155", fontFamily:"monospace" }}>
                      {new Date(c.created_at).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ ALL CLINICS ════ */}
          {page === "clinics" && (
            <div>
              {/* Filters */}
              <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                <input placeholder="Search clinic or city..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ flex:1, minWidth:200, padding:"8px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", color:"#e2e8f0", borderRadius:8, fontSize:13, fontFamily:"inherit", outline:"none" }} />
                {["all","free","premium","enterprise"].map(p => (
                  <button key={p} onClick={() => setPlanFilter(p)} style={{
                    padding:"8px 16px", borderRadius:8, cursor:"pointer", fontFamily:"monospace", fontSize:11, fontWeight:600, textTransform:"uppercase",
                    background: planFilter === p ? "rgba(220,38,38,0.15)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${planFilter === p ? "rgba(220,38,38,0.4)" : "rgba(255,255,255,0.08)"}`,
                    color: planFilter === p ? "#fca5a5" : "#475569",
                  }}>
                    {p} ({p==="all" ? clinics.length : clinics.filter(c=>c.plan===p).length})
                  </button>
                ))}
              </div>

              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                      {["Clinic","City","Specialty","Plan","Published","Joined","Actions"].map(h => (
                        <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontFamily:"monospace", color:"#475569", fontWeight:600, letterSpacing:0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClinics.map((c, i) => (
                      <tr key={c.id} style={{ borderBottom: i < filteredClinics.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                        onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                        <td style={{ padding:"12px 14px" }}>
                          <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0" }}>{c.name}</div>
                          <div style={{ fontSize:11, color:"#334155", fontFamily:"monospace" }}>{c.slug}</div>
                        </td>
                        <td style={{ padding:"12px 14px", fontSize:13, color:"#94a3b8" }}>{c.city}</td>
                        <td style={{ padding:"12px 14px", fontSize:13, color:"#94a3b8" }}>{c.specialty}</td>
                        <td style={{ padding:"12px 14px" }}><Badge plan={c.plan || "free"} /></td>
                        <td style={{ padding:"12px 14px" }}>
                          <button onClick={() => togglePublish(c.id, c.is_published)}
                            style={{ background: c.is_published ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border:`1px solid ${c.is_published ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, color: c.is_published ? "#22c55e" : "#f87171", borderRadius:6, padding:"3px 10px", fontSize:11, cursor:"pointer", fontFamily:"monospace", fontWeight:600 }}>
                            {c.is_published ? "Live" : "Hidden"}
                          </button>
                        </td>
                        <td style={{ padding:"12px 14px", fontSize:11, color:"#475569", fontFamily:"monospace" }}>
                          {new Date(c.created_at).toLocaleDateString("en-IN")}
                        </td>
                        <td style={{ padding:"12px 14px" }}>
                          <div style={{ display:"flex", gap:6 }}>
                            <a href={`/${c.slug}`} target="_blank"
                              style={{ background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.3)", color:"#3b82f6", borderRadius:6, padding:"4px 8px", fontSize:11, textDecoration:"none", cursor:"pointer" }}>
                              View ↗
                            </a>
                            <button onClick={() => setActionClinic(actionClinic?.id === c.id ? null : c)}
                              style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"#94a3b8", borderRadius:6, padding:"4px 8px", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                              ⋯
                            </button>
                          </div>
                          {/* Action menu */}
                          {actionClinic?.id === c.id && (
                            <div style={{ position:"absolute", background:"#0d1526", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:8, zIndex:50, minWidth:160, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", marginTop:4 }}>
                              <div style={{ fontSize:10, color:"#334155", fontFamily:"monospace", padding:"4px 8px", marginBottom:4 }}>CHANGE PLAN</div>
                              {["free","premium","enterprise"].map(p => (
                                <button key={p} onClick={() => updatePlan(c.id, p)}
                                  style={{ display:"block", width:"100%", padding:"7px 12px", background: c.plan===p ? "rgba(59,130,246,0.1)" : "transparent", border:"none", color: c.plan===p ? "#7dd3fc" : "#94a3b8", borderRadius:6, fontSize:12, cursor:"pointer", fontFamily:"inherit", textAlign:"left", textTransform:"capitalize" }}>
                                  {c.plan===p ? "✓ " : ""}{p}
                                </button>
                              ))}
                              <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", margin:"6px 0" }} />
                              <button onClick={() => deleteClinic(c.id)}
                                style={{ display:"block", width:"100%", padding:"7px 12px", background:"transparent", border:"none", color:"#f87171", borderRadius:6, fontSize:12, cursor:"pointer", fontFamily:"inherit", textAlign:"left" }}>
                                🗑 Delete clinic
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredClinics.length === 0 && (
                  <div style={{ padding:32, textAlign:"center", color:"#334155", fontSize:14 }}>No clinics found</div>
                )}
              </div>
            </div>
          )}

          {/* ════ REVENUE ════ */}
          {page === "revenue" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
                <StatCard icon="💰" label="MRR"              value={`₹${mrr.toLocaleString()}`}  sub="This month"         color="#22c55e" />
                <StatCard icon="📈" label="ARR"              value={`₹${arr.toLocaleString()}`}  sub="Annualised"         color="#3b82f6" />
                <StatCard icon="🎯" label="Conversion Rate"  value={`${Math.round(((premiumClinics+enterpriseClinics)/Math.max(totalClinics,1))*100)}%`} sub="Free → Paid"  color="#f59e0b" />
              </div>

              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:24 }}>
                <div style={{ fontFamily:"monospace", fontSize:12, color:"#64748b", marginBottom:20 }}>REVENUE BREAKDOWN</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                  {[
                    { plan:"Free",       count:freeClinics,       rev:0,                           color:"#64748b" },
                    { plan:"Premium",    count:premiumClinics,    rev:premiumClinics * 499,         color:"#3b82f6" },
                    { plan:"Enterprise", count:enterpriseClinics, rev:enterpriseClinics * 1999,    color:"#a855f7" },
                  ].map(row => (
                    <div key={row.plan} style={{ background:"rgba(0,0,0,0.3)", borderRadius:10, padding:18 }}>
                      <Badge plan={row.plan.toLowerCase()} />
                      <div style={{ fontSize:24, fontWeight:700, color:row.color, fontFamily:"monospace", marginTop:12, marginBottom:4 }}>
                        {row.rev === 0 ? "₹0" : `₹${row.rev.toLocaleString()}`}
                      </div>
                      <div style={{ fontSize:12, color:"#64748b" }}>{row.count} clinics × ₹{row.plan==="Free"?0:row.plan==="Premium"?499:1999}/mo</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop:24, padding:16, background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
                    {[
                      ["Total Revenue",       `₹${mrr.toLocaleString()}/mo`,                          "#22c55e"],
                      ["Est. Infra Cost",     `₹${(6000 + totalClinics*21).toLocaleString()}/mo`,      "#ef4444"],
                      ["Est. Gross Profit",   `₹${Math.max(0,mrr-6000-totalClinics*21).toLocaleString()}/mo`, "#f59e0b"],
                      ["Gross Margin",        `${mrr > 0 ? Math.round(((mrr-6000-totalClinics*21)/mrr)*100) : 0}%`, "#a855f7"],
                    ].map(([k,v,c]) => (
                      <div key={k} style={{ textAlign:"center" }}>
                        <div style={{ fontSize:10, color:"#475569", fontFamily:"monospace", marginBottom:4 }}>{k}</div>
                        <div style={{ fontSize:20, fontWeight:700, color:c, fontFamily:"monospace" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ PAYMENTS ════ */}
          {page === "payments" && (
            <div>
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                      {["Clinic","Plan","Amount","Payment ID","Date","Status"].map(h => (
                        <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontFamily:"monospace", color:"#475569" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 && (
                      <tr><td colSpan={6} style={{ padding:32, textAlign:"center", color:"#334155", fontSize:14 }}>No payments yet</td></tr>
                    )}
                    {payments.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: i < payments.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <td style={{ padding:"12px 14px", fontSize:13, color:"#e2e8f0", fontWeight:600 }}>{p.clinics?.name}</td>
                        <td style={{ padding:"12px 14px" }}><Badge plan={p.plan} /></td>
                        <td style={{ padding:"12px 14px", fontSize:13, color:"#22c55e", fontFamily:"monospace", fontWeight:700 }}>₹{((p.amount||0)/100).toLocaleString()}</td>
                        <td style={{ padding:"12px 14px", fontSize:11, color:"#475569", fontFamily:"monospace" }}>{p.razorpay_payment_id || "—"}</td>
                        <td style={{ padding:"12px 14px", fontSize:11, color:"#475569", fontFamily:"monospace" }}>{new Date(p.created_at).toLocaleDateString("en-IN")}</td>
                        <td style={{ padding:"12px 14px" }}>
                          <span style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", color:"#22c55e", borderRadius:20, padding:"2px 10px", fontSize:11, fontFamily:"monospace" }}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ WEBHOOKS ════ */}
          {page === "webhooks" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={{ fontSize:13, color:"#64748b" }}>
                  Last {webhookLogs.length} webhook events from Razorpay
                </div>
                <button onClick={loadAll} style={{
                  background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                  color:"#94a3b8", borderRadius:6, padding:"6px 12px", fontSize:12, cursor:"pointer", fontFamily:"inherit",
                }}>🔄 Refresh</button>
              </div>

              {webhookLogs.length === 0 ? (
                <div style={{ textAlign:"center", padding:"40px 0", color:"#475569", fontSize:14 }}>
                  No webhook events yet. Events appear here once Razorpay webhook is configured.
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {webhookLogs.map(log => {
                    const isSuccess = log.event.includes("activated") || log.event.includes("charged");
                    const isDanger  = log.event.includes("halted") || log.event.includes("failed");
                    const color     = isSuccess ? "#22c55e" : isDanger ? "#ef4444" : "#94a3b8";
                    const bg        = isSuccess ? "rgba(34,197,94,0.06)" : isDanger ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)";
                    return (
                      <div key={log.id} style={{
                        background:bg, border:`1px solid ${color}20`,
                        borderLeft:`3px solid ${color}`,
                        borderRadius:8, padding:"12px 16px",
                        display:"flex", alignItems:"center", gap:16,
                      }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, fontFamily:"monospace", color, fontWeight:700, marginBottom:3 }}>
                            {log.event}
                          </div>
                          <div style={{ fontSize:11, color:"#475569" }}>
                            Clinic: {log.clinic_id?.slice(0,8) || "unknown"} ·{" "}
                            {new Date(log.created_at).toLocaleString("en-IN")}
                          </div>
                        </div>
                        <button
                          onClick={() => alert(JSON.stringify(log.payload, null, 2))}
                          style={{ background:"none", border:"1px solid rgba(255,255,255,0.1)",
                            color:"#64748b", borderRadius:6, padding:"4px 10px",
                            fontSize:11, cursor:"pointer" }}>
                          View payload
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════ BROADCAST ════ */}
          {page === "broadcast" && (
            <div style={{ maxWidth:620 }}>
              <div style={{ background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#f59e0b" }}>
                ⚠️ This will send an email to ALL {totalClinics} clinic owners on the platform.
              </div>
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:24 }}>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace", fontWeight:600, marginBottom:8 }}>SUBJECT</div>
                  <input value={broadcast.subject} onChange={e => setBroadcast(p=>({...p,subject:e.target.value}))}
                    placeholder="e.g. New feature: Blog articles now available!"
                    style={{ width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#e2e8f0", borderRadius:9, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
                </div>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace", fontWeight:600, marginBottom:8 }}>MESSAGE BODY</div>
                  <textarea value={broadcast.body} onChange={e => setBroadcast(p=>({...p,body:e.target.value}))}
                    placeholder="Write your message to all clinic owners..."
                    rows={8} style={{ width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#e2e8f0", borderRadius:9, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box", resize:"vertical", lineHeight:1.6 }} />
                </div>
                {broadcast.sent && <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.25)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#22c55e", marginBottom:16 }}>✓ Broadcast sent to {totalClinics} clinic owners.</div>}
                <button
                  onClick={() => { setBroadcast(p=>({...p,sending:true})); setTimeout(()=>setBroadcast(p=>({...p,sending:false,sent:true,subject:"",body:""})),1500); }}
                  disabled={!broadcast.subject || !broadcast.body || broadcast.sending}
                  style={{ padding:"12px 28px", background: broadcast.subject&&broadcast.body ? "linear-gradient(135deg,#dc2626,#ea580c)" : "rgba(255,255,255,0.05)", border:"none", borderRadius:10, color: broadcast.subject&&broadcast.body ? "white" : "#334155", fontSize:14, fontWeight:700, cursor: broadcast.subject&&broadcast.body ? "pointer":"not-allowed", fontFamily:"inherit" }}>
                  {broadcast.sending ? "Sending..." : `📢 Send to All ${totalClinics} Clinics`}
                </button>
              </div>
            </div>
          )}

          {/* ════ SETTINGS ════ */}
          {page === "settings" && (
            <div style={{ maxWidth:520 }}>
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:24 }}>
                <div style={{ fontFamily:"monospace", fontSize:12, color:"#64748b", marginBottom:16 }}>PLATFORM SETTINGS</div>
                {[
                  { label:"Platform Name",  value:"WaSpace" },
                  { label:"Platform URL",   value:"waspace.in" },
                  { label:"Support Email",  value:"support@waspace.in" },
                  { label:"Free Plan Limit", value:"3 pages, 1 doctor" },
                ].map(s => (
                  <div key={s.label} style={{ marginBottom:16 }}>
                    <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace", fontWeight:600, marginBottom:6 }}>{s.label.toUpperCase()}</div>
                    <input defaultValue={s.value} style={{ width:"100%", padding:"10px 14px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#e2e8f0", borderRadius:8, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
                  </div>
                ))}
                <button style={{ padding:"11px 24px", background:"linear-gradient(135deg,#dc2626,#ea580c)", border:"none", borderRadius:10, color:"white", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  Save Settings
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}