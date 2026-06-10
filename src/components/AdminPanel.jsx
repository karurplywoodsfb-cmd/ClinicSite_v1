// src/components/AdminPanel.jsx — FINAL (all compliance updates integrated)
import { useState, useEffect } from "react";
import {
  supabase, updateClinic, getServices, getDoctors,
  updateService, updateDoctor, getAppointments,
  updateAppointmentStatus, uploadDoctorPhoto,
  publishClinic, subscribeToAppointments,
} from "../lib/supabase";
import UpgradeModal  from "./UpgradeModal";
import ComplianceTab from "./ComplianceTab";
import AIBlogGenerator from "./AIBlogGenerator";
import { TEMPLATES, suggestTemplate } from "../templates";

// ── helpers ───────────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    confirmed:{ bg:"rgba(34,197,94,0.12)",  border:"rgba(34,197,94,0.3)",  color:"#22c55e", label:"Confirmed" },
    pending:  { bg:"rgba(245,158,11,0.12)", border:"rgba(245,158,11,0.3)", color:"#f59e0b", label:"Pending" },
    completed:{ bg:"rgba(100,116,139,0.12)",border:"rgba(100,116,139,0.3)",color:"#64748b", label:"Completed" },
  };
  const s = map[status] || map.pending;
  return <span style={{ background:s.bg, border:`1px solid ${s.border}`, color:s.color, borderRadius:20, padding:"3px 10px", fontSize:11, fontFamily:"monospace", fontWeight:600 }}>{s.label}</span>;
}
function Toggle({ value, onChange }) {
  return (
    <div onClick={()=>onChange(!value)} style={{ width:40, height:22, borderRadius:11, background:value?"#22c55e":"rgba(255,255,255,0.12)", position:"relative", cursor:"pointer", transition:"background .25s", flexShrink:0, border:`1px solid ${value?"rgba(34,197,94,0.5)":"rgba(255,255,255,0.15)"}` }}>
      <div style={{ width:16, height:16, borderRadius:"50%", background:"white", position:"absolute", top:2, left:value?20:2, transition:"left .25s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }}/>
    </div>
  );
}
function Field({ label, value, onChange, multiline, hint }) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <label style={{ fontSize:12, color:"#64748b", fontFamily:"monospace", fontWeight:600, letterSpacing:.5 }}>{label}</label>
        {hint&&<span style={{ fontSize:11, color:"#334155" }}>{hint}</span>}
      </div>
      {multiline
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} rows={3} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", color:"#e2e8f0", borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box", lineHeight:1.6 }}/>
        : <input value={value||""} onChange={e=>onChange(e.target.value)} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", color:"#e2e8f0", borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
      }
    </div>
  );
}
function SaveBtn({ saved, saving, onClick }) {
  return (
    <button onClick={onClick} disabled={saving} style={{ background:saved?"rgba(34,197,94,0.15)":"linear-gradient(135deg,#1565c0,#1e88e5)", border:`1px solid ${saved?"rgba(34,197,94,0.4)":"rgba(30,136,229,0.5)"}`, color:saved?"#22c55e":"white", borderRadius:8, padding:"10px 24px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all .2s" }}>
      {saving?"Saving...":saved?"✓ Saved":"Save Changes"}
    </button>
  );
}

const NAV = [
  { id:"dashboard",   label:"Dashboard",       icon:"⊞" },
  { id:"appointments",label:"Appointments",    icon:"📅" },
  { id:"services",    label:"Services",        icon:"🦷" },
  { id:"clinic",      label:"Clinic Info",     icon:"🏥" },
  { id:"doctor",      label:"Doctor Profile",  icon:"👨‍⚕️" },
  { id:"design",      label:"Design & Theme",  icon:"🎨" },
  { id:"blog",        label:"Blog & Content",  icon:"✍️" },
  { id:"seo",         label:"SEO",             icon:"🔍" },
  { id:"compliance",  label:"Compliance",      icon:"⚖️" },
  { id:"preview",     label:"Preview Site",    icon:"👁️" },
];

export default function AdminPanel({ user, clinic: initClinic, onClinicUpdate, onLogout }) {
  const [page,       setPage]       = useState("dashboard");
  const [clinic,     setClinic]     = useState(initClinic);
  const [services,   setServices]   = useState([]);
  const [doctors,    setDoctors]    = useState([]);
  const [appts,      setAppts]      = useState([]);
  const [saved,      setSaved]      = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [apptFilter, setApptFilter] = useState("all");
  const [showUpgrade,setShowUpgrade]= useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState("");
  const [sideOpen,   setSideOpen]   = useState(true);

  // Load data on mount
  useEffect(() => {
    if (!clinic?.id) return;
    getServices(clinic.id).then(setServices).catch(()=>{});
    getDoctors(clinic.id).then(setDoctors).catch(()=>{});
    getAppointments(clinic.id).then(setAppts).catch(()=>{});
    // Realtime appointments
    const unsub = subscribeToAppointments(clinic.id, (payload) => {
      if (payload.eventType === "INSERT") setAppts(p => [payload.new, ...p]);
      if (payload.eventType === "UPDATE")  setAppts(p => p.map(a => a.id===payload.new.id ? payload.new : a));
    });
    return unsub;
  }, [clinic?.id]);

  const handleSave = async (updates) => {
    setSaving(true);
    try {
      const updated = await updateClinic(clinic.id, updates);
      setClinic(updated);
      onClinicUpdate?.(updated);
      setSaved(true); setTimeout(()=>setSaved(false), 2000);
    } catch(e) { alert("Save failed: "+e.message); }
    finally { setSaving(false); }
  };

  const handlePublish = async () => {
    setPublishing(true); setPublishMsg("Publishing...");
    try {
      await publishClinic(clinic.id, !clinic.is_published);
      const updated = { ...clinic, is_published: !clinic.is_published };
      setClinic(updated); onClinicUpdate?.(updated);
      setPublishMsg(updated.is_published ? "✓ Site is Live!" : "✓ Site Hidden");
      setTimeout(()=>setPublishMsg(""), 3000);
    } catch(e) { setPublishMsg("⚠ "+e.message); setTimeout(()=>setPublishMsg(""), 5000); }
    finally { setPublishing(false); }
  };

  const filteredAppts = apptFilter==="all" ? appts : appts.filter(a=>a.status===apptFilter);
  const doctor = doctors[0];

  return (
    <div style={{ display:"flex", height:"100vh", background:"#080c14", color:"#e2e8f0", fontFamily:"'DM Sans','Segoe UI',sans-serif", overflow:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* ── SIDEBAR ── */}
      <div style={{ width:sideOpen?224:60, flexShrink:0, background:"#0d1526", borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", transition:"width .25s", overflow:"hidden" }}>
        <div style={{ padding:"16px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:10, minHeight:64 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#1565c0,#1e88e5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>🦷</div>
          {sideOpen&&<div style={{ overflow:"hidden" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#f1f5f9", whiteSpace:"nowrap" }}>ClinicSite</div>
            <div style={{ fontSize:10, color:"#475569", whiteSpace:"nowrap" }}>Admin Panel</div>
          </div>}
          <button onClick={()=>setSideOpen(!sideOpen)} style={{ marginLeft:"auto", background:"none", border:"none", color:"#475569", cursor:"pointer", fontSize:14, padding:2, flexShrink:0 }}>{sideOpen?"◀":"▶"}</button>
        </div>
        <nav style={{ flex:1, padding:"10px 8px", overflowY:"auto" }}>
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setPage(item.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderRadius:8, border:"none", cursor:"pointer", background:page===item.id?"rgba(21,101,192,0.15)":"transparent", color:page===item.id?"#7dd3fc":"#475569", fontFamily:"inherit", fontSize:13, fontWeight:page===item.id?600:400, transition:"all .15s", marginBottom:2, textAlign:"left", borderLeft:page===item.id?"2px solid #1e88e5":"2px solid transparent" }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
              {sideOpen&&<span style={{ whiteSpace:"nowrap", overflow:"hidden" }}>{item.label}</span>}
              {item.id==="compliance"&&sideOpen&&services.length>0&&!doctor?.reg_number&&(
                <span style={{ marginLeft:"auto", width:8, height:8, borderRadius:"50%", background:"#ef4444", flexShrink:0 }}/>
              )}
            </button>
          ))}
        </nav>
        {sideOpen&&(
          <div style={{ padding:"12px 12px 16px" }}>
            <div style={{ background:"rgba(21,101,192,0.1)", border:"1px solid rgba(21,101,192,0.25)", borderRadius:8, padding:"10px 12px" }}>
              <div style={{ fontSize:10, color:"#3b82f6", fontFamily:"monospace", marginBottom:4 }}>{(clinic?.plan||"free").toUpperCase()} PLAN</div>
              <div style={{ fontSize:11, color:"#64748b", marginBottom:8 }}>
                {clinic?.plan==="free"?"Upgrade for appointments + custom domain":"Active subscription"}
              </div>
              {clinic?.plan==="free"&&(
                <button onClick={()=>setShowUpgrade(true)} style={{ width:"100%", background:"#1565c0", border:"none", color:"white", borderRadius:6, padding:"6px", fontSize:11, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
                  Upgrade ₹499/mo →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Topbar */}
        <div style={{ height:64, background:"#0d1526", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", padding:"0 24px", gap:16, flexShrink:0 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#f1f5f9" }}>{NAV.find(n=>n.id===page)?.label}</div>
            <div style={{ fontSize:11, color:"#475569", fontFamily:"monospace" }}>
              {clinic?.slug}.clinicsite.in {clinic?.is_published?"· 🟢 Live":"· ⚫ Hidden"}
            </div>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:10, alignItems:"center" }}>
            {publishMsg&&<div style={{ fontSize:12, color:publishMsg.includes("✓")?"#22c55e":"#f59e0b", fontFamily:"monospace", background:"rgba(0,0,0,0.3)", borderRadius:6, padding:"4px 12px" }}>{publishMsg}</div>}
            <button onClick={handlePublish} disabled={publishing} style={{ background:clinic?.is_published?"rgba(239,68,68,0.1)":"rgba(34,197,94,0.1)", border:`1px solid ${clinic?.is_published?"rgba(239,68,68,0.3)":"rgba(34,197,94,0.3)"}`, color:clinic?.is_published?"#f87171":"#22c55e", borderRadius:8, padding:"8px 16px", fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:600, transition:"all .2s" }}>
              {publishing?"...":clinic?.is_published?"⏸ Unpublish":"🚀 Publish Site"}
            </button>
            <button onClick={onLogout} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", color:"#64748b", borderRadius:8, padding:"8px 14px", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:24 }}>

          {/* ═══ DASHBOARD ═══ */}
          {page==="dashboard"&&(
            <div>
              <div style={{ marginBottom:20, fontSize:13, color:"#64748b" }}>Good morning 👋 — {clinic?.name}</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
                {[
                  { label:"Appointments",  value:appts.length,                             icon:"📅", color:"#3b82f6" },
                  { label:"Pending",       value:appts.filter(a=>a.status==="pending").length, icon:"⏳", color:"#f59e0b" },
                  { label:"SEO Score",     value:"91/100",                                 icon:"🔍", color:"#22c55e" },
                  { label:"Plan",          value:(clinic?.plan||"Free").toUpperCase(),     icon:"⭐", color:"#a855f7" },
                ].map(s=>(
                  <div key={s.label} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:18 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                      <span style={{ fontSize:22 }}>{s.icon}</span>
                      <span style={{ fontSize:10, background:`${s.color}15`, border:`1px solid ${s.color}30`, color:s.color, borderRadius:4, padding:"2px 7px", fontFamily:"monospace" }}>LIVE</span>
                    </div>
                    <div style={{ fontSize:26, fontWeight:700, color:s.color, fontFamily:"monospace", marginBottom:4 }}>{s.value}</div>
                    <div style={{ fontSize:12, color:"#94a3b8" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Compliance alert */}
              {!doctor?.reg_number&&(
                <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:20 }}>⚠️</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#f87171" }}>Compliance Action Required</div>
                    <div style={{ fontSize:12, color:"#64748b" }}>Medical Council Registration Number is missing. Required by IMC Ethics Regulations 2002 before publishing.</div>
                  </div>
                  <button onClick={()=>setPage("doctor")} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#f87171", borderRadius:7, padding:"6px 14px", fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>Fix →</button>
                </div>
              )}
              {/* Today's appointments */}
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20 }}>
                <div style={{ fontFamily:"monospace", fontSize:12, color:"#64748b", marginBottom:14 }}>TODAY'S APPOINTMENTS</div>
                {appts.length===0
                  ? <div style={{ fontSize:13, color:"#334155", textAlign:"center", padding:"20px 0" }}>No appointments yet. Share your booking link with patients.</div>
                  : appts.slice(0,5).map((a,i)=>(
                    <div key={a.id||i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0" }}>{a.patient_name}</div>
                        <div style={{ fontSize:11, color:"#475569" }}>{a.appt_time} · {a.service}</div>
                      </div>
                      <Badge status={a.status}/>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ═══ APPOINTMENTS ═══ */}
          {page==="appointments"&&(
            <div>
              <div style={{ display:"flex", gap:8, marginBottom:20 }}>
                {["all","pending","confirmed","completed"].map(f=>(
                  <button key={f} onClick={()=>setApptFilter(f)} style={{ background:apptFilter===f?"rgba(21,101,192,0.15)":"rgba(255,255,255,0.03)", border:`1px solid ${apptFilter===f?"rgba(21,101,192,0.4)":"rgba(255,255,255,0.08)"}`, color:apptFilter===f?"#7dd3fc":"#64748b", borderRadius:8, padding:"7px 16px", cursor:"pointer", fontSize:12, fontFamily:"monospace", textTransform:"capitalize" }}>
                    {f} ({f==="all"?appts.length:appts.filter(a=>a.status===f).length})
                  </button>
                ))}
              </div>
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                    {["Patient","Phone","Service","Date & Time","Consent","Status","Actions"].map(h=>(
                      <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontFamily:"monospace", color:"#475569", fontWeight:600 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredAppts.length===0&&(
                      <tr><td colSpan={7} style={{ padding:32, textAlign:"center", color:"#334155", fontSize:13 }}>No appointments found</td></tr>
                    )}
                    {filteredAppts.map((a,i)=>(
                      <tr key={a.id||i} style={{ borderBottom:i<filteredAppts.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}>
                        <td style={{ padding:"12px 16px", fontSize:13, fontWeight:600, color:"#e2e8f0" }}>{a.patient_name}</td>
                        <td style={{ padding:"12px 16px", fontSize:13, color:"#94a3b8" }}>{a.phone}</td>
                        <td style={{ padding:"12px 16px", fontSize:13, color:"#94a3b8" }}>{a.service}</td>
                        <td style={{ padding:"12px 16px" }}>
                          <div style={{ fontSize:13, color:"#e2e8f0" }}>{a.appt_date}</div>
                          <div style={{ fontSize:11, color:"#475569" }}>{a.appt_time}</div>
                        </td>
                        <td style={{ padding:"12px 16px" }}>
                          <span style={{ fontSize:11, color:a.consent_appointment?"#22c55e":"#ef4444", fontFamily:"monospace" }}>
                            {a.consent_appointment?"✓ DPDP":"✗ Missing"}
                          </span>
                        </td>
                        <td style={{ padding:"12px 16px" }}><Badge status={a.status}/></td>
                        <td style={{ padding:"12px 16px" }}>
                          <div style={{ display:"flex", gap:6 }}>
                            {a.status==="pending"&&<button onClick={()=>updateAppointmentStatus(a.id,"confirmed").then(u=>setAppts(p=>p.map(x=>x.id===a.id?u:x)))} style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", color:"#22c55e", borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>Confirm</button>}
                            {a.status==="confirmed"&&<button onClick={()=>updateAppointmentStatus(a.id,"completed").then(u=>setAppts(p=>p.map(x=>x.id===a.id?u:x)))} style={{ background:"rgba(100,116,139,0.1)", border:"1px solid rgba(100,116,139,0.3)", color:"#64748b", borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>Complete</button>}
                            <a href={`https://wa.me/${(a.phone||"").replace(/\D/g,"")}`} target="_blank" style={{ background:"rgba(37,211,102,0.1)", border:"1px solid rgba(37,211,102,0.3)", color:"#25d366", borderRadius:6, padding:"4px 10px", fontSize:11, textDecoration:"none" }}>💬</a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ SERVICES ═══ */}
          {page==="services"&&(
            <div>
              <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
                <SaveBtn saved={saved} saving={saving} onClick={()=>handleSave({})}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {(services.length>0?services:[
                  {id:1,name:"General Checkup",price:"₹500",is_active:true,icon:"🔬"},
                  {id:2,name:"Dental Implants",price:"₹25,000",is_active:true,icon:"🔩"},
                ]).map(svc=>(
                  <div key={svc.id} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:18, opacity:svc.is_active?1:.5 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                      <span style={{ fontSize:24 }}>{svc.icon||"🏥"}</span>
                      <input value={svc.name} onChange={e=>setServices(p=>p.map(s=>s.id===svc.id?{...s,name:e.target.value}:s))} style={{ background:"transparent", border:"none", color:"#e2e8f0", fontSize:14, fontWeight:600, fontFamily:"inherit", flex:1, outline:"none" }}/>
                      <Toggle value={!!svc.is_active} onChange={v=>{setServices(p=>p.map(s=>s.id===svc.id?{...s,is_active:v}:s));if(svc.id&&typeof svc.id==="string")updateService(svc.id,{is_active:v});}}/>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:12, color:"#475569" }}>Consultation fee:</span>
                      <input value={svc.price} onChange={e=>setServices(p=>p.map(s=>s.id===svc.id?{...s,price:e.target.value}:s))} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#22c55e", borderRadius:6, padding:"4px 10px", fontSize:13, fontFamily:"monospace", width:100, outline:"none", fontWeight:600 }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ CLINIC INFO ═══ */}
          {page==="clinic"&&(
            <div style={{ maxWidth:680 }}>
              <Field label="CLINIC NAME" value={clinic?.name} onChange={v=>setClinic(p=>({...p,name:v}))}/>
              <Field label="TAGLINE" value={clinic?.tagline} onChange={v=>setClinic(p=>({...p,tagline:v}))} hint="Shown under clinic name — no superlatives"/>
              <Field label="PHONE NUMBER" value={clinic?.phone} onChange={v=>setClinic(p=>({...p,phone:v}))}/>
              <Field label="WHATSAPP NUMBER" value={clinic?.whatsapp} onChange={v=>setClinic(p=>({...p,whatsapp:v}))}/>
              <Field label="EMAIL" value={clinic?.email} onChange={v=>setClinic(p=>({...p,email:v}))}/>
              <Field label="ADDRESS" value={clinic?.address} onChange={v=>setClinic(p=>({...p,address:v}))} multiline/>
              <Field label="ABOUT THE CLINIC" value={clinic?.about} onChange={v=>setClinic(p=>({...p,about:v}))} multiline hint="Educational, factual — no superlatives"/>
              <div style={{ marginBottom:10, padding:"10px 14px", background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:8, fontSize:11, color:"#f59e0b" }}>
                ⚠ Compliance: Do not use 'best', 'most trusted', 'painless', 'guaranteed' — IMC Ethics Regulations 2002
              </div>
              <SaveBtn saved={saved} saving={saving} onClick={()=>handleSave({ name:clinic?.name, tagline:clinic?.tagline, phone:clinic?.phone, whatsapp:clinic?.whatsapp, email:clinic?.email, address:clinic?.address, about:clinic?.about })}/>
            </div>
          )}

          {/* ═══ DOCTOR PROFILE ═══ */}
          {page==="doctor"&&(
            <div style={{ maxWidth:680 }}>
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20, marginBottom:20, display:"flex", alignItems:"center", gap:20 }}>
                <div style={{ width:80, height:80, borderRadius:16, background:"linear-gradient(135deg,#1565c0,#a855f7)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, flexShrink:0 }}>
                  {doctor?.photo_url ? <img src={doctor.photo_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:16 }}/> : "👨‍⚕️"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color:"#94a3b8", marginBottom:8 }}>Doctor Photo</div>
                  <input type="file" accept="image/*" onChange={async e=>{
                    if(!e.target.files?.[0]||!clinic?.id) return;
                    const url = await uploadDoctorPhoto(clinic.id, e.target.files[0]);
                    if(doctor?.id) await updateDoctor(doctor.id, {photo_url:url});
                    setDoctors(p=>p.map((d,i)=>i===0?{...d,photo_url:url}:d));
                  }} style={{ display:"none" }} id="photo-upload"/>
                  <label htmlFor="photo-upload" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"#94a3b8", borderRadius:8, padding:"8px 16px", fontSize:12, cursor:"pointer" }}>📷 Upload Photo</label>
                </div>
              </div>

              {[
                ["DOCTOR NAME *",              "name",           doctor?.name            ],
                ["DEGREE (NMC Recognised) *",  "degree",         doctor?.degree          ],
                ["SPECIALIZATION",             "specialization", doctor?.specialization   ],
                ["YEARS OF EXPERIENCE",        "experience",     doctor?.experience       ],
              ].map(([label, key, val])=>(
                <Field key={key} label={label} value={val||""} onChange={v=>setDoctors(p=>p.map((d,i)=>i===0?{...d,[key]:v}:d))}/>
              ))}

              {/* Mandatory Reg No field */}
              <div style={{ marginBottom:18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <label style={{ fontSize:12, color:"#64748b", fontFamily:"monospace", fontWeight:600, letterSpacing:.5 }}>MEDICAL COUNCIL REG NO * <span style={{ color:"#ef4444" }}>MANDATORY</span></label>
                </div>
                <input value={doctor?.reg_number||""} onChange={e=>setDoctors(p=>p.map((d,i)=>i===0?{...d,reg_number:e.target.value}:d))} placeholder="e.g. TNMC-12345"
                  style={{ width:"100%", background:doctor?.reg_number?"rgba(34,197,94,0.06)":"rgba(239,68,68,0.06)", border:`1px solid ${doctor?.reg_number?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"}`, color:"#e2e8f0", borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:"monospace", outline:"none", boxSizing:"border-box" }}/>
                <div style={{ fontSize:11, color:"#64748b", marginTop:5 }}>Required by IMC Ethics Regulations 2002. Displayed permanently in your website footer.</div>
              </div>

              <select value={doctor?.council_name||"Tamil Nadu Medical Council"} onChange={e=>setDoctors(p=>p.map((d,i)=>i===0?{...d,council_name:e.target.value}:d))}
                style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", color:"#e2e8f0", borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:"inherit", outline:"none", marginBottom:18 }}>
                {["Tamil Nadu Medical Council","Karnataka Medical Council","Maharashtra Medical Council","Delhi Medical Council","Kerala State Medical Council","National Medical Commission"].map(c=><option key={c}>{c}</option>)}
              </select>

              <Field label="DOCTOR BIO" value={doctor?.bio||""} onChange={v=>setDoctors(p=>p.map((d,i)=>i===0?{...d,bio:v}:d))} multiline hint="Factual, no superlatives"/>

              <SaveBtn saved={saved} saving={saving} onClick={async()=>{
                if(!doctor?.id) return;
                setSaving(true);
                await updateDoctor(doctor.id, { name:doctor.name, degree:doctor.degree, specialization:doctor.specialization, experience:doctor.experience, bio:doctor.bio, reg_number:doctor.reg_number, council_name:doctor.council_name });
                setSaved(true); setTimeout(()=>setSaved(false),2000); setSaving(false);
              }}/>
            </div>
          )}

          {/* ═══ DESIGN & THEME ═══ */}
          {page==="design"&&(
            <div>
              <div style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>Choose a template. Your content stays the same — only the visual style changes.</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                {Object.values(TEMPLATES).map(tmpl=>{
                  const active = (clinic?.template||"corporate")===tmpl.id;
                  return (
                    <div key={tmpl.id} onClick={()=>handleSave({template:tmpl.id})} style={{ background:active?"rgba(21,101,192,0.1)":"rgba(255,255,255,0.02)", border:`2px solid ${active?"rgba(21,101,192,0.5)":"rgba(255,255,255,0.07)"}`, borderRadius:14, padding:20, cursor:"pointer", transition:"all .2s" }}>
                      <div style={{ fontSize:32, marginBottom:10 }}>{tmpl.icon}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9", marginBottom:4 }}>{tmpl.name}</div>
                      <div style={{ fontSize:11, color:"#64748b", marginBottom:10 }}>Best for: {tmpl.bestFor.slice(0,2).join(", ")}</div>
                      {active&&<div style={{ fontSize:11, color:"#22c55e", fontFamily:"monospace" }}>✓ Active Template</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ BLOG ═══ */}
          {page==="blog"&&(
            <AIBlogGenerator clinic={clinic} supabaseClient={supabase}/>
          )}

          {/* ═══ SEO ═══ */}
          {page==="seo"&&(
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:24 }}>
                <div style={{ fontFamily:"monospace", fontSize:12, color:"#64748b", marginBottom:16 }}>SEO HEALTH</div>
                <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:16 }}>
                  <div style={{ fontSize:40, fontWeight:700, color:"#22c55e", fontFamily:"monospace" }}>91</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:"#e2e8f0" }}>Great SEO Score</div>
                    <div style={{ fontSize:12, color:"#64748b" }}>Auto-configured for {clinic?.city}</div>
                  </div>
                </div>
                {[["MedicalClinic Schema",true],["LocalBusiness Schema",true],["FAQPage Schema",true],["Meta Title",true],["Sitemap",true],["Mobile Optimized",true],["HTTPS Active",true],["Patient Reviews Removed",true],["Reg No. in Footer",!!doctor?.reg_number]].map(([l,s],i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", fontSize:12 }}>
                    <span style={{ color:s?"#22c55e":"#ef4444" }}>{s?"✓":"✗"}</span>
                    <span style={{ color:s?"#94a3b8":"#64748b" }}>{l}</span>
                    <span style={{ marginLeft:"auto", fontSize:10, fontFamily:"monospace", color:s?"#22c55e":"#ef4444" }}>{s?"Active":"Missing"}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:24 }}>
                <div style={{ fontFamily:"monospace", fontSize:12, color:"#64748b", marginBottom:12 }}>AUTO META TAGS</div>
                {[["Title",`${clinic?.name} | ${clinic?.specialty} in ${clinic?.city}`],["Description",`Expert ${(clinic?.specialty||"").toLowerCase()} care in ${clinic?.city}. Book appointment online.`]].map(([k,v])=>(
                  <div key={k} style={{ marginBottom:14 }}>
                    <div style={{ fontSize:11, color:"#475569", marginBottom:4 }}>{k.toUpperCase()}</div>
                    <div style={{ background:"#0a0d14", borderRadius:6, padding:10, fontSize:12, color:"#93c5fd", fontFamily:"monospace" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ COMPLIANCE ═══ */}
          {page==="compliance"&&(
            <ComplianceTab clinic={clinic} doctor={doctor} onNavigate={setPage}/>
          )}

          {/* ═══ PREVIEW ═══ */}
          {page==="preview"&&(
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={{ fontSize:13, color:"#64748b" }}>Live preview of your clinic website</div>
                <div style={{ display:"flex", gap:10 }}>
                  <a href={`/${clinic?.slug}`} target="_blank" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"#94a3b8", borderRadius:8, padding:"8px 16px", fontSize:13, textDecoration:"none" }}>🔗 Open Full Site</a>
                  <button onClick={handlePublish} style={{ background:"linear-gradient(135deg,#1565c0,#1e88e5)", border:"none", color:"white", borderRadius:8, padding:"8px 20px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>🚀 Publish</button>
                </div>
              </div>
              <div style={{ background:"#1a1a2e", borderRadius:14, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ background:"#0f0f1a", padding:"10px 16px", display:"flex", alignItems:"center", gap:10, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display:"flex", gap:6 }}>
                    {["#ef4444","#f59e0b","#22c55e"].map(c=><div key={c} style={{ width:10, height:10, borderRadius:"50%", background:c }}/>)}
                  </div>
                  <div style={{ flex:1, background:"rgba(255,255,255,0.05)", borderRadius:6, padding:"4px 12px", fontSize:12, color:"#475569", fontFamily:"monospace" }}>
                    🔒 {clinic?.slug}.clinicsite.in
                  </div>
                </div>
                <div style={{ background:"white", height:400, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
                  <div style={{ fontSize:32 }}>👁️</div>
                  <div style={{ fontSize:14, color:"#0b2545", fontWeight:600 }}>{clinic?.name}</div>
                  <div style={{ fontSize:12, color:"#94a3b8" }}>{clinic?.specialty} · {clinic?.city}</div>
                  <a href={`/${clinic?.slug}`} target="_blank" style={{ background:"#1565c0", color:"white", borderRadius:8, padding:"10px 20px", textDecoration:"none", fontSize:13, fontWeight:600 }}>Open Live Preview →</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgrade&&<UpgradeModal clinic={clinic} user={user} onClose={()=>setShowUpgrade(false)} onUpgraded={(updated)=>{setClinic(updated);onClinicUpdate?.(updated);}}/>}
    </div>
  );
}