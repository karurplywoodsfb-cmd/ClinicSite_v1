// src/components/BookingEngine.jsx
// Branch-aware booking engine.
// Step 0 (only shown when clinic has branches): Choose Location
// Step 1: Choose Service
// Step 2: Pick Date & Time
// Step 3: Your Details + DPDP Consent
// Step 4: Confirmed

import { useState, useEffect } from "react";
import {
  bookAppointment,
  getTakenSlots,
  checkClinicAppointmentLimit,
  supabase,
} from "../lib/supabase";
import DPDPConsentBlock         from "./DPDPConsentBlock";
import SymptomTriage            from "./SymptomTriage";
import { getSlotsForDate, findNextAvailable } from "../lib/slotEngine";

// Fallback static slots (used only when no working hours configured)
const DAY_LABELS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getDates(count = 7) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function BookingEngine({ clinic, services = [], branches = [], hours = [], hidePrice = false }) {
  const hasBranches = branches.filter(b => b.is_active !== false).length > 0;
  const firstStep   = hasBranches ? 0 : 1;

  const [step,          setStep]          = useState(firstStep);
  const [form,          setForm]          = useState({
    branch: null, service: "", date: null, slot: "", name: "", phone: "", notes: "",
  });
  const [consentGiven,  setConsentGiven]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [takenSlots,    setTakenSlots]    = useState([]);
  const [slotsLoading,  setSlotsLoading]  = useState(false);
  const [limitBlocked,  setLimitBlocked]  = useState(false);
  const [limitInfo,     setLimitInfo]     = useState(null);
  const [nextAvail,     setNextAvail]     = useState(null); // { label, date, slot }
  const [takenMap,      setTakenMap]      = useState({});   // { dateStr: [slots] }

  const dates    = getDates(7);
  const set      = (key, val) => setForm(p => ({ ...p, [key]: val }));

  // Smart slots for selected date from working hours
  const availableSlots = form.date
    ? getSlotsForDate(hours, form.date)
    : [];

  const totalSteps  = hasBranches ? 4 : 3;
  const confirmStep = hasBranches ? 5 : 4;

  const stepLabel = hasBranches
    ? ["","Choose Location","Choose Service","Pick Date & Time","Your Details","Confirmed!"][step]
    : ["","Choose Service","Pick Date & Time","Your Details","Confirmed!"][step];

  // Fetch taken slots when date changes
  useEffect(() => {
    if (!form.date || !clinic?.id) { setTakenSlots([]); return; }
    const dateStr = form.date.toISOString().split("T")[0];
    setSlotsLoading(true);
    getTakenSlots(clinic.id, dateStr)
      .then(slots => {
        setTakenSlots(slots);
        setTakenMap(prev => ({ ...prev, [dateStr]: slots }));
      })
      .catch(() => setTakenSlots([]))
      .finally(() => setSlotsLoading(false));
    set("slot", "");
  }, [form.date, clinic?.id]);

  // Find next available slot across the week (for the banner)
  useEffect(() => {
    if (!clinic?.id || hours.length === 0) return;
    const next = findNextAvailable(hours, takenMap);
    setNextAvail(next);
  }, [hours, takenMap, clinic?.id]);

  // Check monthly limit on mount
  useEffect(() => {
    if (!clinic?.id) return;
    checkClinicAppointmentLimit(clinic.id)
      .then(info => { setLimitInfo(info); setLimitBlocked(!info.canBook); })
      .catch(() => setLimitBlocked(false));
  }, [clinic?.id]);

  const handleConsent = (a, b) => setConsentGiven(a && b);

  const handleBook = async () => {
    if (!form.name.trim())                     { setError("Please enter your name"); return; }
    if (!form.phone || form.phone.length < 10) { setError("Enter a valid 10-digit phone number"); return; }
    if (!consentGiven)                         { setError("Please provide both data processing consents to proceed."); return; }

    const limitCheck = await checkClinicAppointmentLimit(clinic.id).catch(() => ({ canBook: true }));
    if (!limitCheck.canBook) {
      setLimitBlocked(true); setLimitInfo(limitCheck);
      setError("This clinic has reached its monthly appointment capacity. Please call directly.");
      return;
    }

    setLoading(true); setError("");
    try {
      const appt = await bookAppointment(clinic.id, {
        branch_id:              form.branch?.id || null,
        name:                   form.name,
        phone:                  form.phone.startsWith("+") ? form.phone : `+91${form.phone}`,
        service:                form.service,
        date:                   form.date?.toISOString().split("T")[0],
        time:                   form.slot,
        notes:                  form.notes,
        consent_appointment:    true,
        consent_communications: true,
        consent_timestamp:      new Date().toISOString(),
      });
      setStep(confirmStep);

      supabase.rpc("increment_clinic_appointment_usage", { p_clinic_id: clinic.id })
        .catch(() => {});
      supabase.functions.invoke("send-push", {
        body: {
          clinic_id: clinic.id,
          appointment: {
            id: appt?.id, patient_name: form.name,
            service_name: form.service, branch_name: form.branch?.name || null,
            preferred_date: form.date?.toISOString().split("T")[0], preferred_time: form.slot,
          },
        },
      }).catch(() => {});
    } catch (e) {
      setError(e.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Capacity full screen ──────────────────────────────────────
  if (limitBlocked && limitInfo) {
    return (
      <div style={cardStyle}>
        <div style={headerStyle(clinic)}>
          <div style={{ fontSize:20, fontWeight:700 }}>{clinic?.name}</div>
        </div>
        <div style={{ padding:"32px 28px", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:16 }}>📅</div>
          <div style={{ fontSize:18, fontWeight:700, color:"#0b2545", marginBottom:8 }}>Appointments Fully Booked</div>
          <p style={{ fontSize:14, color:"#64748b", lineHeight:1.6, marginBottom:20 }}>
            This clinic has reached its monthly capacity ({limitInfo.currentCount}/{limitInfo.limit}).
            Please call to schedule.
          </p>
          <a href={`tel:${clinic?.phone}`} style={primaryLinkStyle}>📞 Call {clinic?.name}</a>
        </div>
      </div>
    );
  }

  const activeBranches = branches.filter(b => b.is_active !== false);

  return (
    <div style={cardStyle}>
      {/* ── Header with progress ── */}
      <div style={headerStyle(clinic)}>
        <div style={{ fontSize:12, opacity:.65, marginBottom:4, letterSpacing:1 }}>BOOK APPOINTMENT</div>
        <div style={{ fontSize:20, fontWeight:700 }}>
          {form.branch ? `${clinic?.name} — ${form.branch.name}` : clinic?.name}
        </div>
        {/* Progress bar — only show for steps 1-3 (or 1-4 with branches) */}
        {step > 0 && step < confirmStep && (
          <div style={{ display:"flex", gap:6, marginTop:16 }}>
            {Array.from({ length: totalSteps }).map((_, n) => {
              const barStep = n + (hasBranches ? 0 : 1);
              return (
                <div key={n} style={{
                  flex:1, height:3, borderRadius:2, transition:"background .3s",
                  background: step > barStep ? "#22c55e"
                    : step === barStep ? "rgba(255,255,255,0.9)"
                    : "rgba(255,255,255,0.2)",
                }}/>
              );
            })}
          </div>
        )}
        {step > 0 && step < confirmStep && (
          <div style={{ fontSize:11, opacity:.6, marginTop:6 }}>
            Step {step} of {totalSteps} — {stepLabel}
          </div>
        )}
      </div>

      <div style={{ padding:"24px 28px" }}>

        {/* ── STEP 0: Choose Location (only if branches exist) ── */}
        {step === 0 && (
          <div>
            <div style={{ fontSize:14, color:"#64748b", marginBottom:16 }}>
              Where would you like your appointment?
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {/* Main clinic */}
              <button
                onClick={() => { set("branch", null); setStep(1); }}
                style={locationBtnStyle(false)}>
                <div style={{ fontSize:20 }}>🏥</div>
                <div style={{ flex:1, textAlign:"left" }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"#0b2545" }}>{clinic?.name}</div>
                  <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{clinic?.address || "Main Clinic"}</div>
                </div>
                <span style={{ fontSize:12, color:"#1565c0" }}>Select →</span>
              </button>

              {/* Branch locations */}
              {activeBranches.map(b => (
                <button key={b.id}
                  onClick={() => { set("branch", b); setStep(1); }}
                  style={locationBtnStyle(false)}>
                  <div style={{ fontSize:20 }}>📍</div>
                  <div style={{ flex:1, textAlign:"left" }}>
                    <div style={{ fontSize:14, fontWeight:600, color:"#0b2545" }}>{b.name}</div>
                    <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{b.address || "Branch Location"}</div>
                    {b.phone && (
                      <div style={{ fontSize:11, color:"#94a3b8", marginTop:1 }}>📞 {b.phone}</div>
                    )}
                  </div>
                  <span style={{ fontSize:12, color:"#1565c0" }}>Select →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 1: Service ── */}
        {step === 1 && (
          <div>
            {hasBranches && (
              <div style={breadcrumb}>
                📍 {form.branch ? form.branch.name : clinic?.name}
                <button onClick={() => setStep(0)} style={backLinkStyle}>Change</button>
              </div>
            )}

            {/* ── Next Available Banner ── */}
            {nextAvail && (
              <div style={{
                display:"flex", alignItems:"center", gap:10,
                background:"rgba(34,197,94,0.07)",
                border:"1px solid rgba(34,197,94,0.25)",
                borderRadius:10, padding:"10px 14px", marginBottom:14,
              }}>
                <span style={{ fontSize:18 }}>🟢</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#15803d" }}>
                    Next available: {nextAvail.label}
                  </div>
                  <div style={{ fontSize:11, color:"#64748b", marginTop:1 }}>
                    Pick a service below to book this slot instantly
                  </div>
                </div>
              </div>
            )}

            {/* ── AI Symptom Triage ── */}
            <SymptomTriage
              services={services}
              specialty={clinic?.specialty || "General"}
              onServiceSelect={svc => { set("service", svc.name); setStep(2); }}
              style={{ marginBottom:14 }}
            />

            {services.length === 0 ? (
              <div style={{ textAlign:"center", padding:"32px 0", color:"#94a3b8", fontSize:14 }}>
                ℹ️ No services listed. Please call to book.
              </div>
            ) : (
              <>
                <div style={{ fontSize:13, color:"#64748b", marginBottom:10 }}>
                  Or select a service directly:
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {services.filter(s => s.is_active !== false).map((svc, i) => (
                    <button key={i}
                      onClick={() => { set("service", svc.name); setStep(2); }}
                      style={{
                        display:"flex", alignItems:"center", gap:12,
                        padding:"13px 16px", borderRadius:10, cursor:"pointer",
                        background: form.service===svc.name ? "rgba(21,101,192,0.06)" : "white",
                        border: `1.5px solid ${form.service===svc.name ? "#1565c0" : "#e8eef6"}`,
                        transition:"all .15s", textAlign:"left",
                      }}>
                      {svc.icon && <span style={{ fontSize:22 }}>{svc.icon}</span>}
                      <span style={{ flex:1, fontSize:14, fontWeight:500, color:"#0b2545" }}>{svc.name}</span>
                      {!hidePrice && !svc.hide_price && svc.price && (
                        <span style={{ fontSize:13, color:"#1565c0", fontWeight:600 }}>{svc.price}</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STEP 2: Date + Time (smart slots) ── */}
        {step === 2 && (
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#0b2545", marginBottom:10 }}>Choose a Date</div>
            <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:20 }}>
              {dates.map((d, i) => {
                // Mark days clinic is closed
                const daySlots = getSlotsForDate(hours, d);
                const isClosed = hours.length > 0 && daySlots.length === 0;
                const sel = form.date?.toDateString() === d.toDateString();
                return (
                  <button key={i} onClick={() => !isClosed && set("date", d)}
                    disabled={isClosed}
                    style={{
                      flexShrink:0, width:60, padding:"10px 0", borderRadius:10,
                      cursor: isClosed ? "not-allowed" : "pointer",
                      background: sel ? "#1565c0" : isClosed ? "#f8fafc" : "white",
                      border: `1.5px solid ${sel ? "#1565c0" : "#e8eef6"}`,
                      opacity: isClosed ? .4 : 1, textAlign:"center", transition:"all .15s",
                      position:"relative",
                    }}>
                    <div style={{ fontSize:10, color:sel?"rgba(255,255,255,0.7)":"#94a3b8", marginBottom:4 }}>
                      {DAY_LABELS[d.getDay()]}
                    </div>
                    <div style={{ fontSize:18, fontWeight:700, color:sel?"white":"#0b2545", lineHeight:1 }}>
                      {d.getDate()}
                    </div>
                    <div style={{ fontSize:10, color:sel?"rgba(255,255,255,0.7)":"#94a3b8", marginTop:2 }}>
                      {MONTH_LABELS[d.getMonth()]}
                    </div>
                    {isClosed && (
                      <div style={{ position:"absolute", bottom:2, left:0, right:0,
                        fontSize:8, color:"#ef4444", textAlign:"center" }}>closed</div>
                    )}
                  </button>
                );
              })}
            </div>

            {form.date && (
              <>
                {availableSlots.length === 0 ? (
                  <div style={{
                    textAlign:"center", padding:"20px",
                    background:"#fef2f2", borderRadius:10, marginBottom:16,
                    fontSize:13, color:"#dc2626",
                  }}>
                    🚫 Clinic is closed on this day. Please choose another date.
                  </div>
                ) : (
                  <>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#0b2545" }}>
                        Available Slots
                        {slotsLoading && <span style={{ fontSize:11, color:"#94a3b8", marginLeft:8 }}>Loading...</span>}
                      </div>
                      <div style={{ fontSize:11, color:"#64748b" }}>
                        {availableSlots.length - takenSlots.length} of {availableSlots.length} free
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:20 }}>
                      {availableSlots.map((slot, i) => {
                        const taken = takenSlots.includes(slot);
                        const sel   = form.slot === slot;
                        return (
                          <button key={i}
                            onClick={() => !taken && !slotsLoading && set("slot", slot)}
                            disabled={taken || slotsLoading}
                            style={{
                              padding:"8px 4px", borderRadius:8, fontSize:12,
                              cursor: taken || slotsLoading ? "not-allowed" : "pointer",
                              background: sel ? "#1565c0" : taken ? "#f8fafc" : "white",
                              border: `1.5px solid ${sel ? "#1565c0" : taken ? "#e8eef6" : "#dce8f5"}`,
                              color: sel ? "white" : taken ? "#cbd5e1" : "#0b2545",
                              fontWeight: sel ? 600 : 400,
                              textDecoration: taken ? "line-through" : "none",
                              fontFamily:"inherit", transition:"all .15s",
                              opacity: slotsLoading ? .5 : 1,
                            }}>
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setStep(1)} style={secondaryBtn}>← Back</button>
              <button onClick={() => form.date && form.slot && setStep(3)}
                disabled={!form.date || !form.slot} style={primaryBtn(!form.date || !form.slot)}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Details + Consent ── */}
        {step === 3 && (
          <div>
            {/* Booking summary */}
            <div style={{ background:"#f0f7ff", border:"1px solid #dce8f5", borderRadius:10, padding:"12px 16px", marginBottom:20 }}>
              <div style={{ fontSize:12, color:"#1565c0", fontWeight:600, marginBottom:4 }}>BOOKING SUMMARY</div>
              {form.branch && (
                <div style={{ fontSize:12, color:"#5a7a96", marginBottom:2 }}>📍 {form.branch.name}</div>
              )}
              <div style={{ fontSize:14, color:"#0b2545", fontWeight:600 }}>{form.service}</div>
              <div style={{ fontSize:13, color:"#5a7a96", marginTop:2 }}>
                {form.date?.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" })} at {form.slot}
              </div>
            </div>

            {[
              { label:"YOUR NAME *",      key:"name",  placeholder:"e.g. Ravi Kumar", type:"text" },
              { label:"PHONE NUMBER *",   key:"phone", placeholder:"98400 00000",       type:"tel"  },
              { label:"NOTES (optional)", key:"notes", placeholder:"Any concerns?",     type:"text" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace", fontWeight:600, marginBottom:5 }}>{f.label}</div>
                <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  style={{ width:"100%", padding:"11px 14px", border:"1.5px solid #dce8f5",
                    borderRadius:8, fontSize:14, color:"#0b2545", fontFamily:"inherit",
                    outline:"none", boxSizing:"border-box", background:"#fafcff" }}/>
              </div>
            ))}

            <div style={{ marginBottom:18 }}>
              <DPDPConsentBlock clinic={clinic} onChange={handleConsent}/>
            </div>

            {error && (
              <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8,
                padding:"10px 14px", fontSize:13, color:"#ef4444", marginBottom:14 }}>
                {error}
              </div>
            )}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setStep(2)} style={secondaryBtn}>← Back</button>
              <button onClick={handleBook} disabled={loading || !consentGiven}
                style={primaryBtn(loading || !consentGiven)}>
                {loading ? "Confirming..." : !consentGiven ? "Provide Consent" : "Confirm Appointment ✓"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4/5: Confirmed ── */}
        {step === confirmStep && (
          <div style={{ textAlign:"center", padding:"12px 0" }}>
            <div style={{ fontSize:52, marginBottom:14 }}>🎉</div>
            <div style={{ fontSize:20, fontWeight:700, color:"#0b2545", marginBottom:8 }}>
              Appointment Confirmed!
            </div>
            {form.branch && (
              <div style={{ fontSize:13, color:"#1565c0", fontWeight:600, marginBottom:4 }}>
                📍 {form.branch.name}
              </div>
            )}
            <div style={{ fontSize:14, color:"#5a7a96", marginBottom:24, lineHeight:1.6 }}>
              We'll call <strong style={{ color:"#0b2545" }}>{form.phone}</strong> within 30 minutes to confirm.
            </div>

            <div style={{ background:"#f0f7ff", border:"1px solid #dce8f5", borderRadius:12, padding:"16px 20px", marginBottom:20, textAlign:"left" }}>
              {[
                form.branch ? ["Location", form.branch.name] : null,
                ["Service", form.service],
                ["Date",    form.date?.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" })],
                ["Time",    form.slot],
                ["Patient", form.name],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #dce8f5", fontSize:13 }}>
                  <span style={{ color:"#64748b" }}>{k}</span>
                  <span style={{ color:"#0b2545", fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ background:"rgba(34,197,94,0.05)", border:"1px solid #bbf7d0", borderRadius:8,
              padding:"10px 14px", marginBottom:18, fontSize:11, color:"#64748b", textAlign:"left" }}>
              🔒 Your consent has been recorded as required by the DPDP Act, 2023.
            </div>

            {(form.branch?.whatsapp || clinic?.whatsapp) && (
              <a href={`https://wa.me/${(form.branch?.whatsapp || clinic?.whatsapp || "").replace(/\D/g,"")}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  background:"#25d366", color:"white", borderRadius:10, padding:"12px",
                  fontSize:14, fontWeight:600, textDecoration:"none", marginBottom:10 }}>
                💬 Send us a WhatsApp message
              </a>
            )}

            <button onClick={() => {
              setStep(firstStep);
              setForm({ branch:null, service:"", date:null, slot:"", name:"", phone:"", notes:"" });
              setConsentGiven(false); setTakenSlots([]);
            }} style={{ width:"100%", padding:"11px", background:"white",
              border:"1.5px solid #dce8f5", borderRadius:10, color:"#64748b",
              fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
              Book another appointment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────
const cardStyle = {
  background:"white", borderRadius:20,
  boxShadow:"0 24px 64px rgba(11,37,69,0.12)",
  overflow:"hidden", maxWidth:520, width:"100%",
  fontFamily:"'DM Sans',sans-serif",
};

const headerStyle = clinic => ({
  background:"linear-gradient(135deg,#0b2545,#1565c0)",
  padding:"22px 28px", color:"white",
});

const primaryBtn = disabled => ({
  flex:2, padding:"12px", border:"none", borderRadius:10,
  fontSize:14, fontWeight:600, fontFamily:"inherit", transition:"all .2s",
  background: disabled ? "#e2e8f0" : "#1565c0",
  color: disabled ? "#94a3b8" : "white",
  cursor: disabled ? "not-allowed" : "pointer",
  boxShadow: disabled ? "none" : "0 4px 14px rgba(21,101,192,0.3)",
});

const secondaryBtn = {
  flex:1, padding:"12px", background:"white",
  border:"1.5px solid #dce8f5", borderRadius:10,
  color:"#64748b", fontSize:14, cursor:"pointer", fontFamily:"inherit",
};

const primaryLinkStyle = {
  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
  background:"#1565c0", color:"white", borderRadius:10, padding:"12px",
  fontSize:14, fontWeight:600, textDecoration:"none",
};

const locationBtnStyle = selected => ({
  display:"flex", alignItems:"center", gap:12,
  padding:"14px 16px", borderRadius:12, cursor:"pointer",
  background: selected ? "rgba(21,101,192,0.06)" : "white",
  border: `1.5px solid ${selected ? "#1565c0" : "#e8eef6"}`,
  transition:"all .15s", textAlign:"left", width:"100%",
});

const breadcrumb = {
  display:"flex", alignItems:"center", gap:8,
  fontSize:12, color:"#64748b", marginBottom:14,
  background:"#f8faff", borderRadius:8, padding:"8px 12px",
};

const backLinkStyle = {
  marginLeft:"auto", fontSize:11, color:"#1565c0",
  background:"none", border:"none", cursor:"pointer",
  fontFamily:"inherit", textDecoration:"underline", padding:0,
};
