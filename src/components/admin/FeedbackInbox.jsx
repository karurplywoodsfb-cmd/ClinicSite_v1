// src/components/admin/FeedbackInbox.jsx
// Drop into AdminPanel.jsx as a tab/section.
// Usage: <FeedbackInbox clinicId={clinic.id} />

import { useState, useEffect } from "react";
import { getPrivateFeedback, updateFeedbackStatus } from "../../lib/supabase";

const STATUS_LABEL = { new: "New", acknowledged: "In progress", resolved: "Resolved" };
const STATUS_COLOR = { new: "#dc2626", acknowledged: "#b45309", resolved: "#16a34a" };

export default function FeedbackInbox({ clinicId }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState(null); // null = all

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPrivateFeedback(clinicId, filter);
      setItems(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [clinicId, filter]);

  const advance = async (item) => {
    const next = item.status === "new" ? "acknowledged" : "resolved";
    try {
      await updateFeedbackStatus(item.id, next);
      load();
    } catch (e) {
      alert(e.message || "Could not update status.");
    }
  };

  const newCount = items.filter((i) => i.status === "new").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
          Patient complaints {newCount > 0 && <span style={{ background: "#dc2626", color: "white", fontSize: 11, borderRadius: 10, padding: "2px 8px", marginLeft: 8 }}>{newCount} new</span>}
        </div>
        <select value={filter || ""} onChange={(e) => setFilter(e.target.value || null)} style={{ fontSize: 13, padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
          <option value="">All</option>
          <option value="new">New</option>
          <option value="acknowledged">In progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {loading && <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading…</div>}
      {!loading && items.length === 0 && (
        <div style={{ color: "#94a3b8", fontSize: 13, padding: 20, textAlign: "center", border: "1px dashed #e2e8f0", borderRadius: 12 }}>
          No complaints here — 1-3★ feedback from the review page will show up in this inbox privately.
        </div>
      )}

      {items.map((item) => (
        <div key={item.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 14 }}>
              {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
              <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, color: STATUS_COLOR[item.status] }}>{STATUS_LABEL[item.status]}</span>
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>{new Date(item.created_at).toLocaleString("en-IN")}</div>
          </div>
          {item.comment && <div style={{ fontSize: 14, color: "#334155", marginBottom: 8 }}>{item.comment}</div>}
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
            {item.patient_name || "Anonymous"}{item.patient_phone ? ` · ${item.patient_phone}` : ""}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {item.patient_phone && (
              <a href={`https://wa.me/${item.patient_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, fontWeight: 600, color: "#25d366", textDecoration: "none", border: "1px solid #25d366", borderRadius: 6, padding: "6px 10px" }}>
                💬 WhatsApp patient
              </a>
            )}
            {item.status !== "resolved" && (
              <button onClick={() => advance(item)} style={{ fontSize: 12, fontWeight: 600, color: "white", background: "#0f172a", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
                Mark {item.status === "new" ? "in progress" : "resolved"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
