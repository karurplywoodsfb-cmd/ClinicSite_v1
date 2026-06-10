// src/components/OnboardingWizard.jsx
// Self-onboarding wizard — replaces manual seed SQL
// New clinic owner signs up → answers 6 steps → site is live
// Saves everything to Supabase automatically

import { useState } from "react";
import { supabase } from "../lib/supabase";

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

// ── Step components ───────────────────────────────────────────────

function StepWrap({ children }) {
  return (
    <div style={{ animation: "fadeUp .35s ease both" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize:11, fontFamily:"monospace", fontWeight:700, letterSpacing:1, color:"#64748b", textTransform:"uppercase", marginBottom:8 }}>{children}</div>;
}

function Input({ value, onChange, placeholder, type="text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.05)", border:`1.5px solid ${focused?"rgba(21,101,192,0.6)":"rgba(255,255,255,0.1)"}`, color:"#e2e8f0", borderRadius:9, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box", transition:"border-color .2s" }}
    />
  );
}

// ── Main wizard ───────────────────────────────────────────────────

const TOTAL_STEPS = 6;

export default function OnboardingWizard({ user, onComplete }) {
  const [step, setStep]     = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [done, setDone]     = useState(false);
  const [liveUrl, setLiveUrl] = useState("");

  const [data, setData] = useState({
    // Step 1
    clinicName:     "",
    specialty:      "",
    city:           "",
    // Step 2
    phone:          "",
    whatsapp:       "",
    email:          "",
    address:        "",
    // Step 3
    doctorName:     "",
    doctorDegree:   "",
    doctorSpec:     "",
    doctorExp:      "",
    doctorBio:      "",
    // Step 4
    services:       [],
    // Step 5
    hours: {
      Monday: { open:"09:00", close:"20:00", closed:false },
      Tuesday: { open:"09:00", close:"20:00", closed:false },
      Wednesday: { open:"09:00", close:"20:00", closed:false },
      Thursday: { open:"09:00", close:"20:00", closed:false },
      Friday: { open:"09:00", close:"20:00", closed:false },
      Saturday: { open:"09:00", close:"18:00", closed:false },
      Sunday: { open:"", close:"", closed:true },
    },
    // Step 6
    about: "",
  });

  const set = (key, val) => setData(p => ({ ...p, [key]: val }));

  const progress = ((step - 1) / TOTAL_STEPS) * 100;

  // ── Validation per step ─────────────────────────────────────────
  const canNext = () => {
    if (step === 1) return data.clinicName.trim() && data.specialty && data.city.trim();
    if (step === 2) return data.phone.trim() && data.address.trim();
    if (step === 3) return data.doctorName.trim() && data.doctorDegree.trim();
    if (step === 4) return data.services.length > 0;
    return true;
  };

  // ── Save everything to Supabase ─────────────────────────────────
  const handleFinish = async () => {
    setSaving(true);
    setError("");
    try {
      const slug = slugify(data.clinicName);

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
          address:    data.address,
          about:      data.about || `Expert ${data.specialty.toLowerCase()} care in ${data.city}.`,
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

      const url = `${slug}.clinicsite.in`;
      setLiveUrl(url);
      setDone(true);
      onComplete?.(clinic);

    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── DONE screen ─────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ minHeight:"100vh", background:"#080c14", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", padding:24 }}>
        <div style={{ maxWidth:480, width:"100%", textAlign:"center" }}>
          <div style={{ fontSize:64, marginBottom:16, animation:"bounce 1s ease" }}>🎉</div>
          <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-20px)}60%{transform:translateY(-10px)}}`}</style>
          <h1 style={{ fontSize:28, fontWeight:700, color:"#f1f5f9", marginBottom:8 }}>Your site is live!</h1>
          <p style={{ color:"#64748b", fontSize:15, marginBottom:28 }}>
            {data.clinicName} is now online and searchable on Google.
          </p>
          <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.25)", borderRadius:12, padding:"16px 20px", marginBottom:24 }}>
            <div style={{ fontSize:11, color:"#22c55e", fontFamily:"monospace", marginBottom:6 }}>YOUR LIVE URL</div>
            <div style={{ fontSize:17, fontWeight:700, color:"#22c55e" }}>🌐 {liveUrl}</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
            {[
              ["🔍","SEO Configured","Auto-applied for " + data.city],
              ["📅","Booking Ready","Patients can book online"],
              ["💬","WhatsApp Active","One-tap patient contact"],
              ["📊","Admin Panel","Manage everything"],
            ].map(([icon,title,sub]) => (
              <div key={title} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"14px 12px", textAlign:"left" }}>
                <div style={{ fontSize:20, marginBottom:6 }}>{icon}</div>
                <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0" }}>{title}</div>
                <div style={{ fontSize:11, color:"#475569" }}>{sub}</div>
              </div>
            ))}
          </div>
          <button onClick={() => onComplete?.()} style={{ width:"100%", padding:"13px", background:"linear-gradient(135deg,#1565c0,#1e88e5)", border:"none", borderRadius:10, color:"white", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 16px rgba(21,101,192,0.3)" }}>
            Go to Admin Panel →
          </button>
        </div>
      </div>
    );
  }

  // ── Wizard shell ─────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#080c14", display:"flex", fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* Left panel */}
      <div style={{ width:280, flexShrink:0, background:"#0d1526", borderRight:"1px solid rgba(255,255,255,0.06)", padding:"32px 24px", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:40 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#1565c0,#1e88e5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🦷</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>ClinicSite</div>
            <div style={{ fontSize:10, color:"#475569" }}>Setup Wizard</div>
          </div>
        </div>

        {[
          [1,"Clinic Basics","Name, specialty, city"],
          [2,"Contact Info","Phone, address"],
          [3,"Doctor Profile","Name, degree, bio"],
          [4,"Services","What you offer"],
          [5,"Working Hours","When you're open"],
          [6,"About & Launch","Final details"],
        ].map(([n, title, sub]) => (
          <div key={n} style={{ display:"flex", gap:12, marginBottom:20, alignItems:"flex-start" }}>
            <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, fontFamily:"monospace",
              background: step > n ? "#22c55e" : step === n ? "#1565c0" : "rgba(255,255,255,0.06)",
              color: step >= n ? "white" : "#334155",
              border: `2px solid ${step > n ? "#22c55e" : step === n ? "#1565c0" : "rgba(255,255,255,0.08)"}`,
              transition:"all .3s",
            }}>
              {step > n ? "✓" : n}
            </div>
            <div style={{ paddingTop:4 }}>
              <div style={{ fontSize:13, fontWeight:600, color: step >= n ? "#e2e8f0" : "#334155", transition:"color .3s" }}>{title}</div>
              <div style={{ fontSize:11, color:"#334155", marginTop:1 }}>{sub}</div>
            </div>
          </div>
        ))}

        <div style={{ marginTop:"auto", background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:10, padding:"12px 14px" }}>
          <div style={{ fontSize:10, color:"#22c55e", fontFamily:"monospace", marginBottom:4 }}>ESTIMATED TIME</div>
          <div style={{ fontSize:18, fontWeight:700, color:"#22c55e" }}>~5 minutes</div>
          <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>Then your site is live</div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Progress bar */}
        <div style={{ height:3, background:"rgba(255,255,255,0.06)" }}>
          <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#1565c0,#22c55e)", transition:"width .4s ease", borderRadius:"0 2px 2px 0" }} />
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"40px 48px" }}>
          <div style={{ maxWidth:560 }}>

            {/* ── STEP 1: Clinic basics ── */}
            {step === 1 && (
              <StepWrap>
                <div style={{ fontSize:11, color:"#1565c0", fontFamily:"monospace", fontWeight:700, letterSpacing:2, marginBottom:8 }}>STEP 1 OF 6</div>
                <h2 style={{ fontSize:26, fontWeight:700, color:"#f1f5f9", marginBottom:6 }}>Tell us about your clinic</h2>
                <p style={{ fontSize:14, color:"#64748b", marginBottom:28, lineHeight:1.6 }}>This is what patients will see when they find you on Google.</p>

                <div style={{ marginBottom:18 }}>
                  <Label>Clinic Name *</Label>
                  <Input value={data.clinicName} onChange={v => set("clinicName",v)} placeholder="e.g. Karur Dental Clinic" />
                </div>

                <div style={{ marginBottom:18 }}>
                  <Label>Specialty *</Label>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                    {Object.entries(SPECIALTY_DATA).map(([sp, info]) => (
                      <button key={sp} onClick={() => set("specialty", sp)} style={{
                        padding:"10px 8px", borderRadius:9, cursor:"pointer", textAlign:"center", fontFamily:"inherit",
                        background: data.specialty === sp ? "rgba(21,101,192,0.15)" : "rgba(255,255,255,0.03)",
                        border: `1.5px solid ${data.specialty === sp ? "rgba(21,101,192,0.5)" : "rgba(255,255,255,0.08)"}`,
                        color: data.specialty === sp ? "#7dd3fc" : "#64748b",
                        transition:"all .15s",
                      }}>
                        <div style={{ fontSize:20, marginBottom:4 }}>{info.icon}</div>
                        <div style={{ fontSize:11, fontWeight:600 }}>{sp}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom:18 }}>
                  <Label>City *</Label>
                  <Input value={data.city} onChange={v => set("city",v)} placeholder="e.g. Karur, Coimbatore, Chennai" />
                </div>
              </StepWrap>
            )}

            {/* ── STEP 2: Contact ── */}
            {step === 2 && (
              <StepWrap>
                <div style={{ fontSize:11, color:"#1565c0", fontFamily:"monospace", fontWeight:700, letterSpacing:2, marginBottom:8 }}>STEP 2 OF 6</div>
                <h2 style={{ fontSize:26, fontWeight:700, color:"#f1f5f9", marginBottom:6 }}>Contact information</h2>
                <p style={{ fontSize:14, color:"#64748b", marginBottom:28 }}>Patients will use these to reach you.</p>

                {[
                  ["Phone Number *","phone","tel","+91 98400 00000"],
                  ["WhatsApp Number","whatsapp","tel","Same as phone if same"],
                  ["Email Address","email","email","clinic@email.com"],
                  ["Full Address *","address","text","Street, Area, City, Pincode"],
                ].map(([label, key, type, placeholder]) => (
                  <div key={key} style={{ marginBottom:16 }}>
                    <Label>{label}</Label>
                    <Input value={data[key]} onChange={v => set(key,v)} placeholder={placeholder} type={type} />
                  </div>
                ))}
              </StepWrap>
            )}

            {/* ── STEP 3: Doctor ── */}
            {step === 3 && (
              <StepWrap>
                <div style={{ fontSize:11, color:"#1565c0", fontFamily:"monospace", fontWeight:700, letterSpacing:2, marginBottom:8 }}>STEP 3 OF 6</div>
                <h2 style={{ fontSize:26, fontWeight:700, color:"#f1f5f9", marginBottom:6 }}>Doctor profile</h2>
                <p style={{ fontSize:14, color:"#64748b", marginBottom:28 }}>Builds patient trust. You can add more doctors later.</p>

                {[
                  ["Doctor's Full Name *","doctorName","Dr. Ramesh Kumar"],
                  ["Degree / Qualification *","doctorDegree","BDS, MDS – Periodontology"],
                  ["Specialization","doctorSpec","Periodontist & Implantologist"],
                  ["Years of Experience","doctorExp","12 Years"],
                ].map(([label, key, placeholder]) => (
                  <div key={key} style={{ marginBottom:16 }}>
                    <Label>{label}</Label>
                    <Input value={data[key]} onChange={v => set(key,v)} placeholder={placeholder} />
                  </div>
                ))}
                <div style={{ marginBottom:16 }}>
                  <Label>Short Bio</Label>
                  <textarea value={data.doctorBio} onChange={e => set("doctorBio",e.target.value)}
                    placeholder="Brief background about the doctor's experience and expertise..."
                    rows={3} style={{ width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.05)", border:"1.5px solid rgba(255,255,255,0.1)", color:"#e2e8f0", borderRadius:9, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box", resize:"vertical", lineHeight:1.6 }} />
                </div>
              </StepWrap>
            )}

            {/* ── STEP 4: Services ── */}
            {step === 4 && (
              <StepWrap>
                <div style={{ fontSize:11, color:"#1565c0", fontFamily:"monospace", fontWeight:700, letterSpacing:2, marginBottom:8 }}>STEP 4 OF 6</div>
                <h2 style={{ fontSize:26, fontWeight:700, color:"#f1f5f9", marginBottom:6 }}>Select your services</h2>
                <p style={{ fontSize:14, color:"#64748b", marginBottom:28 }}>Choose what you offer. You can add more from the admin panel.</p>

                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {(DEFAULT_SERVICES[data.specialty] || DEFAULT_SERVICES["General Practice"]).map(svc => {
                    const selected = data.services.includes(svc);
                    return (
                      <button key={svc} onClick={() => set("services", selected ? data.services.filter(s=>s!==svc) : [...data.services, svc])}
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:10, cursor:"pointer", fontFamily:"inherit", textAlign:"left",
                          background: selected ? "rgba(21,101,192,0.12)" : "rgba(255,255,255,0.03)",
                          border: `1.5px solid ${selected ? "rgba(21,101,192,0.4)" : "rgba(255,255,255,0.08)"}`,
                          transition:"all .15s",
                        }}>
                        <div style={{ width:22, height:22, borderRadius:6, background: selected ? "#1565c0" : "rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0, transition:"all .15s" }}>
                          {selected ? "✓" : SERVICE_ICONS[svc] || "🏥"}
                        </div>
                        <span style={{ fontSize:14, color: selected ? "#7dd3fc" : "#94a3b8", fontWeight: selected ? 600 : 400 }}>{svc}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop:12, fontSize:12, color:"#334155" }}>{data.services.length} selected</div>
              </StepWrap>
            )}

            {/* ── STEP 5: Hours ── */}
            {step === 5 && (
              <StepWrap>
                <div style={{ fontSize:11, color:"#1565c0", fontFamily:"monospace", fontWeight:700, letterSpacing:2, marginBottom:8 }}>STEP 5 OF 6</div>
                <h2 style={{ fontSize:26, fontWeight:700, color:"#f1f5f9", marginBottom:6 }}>Working hours</h2>
                <p style={{ fontSize:14, color:"#64748b", marginBottom:28 }}>Shown on your website. Patients know when to visit.</p>

                {Object.entries(data.hours).map(([day, h]) => (
                  <div key={day} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ width:100, fontSize:13, color: h.closed ? "#334155" : "#94a3b8", flexShrink:0 }}>{day}</div>
                    {h.closed ? (
                      <div style={{ flex:1, fontSize:13, color:"#ef4444" }}>Closed</div>
                    ) : (
                      <div style={{ display:"flex", gap:8, alignItems:"center", flex:1 }}>
                        <input type="time" value={h.open} onChange={e => set("hours",{...data.hours,[day]:{...h,open:e.target.value}})}
                          style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#e2e8f0", borderRadius:7, padding:"6px 10px", fontSize:13, fontFamily:"monospace", outline:"none", width:100 }} />
                        <span style={{ color:"#334155" }}>to</span>
                        <input type="time" value={h.close} onChange={e => set("hours",{...data.hours,[day]:{...h,close:e.target.value}})}
                          style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#e2e8f0", borderRadius:7, padding:"6px 10px", fontSize:13, fontFamily:"monospace", outline:"none", width:100 }} />
                      </div>
                    )}
                    <button onClick={() => set("hours",{...data.hours,[day]:{...h,closed:!h.closed}})}
                      style={{ background: h.closed ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border:`1px solid ${h.closed?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"}`, color: h.closed ? "#22c55e" : "#f87171", borderRadius:7, padding:"5px 12px", fontSize:11, cursor:"pointer", fontFamily:"inherit", fontWeight:600, whiteSpace:"nowrap" }}>
                      {h.closed ? "Set Open" : "Mark Closed"}
                    </button>
                  </div>
                ))}
              </StepWrap>
            )}

            {/* ── STEP 6: About + launch ── */}
            {step === 6 && (
              <StepWrap>
                <div style={{ fontSize:11, color:"#1565c0", fontFamily:"monospace", fontWeight:700, letterSpacing:2, marginBottom:8 }}>STEP 6 OF 6</div>
                <h2 style={{ fontSize:26, fontWeight:700, color:"#f1f5f9", marginBottom:6 }}>Almost done!</h2>
                <p style={{ fontSize:14, color:"#64748b", marginBottom:28 }}>One last thing — a short intro about your clinic.</p>

                <div style={{ marginBottom:20 }}>
                  <Label>About Your Clinic</Label>
                  <textarea value={data.about} onChange={e => set("about",e.target.value)}
                    placeholder={`e.g. ${data.clinicName} has been serving ${data.city} with expert ${(data.specialty||"").toLowerCase()} care for over 10 years...`}
                    rows={4} style={{ width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.05)", border:"1.5px solid rgba(255,255,255,0.1)", color:"#e2e8f0", borderRadius:9, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box", resize:"vertical", lineHeight:1.6 }} />
                </div>

                {/* Summary card */}
                <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:20, marginBottom:24 }}>
                  <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace", marginBottom:14 }}>REVIEW YOUR SETUP</div>
                  {[
                    ["Clinic", data.clinicName],
                    ["Specialty", `${SPECIALTY_DATA[data.specialty]?.icon} ${data.specialty}`],
                    ["City", data.city],
                    ["Doctor", data.doctorName],
                    ["Services", `${data.services.length} services`],
                    ["Your URL", `${slugify(data.clinicName)}.clinicsite.in`],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", fontSize:13 }}>
                      <span style={{ color:"#475569" }}>{k}</span>
                      <span style={{ color:"#e2e8f0", fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                </div>

                {error && (
                  <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#f87171", marginBottom:16 }}>
                    ⚠️ {error}
                  </div>
                )}
              </StepWrap>
            )}

            {/* ── Navigation ── */}
            <div style={{ display:"flex", gap:12, marginTop:32 }}>
              {step > 1 && (
                <button onClick={() => setStep(s => s-1)} style={{ flex:1, padding:"12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", color:"#94a3b8", borderRadius:10, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
                  ← Back
                </button>
              )}
              {step < TOTAL_STEPS ? (
                <button onClick={() => canNext() && setStep(s=>s+1)} disabled={!canNext()}
                  style={{ flex:2, padding:"12px", background: canNext() ? "linear-gradient(135deg,#1565c0,#1e88e5)" : "rgba(255,255,255,0.05)", border:"none", borderRadius:10, color: canNext() ? "white" : "#334155", fontSize:14, fontWeight:700, cursor: canNext() ? "pointer" : "not-allowed", fontFamily:"inherit", transition:"all .2s", boxShadow: canNext() ? "0 4px 16px rgba(21,101,192,0.3)" : "none" }}>
                  Continue →
                </button>
              ) : (
                <button onClick={handleFinish} disabled={saving}
                  style={{ flex:2, padding:"12px", background: saving ? "rgba(21,101,192,0.4)" : "linear-gradient(135deg,#1565c0,#22c55e)", border:"none", borderRadius:10, color:"white", fontSize:14, fontWeight:700, cursor: saving ? "not-allowed" : "pointer", fontFamily:"inherit", boxShadow:"0 4px 16px rgba(21,101,192,0.3)" }}>
                  {saving ? "🚀 Launching your site..." : "🚀 Launch My Site!"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
