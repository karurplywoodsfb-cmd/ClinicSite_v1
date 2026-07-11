// src/components/admin/WorkingHoursPage.jsx
// AdminPanel "Working Hours" tab. Extracted from AdminPanel.jsx as part of
// the admin-panel split.
//
// IMPORTANT: saveHourField always upserts (creates the day's row if it
// doesn't exist yet, updates it if it does) before touching local state.
// A previous version only wrote to the DB when a row already existed —
// editing the time fields on a day that had never had its checkbox
// toggled silently did nothing, in the UI and the DB. That could leave a
// clinic's public booking calendar treating days with no row as
// permanently closed. Don't reintroduce a conditional `if (h.id)` write
// path here without preserving the upsert-first guarantee.

import { supabase, updateWorkingHour } from "../../lib/supabase";

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_ORDER = [1,2,3,4,5,6,0]; // Monday-first display order

export default function WorkingHoursPage({ clinic, hours, setHours }) {
  return (
    <div style={{ maxWidth:560 }}>
      <div style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>
        Set your clinic's opening hours. Changes save immediately.
      </div>
      {DAY_ORDER.map(dayIdx => {
        const h = hours.find(x => x.day_of_week === dayIdx) || {
          day_of_week: dayIdx, is_open: dayIdx !== 0,
          open_time:"09:00", close_time:"18:00",
        };
        const isToday = new Date().getDay() === dayIdx;

        const saveHourField = async (patch) => {
          const existing = hours.find(x => x.day_of_week === dayIdx);
          if (existing?.id) {
            await updateWorkingHour(existing.id, patch);
            setHours(prev => prev.map(x => x.day_of_week === dayIdx ? { ...x, ...patch } : x));
          } else {
            const base = { day_of_week: dayIdx, is_open: dayIdx !== 0, open_time:"09:00", close_time:"18:00", ...patch };
            const { data, error } = await supabase.from("working_hours")
              .insert({ clinic_id: clinic.id, ...base }).select().single();
            if (error) { alert("Couldn't save hours for " + DAY_NAMES[dayIdx] + ": " + error.message); return; }
            setHours(prev => [...prev, data]);
          }
        };

        return (
          <div key={dayIdx} style={{
            display:"flex", alignItems:"center", gap:14,
            padding:"12px 16px", borderRadius:10, marginBottom:8,
            background: isToday ? "rgba(21,101,192,0.06)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${isToday ? "rgba(21,101,192,0.2)" : "rgba(255,255,255,0.07)"}`,
          }}>
            <div style={{ width:90, fontSize:13, fontWeight: isToday ? 700 : 500, color: isToday ? "#7dd3fc" : "#94a3b8" }}>
              {DAY_NAMES[dayIdx]}
              {isToday && <span style={{ fontSize:9, color:"#1e88e5", marginLeft:4 }}>TODAY</span>}
            </div>
            <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", userSelect:"none" }}>
              <input type="checkbox" checked={h.is_open || false}
                onChange={e => saveHourField({ is_open: e.target.checked })}
                style={{ width:16, height:16, cursor:"pointer" }}/>
              <span style={{ fontSize:12, color: h.is_open ? "#22c55e" : "#475569" }}>
                {h.is_open ? "Open" : "Closed"}
              </span>
            </label>
            {h.is_open && (
              <>
                <input type="time" value={h.open_time || "09:00"}
                  onChange={e => saveHourField({ open_time: e.target.value })}
                  style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                    color:"#e2e8f0", borderRadius:6, padding:"5px 8px", fontSize:12, fontFamily:"inherit" }}/>
                <span style={{ color:"#334155", fontSize:12 }}>to</span>
                <input type="time" value={h.close_time || "18:00"}
                  onChange={e => saveHourField({ close_time: e.target.value })}
                  style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                    color:"#e2e8f0", borderRadius:6, padding:"5px 8px", fontSize:12, fontFamily:"inherit" }}/>
              </>
            )}
          </div>
        );
      })}
      <div style={{ marginTop:20, padding:"10px 14px", background:"rgba(21,101,192,0.06)",
        border:"1px solid rgba(21,101,192,0.15)", borderRadius:8, fontSize:12, color:"#64748b" }}>
        💡 Changes save instantly. Your clinic website shows these hours automatically.
      </div>
    </div>
  );
}
