// src/components/admin/ReceptionistDashboard.jsx
// Thumb-friendly, high-contrast queue control panel. Designed for a phone
// held one-handed at a busy front desk — big tap targets, minimal reading.

import { useState, useEffect, useCallback } from "react";
import {
  getTodayQueue, getRecentDoneTokens, addQueueToken,
  callNextToken, markTokenDone, skipToken, resurrectToken, updateTokenPositions,
} from "../../lib/supabase";
import {
  getRollingAvgMinutes, computeSnoozePositions, computeResurrectPosition,
  computeNewTokenPosition, getNextTokenNumber,
} from "../../lib/queueEngine";
import { subscribeToQueue } from "../../lib/supabase";

const STATUS_BG = { waiting: "#eff6ff", serving: "#f0fdf4", skipped: "#fef2f2" };

export default function ReceptionistDashboard({ clinicId, avgApptMinutesDefault = 15 }) {
  const [tokens, setTokens]   = useState([]);
  const [avgMinutes, setAvg]  = useState(avgApptMinutesDefault);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId]   = useState(null);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinName, setCheckinName] = useState("");
  const [checkinPhone, setCheckinPhone] = useState("");
  const [checkinBusy, setCheckinBusy]   = useState(false);

  const load = useCallback(async () => {
    try {
      const [today, done] = await Promise.all([
        getTodayQueue(clinicId),
        getRecentDoneTokens(clinicId),
      ]);
      setTokens(today);
      setAvg(getRollingAvgMinutes(done, avgApptMinutesDefault));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [clinicId, avgApptMinutesDefault]);

  useEffect(() => {
    load();
    const unsub = subscribeToQueue(clinicId, load);
    return unsub;
  }, [clinicId, load]);

  const waiting  = tokens.filter(t => t.status === "waiting").sort((a, b) => a.position - b.position);
  const serving  = tokens.filter(t => t.status === "serving");
  const skipped  = tokens.filter(t => t.status === "skipped");
  const nextUp   = waiting[0];

  const withBusy = async (id, fn) => {
    setBusyId(id);
    try { await fn(); await load(); }
    catch (e) { alert(e.message || "Something went wrong."); }
    setBusyId(null);
  };

  const handleCallNext = () => nextUp && withBusy(nextUp.id, () => callNextToken(nextUp.id));
  const handleDone     = (t) => withBusy(t.id, () => markTokenDone(t.id));
  const handleSkip     = (t) => withBusy(t.id, () => skipToken(t.id, t.skipped_count));

  const handleSnooze = (t) =>
    withBusy(t.id, async () => {
      const updates = computeSnoozePositions(waiting, t.id);
      if (updates.length === 0) return; // nothing ahead to snooze past
      await updateTokenPositions(updates);
      // TODO (edge function): fire "you've moved to position N" WhatsApp — see queue-notify function
    });

  const handleResurrect = (t) =>
    withBusy(t.id, async () => {
      const pos = computeResurrectPosition(waiting);
      await resurrectToken(t.id, pos);
    });

  const handleCheckIn = async () => {
    if (!checkinName.trim() || !checkinPhone.trim()) return;
    setCheckinBusy(true);
    try {
      const position = computeNewTokenPosition(waiting);
      const tokenNumber = getNextTokenNumber(tokens);
      await addQueueToken(clinicId, {
        patientName: checkinName.trim(),
        patientPhone: checkinPhone.trim(),
        position,
        tokenNumber,
      });
      setCheckinName(""); setCheckinPhone(""); setCheckinOpen(false);
      await load();
    } catch (e) {
      alert(e.message || "Could not check in patient.");
    }
    setCheckinBusy(false);
  };

  const btnBase = {
    border: "none", borderRadius: 14, fontWeight: 700, cursor: "pointer",
    fontFamily: "inherit", touchAction: "manipulation",
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Check in a patient (walk-in or arrived-appointment) ── */}
      {!checkinOpen && (
        <button
          onClick={() => setCheckinOpen(true)}
          style={{ ...btnBase, width: "100%", background: "#eff6ff", color: "#1565c0", border: "1.5px dashed #93c5fd", padding: "16px 0", fontSize: 15, marginBottom: 14 }}
        >
          + Check In Patient
        </button>
      )}
      {checkinOpen && (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, marginBottom: 14 }}>
          <input value={checkinName} onChange={e => setCheckinName(e.target.value)} placeholder="Patient name"
            style={{ width: "100%", borderRadius: 10, border: "1px solid #e2e8f0", padding: 12, fontSize: 15, fontFamily: "inherit", marginBottom: 8 }} />
          <input value={checkinPhone} onChange={e => setCheckinPhone(e.target.value)} placeholder="Phone number"
            style={{ width: "100%", borderRadius: 10, border: "1px solid #e2e8f0", padding: 12, fontSize: 15, fontFamily: "inherit", marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleCheckIn} disabled={checkinBusy}
              style={{ ...btnBase, flex: 1, background: "#1565c0", color: "white", padding: "12px 0", fontSize: 14 }}>
              {checkinBusy ? "Adding…" : "Add to queue"}
            </button>
            <button onClick={() => setCheckinOpen(false)}
              style={{ ...btnBase, background: "white", border: "1px solid #e2e8f0", color: "#64748b", padding: "12px 16px", fontSize: 14 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Now serving / Call Next ── */}
      <div style={{ background: "#0f172a", borderRadius: 20, padding: 20, marginBottom: 16, color: "white" }}>
        <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>NOW SERVING</div>
        {serving.length === 0 && <div style={{ fontSize: 15, opacity: 0.5 }}>No one currently being seen</div>}
        {serving.map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>#{t.token_number} · {t.patient_name}</div>
            </div>
            <button
              onClick={() => handleDone(t)}
              disabled={busyId === t.id}
              style={{ ...btnBase, background: "#16a34a", color: "white", padding: "14px 20px", fontSize: 15 }}
            >
              ✓ Done
            </button>
          </div>
        ))}

        <button
          onClick={handleCallNext}
          disabled={!nextUp || busyId === nextUp?.id}
          style={{
            ...btnBase, width: "100%", marginTop: 12, padding: "20px 0", fontSize: 18,
            background: nextUp ? "#1565c0" : "#334155", color: "white",
          }}
        >
          {nextUp ? `📢 Call Next — #${nextUp.token_number} ${nextUp.patient_name}` : "Queue is empty"}
        </button>
      </div>

      {/* ── Waiting list ── */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 8, paddingLeft: 4 }}>
        WAITING ({waiting.length}) · avg {avgMinutes} min/patient
      </div>
      {loading && <div style={{ color: "#94a3b8", padding: 20 }}>Loading queue…</div>}
      {!loading && waiting.length === 0 && (
        <div style={{ color: "#94a3b8", fontSize: 13, padding: 20, textAlign: "center", border: "1px dashed #e2e8f0", borderRadius: 14 }}>
          No one waiting right now.
        </div>
      )}
      {waiting.map((t, i) => (
        <div key={t.id} style={{ background: STATUS_BG.waiting, borderRadius: 16, padding: "14px 16px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>#{t.token_number} {t.patient_name}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{i === 0 ? "Next up" : `${i * avgMinutes} min est. wait`}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => handleSnooze(t)} disabled={busyId === t.id}
              style={{ ...btnBase, background: "white", border: "1px solid #cbd5e1", color: "#475569", padding: "10px 12px", fontSize: 13 }}>
              😴 +2
            </button>
            <button onClick={() => handleSkip(t)} disabled={busyId === t.id}
              style={{ ...btnBase, background: "white", border: "1px solid #cbd5e1", color: "#475569", padding: "10px 12px", fontSize: 13 }}>
              ⏭️ Skip
            </button>
          </div>
        </div>
      ))}

      {/* ── Skipped / missed tray ── */}
      {skipped.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", margin: "20px 0 8px", paddingLeft: 4 }}>
            SKIPPED / MISSED ({skipped.length})
          </div>
          {skipped.map(t => (
            <div key={t.id} style={{ background: STATUS_BG.skipped, borderRadius: 16, padding: "14px 16px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>#{t.token_number} {t.patient_name}</div>
              <button onClick={() => handleResurrect(t)} disabled={busyId === t.id}
                style={{ ...btnBase, background: "#0f172a", color: "white", padding: "10px 16px", fontSize: 13 }}>
                ↩️ Bring back next
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
