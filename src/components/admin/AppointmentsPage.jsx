// src/components/admin/AppointmentsPage.jsx
// AdminPanel "Appointments" tab — monthly quota banner, notification
// settings, filterable appointment table with status actions.
// Extracted from AdminPanel.jsx. The real-time subscription that keeps
// `appts` fresh (subscribeToAppointments) stays in the parent — it's wired
// up once on mount alongside the other data fetches, not specific to this
// page being visible, so it doesn't belong in this component's lifecycle.

import { Badge } from "./ui";
import { supabase, updateAppointmentStatus } from "../../lib/supabase";
import NotificationSettings from "./NotificationSettings";

export default function AppointmentsPage({
  clinic, appts, setAppts, branches,
  apptFilter, setApptFilter, planContext, onRequestUpgrade,
}) {
  const filteredAppts = apptFilter === "all"
    ? appts
    : appts.filter(a => a.status === apptFilter);

  const limit   = planContext.limits?.features?.appointments_monthly ?? 50;
  const used    = limit - planContext.getRemaining("appointments_monthly");
  const pct     = planContext.getUsagePercent("appointments_monthly");
  const isUnlim = limit >= 999999;
  const atLimit = !isUnlim && used >= limit;

  return (
    <div>
      {!isUnlim && (
        <div style={{
          display:"flex", alignItems:"center", gap:14, marginBottom:16,
          background: atLimit ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)",
          border: `1px solid ${atLimit ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)"}`,
          borderRadius:10, padding:"12px 16px",
        }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, color:"#64748b", marginBottom:6 }}>
              Monthly appointments: <strong style={{ color: atLimit ? "#ef4444" : "#e2e8f0" }}>{used} / {limit}</strong>
            </div>
            <div style={{ height:5, background:"rgba(255,255,255,0.06)", borderRadius:99 }}>
              <div style={{
                height:5, borderRadius:99, transition:"width .5s",
                background: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e",
                width: `${Math.min(pct, 100)}%`,
              }}/>
            </div>
          </div>
          {atLimit && (
            <button onClick={onRequestUpgrade} style={{
              flexShrink:0, padding:"7px 14px", background:"#1565c0", color:"white",
              border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
            }}>Upgrade</button>
          )}
        </div>
      )}

      <div style={{ marginBottom:24 }}>
        <NotificationSettings clinic={clinic} supabase={supabase}/>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {["all","pending","confirmed","completed"].map(f => (
          <button key={f} onClick={() => setApptFilter(f)} style={{
            background: apptFilter === f ? "rgba(21,101,192,0.15)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${apptFilter === f ? "rgba(21,101,192,0.4)" : "rgba(255,255,255,0.08)"}`,
            color: apptFilter === f ? "#7dd3fc" : "#64748b",
            borderRadius:8, padding:"7px 16px", cursor:"pointer",
            fontSize:12, fontFamily:"monospace", textTransform:"capitalize",
          }}>
            {f} ({f === "all" ? appts.length : appts.filter(a => a.status === f).length})
          </button>
        ))}
      </div>

      <div style={{ background:"rgba(255,255,255,0.02)",
        border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
              {["Patient","Phone","Service","Date & Time","Consent","Status","Actions"].map(h => (
                <th key={h} style={{ padding:"12px 16px", textAlign:"left",
                  fontSize:11, fontFamily:"monospace", color:"#475569", fontWeight:600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAppts.length === 0 && (
              <tr><td colSpan={7} style={{ padding:32, textAlign:"center",
                color:"#334155", fontSize:13 }}>No appointments found</td></tr>
            )}
            {filteredAppts.map((a, i) => (
              <tr key={a.id || i}
                style={{ borderBottom: i < filteredAppts.length - 1
                  ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding:"12px 16px", fontSize:13, fontWeight:600, color:"#e2e8f0" }}>
                  {a.patient_name}
                </td>
                <td style={{ padding:"12px 16px", fontSize:13, color:"#94a3b8" }}>{a.phone}</td>
                <td style={{ padding:"12px 16px", fontSize:13, color:"#94a3b8" }}>
                  <div>{a.service}</div>
                  {a.branch_id && branches.find(b => b.id === a.branch_id) && (
                    <div style={{ fontSize:11, color:"#1e88e5", marginTop:2 }}>
                      📍 {branches.find(b => b.id === a.branch_id)?.name}
                    </div>
                  )}
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ fontSize:13, color:"#e2e8f0" }}>{a.appt_date}</div>
                  <div style={{ fontSize:11, color:"#475569" }}>{a.appt_time}</div>
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <span style={{ fontSize:11, fontFamily:"monospace",
                    color: a.consent_appointment ? "#22c55e" : "#ef4444" }}>
                    {a.consent_appointment ? "✓ DPDP" : "✗ Missing"}
                  </span>
                </td>
                <td style={{ padding:"12px 16px" }}><Badge status={a.status}/></td>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ display:"flex", gap:6 }}>
                    {a.status === "pending" && (
                      <button onClick={() =>
                        updateAppointmentStatus(a.id, "confirmed")
                          .then(u => setAppts(p => p.map(x => x.id === a.id ? u : x)))}
                        style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)",
                          color:"#22c55e", borderRadius:6, padding:"4px 10px",
                          fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                        Confirm
                      </button>
                    )}
                    {a.status === "confirmed" && (
                      <button onClick={() =>
                        updateAppointmentStatus(a.id, "completed")
                          .then(u => setAppts(p => p.map(x => x.id === a.id ? u : x)))}
                        style={{ background:"rgba(100,116,139,0.1)", border:"1px solid rgba(100,116,139,0.3)",
                          color:"#64748b", borderRadius:6, padding:"4px 10px",
                          fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                        Complete
                      </button>
                    )}
                    <a href={`https://wa.me/${(a.phone || "").replace(/\D/g,"")}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ background:"rgba(37,211,102,0.1)", border:"1px solid rgba(37,211,102,0.3)",
                        color:"#25d366", borderRadius:6, padding:"4px 10px",
                        fontSize:11, textDecoration:"none" }}>💬</a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
