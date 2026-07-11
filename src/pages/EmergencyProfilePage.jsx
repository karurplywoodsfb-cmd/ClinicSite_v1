// src/pages/EmergencyProfilePage.jsx
// Route: /emergency/:token — public, no login. Security model is the
// unguessable token itself (same trust model as a MedicAlert bracelet),
// not authentication. Shows ONLY non-sensitive-in-context fields.

import { useState, useEffect } from "react";
import { getEmergencyProfile } from "../lib/supabase";

export default function EmergencyProfilePage({ token }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setProfile(await getEmergencyProfile(token)); }
      catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [token]);

  const wrap = { minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans', sans-serif" };
  const card = { background: "white", borderRadius: 20, padding: 32, maxWidth: 400, width: "100%" };

  if (loading) return <div style={wrap}><div style={{ color: "white" }}>Loading…</div></div>;
  if (!profile) return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>❓</div>
        <p style={{ textAlign: "center", color: "#64748b" }}>Profile not found.</p>
      </div>
    </div>
  );

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>🚨</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", textAlign: "center", marginBottom: 20 }}>Emergency Medical Info</h1>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>Name</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{profile.name}</div>
        </div>

        {profile.blood_group && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>Blood Group</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#dc2626" }}>{profile.blood_group}</div>
          </div>
        )}

        {profile.allergies && (
          <div style={{ marginBottom: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, color: "#991b1b", fontWeight: 700, marginBottom: 2 }}>⚠️ ALLERGIES</div>
            <div style={{ fontSize: 14, color: "#7f1d1d" }}>{profile.allergies}</div>
          </div>
        )}

        {profile.emergency_contact_name && (
          <div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>Emergency Contact</div>
            <div style={{ fontSize: 15, color: "#0f172a" }}>{profile.emergency_contact_name}</div>
            {profile.emergency_contact_phone && (
              <a href={`tel:${profile.emergency_contact_phone}`} style={{ fontSize: 15, color: "#1565c0", fontWeight: 700, textDecoration: "none" }}>
                📞 {profile.emergency_contact_phone}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
