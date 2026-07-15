// src/Router.jsx — FIXED
// Routes: / | /admin | /superadmin | /login | /:slug | /:slug/blog | /:slug/blog/:post | /:slug/privacy-policy

import { useState, useEffect } from "react";
import { supabase }            from "./lib/supabase";
import Login                   from "./components/Login";
import AdminPanel              from "./components/AdminPanel";
import OnboardingWizard        from "./components/OnboardingWizard";
import SuperAdmin              from "./components/SuperAdmin";
import ClinicSite              from "./pages/ClinicSite";
import BlogPage                from "./pages/BlogPage";
import FeedbackPage            from "./pages/FeedbackPage";
import LiveQueuePage           from "./pages/LiveQueuePage";
import PrivacyPolicyPage, { generatePrivacyPolicy } from "./pages/PrivacyPolicyPage";
import { getMyClinic }         from "./lib/supabase";

// ── helpers ───────────────────────────────────────────────────────
function getSubdomainSlug() {
  const h = window.location.hostname;
  if (h.includes("localhost")) return null;
  if (h.endsWith(".vercel.app")) return null;
  if (!h.endsWith(".waspace.in")) return null;
  const p = h.split(".");
  if (p.length >= 3) return p[0];
  return null;
}

function getRoute() {
  const path  = window.location.pathname;
  const parts = path.split("/").filter(Boolean);

  if (path.startsWith("/superadmin")) return { type:"superadmin" };
  if (path.startsWith("/admin"))      return { type:"admin" };
  if (path.startsWith("/login"))      return { type:"login" };
  if (path === "/" || path === "")    return { type:"landing" };

  const sub = getSubdomainSlug();
  if (sub) {
    if (parts[0]==="blog" && parts[1]) return { type:"blogPost",  clinicSlug:sub, postSlug:parts[1] };
    if (parts[0]==="blog")             return { type:"blog",      clinicSlug:sub };
    if (parts[0]==="privacy-policy")   return { type:"privacy",   clinicSlug:sub };
    if (parts[0]==="feedback")         return { type:"feedback",  clinicSlug:sub };
    if (parts[0]==="live")              return { type:"live",      clinicSlug:sub };
    return { type:"clinic", slug:sub };
  }

  const RESERVED = ["admin","superadmin","login","signup","pricing","about","contact",""];
  if (!RESERVED.includes(parts[0])) {
    const slug = parts[0];
    if (parts[1]==="blog" && parts[2]) return { type:"blogPost",  clinicSlug:slug, postSlug:parts[2] };
    if (parts[1]==="blog")             return { type:"blog",      clinicSlug:slug };
    if (parts[1]==="privacy-policy")   return { type:"privacy",   clinicSlug:slug };
    if (parts[1]==="feedback")         return { type:"feedback",  clinicSlug:slug };
    if (parts[1]==="live")              return { type:"live",      clinicSlug:slug };
    return { type:"clinic", slug };
  }

  return { type:"landing" };
}

async function checkSuperAdmin(userId) {
  // FIX: Use maybeSingle() instead of single()
  const { data } = await supabase.from("profiles").select("is_superadmin").eq("id", userId).maybeSingle();
  return data?.is_superadmin === true;
}

// ── Landing page (inline) ─────────────────────────────────────────
function Landing({ onGetStarted }) {
  return (
    <div style={{ minHeight:"100vh", background:"#080c14", color:"white", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:40, textAlign:"center" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div style={{ width:60, height:60, borderRadius:16, background:"linear-gradient(135deg,#1565c0,#1e88e5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, marginBottom:24, boxShadow:"0 8px 32px rgba(21,101,192,0.4)" }}>🦷</div>
      <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"clamp(36px,5vw,64px)", lineHeight:1.1, marginBottom:20, maxWidth:700 }}>
        Your Clinic Website<br/><em style={{ fontStyle:"italic", color:"#1e88e5" }}>in 10 Minutes</em>
      </div>
      <p style={{ fontSize:18, color:"rgba(255,255,255,0.55)", maxWidth:500, lineHeight:1.7, marginBottom:40 }}>
        Built for Indian clinics. Auto-SEO. Appointment booking. DPDP-compliant. Free to start.
      </p>
      <div style={{ display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center", marginBottom:60 }}>
        <button onClick={onGetStarted} style={{ background:"#1565c0", color:"white", border:"none", borderRadius:12, padding:"16px 36px", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 8px 24px rgba(21,101,192,0.4)" }}>Get Started Free →</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, maxWidth:700, width:"100%" }}>
        {[["🏥","6.5L+ Clinics","In India, mostly undigitized"],["⏱️","10 Minutes","From signup to live site"],["⚖️","DPDP Compliant","Built for Indian medical law"]].map(([icon,title,sub])=>(
          <div key={title} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:20 }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>{title}</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)" }}>{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ minHeight:"100vh", background:"#080c14", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, fontFamily:"sans-serif" }}>
      <div style={{ fontSize:40, animation:"spin 2s linear infinite" }}>🦷</div>
      <div style={{ color:"#475569", fontSize:14 }}>Loading WaSpace...</div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Main Router ───────────────────────────────────────────────────
export default function Router() {
  const [route,        setRoute]        = useState(getRoute());
  const [user,         setUser]         = useState(null);
  const [clinic,       setClinic]       = useState(null);
  const [doctor,       setDoctor]       = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading,      setLoading]      = useState(true);

  // Back/forward navigation
  useEffect(() => {
    const onPop = () => setRoute(getRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) { setUser(session.user); await loadUserData(session.user); }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) { setUser(session.user); await loadUserData(session.user); }
      else { setUser(null); setClinic(null); setDoctor(null); setIsSuperAdmin(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (u) => {
    try {
      const [isSA, c] = await Promise.all([
        checkSuperAdmin(u.id).catch(() => false),
        getMyClinic().catch(() => null),
      ]);
      setIsSuperAdmin(isSA);
      setClinic(c);
      if (c?.id) {
        // FIX: Use maybeSingle() instead of limit(1) + array access
        const { data: doc } = await supabase.from("doctors").select("*").eq("clinic_id", c.id).maybeSingle();
        setDoctor(doc || null);
      }
    } catch (e) {
      console.error("loadUserData:", e.message);
    }
  };

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setRoute(getRoute());
  };

  if (loading) return <Spinner />;

  // ── SUPERADMIN ───────────────────────────────────────────────────
  if (route.type === "superadmin") {
    if (!user) return <Login onLogin={u => { setUser(u); }} />;
    if (!isSuperAdmin) return (
      <div style={{ minHeight:"100vh", background:"#080c14", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif", flexDirection:"column", gap:12 }}>
        <div style={{ fontSize:40 }}>🚫</div>
        <div style={{ color:"#ef4444", fontWeight:700, fontSize:18 }}>Access Denied</div>
        <div style={{ color:"#64748b", fontSize:14 }}>Restricted to platform administrators.</div>
        <button onClick={() => navigate("/admin")} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#64748b", borderRadius:8, padding:"8px 20px", fontSize:13, cursor:"pointer", marginTop:8, fontFamily:"inherit" }}>Go to Clinic Admin</button>
      </div>
    );
    return <SuperAdmin user={user} />;
  }

  // ── ADMIN ────────────────────────────────────────────────────────
  if (route.type === "admin") {
    if (!user) return <Login onLogin={u => setUser(u)} />;
    if (!clinic) return (
      <OnboardingWizard
        user={user}
        onComplete={async (newClinic) => {
          setClinic(newClinic);
          try {
            const { data: doc } = await supabase.from("doctors").select("*").eq("clinic_id", newClinic.id).maybeSingle();
            setDoctor(doc || null);
            const policy = generatePrivacyPolicy(newClinic, doc);
            await supabase.from("privacy_policies").upsert({ clinic_id: newClinic.id, content: policy.content, version: policy.version }).catch(() => {});
          } catch(e) { console.error(e); }
          navigate("/admin");
        }}
      />
    );
    return (
      <AdminPanel
        user={user}
        clinic={clinic}
        onClinicUpdate={c => { setClinic(c); }}
        onLogout={() => { supabase.auth.signOut(); navigate("/"); }}
      />
    );
  }

  // ── LOGIN ────────────────────────────────────────────────────────
  if (route.type === "login") {
    if (user) { navigate(isSuperAdmin ? "/superadmin" : "/admin"); return null; }
    return <Login onLogin={u => { setUser(u); navigate("/admin"); }} />;
  }

  // ── PRIVACY POLICY ───────────────────────────────────────────────
  if (route.type === "privacy") {
    return <PrivacyPolicyClinic slug={route.clinicSlug} />;
  }

  // ── FEEDBACK (Review Filter Funnel) ────────────────────────────────
  if (route.type === "feedback") {
    return <FeedbackPage slug={route.clinicSlug} />;
  }

  // ── LIVE TOKEN STATUS ────────────────────────────────────────────
  if (route.type === "live") {
    return <LiveQueuePage slug={route.clinicSlug} />;
  }

  // ── BLOG LIST ────────────────────────────────────────────────────
  if (route.type === "blog") {
    return <BlogPage clinicSlug={route.clinicSlug} supabase={supabase} />;
  }

  // ── BLOG POST ────────────────────────────────────────────────────
  if (route.type === "blogPost") {
    return <BlogPage clinicSlug={route.clinicSlug} postSlug={route.postSlug} supabase={supabase} />;
  }

  // ── CLINIC SITE (patient-facing) ─────────────────────────────────
  if (route.type === "clinic") {
    return <ClinicSite slug={route.slug} />;
  }

  // ── LANDING ────────────────────────────────────────────────────────
  return <Landing onGetStarted={() => navigate("/login")} />;
}

// ── Privacy policy fetcher (per clinic) ────────────────────────────
function PrivacyPolicyClinic({ slug }) {
  const [clinic, setClinic]   = useState(null);
  const [doctor, setDoctor]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // FIX: Use maybeSingle() instead of single()
        const { data: c } = await supabase.from("clinics").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
        if (c) {
          setClinic(c);
          const { data: doc } = await supabase.from("doctors").select("*").eq("clinic_id", c.id).maybeSingle();
          setDoctor(doc || null);
        }
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <Spinner />;
  if (!clinic) return <div style={{ padding:40, fontFamily:"sans-serif", color:"#334155" }}>Clinic not found.</div>;
  return <PrivacyPolicyPage clinic={clinic} doctor={doctor} />;
}