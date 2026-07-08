// src/App.jsx — Definitive router (replaces Router.jsx)
// Uses react-router-dom v7. Auth state from AuthContext.
// All route wrappers are inline here — no top-level await, no mid-file imports.

import { lazy, Suspense, useState, useEffect } from "react";
import {
  BrowserRouter, Routes, Route,
  Navigate, useParams, useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuthContext }from "./contexts/AuthContext";
import { PlanEnforcementProvider }     from "./components/PlanEnforcementProvider";
import { RoleProvider }                from "./components/RoleProvider";
import { useCustomDomain }             from "./hooks/useCustomDomain";
import { supabase }                    from "./lib/supabase";

// ── Lazy page/component imports ───────────────────────────────────
// (Only default exports — no route wrappers in those files)
const LandingPage        = lazy(() => import("./pages/LandingPage"));
const LoginComponent     = lazy(() => import("./components/Login"));
const OnboardingWizard   = lazy(() => import("./components/OnboardingWizard"));
const AdminPanel         = lazy(() => import("./components/AdminPanel"));
const SuperAdmin         = lazy(() => import("./components/SuperAdmin"));
const ClinicSitePage     = lazy(() => import("./pages/ClinicSite"));
const BlogPageComponent  = lazy(() => import("./pages/BlogPage"));
const PrivacyPolicyPage  = lazy(() => import("./pages/PrivacyPolicyPage"));
const FeedbackPage       = lazy(() => import("./pages/FeedbackPage"));
const LiveQueuePage      = lazy(() => import("./pages/LiveQueuePage"));
const NotFound           = lazy(() => import("./pages/NotFound"));

// ── Shared loader shown during lazy chunk download ────────────────
function PageLoader() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#080c14",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, animation: "spin 2s linear infinite" }}>🦷</div>
        <div style={{ color: "#475569", fontSize: 14, marginTop: 12, fontFamily: "sans-serif" }}>
          Loading ClinicSite...
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div style={{
      minHeight: "100vh", background: "#080c14", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "sans-serif", flexDirection: "column", gap: 12,
    }}>
      <div style={{ fontSize: 40 }}>🚫</div>
      <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 18 }}>Access Denied</div>
      <div style={{ color: "#64748b", fontSize: 14 }}>Restricted to platform administrators.</div>
      <a href="/admin" style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>← Clinic Admin</a>
    </div>
  );
}

// ── ProtectedRoute: guards behind auth ───────────────────────────
function ProtectedRoute({ children, requireSuperAdmin = false }) {
  const { user, isSuperAdmin, loading } = useAuthContext();
  if (loading) return <PageLoader />;
  if (!user)   return <Navigate to="/login" replace />;
  if (requireSuperAdmin && !isSuperAdmin) return <AccessDenied />;
  return children;
}

// ── LoginRoute: skip if already authed ───────────────────────────
function LoginRoute() {
  const { user, isSuperAdmin, loading } = useAuthContext();
  const navigate = useNavigate();

  if (loading) return <PageLoader />;
  if (user)    return <Navigate to={isSuperAdmin ? "/superadmin" : "/admin"} replace />;

  // onLogin is called after OTP verification — AuthContext picks up the
  // session change via onAuthStateChange, so we just navigate to /admin.
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginComponent onLogin={() => navigate("/admin", { replace: true })} />
    </Suspense>
  );
}

// ── AdminRoute: wraps PlanEnforcementProvider + RoleProvider + onboarding gate ──
function AdminRoute() {
  const { user, clinic, onClinicCreated, setClinic, logout } = useAuthContext();

  return (
    <PlanEnforcementProvider>
      {!clinic
        ? <OnboardingWizard user={user} onComplete={onClinicCreated} />
        : <RoleProvider clinic={clinic} user={user}>
            <AdminPanel
              user={user}
              clinic={clinic}
              onClinicUpdate={setClinic}
              onLogout={logout}
            />
          </RoleProvider>
      }
    </PlanEnforcementProvider>
  );
}

// ── SuperAdminRoute: passes user from context ─────────────────────
function SuperAdminRoute() {
  const { user } = useAuthContext();
  return (
    <Suspense fallback={<PageLoader />}>
      <SuperAdmin user={user} />
    </Suspense>
  );
}

// ── ClinicSiteRoute: reads :slug from URL params ──────────────────
function ClinicSiteRoute() {
  const { slug } = useParams();
  return (
    <Suspense fallback={<PageLoader />}>
      <ClinicSitePage slug={slug} />
    </Suspense>
  );
}

// ── BlogRoute: fetches clinic by slug, passes to BlogPage ─────────
function BlogRoute() {
  const { slug }            = useParams();
  const [clinic, setClinic] = useState(null);
  const [ready, setReady]   = useState(false);

  useEffect(() => {
    supabase
      .from("clinics").select("*")
      .eq("slug", slug).eq("is_published", true).maybeSingle()
      .then(({ data }) => { setClinic(data || null); setReady(true); })
      .catch(() => setReady(true));
  }, [slug]);

  if (!ready) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
      <BlogPageComponent clinic={clinic} supabase={supabase} />
    </Suspense>
  );
}

// ── PrivacyPolicyRoute: fetches clinic + doctor by slug ───────────
function PrivacyPolicyRoute() {
  const { slug }              = useParams();
  const [clinic, setClinic]   = useState(null);
  const [doctor, setDoctor]   = useState(null);
  const [ready, setReady]     = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: c } = await supabase
          .from("clinics").select("*")
          .eq("slug", slug).eq("is_published", true).maybeSingle();
        if (c) {
          setClinic(c);
          const { data: doc } = await supabase
            .from("doctors").select("*").eq("clinic_id", c.id).maybeSingle();
          setDoctor(doc || null);
        }
      } catch (e) {
        console.error("[PrivacyPolicyRoute]", e.message);
      }
      setReady(true);
    })();
  }, [slug]);

  if (!ready) return <PageLoader />;
  if (!clinic) return (
    <div style={{ padding: 40, fontFamily: "sans-serif", color: "#334155" }}>
      Clinic not found.
    </div>
  );

  return (
    <Suspense fallback={<PageLoader />}>
      <PrivacyPolicyPage clinic={clinic} doctor={doctor} />
    </Suspense>
  );
}

// ── FeedbackRoute: review funnel, self-fetches clinic by slug ─────
function FeedbackRoute() {
  const { slug } = useParams();
  return (
    <Suspense fallback={<PageLoader />}>
      <FeedbackPage slug={slug} />
    </Suspense>
  );
}

// ── LiveRoute: live token status, self-fetches clinic by slug ─────
function LiveRoute() {
  const { slug } = useParams();
  return (
    <Suspense fallback={<PageLoader />}>
      <LiveQueuePage slug={slug} />
    </Suspense>
  );
}

// ── Custom domain renderer ────────────────────────────────────────
function CustomDomainSite({ clinicSlug }) {
  if (!clinicSlug) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans',sans-serif", gap: 12,
      }}>
        <div style={{ fontSize: 40 }}>🔍</div>
        <div style={{ color: "#64748b", fontSize: 15 }}>Clinic not found on this domain.</div>
        <a href="https://clinicsite.in"
          style={{ color: "#1565c0", fontSize: 13, textDecoration: "none" }}>
          Powered by ClinicSite.in
        </a>
      </div>
    );
  }
  return (
    <Suspense fallback={<PageLoader />}>
      <ClinicSitePage slug={clinicSlug} />
    </Suspense>
  );
}

// ── Root App ──────────────────────────────────────────────────────
export default function App() {
  const { isCustomDomain, clinicSlug, loading } = useCustomDomain();

  if (loading) return <PageLoader />;

  // Custom clinic domain → render that clinic's site directly
  if (isCustomDomain) return <CustomDomainSite clinicSlug={clinicSlug} />;

  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public ── */}
            <Route path="/"      element={<LandingPage />} />
            <Route path="/login" element={<LoginRoute />} />

            {/* ── Clinic patient pages (public, no auth) ── */}
            <Route path="/:slug"                element={<ClinicSiteRoute />} />
            <Route path="/:slug/blog"           element={<BlogRoute />} />
            <Route path="/:slug/blog/:postSlug" element={<BlogRoute />} />
            <Route path="/:slug/privacy-policy" element={<PrivacyPolicyRoute />} />
            <Route path="/:slug/feedback"       element={<FeedbackRoute />} />
            <Route path="/:slug/live"           element={<LiveRoute />} />

            {/* ── Admin (auth-gated; plan enforcement is inside AdminRoute) ── */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminRoute />
              </ProtectedRoute>
            } />

            {/* ── Superadmin ── */}
            <Route path="/superadmin" element={
              <ProtectedRoute requireSuperAdmin>
                <SuperAdminRoute />
              </ProtectedRoute>
            } />

            {/* ── 404 ── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
