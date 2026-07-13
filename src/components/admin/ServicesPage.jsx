// src/components/admin/ServicesPage.jsx
// AdminPanel "Services" tab. Extracted from AdminPanel.jsx.
// Image upload added: each service can have a photo (image_url column),
// shown as a small thumbnail replacing the emoji icon once uploaded.

import { Toggle, SaveBtn } from "./ui";
import { supabase, updateService } from "../../lib/supabase";

export default function ServicesPage({ clinic, services, setServices, planContext, onRequestUpgrade, saved, saving, setSaved, doSave }) {
  const limit   = planContext.limits?.features?.services ?? 5;
  const count   = services.filter(s => s.is_active !== false).length;
  const atLimit = count >= limit;
  const isUnlim = limit >= 999999;

  const saveAll = () => {
    Promise.all(
      services.map(s => typeof s.id === "string" && s.id.length > 8
        ? updateService(s.id, { name:s.name, price:s.price, is_active:s.is_active, hide_price:s.hide_price||false })
        : Promise.resolve()
      )
    ).then(() => { setSaved(true); setTimeout(()=>setSaved(false),2000); })
    .catch(e => alert("Save failed: " + e.message));
  };

  const uploadServiceImage = async (svc, file) => {
    if (!file || !clinic?.id) return;
    try {
      const ext  = file.name.split(".").pop();
      const path = `${clinic.id}/services/${svc.id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("clinic-media")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage
        .from("clinic-media")
        .getPublicUrl(path);
      if (typeof svc.id === "string" && svc.id.length > 8)
        await updateService(svc.id, { image_url: publicUrl });
      setServices(p => p.map(s => s.id === svc.id ? { ...s, image_url: publicUrl } : s));
    } catch (e) { alert("Image upload failed: " + e.message); }
  };

  const removeServiceImage = async (svc) => {
    if (typeof svc.id === "string" && svc.id.length > 8)
      await updateService(svc.id, { image_url: null }).catch(console.error);
    setServices(p => p.map(s => s.id === svc.id ? { ...s, image_url: null } : s));
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:12, color: atLimit && !isUnlim ? "#ef4444" : "#64748b" }}>
          {isUnlim ? "Unlimited services" : `${count} / ${limit} services used`}
          {atLimit && !isUnlim && (
            <button onClick={onRequestUpgrade}
              style={{ marginLeft:10, fontSize:11, color:"#1e88e5", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>
              Upgrade for more
            </button>
          )}
        </div>
        <SaveBtn saved={saved} saving={saving} onClick={() => doSave({})}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {services.length > 0 ? services.map(svc => (
          <div key={svc.id} style={{
            background:"rgba(255,255,255,0.02)",
            border:"1px solid rgba(255,255,255,0.07)",
            borderRadius:12, padding:18, opacity: svc.is_active ? 1 : .5,
            transition:"opacity .2s",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <div style={{ position:"relative", flexShrink:0 }}>
                <input type="file" accept="image/*" id={`svc-img-${svc.id}`} style={{ display:"none" }}
                  onChange={e => uploadServiceImage(svc, e.target.files?.[0])}/>
                <label htmlFor={`svc-img-${svc.id}`} style={{
                  width:40, height:40, borderRadius:8, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  background: svc.image_url ? "transparent" : "rgba(255,255,255,0.05)",
                  border:"1px solid rgba(255,255,255,0.1)", overflow:"hidden",
                }} title={svc.image_url ? "Click to replace photo" : "Click to add a photo"}>
                  {svc.image_url
                    ? <img src={svc.image_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    : <span style={{ fontSize:20 }}>{svc.icon || "🏥"}</span>}
                </label>
                {svc.image_url && (
                  <button onClick={() => removeServiceImage(svc)} title="Remove photo" style={{
                    position:"absolute", top:-6, right:-6, width:16, height:16, borderRadius:"50%",
                    background:"#ef4444", color:"white", border:"none", fontSize:10, lineHeight:"16px",
                    cursor:"pointer", padding:0 }}>✕</button>
                )}
              </div>
              <input value={svc.name}
                onChange={e => setServices(p => p.map(s => s.id === svc.id ? {...s, name:e.target.value} : s))}
                style={{ background:"transparent", border:"none", color:"#e2e8f0",
                  fontSize:14, fontWeight:600, fontFamily:"inherit", flex:1, outline:"none" }}/>
              <Toggle value={!!svc.is_active}
                onChange={v => {
                  setServices(p => p.map(s => s.id === svc.id ? {...s, is_active:v} : s));
                  if (typeof svc.id === "string" && svc.id.length > 8)
                    updateService(svc.id, { is_active:v }).catch(console.error);
                }}/>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginTop:4 }}>
              <span style={{ fontSize:12, color:"#475569" }}>Fee:</span>
              <input value={svc.price || ""}
                onChange={e => setServices(p => p.map(s => s.id === svc.id ? {...s, price:e.target.value} : s))}
                disabled={svc.hide_price}
                style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                  color: svc.hide_price ? "#334155" : "#22c55e", borderRadius:6, padding:"4px 10px",
                  fontSize:13, fontFamily:"monospace", width:100, outline:"none", fontWeight:600,
                  opacity: svc.hide_price ? 0.4 : 1 }}/>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginLeft:4,
                padding:"3px 10px", borderRadius:6,
                background: svc.hide_price ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
                border: `1px solid ${svc.hide_price ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
                cursor:"pointer" }}
                onClick={() => {
                  const newVal = !svc.hide_price;
                  setServices(p => p.map(s => s.id === svc.id ? {...s, hide_price:newVal} : s));
                  if (typeof svc.id === "string" && svc.id.length > 8)
                    updateService(svc.id, { hide_price: newVal }).catch(console.error);
                }}>
                <div style={{ width:8, height:8, borderRadius:"50%",
                  background: svc.hide_price ? "#ef4444" : "#22c55e" }}/>
                <span style={{ fontSize:11, color: svc.hide_price ? "#f87171" : "#22c55e", fontWeight:600 }}>
                  {svc.hide_price ? "Price Hidden" : "Show Price"}
                </span>
              </div>
            </div>
          </div>
        )) : (
          <div style={{ gridColumn:"1/-1", padding:32, textAlign:"center", color:"#334155", fontSize:13 }}>
            No services found. They should have been created during onboarding.
          </div>
        )}
      </div>
      <div style={{ marginTop:16, display:"flex", justifyContent:"flex-end" }}>
        <SaveBtn saved={saved} saving={saving} onClick={saveAll}/>
      </div>
    </div>
  );
}
