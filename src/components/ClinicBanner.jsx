// src/components/ClinicBanner.jsx
// Renders at the top of the public clinic site when clinic.banner_enabled is true.
// Toggle + message are set from AdminPanel (see BannerControl.jsx).
//
// Uses `position: sticky; top: 0`. Every template's navbar also uses
// `position: sticky; top: 0` (not `fixed`) for exactly this reason — sticky
// siblings stack correctly in document flow (banner first, nav right below
// it, both then stick in order as you scroll) with zero extra offset math.
// If a template ever needs `position: fixed` for its nav, it must account
// for this banner's height itself; don't reintroduce fixed nav without that.

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


