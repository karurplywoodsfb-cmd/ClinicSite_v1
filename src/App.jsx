// src/App.jsx
// Root — handles auth state, loads clinic, renders Login or AdminPanel

import { useState, useEffect } from "react";
import Login      from "./components/Login";
import AdminPanel from "./components/AdminPanel";
import { supabase, getMyClinic } from "./lib/supabase";

export default function App() {
  const [user,    setUser]    = useState(null);
  const [clinic,  setClinic]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadClinic();
      } else {
        setLoading(false);
      }
    });

    // Listen for login / logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await loadClinic();
        } else {
          setUser(null);
          setClinic(null);
          setLoading(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const loadClinic = async () => {
    setLoading(true);
    try {
      const data = await getMyClinic();
      setClinic(data);
    } catch (e) {
      console.error("No clinic linked to this account:", e.message);
      setClinic(null);
    } finally {
      setLoading(false);
    }
  };

  // ── Loading spinner ──────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#080c14", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, fontFamily:"sans-serif" }}>
      <div style={{ fontSize:40, animation:"spin 2s linear infinite" }}>🦷</div>
      <div style={{ color:"#475569", fontSize:14 }}>Loading ClinicSite...</div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Not logged in ────────────────────────────────────────────────
  if (!user) return <Login onLogin={(u) => setUser(u)} />;

  // ── Logged in but no clinic linked yet ───────────────────────────
  if (!clinic) return (
    <div style={{ minHeight:"100vh", background:"#080c14", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, fontFamily:"'DM Sans',sans-serif", padding:24, textAlign:"center" }}>
      <div style={{ fontSize:40 }}>🏥</div>
      <div style={{ fontSize:18, fontWeight:700, color:"#f1f5f9" }}>No clinic found</div>
      <div style={{ fontSize:14, color:"#475569", maxWidth:360, lineHeight:1.6 }}>
        Account created! Now run the seed SQL in Supabase with your User ID below to link your clinic.
      </div>
      <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"14px 20px", fontFamily:"monospace", fontSize:12 }}>
        <div style={{ color:"#64748b", marginBottom:4 }}>Your User ID:</div>
        <div style={{ color:"#22c55e", wordBreak:"break-all" }}>{user.id}</div>
        <div style={{ color:"#64748b", marginTop:8 }}>Your Email:</div>
        <div style={{ color:"#7dd3fc" }}>{user.email}</div>
      </div>
      <button onClick={() => supabase.auth.signOut()} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#64748b", borderRadius:8, padding:"8px 20px", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
        Sign out
      </button>
    </div>
  );

  // ── Logged in + clinic found ─────────────────────────────────────
  return (
    <AdminPanel
      user={user}
      clinic={clinic}
      onClinicUpdate={setClinic}
      onLogout={() => supabase.auth.signOut()}
    />
  );
}
