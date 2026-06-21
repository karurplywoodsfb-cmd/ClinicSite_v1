// src/components/BookingEngine.jsx
// FIXES:
//   - Real slot availability fetched from DB (no hardcoded TAKEN_SLOTS)
//   - Plan limit checked before booking (appointments_monthly)
//   - Ghost imports removed
//   - No hardcoded service fallbacks (rendered only if services prop is non-empty)

import { useState, useEffect } from "react";
import {
  bookAppointment,
  getTakenSlots,
  checkClinicAppointmentLimit,
  supabase,
} from "../lib/supabase";
import DPDPConsentBlock   from "./DPDPConsentBlock";

// ── Time slots (display-only; actual availability comes from DB) ──
const TIME_SLOTS = [
  "9:00 AM","9:30 AM","10:00 AM","10:30 AM",
  "11:00 AM","11:30 AM","12:00 PM",
  "2:00 PM","2:30 PM","3:00 PM","3:30 PM",
  "4:00 PM","4:30 PM","5:00 PM","5:30 PM",
  "6:00 PM","6:30 PM","7:00 PM","7:30 PM",
];

const DAY_LABELS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getDates(count = 7) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function BookingEngine({ clinic, services = [], hidePrice = false }) {
  const [step,         setStep]         = useState(1);
  const [form,         setForm]         = useState({ service:"", date:null, slot:"", name:"", phone:"", notes:"" });
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [booked,       setBooked]       = useState(null);

  // Real availability state
  const [takenSlots,   setTakenSlots]   = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Limit check state
  const [limitBlocked, setLimitBlocked] = useState(false);
  const [limitInfo,    setLimitInfo]    = useState(null);

  const dates = getDates(7);
  const set   = (key, val) => setForm(p => ({ ...p, [key]: val }));

  // ── Fetch taken slots whenever the selected date changes ─────
  useEffect(() => {
    if (!form.date || !clinic?.id) { setTakenSlots([]); return; }
    const dateStr = form.date.toISOString().split("T")[0];
    setSlotsLoading(true);
    getTakenSlots(clinic.id, dateStr)
      .then(slots => setTakenSlots(slots))
      .catch(() => setTakenSlots([]))
      .finally(() => setSlotsLoading(false));
    // Clear previously selected slot when date changes
    set("slot", "");
  }, [form.date, clinic?.id]);

  // ── Check appointment limit on mount ──────────────────────────
  useEffect(() => {
    if (!clinic?.id) return;
    checkClinicAppointmentLimit(clinic.id).then(info => {
      setLimitInfo(info);
      setLimitBlocked(!info.canBook);
    }).catch(() => {
      // Fail open — don't block booking if limit check errors
      setLimitBlocked(false);
    });
  }, [clinic?.id]);

  const handleConsent = (a, b) => setConsentGiven(a && b);

  const handleBook = async () => {
    if (!form.name.trim())                     { setError("Please enter your name"); return; }
    if (!form.phone || form.phone.length < 10) { setError("Enter a valid 10-digit phone number"); return; }
    if (!consentGiven)                         { setError("Please provide both data processing consents to proceed."); return; }

    // Re-check limit right before booking (race-condition safety)
    const limitCheck = await checkClinicAppointmentLimit(clinic.id).catch(() => ({ canBook: true }));
    if (!limitCheck.canBook) {
      setLimitBlocked(true);
      setLimitInfo(limitCheck);
      setError("This clinic has reached its monthly appointment capacity. Please try again next month or call the clinic directly.");
      return;
    }

    setLoading(true); setError("");
    try {
      const appt = await bookAppointment(clinic.id, {
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
      setBooked(appt);
      setStep(4);

      // Increment clinic's monthly appointment usage counter — non-blocking
      supabase.rpc("increment_clinic_appointment_usage", { p_clinic_id: clinic.id })
        .catch(e => console.warn("[BookingEngine] Usage increment failed:", e.message));

      // Push notification to clinic admin — non-blocking
      supabase.functions
        .invoke("send-push", {
          body: {
            clinic_id:   clinic.id,
            appointment: {
              id:             appt?.id,
              patient_name:   form.name,
              service_name:   form.service,
              preferred_date: form.date?.toISOString().split("T")[0],
              preferred_time: form.slot,
            },
          },
        })
        .catch(e => console.warn("[BookingEngine] Push notification failed:", e.message));

    } catch (e) {
      setError(e.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Limit blocked state ───────────────────────────────────────
  if (limitBlocked && limitInfo) {
    return (
      <div style={{
        background:"white", borderRadius:20, overflow:"hidden", maxWidth:520, width:"100%",
        boxShadow:"0 24px 64px rgba(11,37,69,0.12)", fontFamily:"'DM Sans',sans-serif",
      }}>
        <div style={{ background:"linear-gradient(135deg,#0b2545,#1565c0)", padding:"22px 28px", color:"white" }}>
          <div style={{ fontSize:20, fontWeight:700 }}>{clinic?.name}</div>
        </div>
        <div style={{ padding:"32px 28px", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:16 }}>📅</div>
          <div style={{ fontSize:18, fontWeight:700, color:"#0b2545", marginBottom:8 }}>
            Appointments Fully Booked
          </div>
          <p style={{ fontSize:14, color:"#64748b", lineHeight:1.6, marginBottom:20 }}>
            This clinic has reached its monthly booking capacity
            ({limitInfo.currentCount}/{limitInfo.limit} appointments).
            Please call directly to schedule.
          </p>
          <a href={`tel:${clinic?.phone}`} style={{
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            background:"#1565c0", color:"white", borderRadius:10, padding:"12px",
            fontSize:14, fontWeight:600, textDecoration:"none",
          }}>
            📞 Call {clinic?.name}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background:"white", borderRadius:20,
      boxShadow:"0 24px 64px rgba(11,37,69,0.12)",
      overflow:"hidden", maxWidth:520, width:"100%",
      fontFamily:"'DM Sans',sans-serif",
    }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0b2545,#1565c0)", padding:"22px 28px", color:"white" }}>
        <div style={{ fontSize:12, opacity:.65, marginBottom:4, letterSpacing:1 }}>BOOK APPOINTMENT</div>
        <div style={{ fontSize:20, fontWeight:700 }}>{clinic?.name}</div>
        <div style={{ display:"flex", gap:6, marginTop:16 }}>
          {[1,2,3].map(n => (
            <div key={n} style={{
              flex:1, height:3, borderRadius:2, transition:"background .3s",
              background: step>n ? "#22c55e" : step===n ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)",
            }} />
          ))}
        </div>
        <div style={{ fontSize:11, opacity:.6, marginTop:6 }}>
          Step {Math.min(step,3)} of 3 — {["","Choose Service","Pick Date & Time","Your Details","Confirmed!"][step]}
        </div>
      </div>

      <div style={{ padding:"24px 28px" }}>

        {/* ── STEP 1: Service ── */}
        {step === 1 && (
          <div>
            {services.length === 0 ? (
              <div style={{ textAlign:"center", padding:"32px 0", color:"#94a3b8", fontSize:14 }}>
                ℹ️ No services listed yet. Please call the clinic to book.
              </div>
            ) : (
              <>
                <div style={{ fontSize:14, color:"#64748b", marginBottom:16 }}>
                  What would you like to come in for?
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
                        <span style={{ fontSize:13, color:"#1565c0", fontWeight:600 }}>
                          {svc.price}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STEP 2: Date + Slot ── */}
        {step === 2 && (
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#0b2545", marginBottom:10 }}>Choose a Date</div>
            <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:20 }}>
              {dates.map((d, i) => {
                const isSun = d.getDay() === 0;
                const sel   = form.date?.toDateString() === d.toDateString();
                return (
                  <button key={i} onClick={() => !isSun && set("date", d)} disabled={isSun}
                    style={{
                      flexShrink:0, width:60, padding:"10px 0", borderRadius:10,
                      cursor: isSun ? "not-allowed" : "pointer",
                      background: sel ? "#1565c0" : isSun ? "#f8fafc" : "white",
                      border: `1.5px solid ${sel ? "#1565c0" : "#e8eef6"}`,
                      opacity: isSun ? .4 : 1, textAlign:"center", transition:"all .15s",
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
                  </button>
                );
              })}
            </div>

            {form.date && (
              <>
                <div style={{ fontSize:13, fontWeight:600, color:"#0b2545", marginBottom:10 }}>
                  Available Slots
                  {slotsLoading && <span style={{ fontSize:11, color:"#94a3b8", marginLeft:8 }}>Loading...</span>}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:20 }}>
                  {TIME_SLOTS.map((slot, i) => {
                    const taken = takenSlots.includes(slot);
                    const sel   = form.slot === slot;
                    return (
                      <button key={i} onClick={() => !taken && !slotsLoading && set("slot", slot)}
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

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setStep(1)}
                style={{ flex:1, padding:"12px", background:"white", border:"1.5px solid #dce8f5", borderRadius:10, color:"#64748b", fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
                ← Back
              </button>
              <button onClick={() => form.date && form.slot && setStep(3)}
                disabled={!form.date || !form.slot}
                style={{
                  flex:2, padding:"12px", borderRadius:10, fontSize:14, fontWeight:600,
                  cursor: form.date && form.slot ? "pointer" : "not-allowed",
                  background: form.date && form.slot ? "#1565c0" : "#dce8f5",
                  color: form.date && form.slot ? "white" : "#94a3b8",
                  border:"none", fontFamily:"inherit", transition:"all .2s",
                }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Details + DPDP Consent ── */}
        {step === 3 && (
          <div>
            <div style={{ background:"#f0f7ff", border:"1px solid #dce8f5", borderRadius:10, padding:"12px 16px", marginBottom:20 }}>
              <div style={{ fontSize:12, color:"#1565c0", fontWeight:600, marginBottom:4 }}>BOOKING SUMMARY</div>
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
                <input
                  type={f.type} placeholder={f.placeholder} value={form[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  style={{ width:"100%", padding:"11px 14px", border:"1.5px solid #dce8f5", borderRadius:8, fontSize:14, color:"#0b2545", fontFamily:"inherit", outline:"none", boxSizing:"border-box", background:"#fafcff" }}
                />
              </div>
            ))}

            <div style={{ marginBottom:18 }}>
              <DPDPConsentBlock clinic={clinic} onChange={handleConsent} />
            </div>

            {error && (
              <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#ef4444", marginBottom:14 }}>
                {error}
              </div>
            )}

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setStep(2)}
                style={{ flex:1, padding:"12px", background:"white", border:"1.5px solid #dce8f5", borderRadius:10, color:"#64748b", fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
                ← Back
              </button>
              <button onClick={handleBook} disabled={loading || !consentGiven}
                style={{
                  flex:2, padding:"12px", border:"none", borderRadius:10, fontSize:14, fontWeight:600,
                  fontFamily:"inherit", transition:"all .2s",
                  background: loading ? "#93c5fd" : !consentGiven ? "#e2e8f0" : "#1565c0",
                  color: !consentGiven ? "#94a3b8" : "white",
                  cursor: loading || !consentGiven ? "not-allowed" : "pointer",
                  boxShadow: consentGiven && !loading ? "0 4px 14px rgba(21,101,192,0.3)" : "none",
                }}>
                {loading ? "Confirming..." : !consentGiven ? "Provide Consent to Continue" : "Confirm Appointment ✓"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Confirmed ── */}
        {step === 4 && (
          <div style={{ textAlign:"center", padding:"12px 0" }}>
            <div style={{ fontSize:52, marginBottom:14 }}>🎉</div>
            <div style={{ fontSize:20, fontWeight:700, color:"#0b2545", marginBottom:8 }}>
              Appointment Confirmed!
            </div>
            <div style={{ fontSize:14, color:"#5a7a96", marginBottom:24, lineHeight:1.6 }}>
              We'll call <strong style={{ color:"#0b2545" }}>{form.phone}</strong> within 30 minutes to confirm.
            </div>

            <div style={{ background:"#f0f7ff", border:"1px solid #dce8f5", borderRadius:12, padding:"16px 20px", marginBottom:20, textAlign:"left" }}>
              {[
                ["Service", form.service],
                ["Date",    form.date?.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" })],
                ["Time",    form.slot],
                ["Patient", form.name],
              ].map(([k, v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #dce8f5", fontSize:13 }}>
                  <span style={{ color:"#64748b" }}>{k}</span>
                  <span style={{ color:"#0b2545", fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ background:"rgba(34,197,94,0.05)", border:"1px solid #bbf7d0", borderRadius:8, padding:"10px 14px", marginBottom:18, fontSize:11, color:"#64748b", textAlign:"left" }}>
              🔒 Your consent has been recorded as required by the DPDP Act, 2023.
              You may withdraw consent at any time by contacting {clinic?.name}.
            </div>

            {clinic?.whatsapp && (
              <a href={`https://wa.me/${clinic.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:"#25d366", color:"white", borderRadius:10, padding:"12px", fontSize:14, fontWeight:600, textDecoration:"none", marginBottom:10 }}>
                💬 Send us a WhatsApp message
              </a>
            )}

            <button onClick={() => {
              setStep(1);
              setForm({ service:"", date:null, slot:"", name:"", phone:"", notes:"" });
              setBooked(null);
              setConsentGiven(false);
              setTakenSlots([]);
            }} style={{ width:"100%", padding:"11px", background:"white", border:"1.5px solid #dce8f5", borderRadius:10, color:"#64748b", fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
              Book another appointment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
