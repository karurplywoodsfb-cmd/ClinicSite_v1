// src/lib/designSafeguards.js
//
// ── The Secret Builder Rule ──────────────────────────────────────────────
// Two guarantees enforced across "Premium Archetype" templates so a clinic
// can never accidentally cheapen the design, no matter what they upload:
//
//   1. STRICT PADDING CAPS   — every section's whitespace has a hard floor
//      per archetype. There is no `clinic.padding` field, and even if one
//      existed, <Section> strips a `padding` key out of any incoming style
//      object before applying it — so it's structurally impossible to
//      squeeze a section tighter than the archetype allows.
//
//   2. IMAGE TONE OVERLAYS   — every clinic-uploaded photo (doctor photo,
//      gallery image, hero image) is automatically run through an
//      archetype-tuned filter + color-matched overlay via <SafeImage>.
//      A mediocre phone photo gets pulled toward the palette instead of
//      breaking it. This is unconditional — there's no prop to bypass it.
//
// Add a new archetype by adding one entry to each map below; every
// template that imports <Section>/<SafeImage> with that archetypeId
// picks up the rule automatically.

export const SPACING = {
  cybermed: { section: 96, sectionMobile: 64 },
  playful:  { section: 88, sectionMobile: 56 },
};

export const SAFEGUARD_CSS = Object.entries(SPACING)
  .map(([id, s]) => `
    .sb-section-${id} { padding: ${s.section}px 24px; box-sizing: border-box; }
    @media (max-width: 640px) {
      .sb-section-${id} { padding: ${s.sectionMobile}px 20px !important; }
    }
  `)
  .join("\n");

/**
 * Drop-in replacement for <section>. Accepts a `style` prop like any other
 * element, but silently discards `padding`/`paddingTop`/etc keys so callers
 * cannot thin out the archetype's whitespace floor.
 */
export function Section({ archetypeId, id, background, children, style = {}, className = "" }) {
  // eslint-disable-next-line no-unused-vars
  const { padding, paddingTop, paddingBottom, paddingLeft, paddingRight, ...safeStyle } = style;
  return (
    <section id={id} className={`sb-section-${archetypeId} ${className}`} style={{ background, ...safeStyle }}>
      {children}
    </section>
  );
}

export const IMAGE_FILTERS = {
  // Cool, slightly desaturated + contrast-boosted — keeps casual photos from
  // reading as "warm and soft" against an obsidian/cyan tech palette.
  cybermed: "saturate(0.82) contrast(1.1) brightness(0.94)",
  // Warm, gently boosted saturation — keeps photos friendly and bright
  // without tipping into oversaturated/garish.
  playful:  "saturate(1.14) brightness(1.05) contrast(1.02)",
};

export const IMAGE_OVERLAYS = {
  cybermed: "linear-gradient(160deg, rgba(0,229,255,0.12), rgba(11,15,25,0.38))",
  playful:  "linear-gradient(160deg, rgba(231,111,81,0.10), rgba(69,123,157,0.12))",
};

/**
 * Drop-in replacement for <img>. Always applies the archetype's filter +
 * color-matched overlay — no prop exists to turn it off. Falls back to
 * `fallback` (e.g. an emoji/icon placeholder) when there's no src.
 */
export function SafeImage({ archetypeId, src, alt = "", style = {}, fallback = null }) {
  if (!src) return fallback;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", ...style }}>
      <img
        src={src}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: IMAGE_FILTERS[archetypeId] || "none" }}
      />
      <div
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, background: IMAGE_OVERLAYS[archetypeId] || "none", mixBlendMode: "overlay", pointerEvents: "none" }}
      />
    </div>
  );
}
