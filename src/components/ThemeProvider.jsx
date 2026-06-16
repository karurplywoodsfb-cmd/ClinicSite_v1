// src/components/ThemeProvider.jsx
// Injects selected theme CSS variables into :root
// Usage: <ThemeProvider theme={clinic.theme}/>

import { useEffect } from "react";

// Fallback default theme (ocean blue — matches current default template)
const DEFAULT_THEME = {
  "--color-primary":       "#1565c0",
  "--color-primary-light": "#1e88e5",
  "--color-accent":        "#0288d1",
  "--color-bg":            "#f4f8fd",
  "--color-surface":       "#ffffff",
  "--color-text":          "#0b2545",
  "--color-muted":         "#5a7a96",
  "--color-border":        "#dce8f5",
  "--font-heading":        "'DM Serif Display', serif",
  "--font-body":           "'DM Sans', sans-serif",
  "--border-radius-card":  "14px",
  "--shadow-card":         "0 8px 24px rgba(11,37,69,0.1)",
};

export default function ThemeProvider({ theme }) {
  useEffect(() => {
    const applyVars = (vars) => {
      Object.entries(vars).forEach(([key, val]) => {
        document.documentElement.style.setProperty(key, val);
      });
    };

    if (!theme || theme === "default") {
      applyVars(DEFAULT_THEME);
      return;
    }

    // Dynamically import the theme CSS file
    import(`../themes/${theme}.css`)
      .then(() => {
        // CSS is injected — vars are set via :root in the CSS file
      })
      .catch(() => {
        // Theme file not found — fall back to default
        console.warn(`Theme "${theme}" not found, using default.`);
        applyVars(DEFAULT_THEME);
      });

    return () => {
      // Cleanup: reset to default when unmounting
      applyVars(DEFAULT_THEME);
    };
  }, [theme]);

  return null;
}
