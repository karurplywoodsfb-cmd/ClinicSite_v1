// src/components/admin/GalleryPage.jsx
// AdminPanel "Gallery" tab — clinic facility photo uploads.
// Extracted from AdminPanel.jsx as part of the admin-panel split. Upload
// form state (mediaForm/mediaUploading) lives locally here since nothing
// else in AdminPanel needs it; `media`/`setMedia` stay owned by the parent
// because they're fetched once on mount via getClinicMedia and used to
// seed the public-site preview.

import { useState } from "react";
import { supabase, addClinicMedia, deleteClinicMedia } from "../../lib/supabase";

export default function GalleryPage({ clinic, media, setMedia }) {
  const [mediaForm, setMediaForm] = useState({ media_type:"interior", title:"", description:"" });
  const [mediaUploading, setMediaUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !clinic?.id) return;
    if (!mediaForm.title.trim()) { alert("Add a title before uploading."); return; }
    setMediaUploading(true);
    try {
      const ext  = file.name.split(".").pop();
      const path = `${clinic.id}/gallery/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("clinic-media")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage
        .from("clinic-media")
        .getPublicUrl(path);
      const item = await addClinicMedia(clinic.id, {
        file_url: publicUrl,
        media_type: mediaForm.media_type,
        title: mediaForm.title.trim(),
        description: mediaForm.description.trim() || null,
        is_active: true,
        sort_order: media.length,
      });
      setMedia(p => [...p, item]);
      setMediaForm({ media_type:"interior", title:"", description:"" });
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setMediaUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm("Remove this photo?")) return;
    try {
      await deleteClinicMedia(itemId);
      setMedia(p => p.filter(m => m.id !== itemId));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  return (
    <div>
      <div style={{ fontSize:11, fontWeight:700, color:"#64748b", letterSpacing:1.5,
        textTransform:"uppercase", marginBottom:10 }}>Facility Gallery</div>
      <div style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>
        Photos of your clinic, equipment, team, and certifications shown in the "Facility &amp; Credentials"
        section of your site. No patient photos or before/after images (compliance).
      </div>

      <div style={{
        background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)",
        borderRadius:12, padding:20, marginBottom:24,
      }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:10, color:"#64748b", marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>Category</div>
            <select value={mediaForm.media_type}
              onChange={e => setMediaForm(p => ({...p, media_type:e.target.value}))}
              style={{ width:"100%", background:"#0d1526", color:"#e2e8f0", border:"1px solid rgba(255,255,255,0.12)",
                borderRadius:8, padding:"9px 10px", fontSize:13 }}>
              <option value="interior">🏥 Clinic Facility</option>
              <option value="equipment">🖥️ Medical Equipment</option>
              <option value="staff">👨‍⚕️ Our Team</option>
              <option value="certification">🏅 Accreditations</option>
              <option value="diagram">🫀 Educational Content</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize:10, color:"#64748b", marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>Title</div>
            <input value={mediaForm.title}
              onChange={e => setMediaForm(p => ({...p, title:e.target.value}))}
              placeholder="e.g. Digital OPG X-Ray Unit"
              style={{ width:"100%", background:"#0d1526", color:"#e2e8f0", border:"1px solid rgba(255,255,255,0.12)",
                borderRadius:8, padding:"9px 10px", fontSize:13, boxSizing:"border-box" }}/>
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, color:"#64748b", marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>Description (optional)</div>
          <input value={mediaForm.description}
            onChange={e => setMediaForm(p => ({...p, description:e.target.value}))}
            placeholder="Factual caption — no promotional claims"
            style={{ width:"100%", background:"#0d1526", color:"#e2e8f0", border:"1px solid rgba(255,255,255,0.12)",
              borderRadius:8, padding:"9px 10px", fontSize:13, boxSizing:"border-box" }}/>
        </div>

        <input type="file" accept="image/*" id="media-upload" style={{ display:"none" }} onChange={handleUpload}/>
        <label htmlFor="media-upload" style={{
          background: mediaUploading ? "rgba(255,255,255,0.05)" : "#1e88e5",
          color: mediaUploading ? "#64748b" : "white",
          border:"none", borderRadius:8, padding:"10px 20px",
          fontSize:13, fontWeight:600, cursor: mediaUploading ? "default" : "pointer",
          display:"inline-block",
        }}>
          {mediaUploading ? "Uploading…" : "📷 Upload Photo"}
        </label>
        <div style={{ fontSize:11, color:"#334155", marginTop:8 }}>JPG or PNG · Max 5MB · Fill in the title first</div>
      </div>

      {media.length === 0 ? (
        <div style={{ fontSize:13, color:"#475569", textAlign:"center", padding:"32px 0" }}>
          No photos yet — upload your first one above.
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:14 }}>
          {media.map(item => (
            <div key={item.id} style={{
              background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:10, overflow:"hidden",
            }}>
              <div style={{ width:"100%", aspectRatio:"4/3", background:"#0d1526", overflow:"hidden" }}>
                {item.file_url
                  ? <img src={item.file_url} alt={item.title} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>🖼️</div>}
              </div>
              <div style={{ padding:10 }}>
                <div style={{ fontSize:12, fontWeight:600, color:"#e2e8f0", marginBottom:3,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.title}</div>
                <div style={{ fontSize:10, color:"#64748b", marginBottom:8, textTransform:"capitalize" }}>{item.media_type}</div>
                <button onClick={() => handleDelete(item.id)} style={{
                  background:"none", border:"none", color:"#f87171", fontSize:11,
                  cursor:"pointer", padding:0,
                }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
