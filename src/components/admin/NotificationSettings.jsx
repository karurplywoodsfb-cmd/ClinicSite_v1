// src/components/admin/NotificationSettings.jsx
// Push notification settings panel — shown in AdminPanel under Appointments tab
// or as a standalone settings section
// Props: clinic, supabase

import { usePushNotifications } from "../../hooks/usePushNotifications";

export default function NotificationSettings({ clinic, supabase }) {
  const {
    isSupported, isSubscribed, isDenied,
    permission, loading, error,
    subscribe, unsubscribe, sendTest,
  } = usePushNotifications({ supabase, clinicId: clinic?.id });

  const S = {
    card: {
      background: "rgba(255,255,255,0.03)",
      border:     "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding:    20,
    },
    btn: {
      border: "none", borderRadius: 8, padding: "10px 20px",
      fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
    },
  };

  if (!isSupported) return (
    <div style={{ ...S.card, borderColor: "rgba(239,68,68,0.2)" }}>
      <div style={{ fontSize: 14, color: "#f87171" }}>
        ⚠ Push notifications are not supported in this browser.
        Use Chrome or Edge on desktop for notifications.
      </div>
    </div>
  );

  return (
    <div style={{ ...S.card, maxWidth: 480 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
        🔔 Appointment Notifications
      </div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
        Get instant browser notifications when patients book appointments.
      </div>

      {/* Status indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
        padding: "10px 14px", borderRadius: 8,
        background: isSubscribed
          ? "rgba(22,163,74,0.1)"
          : isDenied
          ? "rgba(239,68,68,0.1)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${isSubscribed ? "rgba(22,163,74,0.2)" : isDenied ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)"}`,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%",
          background: isSubscribed ? "#16a34a" : isDenied ? "#dc2626" : "#475569",
          boxShadow: isSubscribed ? "0 0 0 3px rgba(22,163,74,0.2)" : "none",
        }}/>
        <div style={{ fontSize: 13, fontWeight: 600,
          color: isSubscribed ? "#4ade80" : isDenied ? "#f87171" : "#64748b" }}>
          {isSubscribed ? "Notifications Active"
            : isDenied  ? "Permission Blocked"
            : "Notifications Off"}
        </div>
      </div>

      {isDenied && (
        <div style={{ fontSize: 13, color: "#f87171", marginBottom: 16, lineHeight: 1.6 }}>
          Notifications are blocked. To enable: click the 🔒 lock icon in your browser's address bar
          → Site settings → Notifications → Allow.
        </div>
      )}

      {error && (
        <div style={{ fontSize: 13, color: "#f87171", marginBottom: 14,
          padding: "8px 12px", background: "rgba(239,68,68,0.08)",
          borderRadius: 6, border: "1px solid rgba(239,68,68,0.15)" }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {!isSubscribed && !isDenied && (
          <button onClick={subscribe} disabled={loading}
            style={{ ...S.btn, background: "#1565c0", color: "white",
              opacity: loading ? .6 : 1 }}>
            {loading ? "Enabling…" : "🔔 Enable Notifications"}
          </button>
        )}

        {isSubscribed && (
          <>
            <button onClick={sendTest}
              style={{ ...S.btn, background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
              🧪 Send Test
            </button>
            <button onClick={unsubscribe} disabled={loading}
              style={{ ...S.btn, background: "rgba(239,68,68,0.1)", color: "#f87171",
                opacity: loading ? .6 : 1 }}>
              {loading ? "Disabling…" : "Turn Off"}
            </button>
          </>
        )}
      </div>

      {isSubscribed && (
        <div style={{ fontSize: 11, color: "#334155", marginTop: 14, lineHeight: 1.6 }}>
          ✓ You'll receive notifications in this browser when patients book.
          Notifications only work when this browser is open.
        </div>
      )}
    </div>
  );
}
