// src/App.jsx
// Main app entry — handles both platform routing and custom domain routing
// Custom domain: drsmithclinic.in → loads ClinicSite directly (no slug in URL)
// Platform:      clinicsite.in/drsmith → normal slug-based routing

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useCustomDomain } from "./hooks/useCustomDomain";
import ClinicSite from "./pages/ClinicSite";
import { PlanEnforcementProvider } from './components/PlanEnforcementProvider';

// ── Lazy imports (keep initial bundle small) ───────────────────────────────────────────
import { lazy, Suspense } from "react";
const LandingPage       = lazy(() => import("./pages/LandingPage"));
const LoginPage         = lazy(() => import("./pages/LoginPage"));
const OnboardingWizard  = lazy(() => import("./pages/OnboardingWizard"));
const AdminPanel        = lazy(() => import("./components/AdminPanel"));
const SuperadminPanel   = lazy(() => import("./pages/SuperadminPanel"));
const PrivacyPolicy     = lazy(() => import("./pages/PrivacyPolicy"));
const NotFound          = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f4f8fd",
      fontFamily: "'DM Sans', sans-serif", color: "#64748b" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🏥</div>
        <div style={{ fontSize: 14 }}>Loading…</div>
      </div>
    </div>
  );
}

// ── Custom domain wrapper ─────────────────────────────────────
function CustomDomainApp({ clinicSlug }) {
  if (!clinicSlug) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: "'DM Sans', sans-serif",
        flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 40 }}>🔍</div>
        <div style={{ color: "#64748b", fontSize: 15 }}>Clinic not found on this domain.</div>
        <a href="https://clinicsite.in" style={{ color: "#1565c0", fontSize: 13, textDecoration: "none" }}>
          Powered by ClinicSite.in
        </a>
      </div>
    );
  }
  return <ClinicSite slug={clinicSlug}/>;
}

// ── Main App ─────────────────────────────────────────────────────
export default function App() {
  const { isCustomDomain, clinicSlug, loading } = useCustomDomain();

  // While detecting domain type, show nothing (avoid flash)
  if (loading) return <PageLoader/>;

  // OPTION 1: Top-level wrapper encapsulation.
  // This guarantees the context lifecycle builds first, covering both routing paths.
  return (
    <PlanEnforcementProvider>
      {isCustomDomain ? (
        <CustomDomainApp clinicSlug={clinicSlug}/>
      ) : (
        <BrowserRouter>
          <Suspense fallback={<PageLoader/>}>
            <Routes>
              {/* Public */}
              <Route path="/"           element={<LandingPage/>}/>
              <Route path="/login"      element={<LoginPage/>}/>
              <Route path="/onboarding" element={<OnboardingWizard/>}/>

              {/* Clinic patient-facing site */}
              <Route path="/:slug"                element={<ClinicSite/>}/>
              <Route path="/:slug/privacy-policy" element={<PrivacyPolicy/>}/>

              {/* Admin */}
              <Route path="/admin"                element={<AdminPanel/>}/>
              <Route path="/admin/:tab"          element={<AdminPanel/>}/>

              {/* Superadmin */}
              <Route path="/superadmin"          element={<SuperadminPanel/>}/>

              {/* Fallback */}
              <Route path="*" element={<NotFound/>}/>
            </Routes>
          </Suspense>
        </BrowserRouter>
      )}
    </PlanEnforcementProvider>
  );
}