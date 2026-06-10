// src/templates/NordicSanctuary.jsx
export default function NordicSanctuary({ data }) {
  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans','Segoe UI',sans-serif", background:"#F4F6F2", minHeight:"100vh", color:"#2C3E35" }}>
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none" }}>
        <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(86,115,100,0.12),transparent 70%)", top:-100, right:-100 }}/>
        <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(134,175,155,0.1),transparent 70%)", bottom:100, left:-50 }}/>
      </div>
      <div style={{ position:"fixed", right:24, bottom:80, zIndex:100, display:"flex", flexDirection:"column", gap:10 }}>
        <a href="https://wa.me" style={{ width:50, height:50, borderRadius:"50%", background:"#25d366", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:"0 4px 16px rgba(37,211,102,0.4)", textDecoration:"none" }}>💬</a>
        <a href="tel:" style={{ width:50, height:50, borderRadius:"50%", background:"#567364", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:"0 4px 16px rgba(86,115,100,0.4)", textDecoration:"none" }}>📞</a>
      </div>
      <div style={{ position:"relative", zIndex:1 }}>
        <nav style={{ padding:"24px 40px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:"#567364", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🌿</div>
            <div style={{ fontSize:16, fontWeight:700, color:"#2C3E35" }}>{data.clinicName}</div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {["Therapies","About","Contact"].map(l=>(
              <a key={l} href="#" style={{ textDecoration:"none", color:"#567364", fontSize:13, fontWeight:500, padding:"7px 16px", borderRadius:9999 }}>{l}</a>
            ))}
          </div>
          <button style={{ background:"#567364", color:"white", border:"none", borderRadius:9999, padding:"11px 24px", fontSize:13, fontWeight:600, cursor:"pointer" }}>{data.secondaryCTA}</button>
        </nav>
        <div style={{ padding:"40px 40px 0", maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:24, alignItems:"start" }}>
            <div style={{ background:"white", borderRadius:48, padding:"56px 48px", boxShadow:"0 8px 32px rgba(44,62,53,0.06)" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(86,115,100,0.1)", borderRadius:9999, padding:"6px 16px", fontSize:12, color:"#567364", fontWeight:600, marginBottom:24 }}>
                🌱 Holistic Healing Centre
              </div>
              <h1 style={{ fontSize:"clamp(32px,4vw,52px)", fontWeight:700, color:"#2C3E35", lineHeight:1.15, marginBottom:20 }}>{data.heroTagline}</h1>
              <p style={{ fontSize:15, color:"#52685a", lineHeight:1.8, marginBottom:36 }}>{data.heroDescription}</p>
              <div style={{ display:"flex", gap:12 }}>
                <button style={{ background:"#567364", color:"white", border:"none", borderRadius:9999, padding:"14px 28px", fontSize:14, fontWeight:600, cursor:"pointer", boxShadow:"0 4px 16px rgba(86,115,100,0.3)" }}>{data.primaryCTA}</button>
                <button style={{ background:"transparent", color:"#567364", border:"1.5px solid #567364", borderRadius:9999, padding:"14px 24px", fontSize:14, fontWeight:600, cursor:"pointer" }}>{data.secondaryCTA}</button>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {(data.features||[]).map((f,i)=>(
                <div key={i} style={{ background:"white", borderRadius:24, padding:"20px 24px", display:"flex", alignItems:"center", gap:16, boxShadow:"0 4px 16px rgba(44,62,53,0.04)" }}>
                  <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(86,115,100,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:"#2C3E35" }}>{f.label}</div>
                    <div style={{ fontSize:12, color:"#7a9e8a" }}>Tailored to your needs</div>
                  </div>
                  <div style={{ marginLeft:"auto", color:"#567364", fontSize:18 }}>→</div>
                </div>
              ))}
              <div style={{ background:"#567364", borderRadius:32, padding:"24px", color:"white" }}>
                <div style={{ fontSize:13, opacity:.8, marginBottom:8 }}>Free Wellness Consultation</div>
                <div style={{ fontSize:20, fontWeight:700, marginBottom:16 }}>Your healing journey starts here</div>
                <button style={{ background:"white", color:"#567364", border:"none", borderRadius:9999, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:"pointer", width:"100%" }}>Book Free Consultation →</button>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding:"48px 40px", maxWidth:1100, margin:"24px auto 0" }}>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            {["Naturopathy","Ayurveda","Sound Healing","Hydrotherapy","Yoga Therapy","Acupuncture","Nutritional Medicine","Meditation"].map((t,i)=>(
              <div key={i} style={{ background:"white", borderRadius:9999, padding:"10px 20px", fontSize:13, fontWeight:500, color:"#567364", border:"1.5px solid rgba(86,115,100,0.2)", cursor:"pointer" }}>{t}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
