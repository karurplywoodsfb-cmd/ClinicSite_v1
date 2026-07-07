// src/components/ClinicBanner.jsx
// Renders at the top of the public clinic site when clinic.banner_enabled is true.
// Toggle + message are set from AdminPanel (see BannerControl.jsx).

const STYLES = {
  info:      { bg: "#1565c0", icon: "ℹ️" },
  holiday:   { bg: "#b45309", icon: "🏖️" },
  emergency: { bg: "#b91c1c", icon: "🚨" },
};

export default function ClinicBanner({ clinic }) {
  if (!clinic?.banner_enabled || !clinic?.banner_message) return null;
  const style = STYLES[clinic.banner_type] || STYLES.info;

  return (
    <div
      role="alert"
      style={{
        background: style.bg,
        color: "white",
        padding: "10px 16px",
        textAlign: "center",
        fontSize: 14,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        position: "sticky",
        top: 0,
        zIndex: 999,
      }}
    >
      <span style={{ marginRight: 8 }}>{style.icon}</span>
      {clinic.banner_message}
    </div>
  );
}
