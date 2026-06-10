// src/templates/CorporateGiant.jsx
import { useState } from "react";
export default function CorporateGiant({ data }) {
  const [dept, setDept] = useState("");
  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',system-ui,sans-serif", background:"#f8fafc", minHeight:"100vh", color:"#0f172a" }}>
      <div style={{ background:"#dc2626", color:"white", padding:"8px 0", overflow:"hidden" }}>
        <div style={{ display:"flex", gap:48, animation:"ticker 20s linear infinite", whiteSpace:"nowrap", width:"max-content" }}>
          {[...Array(3)].map((_,i)=>(
            <span key={i} style={{ display:"flex", gap:48, fontSize:12, fontWeight:600, letterSpacing:1 }}>
              <span>🚨 EMERGENCY: Call 104 — 24/7 Trauma Care Available</span>
              <span>🩸 BLOOD BANK: O+ Critical — Donate Now</span>
              <span>📞 HELPLINE: 1800-XXX-XXXX (Toll Free)</span>
            </span>
          ))}
        </div>
        <style>{`@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-33.33%)}}`}</style>
      </div>
      <nav style={{ background:"white", borderBottom:"1px solid #e2e8f0", padding:"0 40px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50, boxShadow:"0 1px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:8, background:"#2563eb", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:900, fontSize:16 }}>A</div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:"#0f172a" }}>{data.clinicName}</div>
            <div style={{ fontSize:10, color:"#64748b", letterSpacing:1, textTransform:"uppercase" }}>NABH Accredited</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:24, fontSize:13, fontWeight:600 }}>
          {["Departments","Doctors","Services","About"].map(l=>(
            <a key={l} href="#" style={{ textDecoration:"none", color:"#475569" }}>{l}</a>
          ))}
        </div>
        <button style={{ background:"#2563eb", color:"white", border:"none", borderRadius:8, padding:"9px 20px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Emergency</button>
      </nav>
      <div style={{ background:"linear-gradient(135deg,#1e3a5f,#1d4ed8)", padding:"60px 40px 120px", overflow:"hidden" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <h1 style={{ fontSize:"clamp(32px,4vw,52px)", fontWeight:900, color:"white", lineHeight:1.1, marginBottom:16 }}>{data.heroTagline}</h1>
          <p style={{ fontSize:16, color:"rgba(255,255,255,0.75)", maxWidth:560, lineHeight:1.7 }}>{data.heroDescription}</p>
        </div>
      </div>
      <div style={{ maxWidth:1000, margin:"-60px auto 0", padding:"0 40px", position:"relative", zIndex:10 }}>
        <div style={{ background:"white", borderRadius:16, boxShadow:"0 20px 60px rgba(0,0,0,0.15)", padding:"28px 32px" }}>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:1.5, color:"#64748b", textTransform:"uppercase", marginBottom:16 }}>🔍 Find a Doctor</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:12 }}>
            <select value={dept} onChange={e=>setDept(e.target.value)} style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:14, color:"#0f172a", background:"#f8fafc", outline:"none", fontFamily:"inherit" }}>
              <option>All Departments</option>
              {(data.departments||[]).map(d=><option key={d}>{d}</option>)}
            </select>
            <select style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:14, background:"#f8fafc", outline:"none", fontFamily:"inherit" }}>
              <option>All Specializations</option>
              <option>Interventional Cardiology</option>
              <option>Neuro-Oncology</option>
            </select>
            <select style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:14, background:"#f8fafc", outline:"none", fontFamily:"inherit" }}>
              <option>Any Time</option><option>Today</option><option>This Week</option>
            </select>
            <button style={{ background:"#2563eb", color:"white", border:"none", borderRadius:8, padding:"0 28px", fontSize:14, fontWeight:700, cursor:"pointer", marginTop:0 }}>{data.primaryCTA} →</button>
          </div>
        </div>
      </div>
      <div style={{ maxWidth:1100, margin:"40px auto", padding:"0 40px", display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
        {(data.features||[]).map((f,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, background:"white", border:"1px solid #e2e8f0", borderRadius:10, padding:"10px 18px", fontSize:13, fontWeight:600 }}>
            <span style={{ fontSize:18 }}>{f.icon}</span>{f.label}
          </div>
        ))}
      </div>
      <div style={{ maxWidth:1100, margin:"0 auto 60px", padding:"0 40px" }}>
        <h2 style={{ fontSize:24, fontWeight:800, color:"#0f172a", marginBottom:24 }}>Our Departments</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {(data.departments||[]).map((d,i)=>(
            <div key={i} style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"18px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12, transition:"all .2s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#2563eb";e.currentTarget.style.boxShadow="0 4px 16px rgba(37,99,235,0.12)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.boxShadow="none"}}>
              <div style={{ width:40, height:40, borderRadius:10, background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
                {["❤️","🧠","🦴","🎗️","👶","👩","🫁","🫘"][i%8]}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700 }}>{d}</div>
                <div style={{ fontSize:11, color:"#94a3b8" }}>Specialists available</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:"#0f172a", padding:"48px 40px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:0 }}>
          {(data.stats||[]).map((s,i)=>(
            <div key={i} style={{ textAlign:"center", padding:"16px", borderRight:i<3?"1px solid rgba(255,255,255,0.1)":"none" }}>
              <div style={{ fontSize:40, fontWeight:900, color:"#3b82f6" }}>{s.v}</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginTop:4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
