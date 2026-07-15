// src/components/admin/PreviewPage.jsx
// AdminPanel "Preview Site" tab — publish/unpublish control + live iframe
// or placeholder preview. Extracted from AdminPanel.jsx.

export default function PreviewPage({ clinic, hasRegNo, handlePublish, publishing, publishMsg, onGoToDoctorTab }) {
  const publishDisabled = publishing || (!hasRegNo && !clinic?.is_published);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:13, color:"#64748b" }}>
          {clinic?.is_published
            ? "Your site is live — preview below"
            : "Publish your site to see the live preview"}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {clinic?.is_published && (
            <a href={`/${clinic?.slug}`} target="_blank" rel="noopener noreferrer"
              style={{ background:"rgba(255,255,255,0.05)",
                border:"1px solid rgba(255,255,255,0.12)", color:"#94a3b8",
                borderRadius:8, padding:"8px 16px", fontSize:13, textDecoration:"none" }}>
              🔗 Open Full Site ↗
            </a>
          )}
          <button onClick={handlePublish} disabled={publishDisabled}
            style={{
              background: publishDisabled
                ? "rgba(255,255,255,0.05)"
                : "linear-gradient(135deg,#1565c0,#1e88e5)",
              border:"none", color: (!hasRegNo && !clinic?.is_published) ? "#334155" : "white",
              borderRadius:8, padding:"8px 20px", fontSize:13, fontWeight:600,
              cursor: publishDisabled ? "not-allowed" : "pointer",
              fontFamily:"inherit",
            }}>
            {publishing ? "..." : clinic?.is_published ? "⏸ Unpublish" : "🚀 Publish Site"}
          </button>
        </div>
      </div>

      {!hasRegNo && !clinic?.is_published && (
        <div style={{ background:"rgba(239,68,68,0.06)",
          border:"1px solid rgba(239,68,68,0.2)", borderRadius:10,
          padding:"14px 18px", marginBottom:16,
          display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>🚫</span>
          <div style={{ flex:1, fontSize:13, color:"#f87171" }}>
            Cannot publish: Medical Council Registration Number is missing.
            <button onClick={onGoToDoctorTab}
              style={{ marginLeft:10, background:"none", border:"none",
                color:"#fca5a5", cursor:"pointer", textDecoration:"underline",
                fontFamily:"inherit", fontSize:13 }}>
              Add it now →
            </button>
          </div>
        </div>
      )}

      <div style={{ background:"#1a1a2e", borderRadius:14, overflow:"hidden",
        border:"1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ background:"#0f0f1a", padding:"10px 16px",
          display:"flex", alignItems:"center", gap:10,
          borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", gap:6 }}>
            {["#ef4444","#f59e0b","#22c55e"].map(c => (
              <div key={c} style={{ width:10, height:10, borderRadius:"50%", background:c }}/>
            ))}
          </div>
          <div style={{ flex:1, background:"rgba(255,255,255,0.05)", borderRadius:6,
            padding:"4px 12px", fontSize:12, color:"#475569", fontFamily:"monospace" }}>
            🔒 {clinic?.slug}.waspace.in
          </div>
        </div>

        {clinic?.is_published ? (
          <iframe
            key={clinic.slug}
            src={`/${clinic.slug}`}
            title={`${clinic.name} preview`}
            style={{ width:"100%", height:520, border:"none", background:"white",
              display:"block" }}
          />
        ) : (
          <div style={{ background:"white", height:400,
            display:"flex", alignItems:"center", justifyContent:"center",
            flexDirection:"column", gap:14 }}>
            <div style={{ fontSize:40 }}>👁️</div>
            <div style={{ fontSize:16, fontWeight:700, color:"#0b2545" }}>{clinic?.name}</div>
            <div style={{ fontSize:13, color:"#94a3b8" }}>
              {clinic?.specialty} · {clinic?.city}
            </div>
            <div style={{ fontSize:12, color:"#f59e0b", textAlign:"center",
              maxWidth:340, lineHeight:1.6 }}>
              {!hasRegNo
                ? "⚠ Add your Medical Council Registration Number first, then publish to preview your live site."
                : "Click 'Publish Site' above to make your website live and preview it here."}
            </div>
            {hasRegNo && (
              <button onClick={handlePublish} style={{
                background:"#1565c0", color:"white", border:"none",
                borderRadius:8, padding:"12px 24px", fontSize:14,
                fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                🚀 Publish & Preview
              </button>
            )}
          </div>
        )}
      </div>

      {publishMsg && (
        <div style={{ marginTop:12, textAlign:"center", fontSize:13,
          color: publishMsg.includes("✓") ? "#22c55e" : "#f59e0b",
          fontFamily:"monospace" }}>{publishMsg}</div>
      )}
    </div>
  );
}
