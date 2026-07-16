// src/components/OnboardingWizard.jsx
// Self-onboarding wizard — matches the "WaSpace Onboarding Flow" mockup
// and the "Onboarding Flow – Backend Overview" schema exactly:
//   1 Welcome  2 Clinic Type  3 Clinic Info  4 Location
//   5 Contact Details  6 Template Selection  7 Pages Selection  8 All Set
//
// Each step is saved to Supabase as the user completes it (draft clinic
// row created at step 2, updated on every step after), so onboarding is
// resumable via onboarding_step / onboarding_status — matching the
// not_started → in_progress → completed → website_ready state flow.
//
// Schema note: this reuses the LIVE `clinics` columns that already exist
// and are read elsewhere in the app (name, specialty, owner_id, slug,
// address, city, phone, email, whatsapp, about, is_published) rather than
// renaming them, and only writes to the NEW columns/tables added by
// supabase/migrations/20260715_onboarding_backend.sql (custom_clinic_type,
// specialization, tagline, pincode, state, country, contact_form_opt_in,
// template_id, template_style, onboarding_step, onboarding_status,
// completed_at, templates, clinic_pages). Run that migration first.

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { TEMPLATES as LOCAL_TEMPLATES } from "../templates";

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

const TOTAL_STEPS = 8;

// ── Clinic types (matches the mockup's step-2 grid exactly) ────────
const CLINIC_TYPES = [
  { key:"dental",  label:"Dental Clinic",       icon:"🦷", specialty:"Dental" },
  { key:"skin",    label:"Skin / Dermatology",  icon:"✨", specialty:"Dermatology" },
  { key:"eye",     label:"Eye Clinic",          icon:"👁️", specialty:"Ophthalmology" },
  { key:"physio",  label:"Physiotherapy",       icon:"💪", specialty:"Physiotherapy" },
  { key:"hair",    label:"Hair Clinic",         icon:"💇", specialty:"Hair" },
  { key:"other",   label:"Other",               icon:"⚙️", specialty:null },
];

// Keyword + default-services map, keyed by the underlying `specialty`
const SPECIALTY_DATA = {
  "Dental":          { keywords:["dentist","dental implants","root canal","teeth whitening","braces"],
                        services:["General Checkup & Cleaning","Teeth Whitening","Root Canal Treatment","Dental Implants","Braces & Aligners"] },
  "Dermatology":     { keywords:["skin specialist","acne treatment","hair fall","dermatologist"],
                        services:["Skin Consultation","Acne Treatment","Chemical Peel","Laser Therapy","Anti-Ageing Treatment"] },
  "Ophthalmology":   { keywords:["eye specialist","eye clinic","cataract","lasik"],
                        services:["Eye Checkup","Cataract Surgery","LASIK Consultation","Glaucoma Screening","Contact Lens Fitting"] },
  "Physiotherapy":   { keywords:["physiotherapist","back pain physio","sports injury","rehab"],
                        services:["Initial Assessment","Sports Injury Rehab","Back & Neck Pain Therapy","Post-Surgery Rehab","Home Physiotherapy"] },
  "Hair":            { keywords:["hair specialist","hair transplant","hair fall treatment"],
                        services:["Hair Consultation","Hair Fall Treatment","PRP Therapy","Hair Transplant Consultation"] },
  "General Practice":{ keywords:["general physician","family doctor","doctor near me"],
                        services:["General Consultation","Preventive Checkup","Health Certificates"] },
};

const PAGE_OPTIONS = [
  { key:"home",        label:"Home" },
  { key:"about",       label:"About Us" },
  { key:"services",    label:"Services" },
  { key:"doctors",     label:"Our Doctors" },
  { key:"gallery",     label:"Gallery" },
  { key:"testimonials",label:"Testimonials" },
  { key:"blog",        label:"Blog" },
  { key:"contact",     label:"Contact Us" },
];

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "clinic";
}

function generateSEO(clinic, services) {
  const sp   = SPECIALTY_DATA[clinic.specialty] || {};
  const kwds = (sp.keywords || []).map(k => `${k} ${clinic.city}`);
  return {
    meta_title:       `${clinic.name} | Best ${clinic.specialty} in ${clinic.city} | Book Appointment`,
    meta_description: `${clinic.name} – Expert ${(clinic.specialty || "").toLowerCase()} care in ${clinic.city}. ${services.slice(0,3).join(", ")}${services.length ? " & more." : ""} Book appointment online.`,
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

function Input({ value, onChange, placeholder, type="text", maxLength }) {
  const [focused, setFocused] = useState(false);
  return (
    <input type={type} value={value} maxLength={maxLength} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ width:"100%", padding:"11px 14px", background:"white",
        border:`1.5px solid ${focused ? BRAND.primary : BRAND.border}`, color:BRAND.text,
        borderRadius:9, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box",
        transition:"border-color .2s" }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width:"100%", padding:"11px 14px", background:"white", border:`1.5px solid ${BRAND.border}`,
        color:BRAND.text, borderRadius:9, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
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
        <button onClick={onBack} disabled={loading} style={{ padding:"12px 20px", background:"white", border:`1.5px solid ${BRAND.border}`, color:BRAND.text, borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
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
        {loading ? "Saving…" : nextLabel}
      </button>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────
export default function OnboardingWizard({ user, onComplete }) {
  const [step, setStep]       = useState(1);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);
  const [liveUrl, setLiveUrl] = useState("");
  const [clinicId, setClinicId] = useState(null);
  const [templateOptions, setTemplateOptions] = useState(
    Object.values(LOCAL_TEMPLATES).slice(0, 9).map(t => ({ id:null, style_key:t.id, name:t.name, desc:t.desc, icon:t.icon }))
  );

  const [data, setData] = useState({
    clinicType:        "",
    customClinicType:  "",
    clinicName:        "",
    specialization:    "",
    tagline:           "",
    address:           "",
    city:               "",
    pincode:           "",
    state:             "",
    country:           "India",
    phone:             "",
    email:             "",
    whatsapp:          "",
    contactFormOptIn:  true,
    template:          "",   // style_key
    templateDbId:      null, // uuid, if templates table is seeded
    pages: PAGE_OPTIONS.reduce((acc,p) => ({ ...acc, [p.key]: true }), {}),
  });

  const set = (key, val) => setData(p => ({ ...p, [key]: val }));

  const specialtyFor = () => {
    const ct = CLINIC_TYPES.find(c => c.key === data.clinicType);
    return ct?.specialty || "General Practice";
  };

  // Fetch live templates table; silently fall back to local template list
  // if the migration hasn't been run yet in this environment.
  useEffect(() => {
    (async () => {
      const { data: rows, error: err } = await supabase
        .from("templates").select("id,name,style_key,thumbnail_url").eq("is_active", true);
      if (!err && rows?.length) {
        setTemplateOptions(rows.map(r => {
          const local = Object.values(LOCAL_TEMPLATES).find(t => t.id === r.style_key);
          return { id:r.id, style_key:r.style_key, name:r.name, desc: local?.desc || "", icon: local?.icon || "🖼️" };
        }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Validation per step ─────────────────────────────────────────
  const canNext = () => {
    if (step === 2) return !!data.clinicType && (data.clinicType !== "other" || data.customClinicType.trim());
    if (step === 3) return data.clinicName.trim().length > 0;
    if (step === 4) return data.address.trim() && data.city.trim();
    if (step === 5) return data.phone.trim().length > 0;
    if (step === 6) return !!data.template;
    if (step === 7) return Object.values(data.pages).some(Boolean);
    return true;
  };

  // ── Persist the step just completed, in order (matches the
  //     /api/onboarding/step/* endpoints in the backend spec, done here
  //     as direct Supabase writes since this app talks to Supabase
  //     directly rather than through custom REST routes) ──────────────
  const persistStep = async (n) => {
    try {
      if (n === 2) {
        const tempSlug = `draft-${crypto.randomUUID().slice(0, 8)}`;
        const { data: row, error: err } = await supabase.from("clinics").insert({
          owner_id:            user.id,
          slug:                tempSlug,
          name:                tempSlug,
          city:                "", // NOT NULL in live schema — real value set at step 4 (Location)
          specialty:           specialtyFor(),
          custom_clinic_type:  data.clinicType === "other" ? data.customClinicType : null,
          onboarding_status:   "in_progress",
          onboarding_step:     2,
          is_published:        false,
        }).select().single();
        if (err) throw err;
        setClinicId(row.id);
        return true;
      }
      if (!clinicId) return true; // shouldn't happen past step 2, but don't crash

      const updates = { onboarding_step: n };
      if (n === 3) { updates.name = data.clinicName; updates.specialization = data.specialization; updates.tagline = data.tagline; }
      if (n === 4) { updates.address = data.address; updates.city = data.city; updates.pincode = data.pincode; updates.state = data.state; updates.country = data.country; }
      if (n === 5) { updates.phone = data.phone; updates.email = data.email; updates.whatsapp = data.whatsapp || data.phone; updates.contact_form_opt_in = data.contactFormOptIn; }
      if (n === 6) { updates.template_id = data.templateDbId; updates.template_style = data.template; }
      if (n === 7) {
        const rows = PAGE_OPTIONS.filter(p => data.pages[p.key]).map((p, i) => ({
          clinic_id: clinicId, page_key: p.key, page_label: p.label, is_selected: true, display_order: i,
        }));
        if (rows.length) {
          const { error: pagesErr } = await supabase.from("clinic_pages").upsert(rows, { onConflict: "clinic_id,page_key" });
          if (pagesErr) throw pagesErr;
        }
      }
      const { error: err } = await supabase.from("clinics").update(updates).eq("id", clinicId);
      if (err) throw err;
      return true;
    } catch (e) {
      setError(e.message || "Couldn't save this step. Please try again.");
      return false;
    }
  };

  const goNext = async (skipValidation = false) => {
    if (!skipValidation && !canNext()) return;
    setError("");
    setSaving(true);
    const ok = await persistStep(step);
    setSaving(false);
    if (ok) setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setError("");
    if (step === 1) return;
    setStep(s => s - 1);
  };

  // ── Final step: finalize slug, publish, seed defaults, generate SEO ─
  const handleFinish = async () => {
    setSaving(true);
    setError("");
    try {
      const specialty = specialtyFor();
      const finalSlug = slugify(data.clinicName);

      const { error: clinicErr } = await supabase.from("clinics").update({
        name:              data.clinicName,
        slug:              finalSlug,
        specialty,
        is_published:      true,
        onboarding_status: "completed",
        onboarding_step:   8,
        completed_at:      new Date().toISOString(),
        about:             data.tagline || `Expert ${specialty.toLowerCase()} care in ${data.city}.`,
      }).eq("id", clinicId);
      if (clinicErr) throw clinicErr;

      // Seed default services only if the owner kept the "Services" page.
      let seededServices = [];
      if (data.pages.services) {
        seededServices = (SPECIALTY_DATA[specialty]?.services || SPECIALTY_DATA["General Practice"].services);
        const serviceRows = seededServices.map((name, i) => ({ clinic_id: clinicId, name, is_active: true, sort_order: i }));
        await supabase.from("services").insert(serviceRows);
      }

      // Auto-generate SEO
      const seo = generateSEO({ name: data.clinicName, specialty, city: data.city, phone: data.phone }, seededServices);
      await supabase.from("seo_data").insert({ clinic_id: clinicId, ...seo });

      setLiveUrl(`${finalSlug}.waspace.in`);
      setDone(true);
      onComplete?.({ id: clinicId, slug: finalSlug, name: data.clinicName });
    } catch (e) {
      setError(e.message || "Something went wrong while publishing. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const skipLabel = step < TOTAL_STEPS ? () => goNext(true) : null;

  return (
    <Shell step={step} total={TOTAL_STEPS} onSkip={step < TOTAL_STEPS ? skipLabel : null}>

      {/* STEP 1: Welcome */}
      {step === 1 && (
        <div style={{ textAlign:"center", padding:"12px 0" }}>
          <div style={{ width:64, height:64, borderRadius:16, margin:"0 auto 22px", background:`linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryD})`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Pacifico','Segoe Script',cursive", fontSize:30, color:"white" }}>Wa</div>
          <h1 style={{ fontSize:24, fontWeight:800, color:BRAND.text, marginBottom:10 }}>Welcome to <span style={{ color:BRAND.primary }}>WaSpace</span></h1>
          <p style={{ fontSize:14, color:BRAND.sub, lineHeight:1.7, marginBottom:8, maxWidth:380, marginLeft:"auto", marginRight:"auto" }}>
            The easiest way for clinics to build beautiful, high-converting websites: no code, no hassle.
          </p>
        </div>
      )}

      {/* STEP 2: Clinic Type */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, color:BRAND.text, marginBottom:4 }}>What type of clinic do you run?</h2>
          <p style={{ fontSize:13.5, color:BRAND.sub, marginBottom:22 }}>This helps us personalize your website experience.</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom: data.clinicType === "other" ? 16 : 0 }}>
            {CLINIC_TYPES.map(ct => (
              <ChoiceCard key={ct.key} icon={ct.icon} label={ct.label} selected={data.clinicType === ct.key} onClick={() => set("clinicType", ct.key)} />
            ))}
          </div>
          {data.clinicType === "other" && (
            <div>
              <Label>Tell us what kind of clinic</Label>
              <Input value={data.customClinicType} onChange={v => set("customClinicType", v)} placeholder="e.g. Homeopathy Clinic" />
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Clinic Info */}
      {step === 3 && (
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, color:BRAND.text, marginBottom:4 }}>Tell us about your clinic</h2>
          <p style={{ fontSize:13.5, color:BRAND.sub, marginBottom:22 }}>Add basic information to get started.</p>
          <div style={{ marginBottom:16 }}>
            <Label>Clinic Name</Label>
            <Input value={data.clinicName} onChange={v => set("clinicName", v)} placeholder="e.g. Bright Smile Dental Clinic" />
          </div>
          <div style={{ marginBottom:16 }}>
            <Label>Specialization (Optional)</Label>
            <Input value={data.specialization} onChange={v => set("specialization", v)} placeholder="Cosmetic Dentistry, Implantology" />
          </div>
          <div>
            <Label>Tagline (Optional)</Label>
            <Input value={data.tagline} onChange={v => set("tagline", v)} maxLength={60} placeholder="Creating Healthy Smiles, Every Day 😊" />
            <div style={{ textAlign:"right", fontSize:11, color:"#B4B9D6", marginTop:4 }}>{data.tagline.length}/60</div>
          </div>
        </div>
      )}

      {/* STEP 4: Location */}
      {step === 4 && (
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
              <Select value={data.country} onChange={v => set("country", v)} options={["India"]} />
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Contact Details */}
      {step === 5 && (
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
            <input type="checkbox" checked={data.contactFormOptIn} onChange={e => set("contactFormOptIn", e.target.checked)} />
            Yes, I want a contact form on my website
          </label>
        </div>
      )}

      {/* STEP 6: Template Selection */}
      {step === 6 && (
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, color:BRAND.text, marginBottom:4 }}>Choose your template</h2>
          <p style={{ fontSize:13.5, color:BRAND.sub, marginBottom:22 }}>You can change it anytime later.</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
            {templateOptions.map(t => (
              <button key={t.style_key} onClick={() => { set("template", t.style_key); set("templateDbId", t.id); }} style={{
                borderRadius:12, overflow:"hidden", cursor:"pointer", textAlign:"left", fontFamily:"inherit", padding:0,
                background:"white", border:`1.5px solid ${data.template === t.style_key ? BRAND.primary : BRAND.border}`,
                position:"relative",
              }}>
                {data.template === t.style_key && (
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

      {/* STEP 7: Pages Selection */}
      {step === 7 && (
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, color:BRAND.text, marginBottom:4 }}>What pages do you need?</h2>
          <p style={{ fontSize:13.5, color:BRAND.sub, marginBottom:22 }}>We'll create these pages for your website.</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {PAGE_OPTIONS.map(p => (
              <label key={p.key} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13.5, color:BRAND.text, cursor:"pointer" }}>
                <input type="checkbox" checked={data.pages[p.key]} onChange={e => set("pages", { ...data.pages, [p.key]: e.target.checked })} />
                {p.label}
              </label>
            ))}
          </div>
          <p style={{ fontSize:12, color:"#B4B9D6", marginTop:16 }}>You can add or remove pages anytime.</p>
        </div>
      )}

      {/* STEP 8: All Set */}
      {step === 8 && !done && (
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, color:BRAND.text, marginBottom:4 }}>Review &amp; launch</h2>
          <p style={{ fontSize:13.5, color:BRAND.sub, marginBottom:18 }}>We'll build your website in a few seconds.</p>
          <div style={{ background:BRAND.bg, border:`1px solid ${BRAND.border}`, borderRadius:12, padding:16, marginBottom:20 }}>
            {[
              ["Clinic", data.clinicName],
              ["Type", CLINIC_TYPES.find(c => c.key === data.clinicType)?.label || data.customClinicType],
              ["City", data.city],
              ["Template", templateOptions.find(t => t.style_key === data.template)?.name || "—"],
              ["Pages", `${Object.values(data.pages).filter(Boolean).length} pages`],
              ["Your URL", `${slugify(data.clinicName || "your-clinic")}.waspace.in`],
            ].map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${BRAND.border}`, fontSize:12.5 }}>
                <span style={{ color:BRAND.sub }}>{k}</span>
                <span style={{ color:BRAND.text, fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 8 && done && (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
          <h1 style={{ fontSize:22, fontWeight:800, color:BRAND.text, marginBottom:8 }}>You're all set!</h1>
          <p style={{ color:BRAND.sub, fontSize:14, marginBottom:22, lineHeight:1.6 }}>{data.clinicName} is live and searchable on Google.</p>
          <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.25)", borderRadius:12, padding:"16px 20px", marginBottom:22 }}>
            <div style={{ fontSize:11, color:BRAND.green, fontWeight:700, letterSpacing:1, marginBottom:6 }}>YOUR LIVE URL</div>
            <div style={{ fontSize:16, fontWeight:700, color:BRAND.green }}>🌐 {liveUrl}</div>
          </div>
          <button onClick={() => onComplete?.()} style={{ width:"100%", padding:"13px", background:BRAND.primary, border:"none", borderRadius:10, color:"white", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 8px 20px rgba(91,92,235,0.28)" }}>
            Go to Admin Panel →
          </button>
        </div>
      )}

      {error && step !== 8 && (
        <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#EF4444", marginTop:16 }}>
          ⚠️ {error}
        </div>
      )}
      {error && step === 8 && !done && (
        <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#EF4444", marginBottom:16 }}>
          ⚠️ {error}
        </div>
      )}

      {!done && (
        <NavRow
          onBack={step > 1 ? goBack : null}
          onNext={step < TOTAL_STEPS ? () => goNext(false) : handleFinish}
          nextLabel={step === 1 ? "Get Started →" : step < TOTAL_STEPS ? "Next →" : "🚀 Create My Website"}
          nextDisabled={step > 1 && step < TOTAL_STEPS && !canNext()}
          loading={saving}
        />
      )}
    </Shell>
  );
}
