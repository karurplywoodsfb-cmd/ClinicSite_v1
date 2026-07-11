// src/components/admin/DesignThemePage.jsx
// AdminPanel "Design & Theme" tab — template picker.
// Extracted from AdminPanel.jsx (was inline ~75 lines) as part of the
// admin-panel split. Follows the pattern: parent owns clinic state, page
// components call `onClinicChange(updatedClinicRow)` after a successful
// save and the parent decides what to do with it (setClinic/setClinicEdit/
// notify onClinicUpdate). See WorkingHoursPage.jsx / GalleryPage.jsx for
// the same pattern applied to other tabs.

import { TEMPLATES, TEMPLATE_PREVIEWS } from "../../templates";
import { updateClinic } from "../../lib/supabase";

export default function DesignThemePage({ clinic, onClinicChange }) {
  const handleSelect = async (templateId) => {
    try {
      const updated = await updateClinic(clinic.id, { template: templateId });
      onClinicChange(updated);
    } catch (e) {
      alert("Save failed: " + e.message);
    }
  };

  return (
    <div>
      <div style={{ fontSize:11, fontWeight:700, color:"#64748b", letterSpacing:1.5,
        textTransform:"uppercase", marginBottom:10 }}>Layout Template</div>
      <div style={{ fontSize:13, color:"#64748b", marginBottom:16 }}>
        Select a template. Your content stays the same — only the visual style changes.
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:32 }}>
        {Object.values(TEMPLATES).map(tmpl => {
          const active  = (clinic?.template || "corporate") === tmpl.id;
          const preview = TEMPLATE_PREVIEWS[tmpl.id];
          return (
            <div key={tmpl.id}
              onClick={() => handleSelect(tmpl.id)}
              style={{
                background: active ? "rgba(21,101,192,0.08)" : "rgba(255,255,255,0.02)",
                border: `2px solid ${active ? "#1e88e5" : "rgba(255,255,255,0.07)"}`,
                borderRadius:14, overflow:"hidden", cursor:"pointer",
                transition:"all .2s", position:"relative",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor="rgba(255,255,255,0.2)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor="rgba(255,255,255,0.07)"; }}>

              <div style={{ width:"100%", background:"#060d18", padding:0, lineHeight:0 }}
                dangerouslySetInnerHTML={{ __html: preview || "" }}/>

              <div style={{ padding:"10px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>
                      {tmpl.icon} {tmpl.name}
                    </div>
                    <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>
                      {(tmpl.bestFor || []).slice(0,2).join(" · ")}
                    </div>
                  </div>
                  {active
                    ? <span style={{ fontSize:10, color:"#22c55e", fontWeight:700 }}>✓ Active</span>
                    : <span style={{ fontSize:10, color:"#475569" }}>Apply →</span>
                  }
                </div>
                {clinic?.slug && (
                  <a
                    href={`/${clinic.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                      display:"block", marginTop:8, fontSize:10,
                      color:"#1e88e5", textDecoration:"none",
                      textAlign:"center", opacity:.7,
                    }}>
                    👁 Preview live site
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
