// src/components/AdminPanel.jsx — FINAL v3
// Fixes: template column error, preview iframe, compliance reg no alert,
//        DPDP consent column display, publish gate, usePlanContext safety fallback

import { useState, useEffect } from "react";
import { usePlanContext } from "./PlanEnforcementProvider";
import { PlanBadge } from "./PlanBadge";
import {
  supabase,
  updateClinic,
  getServices,
  getDoctors,
  updateDoctor,
  getAppointments,
  publishClinic,
  subscribeToAppointments,
  getClinicMedia,
  getWorkingHours,
} from "../lib/supabase";
import UpgradeModal    from "./UpgradeModal";
import ComplianceTab   from "./ComplianceTab";
import BannerControl   from "./admin/BannerControl";
import FeedbackInbox   from "./admin/FeedbackInbox";
import ReceptionistDashboard from "./admin/ReceptionistDashboard";
import StaffManagement       from "./admin/StaffManagement";
import PrescriptionPad       from "./admin/PrescriptionPad";
import CrossClinicRequestPanel from "./admin/CrossClinicRequestPanel";
import BillingForm           from "./admin/BillingForm";
import { useRoleContext }    from "./RoleProvider";
import { PermissionGate }    from "./PermissionGate";
import DomainManager          from "../components/admin/DomainManager";
import DashboardPage          from "./admin/DashboardPage";
import AppointmentsPage       from "./admin/AppointmentsPage";
import ServicesPage           from "./admin/ServicesPage";
import WorkingHoursPage       from "./admin/WorkingHoursPage";
import BranchesPage           from "./admin/BranchesPage";
import ClinicInfoPage         from "./admin/ClinicInfoPage";
import DoctorProfilePage      from "./admin/DoctorProfilePage";
import DesignThemePage        from "./admin/DesignThemePage";
import GalleryPage            from "./admin/GalleryPage";
import BlogPage               from "./admin/BlogPage";
import SeoPage                from "./admin/SeoPage";
import PreviewPage            from "./admin/PreviewPage";

// ── Small helpers now live in ./admin/ui.jsx — imported directly by the
// page components that need them (see ServicesPage, DoctorProfilePage, etc.)

const NAV_ITEMS = [
  { id:"dashboard",    label:"Dashboard",      icon:"⊞" },
  { id:"appointments", label:"Appointments",   icon:"📅" },
  { id:"services",     label:"Services",       icon:"🦷" },
  { id:"hours",        label:"Working Hours",  icon:"🕐" },
  { id:"clinic",       label:"Clinic Info",    icon:"🏥" },
  { id:"doctor",       label:"Doctor Profile", icon:"👨‍⚕️" },
  { id:"branches",     label:"Branches",       icon:"📍" },
  { id:"design",       label:"Design & Theme", icon:"🎨" },
  { id:"media",        label:"Gallery",        icon:"🖼️" },
  { id:"blog",         label:"Blog & Content", icon:"✍️"  },
  { id:"seo",          label:"SEO",            icon:"🔍" },
  { id:"queue",        label:"Live Queue",     icon:"🎫" },
  { id:"feedback",     label:"Feedback",       icon:"⭐" },
  { id:"compliance",   label:"Compliance",     icon:"⚖️"  },
  { id:"preview",      label:"Preview Site",   icon:"👁️"  },
  { id:"domain",       label:"Domain",         icon:"🌐" },
  { id:"prescriptions", label:"Prescriptions",   icon:"📋" },
  { id:"billing",      label:"Billing",         icon:"🧾" },
  { id:"health-share",  label:"Cross-Clinic History", icon:"🔗" },
  { id:"staff",        label:"Staff",          icon:"👥" },
];

// Maps nav items to the permission required to see them. Items with no
// entry here are visible to every role (dashboard, preview).
const NAV_PERMISSIONS = {
  appointments: ["manage_calendar", "manage_own_calendar"],
  services:     ["manage_clinic_settings"],
  hours:        ["manage_clinic_settings"],
  clinic:       ["manage_clinic_settings"],
  doctor:       ["manage_clinic_settings"],
  branches:     ["manage_clinic_settings"],
  design:       ["manage_clinic_settings"],
  media:        ["manage_clinic_settings"],
  blog:         ["manage_clinic_settings"],
  seo:          ["manage_clinic_settings"],
  queue:        ["manage_queue"],
  feedback:     ["manage_clinic_settings"],
  compliance:   ["manage_clinic_settings"],
  domain:       ["manage_clinic_settings"],
  staff:        ["manage_staff"],
  prescriptions:["view_medical_records"],
  "health-share": ["view_medical_records"],
  billing:      ["manage_billing"],
};

// ── Main component ────────────────────────────────────────────────
export default function AdminPanel({ user, clinic: initClinic, onClinicUpdate, onLogout }) {
  const planContext = usePlanContext(); // PlanEnforcementProvider is guaranteed by App.jsx's AdminRoute
  const { hasPermission, role, doctorId } = useRoleContext();

  const [page,        setPage]        = useState("dashboard");
  const [clinic,      setClinic]      = useState(initClinic);
  const [services,    setServices]    = useState([]);
  const [doctors,     setDoctors]     = useState([]);
  const [appts,       setAppts]       = useState([]);
  const [hours,       setHours]       = useState([]);
  const [branches,    setBranches]    = useState([]);
  const [media,       setMedia]       = useState([]);
  const [saved,       setSaved]       = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [apptFilter,  setApptFilter]  = useState("all");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [publishing,  setPublishing]  = useState(false);
  const [publishMsg,  setPublishMsg]  = useState("");
  const [sideOpen,    setSideOpen]    = useState(true);

  // Local editable copies
  const [clinicEdit,  setClinicEdit]  = useState(initClinic || {});
  const [doctorEdit,  setDoctorEdit]  = useState({});

  // Load data on mount
  useEffect(() => {
    if (!clinic?.id) return;
    getServices(clinic.id).then(setServices).catch(console.error);
    getDoctors(clinic.id).then(d => { setDoctors(d); setDoctorEdit(d[0] || {}); }).catch(console.error);
    getAppointments(clinic.id).then(setAppts).catch(console.error);
    getWorkingHours(clinic.id).then(setHours).catch(console.error);
    // Load branches
    supabase.from("clinic_branches").select("*").eq("clinic_id", clinic.id)
      .order("created_at").then(({ data }) => setBranches(data || [])).catch(console.error);
    getClinicMedia(clinic.id).then(setMedia).catch(console.error);

    const unsub = subscribeToAppointments(clinic.id, (payload) => {
      if (payload.eventType === "INSERT") setAppts(p => [payload.new, ...p]);
      if (payload.eventType === "UPDATE")  setAppts(p => p.map(a => a.id === payload.new.id ? payload.new : a));
    });
    return unsub;
  }, [clinic?.id]);

  // Keep clinicEdit in sync when clinic prop changes
  useEffect(() => {
    if (initClinic) { setClinic(initClinic); setClinicEdit(initClinic); }
  }, [initClinic]);

  // ── Save helpers ─────────────────────────────────────────────────
  const doSave = async (updates) => {
    setSaving(true);
    try {
      const updated = await updateClinic(clinic.id, updates);
      setClinic(updated);
      setClinicEdit(updated);
      onClinicUpdate?.(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveClinicInfo = () => doSave({
    name:        clinicEdit.name,
    tagline:     clinicEdit.tagline,
    heroTagline: clinicEdit.heroTagline,
    specialty:   clinicEdit.specialty,
    city:        clinicEdit.city,
    phone:       clinicEdit.phone,
    whatsapp:    clinicEdit.whatsapp,
    email:       clinicEdit.email,
    address:     clinicEdit.address,
    about:       clinicEdit.about,
    logo_url:    clinicEdit.logo_url,
  });

  const saveDoctor = async () => {
    if (!doctorEdit?.id) return;
    setSaving(true);
    try {
      const updated = await updateDoctor(doctorEdit.id, {
        name:           doctorEdit.name,
        degree:         doctorEdit.degree,
        specialization: doctorEdit.specialization,
        experience:     doctorEdit.experience,
        bio:            doctorEdit.bio,
        reg_number:     doctorEdit.reg_number,
        council_name:   doctorEdit.council_name,
      });
      setDoctors(prev => prev.map((d, i) => i === 0 ? updated : d));
      setDoctorEdit(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishMsg("Publishing...");
    try {
      const updated = await publishClinic(clinic.id, !clinic.is_published);
      setClinic(updated);
      setClinicEdit(updated);
      onClinicUpdate?.(updated);
      setPublishMsg(updated.is_published ? "✓ Site is Live!" : "✓ Site Hidden");
      setTimeout(() => setPublishMsg(""), 4000);
    } catch (e) {
      setPublishMsg("⚠ " + e.message);
      setTimeout(() => setPublishMsg(""), 8000);
    } finally {
      setPublishing(false);
    }
  };

  const doctor          = doctors[0];
  const hasRegNo        = !!doctor?.reg_number;
  const complianceAlert = !hasRegNo;

  return (
    <div style={{ display:"flex", height:"100vh", background:"#080c14", color:"#e2e8f0",
      fontFamily:"'DM Sans','Segoe UI',sans-serif", overflow:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* ══════════════ SIDEBAR ══════════════ */}
      <div style={{ width: sideOpen ? 224 : 60, flexShrink:0, background:"#0d1526",
        borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column",
        transition:"width .25s", overflow:"hidden" }}>

        {/* Logo */}
        <div style={{ padding:"16px", borderBottom:"1px solid rgba(255,255,255,0.06)",
          display:"flex", alignItems:"center", gap:10, minHeight:64 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#1565c0,#1e88e5)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>🦷</div>
          {sideOpen && (
            <div style={{ overflow:"hidden" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#f1f5f9", whiteSpace:"nowrap" }}>ClinicSite</div>
              <div style={{ fontSize:10, color:"#475569", whiteSpace:"nowrap" }}>Admin Panel</div>
            </div>
          )}
          <button onClick={() => setSideOpen(!sideOpen)}
            style={{ marginLeft:"auto", background:"none", border:"none", color:"#475569",
              cursor:"pointer", fontSize:14, padding:2, flexShrink:0 }}>
            {sideOpen ? "◀" : "▶"}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"10px 8px", overflowY:"auto" }}>
          {NAV_ITEMS.filter(item => {
            const required = NAV_PERMISSIONS[item.id];
            return !required || required.some(p => hasPermission(p));
          }).map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              width:"100%", display:"flex", alignItems:"center", gap:10,
              padding:"9px 10px", borderRadius:8, border:"none", cursor:"pointer",
              background: page === item.id ? "rgba(21,101,192,0.15)" : "transparent",
              color: page === item.id ? "#7dd3fc" : "#475569",
              fontFamily:"inherit", fontSize:13, fontWeight: page === item.id ? 600 : 400,
              transition:"all .15s", marginBottom:2, textAlign:"left",
              borderLeft: page === item.id ? "2px solid #1e88e5" : "2px solid transparent",
            }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
              {sideOpen && <span style={{ whiteSpace:"nowrap", overflow:"hidden" }}>{item.label}</span>}
              {/* Red dot on compliance if reg no missing */}
              {item.id === "compliance" && complianceAlert && sideOpen && (
                <span style={{ marginLeft:"auto", width:8, height:8, borderRadius:"50%",
                  background:"#ef4444", flexShrink:0 }}/>
              )}
              {item.id === "compliance" && complianceAlert && !sideOpen && (
                <span style={{ position:"absolute", top:6, right:6, width:7, height:7,
                  borderRadius:"50%", background:"#ef4444" }}/>
              )}
            </button>
          ))}
        </nav>

        {/* Plan badge */}
        {sideOpen && (
          <div style={{ padding:"12px" }}>
            <PlanBadge />
            {clinic?.plan === "free" && (
              <button onClick={() => setShowUpgrade(true)} style={{
                width:"100%", marginTop:8, background:"#1565c0", border:"none", color:"white",
                borderRadius:6, padding:"6px", fontSize:11, cursor:"pointer",
                fontFamily:"inherit", fontWeight:600 }}>
                Upgrade ₹499/mo →
              </button>
            )}
          </div>
        )}
      </div>

      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Topbar */}
        <div style={{ height:64, background:"#0d1526", borderBottom:"1px solid rgba(255,255,255,0.06)",
          display:"flex", alignItems:"center", padding:"0 24px", gap:16, flexShrink:0 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#f1f5f9" }}>
              {NAV_ITEMS.find(n => n.id === page)?.label}
            </div>
            <div style={{ fontSize:11, color:"#475569", fontFamily:"monospace" }}>
              {clinic?.slug}.clinicsite.in
              {" · "}
              <span style={{ color: clinic?.is_published ? "#22c55e" : "#64748b" }}>
                {clinic?.is_published ? "🟢 Live" : "⚫ Hidden"}
              </span>
            </div>
          </div>

          <div style={{ marginLeft:"auto", display:"flex", gap:10, alignItems:"center" }}>
            {publishMsg && (
              <div style={{ fontSize:12,
                color: publishMsg.includes("✓") ? "#22c55e" : "#f59e0b",
                fontFamily:"monospace", background:"rgba(0,0,0,0.3)",
                borderRadius:6, padding:"4px 12px", maxWidth:300, lineHeight:1.4 }}>
                {publishMsg}
              </div>
            )}
            <button onClick={handlePublish} disabled={publishing} style={{
              background: clinic?.is_published
                ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
              border: `1px solid ${clinic?.is_published ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
              color: clinic?.is_published ? "#f87171" : "#22c55e",
              borderRadius:8, padding:"8px 16px", fontSize:12,
              cursor: publishing ? "not-allowed" : "pointer",
              fontFamily:"inherit", fontWeight:600, transition:"all .2s",
            }}>
              {publishing ? "..." : clinic?.is_published ? "⏸ Unpublish" : "🚀 Publish Site"}
            </button>
            <button onClick={onLogout} style={{
              background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)",
              color:"#64748b", borderRadius:8, padding:"8px 14px",
              fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex:1, overflowY:"auto", padding:24 }}>

          {/* ═══ DASHBOARD ═══ */}
          {page === "dashboard" && (
            <DashboardPage
              clinic={clinic}
              complianceAlert={complianceAlert}
              onGoToDoctorTab={() => setPage("doctor")}
              appts={appts}
              branches={branches}
            />
          )}

          {/* ═══ APPOINTMENTS ═══ */}
          {page === "appointments" && (
            <AppointmentsPage
              clinic={clinic}
              appts={appts}
              setAppts={setAppts}
              branches={branches}
              apptFilter={apptFilter}
              setApptFilter={setApptFilter}
              planContext={planContext}
              onRequestUpgrade={() => setShowUpgrade(true)}
            />
          )}

          {/* ═══ SERVICES ═══ */}
          {page === "services" && (
            <ServicesPage
              clinic={clinic}
              services={services}
              setServices={setServices}
              planContext={planContext}
              onRequestUpgrade={() => setShowUpgrade(true)}
              saved={saved}
              saving={saving}
              setSaved={setSaved}
              doSave={doSave}
            />
          )}

          {/* ═══ WORKING HOURS ═══ */}
          {page === "hours" && (
            <WorkingHoursPage clinic={clinic} hours={hours} setHours={setHours} />
          )}

          {/* ═══ BRANCHES ═══ */}
          {page === "branches" && (
            <BranchesPage
              clinic={clinic}
              branches={branches}
              setBranches={setBranches}
              planContext={planContext}
              onRequestUpgrade={() => setShowUpgrade(true)}
            />
          )}

          {/* ═══ CLINIC INFO ═══ */}
          {page === "clinic" && (
            <ClinicInfoPage
              clinic={clinic}
              clinicEdit={clinicEdit}
              setClinicEdit={setClinicEdit}
              setClinic={setClinic}
              onClinicUpdate={onClinicUpdate}
              saved={saved}
              saving={saving}
              saveClinicInfo={saveClinicInfo}
            />
          )}

          {/* ═══ DOCTOR PROFILE ═══ */}
          {page === "doctor" && (
            <DoctorProfilePage
              clinic={clinic}
              doctors={doctors}
              setDoctors={setDoctors}
              doctorEdit={doctorEdit}
              setDoctorEdit={setDoctorEdit}
              planContext={planContext}
              onRequestUpgrade={() => setShowUpgrade(true)}
              saved={saved}
              saving={saving}
              saveDoctor={saveDoctor}
            />
          )}

          {/* ═══ DESIGN & THEME ═══ */}
          {page === "design" && (
            <DesignThemePage
              clinic={clinic}
              onClinicChange={updated => {
                setClinic(updated);
                setClinicEdit(updated);
                onClinicUpdate?.(updated);
              }}
            />
          )}

          {/* ═══ GALLERY ═══ */}
          {page === "media" && (
            <GalleryPage clinic={clinic} media={media} setMedia={setMedia} />
          )}

          {/* ═══ BLOG ═══ */}
          {page === "blog" && (
            <BlogPage clinic={clinic} planContext={planContext} onRequestUpgrade={() => setShowUpgrade(true)} />
          )}

          {/* ═══ SEO ═══ */}
          {page === "seo" && (
            <SeoPage clinic={clinic} hasRegNo={hasRegNo} />
          )}

          {/* ═══ PRESCRIPTIONS (Phase 4: EMR) ═══ */}
          {page === "prescriptions" && (
            <PermissionGate permission="view_medical_records">
              <PrescriptionPad clinicId={clinic.id} doctorId={doctorId} lockedToDoctor={role === "doctor"} />
            </PermissionGate>
          )}

          {/* ═══ BILLING (Phase 4: OPD invoicing) ═══ */}
          {page === "billing" && (
            <PermissionGate permission="manage_billing">
              <BillingForm clinicId={clinic.id} />
            </PermissionGate>
          )}

          {/* ═══ CROSS-CLINIC HISTORY (Phase 5: Health Locker) ═══ */}
          {page === "health-share" && (
            <PermissionGate permission="view_medical_records">
              <CrossClinicRequestPanel clinicId={clinic.id} />
            </PermissionGate>
          )}

          {/* ═══ STAFF (Phase 3: RBAC) ═══ */}
          {page === "staff" && (
            <PermissionGate permission="manage_staff">
              <StaffManagement clinicId={clinic.id} />
            </PermissionGate>
          )}

          {/* ═══ LIVE QUEUE (Phase 2) ═══ */}
          {page === "queue" && (
            <div>
              <div style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 13, color: "#94a3b8" }}>
                Show this on a lobby TV: <br />
                <code style={{ color: "#7dd3fc" }}>{`${window.location.origin}/${clinic.slug}/live?tv=1`}</code>
                {" · "}Patients can check it on their phone at{" "}
                <code style={{ color: "#7dd3fc" }}>{`${window.location.origin}/${clinic.slug}/live`}</code>
              </div>
              <ReceptionistDashboard clinicId={clinic.id} avgApptMinutesDefault={clinic.avg_appt_minutes_default || 15} />
            </div>
          )}

          {/* ═══ FEEDBACK (Phase 1: banner + review funnel) ═══ */}
          {page === "feedback" && (
            <div style={{ maxWidth: 640 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 16 }}>Site banner</h2>
              <BannerControl clinic={clinic} onUpdate={(updated) => { setClinic(updated); onClinicUpdate?.(updated); }} />

              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: "28px 0 16px" }}>Reviews</h2>
              <div style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 13, color: "#94a3b8" }}>
                Share this link (or a QR code linking to it) at your front desk: <br />
                <code style={{ color: "#7dd3fc" }}>{`${window.location.origin}/${clinic.slug}/feedback`}</code>
              </div>
              <div style={{ background: "white", borderRadius: 12, padding: 16 }}>
                <FeedbackInbox clinicId={clinic.id} />
              </div>
            </div>
          )}

          {/* ═══ COMPLIANCE ═══ */}
          {page === "compliance" && (
            <ComplianceTab
              clinic={clinic}
              doctor={doctor}
              onNavigate={setPage}/>
          )}

          {/* ═══ DOMAIN ═══ */}
          {page === "domain" && (
            planContext.canUseFeature("custom_domain")
              ? <DomainManager clinic={clinic}/>
              : <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 20px", textAlign:"center" }}>
                  <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
                  <div style={{ fontSize:18, fontWeight:700, color:"#e2e8f0", marginBottom:8 }}>Custom Domain — Premium Feature</div>
                  <div style={{ fontSize:14, color:"#64748b", maxWidth:380, lineHeight:1.7, marginBottom:24 }}>
                    Connect your own domain (e.g. <em>www.drsharma.com</em>) on the Premium or Enterprise plan.
                    Your clinic is currently live at <strong style={{ color:"#7dd3fc" }}>{clinic?.slug}.clinicsite.in</strong>
                  </div>
                  <button onClick={() => setShowUpgrade(true)} style={{
                    background:"#1565c0", color:"white", border:"none", borderRadius:10,
                    padding:"12px 28px", fontSize:14, fontWeight:600, cursor:"pointer",
                  }}>
                    ⭐ Upgrade to Premium — ₹499/mo
                  </button>
                </div>
          )}

          {/* ═══ PREVIEW ═══ */}
          {page === "preview" && (
            <PreviewPage
              clinic={clinic}
              hasRegNo={hasRegNo}
              handlePublish={handlePublish}
              publishing={publishing}
              publishMsg={publishMsg}
              onGoToDoctorTab={() => setPage("doctor")}
            />
          )}

        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <UpgradeModal
          clinic={clinic}
          user={user}
          onClose={() => setShowUpgrade(false)}
          onUpgraded={updated => {
            setClinic(updated);
            setClinicEdit(updated);
            onClinicUpdate?.(updated);
          }}/>
      )}
    </div>
  );
}