// src/templates/TelehealthPlatform.jsx
import { useState } from "react";
export default function TelehealthPlatform({ data }) {
  const doctors = [
    { name:"Dr. Ananya Rao",   spec:"General Physician",  wait:"< 2 min",  online:true  },
    { name:"Dr. Kiran Mehta",  spec:"Cardiologist",       wait:"< 5 min",  online:true  },
    { name:"Dr. Priya Nair",   spec:"Dermatologist",      wait:"< 8 min",  online:true  },
    { name:"Dr. Suresh Kumar", spec:"Pediatrician",       wait:"12 min",   online:false },
  ];
  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:"#09090b", minHeight:"100vh", color:"#f4f4f5" }}>
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" }}>
        <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle,rgba(147,51,234,0.15),transparent 70%)", top:-200, left:"20%" }}/>
        <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(16,185,129,0.1),transparent 70%)", bottom:-100, right:"10%" }}/>
      </div>
      <div style={{ background:"rgba(147,51,234,0.15)", borderBottom:"1px solid rgba(147,51,234,0.2)", padding:"8px 24px", display:"flex", alignItems:"center", gap:12, position:"relative", zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#10b981", animation:"livepulse 1.5s infinite" }}/>
          <style>{`@keyframes livepulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.6)}50%{box-shadow:0 0 0 6px rgba(16,185,129,0)}}`}</style>
          <span style={{ fontSize:11, fontWeight:700, color:"#10b981", letterSpacing:1 }}>LIVE</span>
        </div>
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>127 doctors online right now · Avg wait: 4 minutes</span>
        <button style={{ marginLeft:"auto", background:"rgba(16,185,129,0.15)", border:"1px solid rgba(16,185,129,0.3)", color:"#10b981", borderRadius:6, padding:"4px 12px", fontSize:11, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>Consult Now →</button>
      </div>
      <nav style={{ padding:"18px 40px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#7c3aed,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⚡</div>
          <span style={{ fontSize:17, fontWeight:800, color:"#f4f4f5" }}>{data.clinicName}</span>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.15)", color:"#f4f4f5", borderRadius:10, padding:"8px 18px", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Login</button>
          <button style={{ background:"linear-gradient(135deg,#7c3aed,#4f46e5)", color:"white", border:"none", borderRadius:10, padding:"8px 20px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{data.secondaryCTA}</button>
        </div>
      </nav>
      <div style={{ position:"relative", zIndex:10, padding:"60px 40px 40px", maxWidth:1200, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:60, alignItems:"center" }}>
        <div>
          <h1 style={{ fontSize:"clamp(36px,4vw,56px)", fontWeight:900, color:"#f4f4f5", lineHeight:1.05, marginBottom:20, letterSpacing:-2 }}>{data.heroTagline}</h1>
          <p style={{ fontSize:16, color:"#71717a", lineHeight:1.7, marginBottom:36, maxWidth:460 }}>{data.heroDescription}</p>
          <div style={{ display:"flex", gap:12, marginBottom:40 }}>
            <button style={{ background:"linear-gradient(135deg,#7c3aed,#4f46e5)", color:"white", border:"none", borderRadius:12, padding:"14px 28px", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 8px 32px rgba(124,58,237,0.4)" }}>{data.primaryCTA}</button>
            <button style={{ background:"rgba(255,255,255,0.05)", color:"#f4f4f5", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"14px 24px", fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>{data.secondaryCTA}</button>
          </div>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            {(data.features||[]).map((f,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#a1a1aa" }}>
                <span style={{ color:"#10b981" }}>✓</span>{f.label}
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:24, padding:24, backdropFilter:"blur(12px)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#f4f4f5" }}>Available Doctors</div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"#10b981" }}/>
              <span style={{ fontSize:11, color:"#10b981", fontWeight:600 }}>LIVE</span>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {doctors.map((doc,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.04)", borderRadius:14, padding:"14px 16px", border:`1px solid ${doc.online?"rgba(16,185,129,0.15)":"rgba(255,255,255,0.06)"}` }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, position:"relative" }}>
                  👨‍⚕️
                  {doc.online&&<div style={{ position:"absolute", bottom:0, right:0, width:10, height:10, borderRadius:"50%", background:"#10b981", border:"2px solid #09090b" }}/>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#f4f4f5" }}>{doc.name}</div>
                  <div style={{ fontSize:11, color:"#71717a" }}>{doc.spec}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:doc.online?"#10b981":"#71717a", fontWeight:600 }}>{doc.wait}</div>
                  <button style={{ marginTop:4, background:doc.online?"rgba(124,58,237,0.2)":"rgba(255,255,255,0.06)", border:`1px solid ${doc.online?"rgba(124,58,237,0.4)":"rgba(255,255,255,0.1)"}`, color:doc.online?"#c084fc":"#52525b", borderRadius:7, padding:"4px 10px", fontSize:11, cursor:doc.online?"pointer":"not-allowed", fontFamily:"inherit" }}>
                    {doc.online?"📹 Connect":"Offline"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button style={{ width:"100%", marginTop:14, padding:"13px", background:"linear-gradient(135deg,#7c3aed,#10b981)", border:"none", borderRadius:12, color:"white", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            🎥 {data.primaryCTA}
          </button>
        </div>
      </div>
    </div>
  );
}
