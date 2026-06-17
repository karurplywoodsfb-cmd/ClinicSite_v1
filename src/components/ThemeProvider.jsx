// src/components/ThemeProvider.jsx — FIXED v3
// Injects theme CSS variables directly into :root — works in production

import { useEffect, useState } from "react";

// Theme definitions mapped by the IDs used in AdminPanel
// Admin saves: default, forest, sunset, lavender, gold, midnight, rose, teal, charcoal, sage
const THEMES = {
  "default": {
    "--color-primary": "#1565c0",
    "--color-primary-light": "#1e88e5",
    "--color-accent": "#0288d1",
    "--color-bg": "#f4f8fd",
    "--color-surface": "#ffffff",
    "--color-text": "#0b2545",
    "--color-muted": "#5a7a96",
    "--color-border": "#dce8f5",
  },
  "ocean": {
    "--color-primary": "#1565c0",
    "--color-primary-light": "#1e88e5",
    "--color-accent": "#0288d1",
    "--color-bg": "#f4f8fd",
    "--color-surface": "#ffffff",
    "--color-text": "#0b2545",
    "--color-muted": "#5a7a96",
    "--color-border": "#dce8f5",
  },
  "forest": {
    "--color-primary": "#2e7d32",
    "--color-primary-light": "#43a047",
    "--color-accent": "#66bb6a",
    "--color-bg": "#f1f8e9",
    "--color-surface": "#ffffff",
    "--color-text": "#1b5e20",
    "--color-muted": "#558b2f",
    "--color-border": "#c8e6c9",
  },
  "sunset": {
    "--color-primary": "#e64a19",
    "--color-primary-light": "#f57c00",
    "--color-accent": "#ff9800",
    "--color-bg": "#fff3e0",
    "--color-surface": "#ffffff",
    "--color-text": "#bf360c",
    "--color-muted": "#e65100",
    "--color-border": "#ffe0b2",
  },
  "lavender": {
    "--color-primary": "#7b1fa2",
    "--color-primary-light": "#9c27b0",
    "--color-accent": "#ab47bc",
    "--color-bg": "#f3e5f5",
    "--color-surface": "#ffffff",
    "--color-text": "#4a148c",
    "--color-muted": "#7b1fa2",
    "--color-border": "#e1bee7",
  },
  "gold": {
    "--color-primary": "#f57f17",
    "--color-primary-light": "#fb8c00",
    "--color-accent": "#ffa000",
    "--color-bg": "#fff8e1",
    "--color-surface": "#ffffff",
    "--color-text": "#e65100",
    "--color-muted": "#f57f17",
    "--color-border": "#ffecb3",
  },
  "midnight": {
    "--color-primary": "#5c6bc0",
    "--color-primary-light": "#7986cb",
    "--color-accent": "#9fa8da",
    "--color-bg": "#0d1117",
    "--color-surface": "#161b22",
    "--color-text": "#e6edf3",
    "--color-muted": "#8b949e",
    "--color-border": "#30363d",
  },
  "rose": {
    "--color-primary": "#c2185b",
    "--color-primary-light": "#d81b60",
    "--color-accent": "#e91e63",
    "--color-bg": "#fce4ec",
    "--color-surface": "#ffffff",
    "--color-text": "#880e4f",
    "--color-muted": "#c2185b",
    "--color-border": "#f8bbd0",
  },
  "teal": {
    "--color-primary": "#00695c",
    "--color-primary-light": "#00796b",
    "--color-accent": "#009688",
    "--color-bg": "#e0f2f1",
    "--color-surface": "#ffffff",
    "--color-text": "#004d40",
    "--color-muted": "#00695c",
    "--color-border": "#b2dfdb",
  },
  "charcoal": {
    "--color-primary": "#455a64",
    "--color-primary-light": "#607d8b",
    "--color-accent": "#78909c",
    "--color-bg": "#eceff1",
    "--color-surface": "#ffffff",
    "--color-text": "#263238",
    "--color-muted": "#455a64",
    "--color-border": "#cfd8dc",
  },
  "sage": {
    "--color-primary": "#558b2f",
    "--color-primary-light": "#689f38",
    "--color-accent": "#7cb342",
    "--color-bg": "#f1f8e9",
    "--color-surface": "#ffffff",
    "--color-text": "#33691e",
    "--color-muted": "#558b2f",
    "--color-border": "#c8e6c9",
  },
};

const DEFAULT_VARS = {
  "--color-primary": "#1565c0",
  "--color-primary-light": "#1e88e5",
  "--color-accent": "#0288d1",
  "--color-bg": "#f4f8fd",
  "--color-surface": "#ffffff",
  "--color-text": "#0b2545",
  "--color-muted": "#5a7a96",
  "--color-border": "#dce8f5",
  "--color-success": "#2e7d32",
  "--color-warning": "#f57f17",
  "--color-danger": "#c62828",
  "--font-heading": "'DM Serif Display', Georgia, serif",
  "--font-body": "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  "--radius-sm": "8px",
  "--radius-md": "12px",
  "--radius-lg": "16px",
  "--radius-xl": "24px",
  "--shadow-sm": "0 2px 8px rgba(11, 37, 69, 0.06)",
  "--shadow-md": "0 8px 24px rgba(11, 37, 69, 0.1)",
  "--shadow-lg": "0 16px 48px rgba(11, 37, 69, 0.14)",
  "--transition": "0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  "--max-width": "1200px",
  "--section-py": "80px",
};

export default function ThemeProvider({ theme }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);

    const themeId = theme?.trim() || "default";
    const themeVars = THEMES[themeId] || THEMES["default"];

    // Merge with defaults (so missing vars fall back)
    const merged = { ...DEFAULT_VARS, ...themeVars };

    // Apply all CSS variables to :root
    Object.entries(merged).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });

    console.log(`[ThemeProvider] Applied theme: ${themeId}`);
    setLoaded(true);

    // Cleanup: reset to default on unmount
    return () => {
      Object.keys(DEFAULT_VARS).forEach((key) => {
        document.documentElement.style.removeProperty(key);
      });
    };
  }, [theme]);

  return null;
}

// Debug helper: call window.checkTheme() in browser console
if (typeof window !== "undefined") {
  window.checkTheme = () => {
    const root = getComputedStyle(document.documentElement);
    const primary = root.getPropertyValue("--color-primary").trim();
    const bg = root.getPropertyValue("--color-bg").trim();
    const text = root.getPropertyValue("--color-text").trim();
    console.log("Current theme variables:");
    console.log(" --color-primary:", primary || "NOT SET");
    console.log(" --color-bg:", bg || "NOT SET");
    console.log(" --color-text:", text || "NOT SET");
    return { primary, bg, text };
  };
}