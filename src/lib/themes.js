// src/lib/themes.js — single source of truth for all theme definitions
// Imported by: ThemeProvider.jsx, ClinicSite.jsx, AdminPanel (theme picker)

export const THEME_VARS = {
  // Key used to identify this theme (matches what is stored in clinics.color_theme)
  default:  { "--color-primary":"#1565c0","--color-primary-light":"#1e88e5","--color-accent":"#0288d1","--color-bg":"#f4f8fd","--color-surface":"#ffffff","--color-text":"#0b2545","--color-muted":"#5a7a96","--color-border":"#dce8f5" },
  ocean:    { "--color-primary":"#1565c0","--color-primary-light":"#1e88e5","--color-accent":"#0288d1","--color-bg":"#f4f8fd","--color-surface":"#ffffff","--color-text":"#0b2545","--color-muted":"#5a7a96","--color-border":"#dce8f5" },
  forest:   { "--color-primary":"#2e7d32","--color-primary-light":"#43a047","--color-accent":"#66bb6a","--color-bg":"#f1f8e9","--color-surface":"#ffffff","--color-text":"#1b5e20","--color-muted":"#558b2f","--color-border":"#c8e6c9" },
  sunset:   { "--color-primary":"#e64a19","--color-primary-light":"#f57c00","--color-accent":"#ff9800","--color-bg":"#fff3e0","--color-surface":"#ffffff","--color-text":"#bf360c","--color-muted":"#e65100","--color-border":"#ffe0b2" },
  lavender: { "--color-primary":"#7b1fa2","--color-primary-light":"#9c27b0","--color-accent":"#ab47bc","--color-bg":"#f3e5f5","--color-surface":"#ffffff","--color-text":"#4a148c","--color-muted":"#7b1fa2","--color-border":"#e1bee7" },
  gold:     { "--color-primary":"#f57f17","--color-primary-light":"#fb8c00","--color-accent":"#ffa000","--color-bg":"#fff8e1","--color-surface":"#ffffff","--color-text":"#e65100","--color-muted":"#f57f17","--color-border":"#ffecb3" },
  midnight: { "--color-primary":"#5c6bc0","--color-primary-light":"#7986cb","--color-accent":"#9fa8da","--color-bg":"#0d1117","--color-surface":"#161b22","--color-text":"#e6edf3","--color-muted":"#8b949e","--color-border":"#30363d" },
  rose:     { "--color-primary":"#c2185b","--color-primary-light":"#d81b60","--color-accent":"#e91e63","--color-bg":"#fce4ec","--color-surface":"#ffffff","--color-text":"#880e4f","--color-muted":"#c2185b","--color-border":"#f8bbd0" },
  teal:     { "--color-primary":"#00695c","--color-primary-light":"#00796b","--color-accent":"#009688","--color-bg":"#e0f2f1","--color-surface":"#ffffff","--color-text":"#004d40","--color-muted":"#00695c","--color-border":"#b2dfdb" },
  charcoal: { "--color-primary":"#455a64","--color-primary-light":"#607d8b","--color-accent":"#78909c","--color-bg":"#eceff1","--color-surface":"#ffffff","--color-text":"#263238","--color-muted":"#455a64","--color-border":"#cfd8dc" },
  sage:     { "--color-primary":"#558b2f","--color-primary-light":"#689f38","--color-accent":"#7cb342","--color-bg":"#f1f8e9","--color-surface":"#ffffff","--color-text":"#33691e","--color-muted":"#558b2f","--color-border":"#c8e6c9" },
};

// CSS vars applied to every theme (design tokens that don't change per theme)
export const GLOBAL_VARS = {
  "--color-success":     "#2e7d32",
  "--color-warning":     "#f57f17",
  "--color-danger":      "#c62828",
  "--color-whatsapp":    "#25d366",
  "--font-heading":      "'DM Serif Display', Georgia, serif",
  "--font-body":         "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  "--radius-sm":         "8px",
  "--radius-md":         "12px",
  "--radius-lg":         "16px",
  "--radius-xl":         "24px",
  "--shadow-sm":         "0 2px 8px rgba(11,37,69,0.06)",
  "--shadow-md":         "0 8px 24px rgba(11,37,69,0.10)",
  "--shadow-lg":         "0 16px 48px rgba(11,37,69,0.14)",
  "--transition":        "0.25s cubic-bezier(0.4,0,0.2,1)",
  "--max-width":         "1200px",
  "--section-py":        "80px",
};

/**
 * Normalise any stored theme ID to our short key.
 * DB may store "theme-006-midnight" or just "midnight" — both → "midnight"
 */
export function normaliseThemeId(raw) {
  if (!raw) return "default";
  const m = raw.match(/^theme-\d+-(.+)$/);
  return m ? m[1] : raw;
}

/**
 * Apply a theme to :root CSS custom properties.
 * Safe to call from any component — idempotent.
 */
export function applyTheme(rawThemeId) {
  const id   = normaliseThemeId(rawThemeId);
  const vars = { ...GLOBAL_VARS, ...(THEME_VARS[id] ?? THEME_VARS.default) };
  Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
}

/**
 * Remove all theme vars on unmount (used by ThemeProvider cleanup).
 */
export function removeTheme() {
  [...Object.keys(GLOBAL_VARS), ...Object.keys(THEME_VARS.default)].forEach(k =>
    document.documentElement.style.removeProperty(k)
  );
}
