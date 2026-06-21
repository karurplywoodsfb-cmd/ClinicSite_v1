// src/pages/NotFound.jsx — 404 page

export default function NotFound() {
  return (
    <div style={{
      minHeight:"100vh", background:"#f4f8fd", display:"flex",
      flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily:"'DM Sans',sans-serif", textAlign:"center", padding:40,
    }}>
      <div style={{ fontSize:60, marginBottom:16 }}>🔍</div>
      <h1 style={{ fontSize:32, fontWeight:700, color:"#0b2545", marginBottom:8 }}>Page Not Found</h1>
      <p style={{ fontSize:16, color:"#64748b", marginBottom:32 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a href="/" style={{
        background:"#1565c0", color:"white", textDecoration:"none",
        borderRadius:10, padding:"12px 28px", fontSize:14, fontWeight:600,
      }}>
        ← Back to Home
      </a>
    </div>
  );
}
