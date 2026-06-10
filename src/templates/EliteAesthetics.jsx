// src/templates/EliteAesthetics.jsx
import { useState } from "react";
export default function EliteAesthetics({ data }) {
  const [sliderPos, setSliderPos] = useState(50);
  return (
    <div style={{ fontFamily:"Georgia,'Times New Roman',serif", background:"#FAF9F6", minHeight:"100vh", color:"#1c1917" }}>
      <nav style={{ padding:"28px 56px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #e7e5e4" }}>
        <div style={{ fontSize:11, letterSpacing:6, fontFamily:"'Helvetica Neue',sans-serif", fontWeight:300, color:"#57534e", textTransform:"uppercase" }}>{data.clinicName}</div>
        <div style={{ display:"flex", gap:36, fontSize:12, letterSpacing:2, color:"#78716c", fontFamily:"'Helvetica Neue',sans-serif", textTransform:"uppercase" }}>
          {["Treatments","Results","Philosophy","Contact"].map(l=>(
            <a key={l} href="#" style={{ textDecoration:"none", color:"#78716c" }}>{l}</a>
          ))}
        </div>
        <button style={{ background:"none", border:"1px solid #a8956e", color:"#92400e", padding:"10px 24px", fontSize:11, letterSpacing:3, fontFamily:"'Helvetica Neue',sans-serif", cursor:"pointer", textTransform:"uppercase" }}>Reserve</button>
      </nav>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", minHeight:"88vh" }}>
        <div style={{ padding:"80px 56px", display:"flex", flexDirection:"column", justifyContent:"center", borderRight:"1px solid #e7e5e4" }}>
          <div style={{ fontSize:11, letterSpacing:5, color:"#a8956e", fontFamily:"'Helvetica Neue',sans-serif", textTransform:"uppercase", marginBottom:32 }}>Established 2008 · Mumbai</div>
          <h1 style={{ fontSize:"clamp(36px,4.5vw,60px)", fontWeight:300, lineHeight:1.1, color:"#1c1917", marginBottom:28, letterSpacing:-1 }}>
            {data.heroTagline.split(". ").map((line,i,arr)=>(
              <span key={i}>{line}{i<arr.length-1?".":""}<br/></span>
            ))}
          </h1>
          <p style={{ fontSize:15, color:"#78716c", lineHeight:1.85, maxWidth:400, marginBottom:48, fontFamily:"'Helvetica Neue',sans-serif", fontWeight:300 }}>{data.heroDescription}</p>
          <div style={{ display:"flex", gap:16 }}>
            <button style={{ background:"#92400e", color:"white", border:"none", padding:"16px 36px", fontSize:12, letterSpacing:3, fontFamily:"'Helvetica Neue',sans-serif", cursor:"pointer", textTransform:"uppercase" }}>{data.primaryCTA}</button>
            <button style={{ background:"none", color:"#92400e", border:"1px solid #92400e", padding:"16px 28px", fontSize:12, letterSpacing:3, fontFamily:"'Helvetica Neue',sans-serif", cursor:"pointer", textTransform:"uppercase" }}>{data.secondaryCTA}</button>
          </div>
          <div style={{ display:"flex", gap:32, marginTop:56, paddingTop:40, borderTop:"1px solid #e7e5e4" }}>
            {(data.features||[]).map((f,i)=>(
              <div key={i}>
                <div style={{ fontSize:11, letterSpacing:3, color:"#a8956e", textTransform:"uppercase", fontFamily:"'Helvetica Neue',sans-serif", marginBottom:4 }}>{f.icon}</div>
                <div style={{ fontSize:12, letterSpacing:1, color:"#57534e", fontFamily:"'Helvetica Neue',sans-serif" }}>{f.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position:"relative", overflow:"hidden", background:"#f5f0eb", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ position:"relative", width:"100%", height:"100%", userSelect:"none" }}>
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,#d6bcaa,#b08968)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ textAlign:"center", color:"rgba(255,255,255,0.6)", fontFamily:"'Helvetica Neue',sans-serif" }}>
                <div style={{ fontSize:11, letterSpacing:4, marginBottom:8, textTransform:"uppercase" }}>Before</div>
                <div style={{ fontSize:48 }}>📷</div>
              </div>
            </div>
            <div style={{ position:"absolute", inset:0, clipPath:`inset(0 ${100-sliderPos}% 0 0)`, background:"linear-gradient(135deg,#e8d5c4,#c9a880)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ textAlign:"center", color:"rgba(255,255,255,0.9)", fontFamily:"'Helvetica Neue',sans-serif" }}>
                <div style={{ fontSize:11, letterSpacing:4, marginBottom:8, textTransform:"uppercase" }}>After</div>
                <div style={{ fontSize:48 }}>✨</div>
              </div>
            </div>
            <div style={{ position:"absolute", top:0, bottom:0, left:`${sliderPos}%`, transform:"translateX(-50%)", width:2, background:"white", cursor:"ew-resize", zIndex:10 }}>
              <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:40, height:40, background:"white", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(0,0,0,0.2)", fontSize:14 }}>⇔</div>
            </div>
            <input type="range" min={0} max={100} value={sliderPos} onChange={e=>setSliderPos(+e.target.value)} style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0, cursor:"ew-resize", zIndex:20 }}/>
            <div style={{ position:"absolute", bottom:32, left:"50%", transform:"translateX(-50%)", background:"rgba(255,255,255,0.9)", padding:"8px 20px", fontSize:11, letterSpacing:3, color:"#57534e", fontFamily:"'Helvetica Neue',sans-serif", textTransform:"uppercase" }}>
              Drag to Compare
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding:"60px 56px", borderTop:"1px solid #e7e5e4" }}>
        <div style={{ fontSize:11, letterSpacing:5, color:"#a8956e", textTransform:"uppercase", fontFamily:"'Helvetica Neue',sans-serif", marginBottom:40, textAlign:"center" }}>Signature Treatments</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:0 }}>
          {["Facial Sculpting","Laser Resurfacing","Body Contouring","Hair Restoration"].map((t,i)=>(
            <div key={i} style={{ padding:"32px 24px", borderRight:i<3?"1px solid #e7e5e4":"none", textAlign:"center" }}>
              <div style={{ fontSize:11, letterSpacing:4, color:"#a8956e", textTransform:"uppercase", fontFamily:"'Helvetica Neue',sans-serif", marginBottom:12 }}>0{i+1}</div>
              <div style={{ fontSize:18, fontWeight:400, color:"#1c1917", marginBottom:8 }}>{t}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
