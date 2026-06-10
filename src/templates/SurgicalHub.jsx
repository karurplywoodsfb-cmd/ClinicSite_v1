// src/templates/SurgicalHub.jsx
export default function SurgicalHub({ data }) {
  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", background:"#f8fafc", minHeight:"100vh", color:"#0f172a" }}>
      <div style={{ borderTop:"4px solid #0891b2", background:"#0f172a", padding:"10px 40px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:11, letterSpacing:2, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", fontFamily:"monospace" }}>{data.clinicName} · Surgical Excellence Network</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontFamily:"monospace" }}>ISO 15189 · NABH · JCI</div>
      </div>
      <nav style={{ background:"white", borderBottom:"2px solid #e2e8f0", padding:"0 40px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, background:"#0f172a", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:14, fontWeight:900 }}>PSI</div>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:"#0f172a" }}>{data.clinicName}</div>
            <div style={{ fontSize:10, fontFamily:"monospace", color:"#64748b" }}>PRECISION · EXCELLENCE · OUTCOMES</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:24, fontSize:12, fontWeight:600, color:"#475569", textTransform:"uppercase" }}>
          {["Procedures","Outcomes","Technology","Research"].map(l=>(
            <a key={l} href="#" style={{ textDecoration:"none", color:"#475569" }}>{l}</a>
          ))}
        </div>
        <button style={{ background:"#0f172a", color:"white", border:"none", padding:"10px 24px", fontSize:12, fontWeight:700, cursor:"pointer", textTransform:"uppercase" }}>Request Review</button>
      </nav>
      <div style={{ borderLeft:"4px solid #0891b2", background:"linear-gradient(135deg,#0f172a,#1e293b)", padding:"64px 40px 64px 60px", position:"relative" }}>
        <div style={{ position:"absolute", top:20, right:40, fontFamily:"monospace", fontSize:11, color:"rgba(255,255,255,0.2)", lineHeight:1.8 }}>
          SYS.STATUS: OPERATIONAL<br/>PROCEDURES TODAY: 14<br/>ACTIVE BOARDS: 3<br/>UPTIME: 99.97%
        </div>
        <div style={{ maxWidth:700 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, border:"1px solid rgba(8,145,178,0.4)", borderLeft:"3px solid #0891b2", padding:"6px 16px", fontSize:11, color:"#22d3ee", fontFamily:"monospace", marginBottom:24, background:"rgba(8,145,178,0.06)" }}>
            CLASSIFICATION: TIER-1 SURGICAL FACILITY
          </div>
          <h1 style={{ fontSize:"clamp(30px,3.5vw,48px)", fontWeight:900, color:"white", lineHeight:1.1, marginBottom:20, textTransform:"uppercase" }}>{data.heroTagline}</h1>
          <p style={{ fontSize:15, color:"rgba(255,255,255,0.6)", lineHeight:1.8, maxWidth:560, marginBottom:36 }}>{data.heroDescription}</p>
          <div style={{ display:"flex", gap:12 }}>
            <button style={{ background:"#0891b2", color:"white", border:"none", padding:"14px 28px", fontSize:13, fontWeight:700, cursor:"pointer", textTransform:"uppercase" }}>{data.primaryCTA}</button>
            <button style={{ background:"transparent", color:"rgba(255,255,255,0.7)", border:"1px solid rgba(255,255,255,0.2)", padding:"14px 24px", fontSize:13, cursor:"pointer", textTransform:"uppercase" }}>{data.secondaryCTA}</button>
          </div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", borderBottom:"2px solid #e2e8f0" }}>
        {(data.metrics||[]).map((m,i)=>(
          <div key={i} style={{ padding:"36px 32px", borderRight:i<3?"1px solid #e2e8f0":"none", background:"white", transition:"all .2s", cursor:"default", borderTop:"4px solid transparent" }}
            onMouseEnter={e=>{e.currentTarget.style.borderTopColor="#0891b2";e.currentTarget.style.background="#f0f9ff"}}
            onMouseLeave={e=>{e.currentTarget.style.borderTopColor="transparent";e.currentTarget.style.background="white"}}>
            <div style={{ fontSize:40, fontWeight:900, color:"#0f172a", fontFamily:"monospace", letterSpacing:-2, marginBottom:8 }}>{m.value}</div>
            <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:4, textTransform:"uppercase" }}>{m.label}</div>
            <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace" }}>{m.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, borderBottom:"2px solid #e2e8f0" }}>
        <div style={{ padding:"48px 40px", borderRight:"1px solid #e2e8f0" }}>
          <div style={{ fontSize:11, fontFamily:"monospace", color:"#0891b2", letterSpacing:2, marginBottom:16, textTransform:"uppercase" }}>◈ Surgical Technology Stack</div>
          <h2 style={{ fontSize:24, fontWeight:800, color:"#0f172a", marginBottom:24 }}>Robotic-Assisted Precision Surgery</h2>
          {(data.features||[]).map((f,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:"1px solid #f1f5f9" }}>
              <div style={{ width:28, height:28, background:"#0f172a", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:10, flexShrink:0 }}>{f.icon}</div>
              <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{f.label}</span>
              <div style={{ marginLeft:"auto", width:8, height:8, background:"#0891b2", borderRadius:1 }}/>
            </div>
          ))}
        </div>
        <div style={{ background:"#0f172a", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", minHeight:320 }}>
          <div style={{ textAlign:"center", color:"white" }}>
            <div style={{ width:72, height:72, borderRadius:"50%", border:"2px solid rgba(8,145,178,0.5)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:28, cursor:"pointer", background:"rgba(8,145,178,0.1)" }}>▶</div>
            <div style={{ fontSize:14, fontWeight:600, letterSpacing:1, textTransform:"uppercase", color:"rgba(255,255,255,0.8)" }}>Surgical Technique Showcase</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontFamily:"monospace", marginTop:6 }}>da Vinci Xi · 4K Visualization</div>
          </div>
          <div style={{ position:"absolute", top:16, right:16, fontFamily:"monospace", fontSize:10, color:"rgba(255,255,255,0.2)" }}>REC ●  00:00:00</div>
        </div>
      </div>
    </div>
  );
}
