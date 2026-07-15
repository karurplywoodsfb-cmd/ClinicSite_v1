// src/components/OnboardingWizard.jsx
// Self-onboarding wizard — replaces manual seed SQL
// New clinic owner signs up → answers a few steps → site is live
// Saves everything to Supabase automatically
//
// Visual design follows the WaSpace onboarding mockup: a single centered
// card, numbered step badge + progress bar, light lavender background.

import { useState } from "react";
import { usePlanEnforcement } from "../hooks/usePlanEnforcement";
import { PlanUpgradeModal } from "./PlanUpgradeModal";
import { supabase } from "../lib/supabase";
import { TEMPLATES } from "../templates";

// ── Brand tokens ─────────────────────────────────────────────────
const BRAND = {
  primary:  "#5B5CEB",
  primaryD: "#4645C7",
  navy:     "#1E2A44",
  green:    "#22C55E",
  gold:     "#D4AF37",
  bg:       "#F6F8FC",
  border:   "#E7E9F3",
  text:     "#1E2A44",
  sub:      "#64748B",
};

// ── Specialty → keyword map ───────────────────────────────────────
const SPECIALTY_DATA = {
  "Dental":          { icon: "🦷", keywords: ["dentist","dental implants","root canal","teeth whitening","braces"] },
  "Dermatology":     { icon: "✨", keywords: ["skin specialist","acne treatment","hair fall","dermatologist"] },
  "Pediatrics":      { icon: "👶", keywords: ["child specialist","pediatrician","vaccination","baby doctor"] },
  "General Practice":{ icon: "🏥", keywords: ["general physician","family doctor","fever","doctor near me"] },
  "Orthopedics":     { icon: "🦴", keywords: ["ortho doctor","knee pain","back pain","joint replacement"] },
  "Gynecology":      { icon: "🌸", keywords: ["gynecologist","women doctor","pregnancy","lady doctor"] },
  "Ophthalmology":   { icon: "👁️", keywords: ["eye specialist","eye clinic","cataract","lasik"] },
  "Cardiology":      { icon: "❤️", keywords: ["cardiologist","heart specialist","chest pain","ecg"] },
  "Physiotherapy":   { icon: "💪", keywords: ["physiotherapist","back pain physio","sports injury","rehab"] },
  "ENT":             { icon: "👂", keywords: ["ent specialist","ear nose throat","tonsil","hearing clinic"] },
  "Ayurveda":        { icon: "🌿", keywords: ["ayurvedic doctor","natural treatment","herbal","panchakarma"] },
  "Homeopathy":      { icon: "💊", keywords: ["homeopathy doctor","chronic disease","allergy","homeopathic"] },
};

const DEFAULT_SERVICES = {
  "Dental":          ["General Checkup & Cleaning","Teeth Whitening","Root Canal Treatment","Dental Implants","Braces & Aligners","Tooth Extraction","Kids Dentistry","Dentures & Crowns"],
  "Dermatology":     ["Skin Consultation","Acne Treatment","Hair Fall Treatment","Chemical Peel","Laser Therapy","Mole Removal","Anti-Ageing Treatment","Skin Allergy"],
  "Pediatrics":      ["Well Baby Checkup","Vaccination","Fever & Infections","Growth Monitoring","Nutritional Advice","Newborn Care","Child Development","Adolescent Health"],
  "General Practice":["General Consultation","Fever & Cold","Blood Pressure","Diabetes Management","Preventive Checkup","Minor Procedures","Health Certificates","Wound Care"],
  "Orthopedics":     ["Joint Pain Consultation","Knee Replacement","Hip Replacement","Spine Surgery","Fracture Treatment","Sports Injury","Arthritis Management","Physiotherapy"],
  "Gynecology":      ["Antenatal Checkup","Delivery Services","Ultrasound Scan","PCOS Treatment","Fertility Counselling","Menstrual Disorders","Family Planning","Laparoscopy"],
};

const SERVICE_ICONS = {
  "General Checkup & Cleaning":"🔬","Teeth Whitening":"✨","Root Canal Treatment":"🦷",
  "Dental Implants":"🔩","Braces & Aligners":"😁","Tooth Extraction":"💨",
  "Kids Dentistry":"👶","Dentures & Crowns":"👑","Skin Consultation":"🔍",
  "Acne Treatment":"✨","Hair Fall Treatment":"💆","default":"🏥",
};

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function generateSEO(clinic, services) {
  const sp   = SPECIALTY_DATA[clinic.specialty] || {};
  const kwds = (sp.keywords || []).map(k => `${k} ${clinic.city}`);
  return {
    meta_title:       `${clinic.name} | Best ${clinic.specialty} in ${clinic.city} | Book Appointment`,
    meta_description: `${clinic.name} – Expert ${clinic.specialty.toLowerCase()} care in ${clinic.city}. ${services.slice(0,3).join(", ")} & more. Book appointment online.`,
    keywords:         kwds,
    score:            88,
    schema_json: {
      "@context": "https://schema.org",
      "@type": ["MedicalClinic","LocalBusiness"],
      "name": clinic.name,
      "medicalSpecialty": clinic.specialty,
      "address": { "@type":"PostalAddress", "addressLocality": clinic.city, "addressCountry":"IN" },
      "telephone": clinic.phone,
      "availableService": services.map(s => ({ "@type":"MedicalProcedure","name":s })),
    },
  };
}

// ── Shared UI primitives ────────────────────────────────────────

function Label({ children }) {
  return <div style={{ fontSize:13, fontWeight:600, color:BRAND.text, marginBottom:8 }}>{children}</div>;
}

function Input({ value, onChange, placeholder, type="text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ width:"100%", padding:"11px 14px", background:"white",
        border:`1.5px solid ${focused ? BRAND.primary : BRAND.border}`, color:BRAND.text,
        borderRadius:9, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box",
        transition:"border-color .2s" }}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows=3 }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width:"100%", padding:"11px 14px", background:"white", border:`1.5px solid ${BRAND.border}`,
        color:BRAND.text, borderRadius:9, fontSize:14, fontFamily:"inherit", outline:"none",
        boxSizing:"border-box", resize:"vertical", lineHeight:1.6 }} />
  );
}

function ChoiceCard({ selected, icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:"16px 10px", borderRadius:12, cursor:"pointer", textAlign:"center", fontFamily:"inherit",
      background: selected ? "rgba(91,92,235,0.08)" : "white",
      border: `1.5px solid ${selected ? BRAND.primary : BRAND.border}`,
      color: selected ? BRAND.primary : BRAND.sub,
      position:"relative", transition:"all .15s",
    }}>
      {selected && (
        <div style={{ position:"absolute", top:8, right:8, width:16, height:16, borderRadius:"50%",
          background:BRAND.primary, color:"white", fontSize:10, display:"flex", alignItems:"center", justifyContent:"center" }}>✓</div>
      )}
      <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:12, fontWeight:600 }}>{label}</div>
    </button>
  );
}

function Progress({ step, total }) {
  return (
    <div style={{ display:"flex", gap:5, flex:1, margin:"0 14px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ height:5, flex:1, borderRadius:99, background: i < step ? BRAND.primary : BRAND.border, transition:"background .3s" }} />
      ))}
    </div>
  );
}

// Every step (except welcome/done) is wrapped in this card shell.
function Shell({ step, total, onSkip, children }) {
  return (
    <div style={{ minHeight:"100vh", background:BRAND.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`@keyframes waFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ width:"100%", maxWidth:600, background:"white", borderRadius:20, border:`1px solid ${BRAND.border}`, boxShadow:"0 24px 60px rgba(30,42,68,0.10)", padding:32, animation:"waFadeUp .3s ease both" }}>
        <div style={{ display:"flex", alignItems:"center", marginBottom:28 }}>
          <div style={{ width:30, height:30, borderRadius:"50%", background:BRAND.primary, color:"white", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{step}</div>
          <Progress step={step} total={total} />
          {onSkip && <button onClick={onSkip} style={{ background:"none", border:"none", color:BRAND.sub, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Skip</button>}
        </div>
        {children}
      </div>
    </div>
  );
}

function NavRow({ onBack, onNext, nextLabel="Next →", nextDisabled=false, loading=false }) {
  return (
    <div style={{ display:"flex", gap:12, marginTop:28 }}>
      {onBack && (
        <button onClick={onBack} style={{ padding:"12px 20px", background:"white", border:`1.5px solid ${BRAND.border}`, color:BRAND.text, borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
          Back
        </button>
      )}
      <button onClick={onNext} disabled={nextDisabled || loading} style={{
        flex:1, padding:"12px", borderRadius:10, fontSize:14, fontWeight:700, fontFamily:"inherit",
        border:"none", color:"white",
        background: (nextDisabled || loading) ? "#C7CCE8" : BRAND.primary,
        cursor: (nextDisabled || loading) ? "not-allowed" : "pointer",
        boxShadow: (nextDisabled || loading) ? "none" : "0 8px 20px rgba(91,92,235,0.28)",
        transition:"all .2s",
      }}>
        {loading ? "Working…" : nextLabel}
      </button>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────
// Step numbering (matches the WaSpace onboarding flow — welcome and the
// final success screen sit outside the numbered progress bar):
//   1 Clinic type   2 Clinic details   3 Location   4 Contact
//   5 Doctor        6 Template         7 Services   8 Hours & launch
const TOTAL_STEPS = 8;

export default function OnboardingWizard({ user, onComplete }) {
  const [started, setStarted] = useState(false);
  const [step, setStep]       = useState(1);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);
  const [liveUrl, setLiveUrl] = useState("");
  const { limits } = usePlanEnforcement();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");

  const maxServices = typeof limits?.features?.services === "number" ? limits.features.services : 5;

  const [data, setData] = useState({
    clinicName:   "",
    specialty:    "",
    tagline:      "",
    city:         "",
    pincode:      "",
    state:        "",
    address:      "",
    phone:        "",
    whatsapp:     "",
    email:        "",
    wantsContactForm: true,
    doctorName:   "",
    doctorDegree: "",
    doctorSpec:   "",
    doctorExp:    "",
    doctorBio:    "",
    template:     "",
    services:     [],
    hours: {
      Monday: { open:"09:00", close:"20:00", closed:false },
      Tuesday: { open:"09:00", close:"20:00", closed:false },
      Wednesday: { open:"09:00", close:"20:00", closed:false },
      Thursday: { open:"09:00", close:"20:00", closed:false },
      Friday: { open:"09:00", close:"20:00", closed:false },
      Saturday: { open:"09:00", close:"18:00", closed:false },
      Sunday: { open:"", close:"", closed:true },
    },
    about: "",
  });

  const set = (key, val) => setData(p => ({ ...p, [key]: val }));

  // ── Validation per step ─────────────────────────────────────────
  const canNext = () => {
    if (step === 1) return !!data.specialty;
    if (step === 2) return data.clinicName.trim().length > 0;
    if (step === 3) return data.address.trim() && data.city.trim();
    if (step === 4) return data.phone.trim().length > 0;
    if (step === 5) return data.doctorName.trim() && data.doctorDegree.trim();
    if (step === 6) return !!data.template;
    if (step === 7) return data.services.length > 0;
    return true;
  };

  // ── Save everything to Supabase ─────────────────────────────────
  const handleFinish = async () => {
    setSaving(true);
    setError("");
    try {
      const slug = slugify(data.clinicName);
      const fullAddress = [data.address, data.pincode, data.state].filter(Boolean).join(", ");

      // 1. Insert clinic
      const { data: clinic, error: clinicErr } = await supabase
        .from("clinics")
        .insert({
          owner_id:   user.id,
          slug,
          name:       data.clinicName,
          specialty:  data.specialty,
          city:       data.city,
          phone:      data.phone,
          whatsapp:   data.whatsapp || data.phone,
          email:      data.email,
          address:    fullAddress,
          about:      data.about || data.tagline || `Expert ${data.specialty.toLowerCase()} care in ${data.city}.`,
          plan:       "free",
          is_published: true,
        })
        .select()
        .single();
      if (clinicErr) throw clinicErr;

      // 2. Insert doctor
      if (data.doctorName) {
        await supabase.from("doctors").insert({
          clinic_id:      clinic.id,
          name:           data.doctorName,
          degree:         data.doctorDegree,
          specialization: data.doctorSpec || data.specialty,
          experience:     data.doctorExp,
          bio:            data.doctorBio,
        });
      }

      // 3. Insert services
      const serviceRows = data.services.map((name, i) => ({
        clinic_id:  clinic.id,
        name,
        icon:       SERVICE_ICONS[name] || SERVICE_ICONS.default,
        is_active:  true,
        sort_order: i,
      }));
      if (serviceRows.length) await supabase.from("services").insert(serviceRows);

      // 4. Insert working hours
      const hourRows = Object.entries(data.hours).map(([day, h]) => ({
        clinic_id:  clinic.id,
        day,
        open_time:  h.closed ? null : h.open,
        close_time: h.closed ? null : h.close,
        is_closed:  h.closed,
      }));
      await supabase.from("working_hours").insert(hourRows);

      // 5. Auto-generate + insert SEO
      const seo = generateSEO({ name: data.clinicName, specialty: data.specialty, city: data.city, phone: data.phone }, data.services);
      await supabase.from("seo_data").insert({ clinic_id: clinic.id, ...seo });

      // NOTE: data.template ("chosen template id") is currently not persisted —
      // the `clinics` table has no template/theme column in the live schema yet.
      // Once that column exists, add `template: data.template` to the insert above.

      const url = `${slug}.waspace.in`;
      setLiveUrl(url);
      setDone(true);
      onComplete?.(clinic);

    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── WELCOME screen ──────────────────────────────────────────────
  if (!started) {
    return (
      <div style={{ minHeight:"100vh", background:BRAND.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'DM Sans',sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <div style={{ width:"100%", maxWidth:440, background:"white", borderRadius:20, border:`1px solid ${BRAND.border}`, boxShadow:"0 24px 60px rgba(30,42,68,0.10)", padding:40, textAlign:"center" }}>
          <div style={{ width:64, height:64, borderRadius:16, margin:"0 auto 22px", background:`linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryD})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Pacifico','Segoe Script',cursive", fontSize:30, color:"white" }}>Wa</div>
          <h1 style={{ fontSize:24, fontWeight:800, color:BRAND.text, marginBottom:10 }}>Welcome to <span style={{ color:BRAND.primary }}>WaSpace</span></h1>
          <p style={{ fontSize:14, color:BRAND.sub, lineHeight:1.7, marginBottom:28 }}>
            The easiest way for clinics to build beautiful, high-converting websites — no code, no hassle.
          </p>
          <button onClick={() => setStarted(true)} style={{ width:"100%", padding:"13px", background:BRAND.primary, border:"none", borderRadius:10, color:"white", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 8px 20px rgba(91,92,235,0.28)" }}>
            Get Started →
          </button>
        </div>
      </div>
    );
  }

  // ── DONE screen ─────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ minHeight:"100vh", background:BRAND.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", padding:24 }}>
        <div style={{ maxWidth:480, width:"100%", background:"white", borderRadius:20, border:`1px solid ${BRAND.border}`, boxShadow:"0 24px 60px rgba(30,42,68,0.10)", padding:40, textAlign:"center" }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
          <h1 style={{ fontSize:24, fontWeight:800, color:BRAND.text, marginBottom:8 }}>You're all set!</h1>
          <p style={{ color:BRAND.sub, fontSize:14, marginBottom:26, lineHeight:1.6 }}>
            {data.clinicName} is now live and searchable on Google.
          </p>
          <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.25)", borderRadius:12, padding:"16px 20px", marginBottom:24 }}>
            <div style={{ fontSize:11, color:BRAND.green, fontWeight:700, letterSpacing:1, marginBottom:6 }}>YOUR LIVE URL</div>
            <div style={{ fontSize:17, fontWeight:700, color:BRAND.green }}>🌐 {liveUrl}</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:26 }}>
            {[
              ["🔍","SEO Configured","Auto-applied for " + data.city],
              ["📅","Booking Ready","Patients can book online"],
              ["💬","WhatsApp Active","One-tap patient contact"],
              ["📊","Admin Panel","Manage everything"],
            ].map(([icon,title,sub]) => (
              <div key={title} style={{ background:BRAND.bg, border:`1px solid ${BRAND.border}`, borderRadius:10, padding:"14px 12px", textAlign:"left" }}>
                <div style={{ fontSize:20, marginBottom:6 }}>{icon}</div>
                <div style={{ fontSize:13, fontWeight:600, color:BRAND.text }}>{title}</div>
                <div style={{ fontSize:11, color:BRAND.sub }}>{sub}</div>
              </div>
            ))}
          </div>
          <button onClick={() => onComplete?.()} style={{ width:"100%", padding:"13px", background:BRAND.primary, border:"none", borderRadius:10, color:"white", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 8px 20px rgba(91,92,235,0.28)" }}>
            Go to Admin Panel →
          </button>
        </div>
      </div>
    );
  }

  // ── Wizard steps ─────────────────────────────────────────────────
  return (
    <>
      <Shell step={step} total={TOTAL_STEPS} onSkip={step < TOTAL_STEPS ? () => setStep(s => Math.min(s + 1, TOTAL_STEPS)) : null}>

        {/* STEP 1: Clinic type */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize:22, fontWeight:800, color:BRAND.text, marginBottom:4 }}>What type of clinic do you run?</h2>
            <p style={{ fontSize:13.5, color:BRAND.sub, marginBottom:22 }}>This helps us personalize your website experience.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
              {Object.entries(SPECIALTY_DATA).map(([sp, info]) => (
                <ChoiceCard key={sp} icon={info.icon} label={sp} selected={data.specialty === sp} onClick={() => set("specialty", sp)} />
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Clinic details */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize:22, fontWeight:800, color:BRAND.text, marginBottom:4 }}>Tell us about your clinic</h2>
            <p style={{ fontSize:13.5, color:BRAND.sub, marginBottom:22 }}>Add basic information to get started.</p>
            <div style={{ marginBottom:16 }}>
              <Label>Clinic Name</Label>
              <Input value={data.clinicName} onChange={v => set("clinicName", v)} placeholder="e.g. Bright Smile Dental Clinic" />
            </div>
            <div style={{ marginBottom:16 }}>
              <Label>Specialization (Optional)</Label>
              <Input value={data.doctorSpec} onChange={v => set("doctorSpec", v)} placeholder="Cosmetic Dentistry, Implantology" />
            </div>
            <div>
              <Label>Tagline (Optional)</Label>
              <Input value={data.tagline} onChange={v => set("tagline", v.slice(0,60))} placeholder="Creating Healthy Smiles, Every Day 😊" />
              <div style={{ textAlign:"right", fontSize:11, color:"#B4B9D6", marginTop:4 }}>{data.tagline.length}/60</div>
            </div>
          </div>
        )}

        {/* STEP 3: Location */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize:22, fontWeight:800, color:BRAND.text, marginBottom:4 }}>Where is your clinic located?</h2>
            <p style={{ fontSize:13.5, color:BRAND.sub, marginBottom:22 }}>This helps us show your location on the website.</p>
            <div style={{ marginBottom:16 }}>
              <Label>Address</Label>
              <Input value={data.address} onChange={v => set("address", v)} placeholder="123, Anna Salai, T. Nagar" />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
              <div>
                <Label>City</Label>
                <Input value={data.city} onChange={v => set("city", v)} placeholder="Chennai" />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input value={data.pincode} onChange={v => set("pincode", v)} placeholder="600017" />
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div>
                <Label>State</Label>
                <Input value={data.state} onChange={v => set("state", v)} placeholder="Tamil Nadu" />
              </div>
              <div>
                <Label>Country</Label>
                <Input value="India" onChange={() => {}} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Contact */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize:22, fontWeight:800, color:BRAND.text, marginBottom:4 }}>Add your contact details</h2>
            <p style={{ fontSize:13.5, color:BRAND.sub, marginBottom:22 }}>These details will be visible on your website.</p>
            <div style={{ marginBottom:16 }}>
              <Label>Phone Number</Label>
              <Input value={data.phone} onChange={v => set("phone", v)} placeholder="98765 43210" type="tel" />
            </div>
            <div style={{ marginBottom:16 }}>
              <Label>Email Address</Label>
              <Input value={data.email} onChange={v => set("email", v)} placeholder="info@brightsmiledental.com" type="email" />
            </div>
            <div style={{ marginBottom:16 }}>
              <Label>WhatsApp Number (Optional)</Label>
              <Input value={data.whatsapp} onChange={v => set("whatsapp", v)} placeholder="98765 43210" type="tel" />
            </div>
            <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:BRAND.text, cursor:"pointer" }}>
              <input type="checkbox" checked={data.wantsContactForm} onChange={e => set("wantsContactForm", e.target.checked)} />
              Yes, I want a contact form on my website
            </label>
          </div>
        )}

        {/* STEP 5: Doctor */}
        {step === 5 && (
          <div>
            <h2 style={{ fontSize:22, fontWeight:800, color:BRAND.text, marginBottom:4 }}>Doctor profile</h2>
            <p style={{ fontSize:13.5, color:BRAND.sub, marginBottom:22 }}>Builds patient trust. You can add more doctors later.</p>
            {[
              ["Doctor's Full Name","doctorName","Dr. Ramesh Kumar"],
              ["Degree / Qualification","doctorDegree","BDS, MDS – Periodontology"],
              ["Years of Experience","doctorExp","12 Years"],
            ].map(([label, key, placeholder]) => (
              <div key={key} style={{ marginBottom:16 }}>
                <Label>{label}</Label>
                <Input value={data[key]} onChange={v => set(key, v)} placeholder={placeholder} />
              </div>
            ))}
            <div>
              <Label>Short Bio</Label>
              <TextArea value={data.doctorBio} onChange={v => set("doctorBio", v)} placeholder="Brief background about the doctor's experience and expertise…" />
            </div>
          </div>
        )}

        {/* STEP 6: Template */}
        {step === 6 && (
          <div>
            <h2 style={{ fontSize:22, fontWeight:800, color:BRAND.text, marginBottom:4 }}>Choose your template</h2>
            <p style={{ fontSize:13.5, color:BRAND.sub, marginBottom:22 }}>You can change it anytime later.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              {Object.values(TEMPLATES).slice(0, 6).map(t => (
                <button key={t.id} onClick={() => set("template", t.id)} style={{
                  borderRadius:12, overflow:"hidden", cursor:"pointer", textAlign:"left", fontFamily:"inherit", padding:0,
                  background:"white", border:`1.5px solid ${data.template === t.id ? BRAND.primary : BRAND.border}`,
                  position:"relative",
                }}>
                  {data.template === t.id && (
                    <div style={{ position:"absolute", top:6, right:6, width:16, height:16, borderRadius:"50%", background:BRAND.primary, color:"white", fontSize:10, display:"flex", alignItems:"center", justifyContent:"center", zIndex:1 }}>✓</div>
                  )}
                  <div style={{ height:56, background:`linear-gradient(135deg, ${BRAND.navy}, ${BRAND.primary})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{t.icon}</div>
                  <div style={{ padding:"8px 10px" }}>
                    <div style={{ fontSize:11.5, fontWeight:700, color:BRAND.text }}>{t.name}</div>
                    <div style={{ fontSize:10, color:BRAND.sub }}>{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 7: Services */}
        {step === 7 && (
          <div>
            <h2 style={{ fontSize:22, fontWeight:800, color:BRAND.text, marginBottom:4 }}>Select your services</h2>
            <p style={{ fontSize:13.5, color:BRAND.sub, marginBottom:22 }}>Choose what you offer. You can add more from the admin panel.</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {(DEFAULT_SERVICES[data.specialty] || DEFAULT_SERVICES["General Practice"]).map(svc => {
                const selected = data.services.includes(svc);
                const atLimit = data.services.length >= maxServices && !selected;
                return (
                  <button key={svc} onClick={() => {
                    if (atLimit) { setUpgradeFeature("services"); setShowUpgrade(true); return; }
                    set("services", selected ? data.services.filter(s => s !== svc) : [...data.services, svc]);
                  }} style={{
                    display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, cursor:"pointer", fontFamily:"inherit", textAlign:"left",
                    background: selected ? "rgba(91,92,235,0.08)" : "white",
                    border:`1.5px solid ${selected ? BRAND.primary : BRAND.border}`,
                  }}>
                    <div style={{ width:20, height:20, borderRadius:6, background: selected ? BRAND.primary : BRAND.bg, color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, flexShrink:0 }}>
                      {selected ? "✓" : ""}
                    </div>
                    <span style={{ fontSize:13, color: selected ? BRAND.primary : BRAND.text, fontWeight: selected ? 600 : 400 }}>{svc}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop:12, fontSize:12, color: data.services.length >= maxServices ? "#EF4444" : BRAND.sub }}>
              {data.services.length} of {maxServices > 100000 ? "Unlimited" : maxServices} selected
            </div>
          </div>
        )}

        {/* STEP 8: Hours + about + review + launch */}
        {step === 8 && (
          <div>
            <h2 style={{ fontSize:22, fontWeight:800, color:BRAND.text, marginBottom:4 }}>Working hours & final details</h2>
            <p style={{ fontSize:13.5, color:BRAND.sub, marginBottom:18 }}>Shown on your website, then we'll build it.</p>

            {Object.entries(data.hours).map(([day, h]) => (
              <div key={day} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${BRAND.border}` }}>
                <div style={{ width:88, fontSize:12.5, color: h.closed ? "#B4B9D6" : BRAND.text, flexShrink:0 }}>{day}</div>
                {h.closed ? (
                  <div style={{ flex:1, fontSize:12.5, color:"#EF4444" }}>Closed</div>
                ) : (
                  <div style={{ display:"flex", gap:6, alignItems:"center", flex:1 }}>
                    <input type="time" value={h.open} onChange={e => set("hours",{...data.hours,[day]:{...h,open:e.target.value}})}
                      style={{ background:"white", border:`1px solid ${BRAND.border}`, color:BRAND.text, borderRadius:7, padding:"5px 8px", fontSize:12, outline:"none", width:92 }} />
                    <span style={{ color:"#B4B9D6", fontSize:12 }}>to</span>
                    <input type="time" value={h.close} onChange={e => set("hours",{...data.hours,[day]:{...h,close:e.target.value}})}
                      style={{ background:"white", border:`1px solid ${BRAND.border}`, color:BRAND.text, borderRadius:7, padding:"5px 8px", fontSize:12, outline:"none", width:92 }} />
                  </div>
                )}
                <button onClick={() => set("hours",{...data.hours,[day]:{...h,closed:!h.closed}})}
                  style={{ background: h.closed ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)", border:`1px solid ${h.closed?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.25)"}`, color: h.closed ? BRAND.green : "#EF4444", borderRadius:7, padding:"4px 10px", fontSize:10.5, cursor:"pointer", fontFamily:"inherit", fontWeight:600, whiteSpace:"nowrap" }}>
                  {h.closed ? "Set Open" : "Close"}
                </button>
              </div>
            ))}

            <div style={{ margin:"18px 0" }}>
              <Label>About Your Clinic (Optional)</Label>
              <TextArea value={data.about} onChange={v => set("about", v)}
                placeholder={`e.g. ${data.clinicName || "Your clinic"} has been serving ${data.city || "your city"} with expert care for over 10 years…`} />
            </div>

            <div style={{ background:BRAND.bg, border:`1px solid ${BRAND.border}`, borderRadius:12, padding:16, marginBottom:20 }}>
              <div style={{ fontSize:11, color:BRAND.sub, fontWeight:700, letterSpacing:1, marginBottom:10 }}>REVIEW YOUR SETUP</div>
              {[
                ["Clinic", data.clinicName],
                ["Specialty", `${SPECIALTY_DATA[data.specialty]?.icon || ""} ${data.specialty}`],
                ["City", data.city],
                ["Doctor", data.doctorName],
                ["Services", `${data.services.length} services`],
                ["Your URL", `${slugify(data.clinicName || "your-clinic")}.waspace.in`],
              ].map(([k,v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${BRAND.border}`, fontSize:12.5 }}>
                  <span style={{ color:BRAND.sub }}>{k}</span>
                  <span style={{ color:BRAND.text, fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#EF4444", marginBottom:16 }}>
                ⚠️ {error}
              </div>
            )}
          </div>
        )}

        <NavRow
          onBack={step > 1 ? () => setStep(s => s - 1) : () => setStarted(false)}
          onNext={step < TOTAL_STEPS ? () => canNext() && setStep(s => s + 1) : handleFinish}
          nextLabel={step < TOTAL_STEPS ? "Next →" : "🚀 Create My Website"}
          nextDisabled={!canNext()}
          loading={saving}
        />
      </Shell>

      <PlanUpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        requiredPlan="premium"
        featureName={upgradeFeature}
      />
    </>
  );
}
