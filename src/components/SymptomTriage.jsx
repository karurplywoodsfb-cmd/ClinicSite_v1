// src/components/SymptomTriage.jsx
// AI-powered symptom triage → smart service recommendation.
// Uses Groq (via the "groq-generate" Supabase Edge Function, which
// keeps GROQ_API_KEY server-side — never call the AI provider
// directly from the browser).
// No other Indian clinic website builder has this.
//
// Flow:
//   Patient types symptoms → AI identifies likely condition
//   → recommends matching service from clinic's own service list
//   → pre-fills booking form with that service
//   → shows confidence + disclaimer

import { useState, useRef } from "react";
import { supabase } from "../lib/supabase";

const EXAMPLES = [
  "tooth pain when eating cold food",
  "skin rash on face for 3 days",
  "knee pain when climbing stairs",
  "chest tightness in the morning",
  "child has fever and cough",
];

export default function SymptomTriage({ services = [], specialty = "General", onServiceSelect, style = {} }) {
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState("");
  const [showTriage,  setShowTriage]  = useState(false);
  const inputRef = useRef(null);

  const serviceNames = services
    .filter(s => s.is_active !== false)
    .map(s => s.name)
    .join(", ");

  const handleTriage = async () => {
    const trimmed = input.trim();
    if (!trimmed || trimmed.length < 5) {
      setError("Please describe your symptoms in a few words");
      return;
    }
    setLoading(true); setError(""); setResult(null);

    try {
      const system = `You are a medical triage assistant for a ${specialty} clinic in India.
Your job is to map patient-described symptoms to the most relevant service from the clinic's service list.

CLINIC SERVICES: ${serviceNames || "General Consultation"}

RULES:
1. Always recommend ONE service from the clinic's actual service list above
2. If no service exactly matches, recommend "General Consultation" or the closest available
3. Never diagnose — only suggest which type of appointment is most relevant
4. Keep language simple, warm, in Indian English
5. Add a brief 1-line explanation of why this service is relevant
6. Always include a disclaimer to consult the doctor in person
7. Respond ONLY in this JSON format, no markdown, no extra text:
{
  "recommended_service": "exact service name from list",
  "reason": "one sentence why this service",
  "urgency": "routine|soon|urgent",
  "urgency_note": "brief note about timing",
  "disclaimer": "This is not a diagnosis. Please consult our doctor in person."
}`;

      const { data, error: fnError } = await supabase.functions.invoke("groq-generate", {
        body: { system, prompt: `Patient symptoms: ${trimmed}`, max_tokens: 400, json: true },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const clean = (data?.text || "").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      // Verify recommended service exists in clinic's list
      const matched = services.find(s =>
        s.name.toLowerCase() === parsed.recommended_service?.toLowerCase() &&
        s.is_active !== false
      );

      setResult({
        ...parsed,
        service: matched || null,
      });
    } catch (e) {
      setError("Couldn't analyse symptoms right now. Please select a service manually.");
    } finally {
      setLoading(false);
    }
  };

  const urgencyColors = {
    routine: { bg:"rgba(34,197,94,0.08)", border:"rgba(34,197,94,0.25)", text:"#15803d", label:"Routine" },
    soon:    { bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.25)", text:"#b45309", label:"See us soon" },
    urgent:  { bg:"rgba(239,68,68,0.08)", border:"rgba(239,68,68,0.25)", text:"#dc2626", label:"See us today" },
  };

  if (!showTriage) {
    return (
      <button
        onClick={() => { setShowTriage(true); setTimeout(() => inputRef.current?.focus(), 100); }}
        style={{
          display:"flex", alignItems:"center", gap:8,
          background:"rgba(21,101,192,0.06)", border:"1.5px solid rgba(21,101,192,0.2)",
          borderRadius:10, padding:"10px 16px", cursor:"pointer",
          fontSize:13, color:"#1565c0", fontFamily:"inherit",
          width:"100%", ...style,
        }}>
        <span style={{ fontSize:18 }}>🤖</span>
        <span style={{ fontWeight:600 }}>Not sure which service? Describe your symptoms</span>
        <span style={{ marginLeft:"auto", opacity:.6 }}>→</span>
      </button>
    );
  }

  return (
    <div style={{
      background:"#f8faff", border:"1.5px solid rgba(21,101,192,0.2)",
      borderRadius:12, padding:18, fontFamily:"'DM Sans',sans-serif", ...style,
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#0b2545" }}>
          🤖 Describe your symptoms
        </div>
        <button onClick={() => { setShowTriage(false); setResult(null); setInput(""); }}
          style={{ background:"none", border:"none", color:"#94a3b8", fontSize:16, cursor:"pointer", lineHeight:1 }}>✕</button>
      </div>

      {/* Input */}
      <div style={{ position:"relative", marginBottom:10 }}>
        <textarea ref={inputRef}
          value={input} placeholder="e.g. my tooth hurts when I drink cold water..."
          onChange={e => { setInput(e.target.value); setError(""); setResult(null); }}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTriage(); } }}
          rows={2}
          style={{
            width:"100%", padding:"10px 14px", border:"1.5px solid #dce8f5",
            borderRadius:8, fontSize:14, color:"#0b2545",
            fontFamily:"inherit", resize:"none", outline:"none",
            boxSizing:"border-box", background:"white",
          }}/>
      </div>

      {/* Quick examples */}
      {!result && !loading && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
          {EXAMPLES.filter(e =>
            // Show only examples relevant to specialty
            specialty.toLowerCase().includes("dental") ? e.includes("tooth") || e.includes("child")
            : specialty.toLowerCase().includes("skin") ? e.includes("skin") || e.includes("rash")
            : true
          ).slice(0, 3).map(ex => (
            <button key={ex} onClick={() => { setInput(ex); setResult(null); }}
              style={{
                background:"white", border:"1px solid #dce8f5", borderRadius:20,
                padding:"4px 10px", fontSize:11, color:"#64748b",
                cursor:"pointer", fontFamily:"inherit",
              }}>
              {ex}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div style={{ fontSize:12, color:"#ef4444", marginBottom:10 }}>{error}</div>
      )}

      {/* Analyse button */}
      {!result && (
        <button onClick={handleTriage} disabled={loading || input.trim().length < 5}
          style={{
            width:"100%", padding:"10px", border:"none", borderRadius:8,
            background: loading || input.trim().length < 5 ? "#e2e8f0" : "#1565c0",
            color: loading || input.trim().length < 5 ? "#94a3b8" : "white",
            fontSize:13, fontWeight:600, cursor: loading ? "wait" : "pointer",
            fontFamily:"inherit", transition:"all .2s",
          }}>
          {loading ? "Analysing your symptoms..." : "Find the right service →"}
        </button>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign:"center", padding:"16px 0", fontSize:12, color:"#64748b" }}>
          <div style={{ fontSize:24, animation:"pulse 1s infinite" }}>🔍</div>
          <div style={{ marginTop:8 }}>Checking with our AI assistant...</div>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
        </div>
      )}

      {/* Result */}
      {result && (
        <div>
          {/* Urgency badge */}
          {result.urgency && (
            <div style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"4px 10px", borderRadius:20, marginBottom:10,
              background:  urgencyColors[result.urgency]?.bg,
              border:     `1px solid ${urgencyColors[result.urgency]?.border}`,
              fontSize:11, fontWeight:700,
              color: urgencyColors[result.urgency]?.text,
            }}>
              {result.urgency === "urgent" ? "🚨" : result.urgency === "soon" ? "⚠️" : "✅"}
              {urgencyColors[result.urgency]?.label}
              {result.urgency_note && ` — ${result.urgency_note}`}
            </div>
          )}

          {/* Recommended service */}
          <div style={{
            background:"white", border:"1.5px solid #1565c0",
            borderRadius:10, padding:"14px 16px", marginBottom:10,
          }}>
            <div style={{ fontSize:11, color:"#1565c0", fontWeight:700, marginBottom:4, letterSpacing:.5 }}>
              RECOMMENDED SERVICE
            </div>
            <div style={{ fontSize:16, fontWeight:700, color:"#0b2545", marginBottom:4 }}>
              {result.recommended_service}
            </div>
            <div style={{ fontSize:12, color:"#64748b", lineHeight:1.5 }}>
              {result.reason}
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ fontSize:10, color:"#94a3b8", lineHeight:1.5, marginBottom:12, fontStyle:"italic" }}>
            ⚕️ {result.disclaimer}
          </div>

          {/* Action buttons */}
          <div style={{ display:"flex", gap:8 }}>
            {result.service ? (
              <button onClick={() => { onServiceSelect?.(result.service); setShowTriage(false); }}
                style={{
                  flex:2, padding:"11px", border:"none", borderRadius:8,
                  background:"#1565c0", color:"white",
                  fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                  boxShadow:"0 4px 14px rgba(21,101,192,0.3)",
                }}>
                Book {result.recommended_service} →
              </button>
            ) : (
              <button onClick={() => { setShowTriage(false); }}
                style={{
                  flex:2, padding:"11px", border:"none", borderRadius:8,
                  background:"#1565c0", color:"white",
                  fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                }}>
                Choose Service Manually →
              </button>
            )}
            <button onClick={() => { setResult(null); setInput(""); }}
              style={{
                flex:1, padding:"11px", background:"white",
                border:"1.5px solid #dce8f5", borderRadius:8,
                color:"#64748b", fontSize:13, cursor:"pointer", fontFamily:"inherit",
              }}>
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
