// src/pages/LiveQueuePage.jsx
// Route: /:slug/live
// Two view modes:
//   - TV mode: large-type, no interaction, auto-selected on big screens (assume
//     a lobby display is landscape + wide; patients can also force it via ?tv=1)
//   - Phone mode: compact, lets the patient find their own token and opt into
//     a "leave now" travel alert.

import { useState, useEffect, useMemo } from "react";
import { getClinicBySlug, getPublicQueue, setTravelAlert, subscribeToQueue } from "../lib/supabase";
import { getEtaMinutes } from "../lib/queueEngine";

function useIsTvDisplay() {
  const [isTv, setIsTv] = useState(false);
  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("tv");
    if (forced === "1") { setIsTv(true); return; }
    if (forced === "0") { setIsTv(false); return; }
    // Heuristic: lobby displays are wide, landscape, and (usually) not touch devices.
    const check = () => setIsTv(window.innerWidth >= 1024 && window.innerWidth > window.innerHeight);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isTv;
}

export default function LiveQueuePage({ slug }) {
  const [clinic, setClinic]   = useState(null);
  const [tokens, setTokens]   = useState([]);
  const [loading, setLoading] = useState(true);
  const isTv = useIsTvDisplay();

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        const c = await getClinicBySlug(slug);
        setClinic(c);
        if (c) {
          const q = await getPublicQueue(c.id);
          setTokens(q);
          unsub = subscribeToQueue(c.id, async () => setTokens(await getPublicQueue(c.id)));
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
    return () => unsub();
  }, [slug]);

  const waiting = useMemo(() => tokens.filter(t => t.status === "waiting").sort((a, b) => a.position - b.position), [tokens]);
  const serving = useMemo(() => tokens.filter(t => t.status === "serving"), [tokens]);
  const avgMinutes = clinic?.avg_appt_minutes_default || 15;

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: "#64748b" }}>Loading…</div>;
  }
  if (!clinic) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>Clinic not found.</div>;
  }

  return isTv
    ? <TvView clinic={clinic} serving={serving} waiting={waiting} avgMinutes={avgMinutes} />
    : <PhoneView clinic={clinic} serving={serving} waiting={waiting} avgMinutes={avgMinutes} />;
}

// ── Lobby TV display: huge type, zero interaction, readable from across a room ──
function TvView({ clinic, serving, waiting, avgMinutes }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "white", fontFamily: "'DM Sans', sans-serif", padding: "40px 60px", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 28, opacity: 0.6, marginBottom: 20 }}>{clinic.name} — Live Token Status</div>

      <div style={{ display: "flex", gap: 60, flex: 1 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 28, opacity: 0.5, marginBottom: 12 }}>NOW SERVING</div>
          {serving.length === 0 ? (
            <div style={{ fontSize: 48, opacity: 0.4 }}>—</div>
          ) : serving.map(t => (
            <div key={t.id} style={{ fontSize: 140, fontWeight: 800, lineHeight: 1.1, color: "#4ade80" }}>#{t.token_number}</div>
          ))}
        </div>

        <div style={{ flex: 1.4, borderLeft: "2px solid rgba(255,255,255,0.1)", paddingLeft: 60 }}>
          <div style={{ fontSize: 28, opacity: 0.5, marginBottom: 12 }}>UP NEXT</div>
          {waiting.slice(0, 6).map((t, i) => (
            <div key={t.id} style={{ display: "flex", alignItems: "baseline", gap: 24, marginBottom: 16, opacity: i === 0 ? 1 : 0.7 }}>
              <div style={{ fontSize: i === 0 ? 64 : 44, fontWeight: 800 }}>#{t.token_number}</div>
              <div style={{ fontSize: 22, opacity: 0.5 }}>~{i * avgMinutes} min</div>
            </div>
          ))}
          {waiting.length === 0 && <div style={{ fontSize: 36, opacity: 0.4 }}>Queue is empty</div>}
        </div>
      </div>

      <div style={{ fontSize: 18, opacity: 0.35, marginTop: 30 }}>Estimated ~{avgMinutes} min per patient · updates live</div>
    </div>
  );
}

// ── Phone view: patient looks up their token, can request a travel alert ──
function PhoneView({ clinic, serving, waiting, avgMinutes }) {
  const [myToken, setMyToken]   = useState(null);
  const [lookupNum, setLookupNum] = useState("");
  const [travelSet, setTravelSet] = useState(false);
  const [travelMin, setTravelMin] = useState(10);
  const [saving, setSaving]     = useState(false);

  const findMyToken = () => {
    const num = parseInt(lookupNum, 10);
    const found = waiting.find(t => t.token_number === num);
    setMyToken(found || null);
  };

  const eta = myToken ? getEtaMinutes(myToken, waiting, avgMinutes) : null;

  const handleSetTravelAlert = async () => {
    if (!myToken) return;
    setSaving(true);
    try {
      await setTravelAlert(myToken.id, travelMin);
      setTravelSet(true);
    } catch (e) {
      alert(e.message || "Could not set alert.");
    }
    setSaving(false);
  };

  const wrap = { minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif", padding: 20 };
  const card = { background: "white", borderRadius: 20, padding: 24, boxShadow: "0 8px 32px rgba(15,23,42,0.06)", marginBottom: 16 };

  return (
    <div style={wrap}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16, textAlign: "center" }}>{clinic.name}</div>

      <div style={{ ...card, textAlign: "center", background: "#0f172a", color: "white" }}>
        <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>NOW SERVING</div>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#4ade80" }}>
          {serving.length > 0 ? `#${serving[0].token_number}` : "—"}
        </div>
      </div>

      {!myToken && (
        <div style={card}>
          <div style={{ fontSize: 14, color: "#334155", marginBottom: 10, fontWeight: 600 }}>Find your token</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={lookupNum} onChange={e => setLookupNum(e.target.value)} placeholder="Token number" type="number"
              style={{ flex: 1, borderRadius: 10, border: "1px solid #e2e8f0", padding: 12, fontSize: 15, fontFamily: "inherit" }} />
            <button onClick={findMyToken} style={{ background: "#1565c0", color: "white", border: "none", borderRadius: 10, padding: "0 18px", fontWeight: 700, cursor: "pointer" }}>Go</button>
          </div>
        </div>
      )}

      {myToken && (
        <div style={card}>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>Your token</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>#{myToken.token_number}</div>
          <div style={{ fontSize: 14, color: "#475569", marginBottom: 16 }}>
            {waiting.findIndex(t => t.id === myToken.id)} people ahead · est. ~{eta} min
          </div>

          {!travelSet ? (
            <>
              <div style={{ fontSize: 13, color: "#334155", marginBottom: 8 }}>How far away are you? We'll alert you when it's time to leave.</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                {[5, 10, 15, 20, 30].map(m => (
                  <button key={m} onClick={() => setTravelMin(m)}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                      border: travelMin === m ? "2px solid #1565c0" : "1px solid #e2e8f0",
                      background: travelMin === m ? "#eff6ff" : "white", color: travelMin === m ? "#1565c0" : "#64748b" }}>
                    {m}m
                  </button>
                ))}
              </div>
              <button onClick={handleSetTravelAlert} disabled={saving}
                style={{ width: "100%", background: "#0f172a", color: "white", border: "none", borderRadius: 10, padding: "12px 0", fontWeight: 700, cursor: "pointer" }}>
                {saving ? "Setting…" : "🔔 Alert me when it's time to leave"}
              </button>
            </>
          ) : (
            <div style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✓ We'll message you on WhatsApp when it's time to head over.</div>
          )}
        </div>
      )}

      <div style={{ textAlign: "center", fontSize: 12, color: "#94a3b8" }}>Updates automatically · avg {avgMinutes} min/patient</div>
    </div>
  );
}
