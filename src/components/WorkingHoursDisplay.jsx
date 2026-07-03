// src/components/WorkingHoursDisplay.jsx
// Shows clinic working hours on the public-facing site.
// Highlights today, shows open/closed status in real time.

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function isOpenNow(hours) {
  if (!hours || hours.length === 0) return null;
  const now     = new Date();
  const dayIdx  = now.getDay();
  const today   = hours.find(h => h.day_of_week === dayIdx);
  if (!today || !today.is_open) return false;
  const [oh, om] = (today.open_time  || "09:00").split(":").map(Number);
  const [ch, cm] = (today.close_time || "18:00").split(":").map(Number);
  const mins     = now.getHours() * 60 + now.getMinutes();
  return mins >= oh * 60 + om && mins < ch * 60 + cm;
}

function fmt(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm   = h >= 12 ? "PM" : "AM";
  const hr     = h % 12 || 12;
  return `${hr}${m ? `:${String(m).padStart(2,"0")}` : ""} ${ampm}`;
}

export default function WorkingHoursDisplay({ hours = [], style = {} }) {
  if (!hours || hours.length === 0) return null;

  const todayIdx  = new Date().getDay();
  const openStatus = isOpenNow(hours);

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", ...style }}>
      {/* Open/Closed badge */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <span style={{
          display:"inline-flex", alignItems:"center", gap:6,
          padding:"4px 12px", borderRadius:20,
          background: openStatus ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.10)",
          border: `1px solid ${openStatus ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.25)"}`,
          fontSize:12, fontWeight:700,
          color: openStatus ? "#16a34a" : "#dc2626",
        }}>
          <span style={{
            width:7, height:7, borderRadius:"50%",
            background: openStatus ? "#22c55e" : "#ef4444",
            display:"inline-block",
            animation: openStatus ? "pulse 2s infinite" : "none",
          }}/>
          {openStatus ? "Open Now" : "Closed"}
        </span>
      </div>

      {/* Hours grid */}
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        {hours.sort((a,b) => {
          // Sort Mon–Sat first, Sun last
          const order = [1,2,3,4,5,6,0];
          return order.indexOf(a.day_of_week) - order.indexOf(b.day_of_week);
        }).map(h => {
          const isToday = h.day_of_week === todayIdx;
          return (
            <div key={h.day_of_week} style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"6px 10px", borderRadius:6,
              background: isToday ? "rgba(21,101,192,0.08)" : "transparent",
              border: isToday ? "1px solid rgba(21,101,192,0.15)" : "1px solid transparent",
            }}>
              <span style={{
                fontSize:13, fontWeight: isToday ? 700 : 400,
                color: isToday ? "#1565c0" : "#475569",
                width:36,
              }}>
                {SHORT[h.day_of_week]}
              </span>
              <span style={{
                fontSize:13, color: h.is_open ? "#334155" : "#94a3b8",
                fontWeight: isToday ? 600 : 400,
              }}>
                {h.is_open ? `${fmt(h.open_time)} – ${fmt(h.close_time)}` : "Closed"}
              </span>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
