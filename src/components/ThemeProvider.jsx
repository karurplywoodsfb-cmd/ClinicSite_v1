// src/components/ThemeProvider.jsx — BULLETPROOF VERSION
// Injects selected theme CSS variables into :root with full error handling

import { useEffect, useState } from "react";

// Complete default theme with ALL variables that ClinicSite.css expects
const DEFAULT_THEME = {
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

// List of valid theme IDs (must match filenames in src/themes/)
const VALID_THEMES = [
  "theme-001-ocean", "theme-002-forest", "theme-003-sunset",
  "theme-004-lavender", "theme-005-gold", "theme-006-midnight",
  "theme-007-rose", "theme-008-teal", "theme-009-charcoal",
  "theme-010-sage", "theme-011-crimson", "theme-012-arctic",
  "theme-013-amber", "theme-014-plum", "theme-015-olive",
  "theme-016-slate", "theme-017-copper", "theme-018-indigo",
  "theme-019-mint", "theme-020-graphite",
];

export default function ThemeProvider({ theme }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    setLoaded(false);

    // Validate theme ID
    const themeId = theme?.trim();
    const isValidTheme = themeId && VALID_THEMES.includes(themeId);

    if (!isValidTheme || themeId === "default") {
      console.log(`[ThemeProvider] Using default theme (themeId: ${themeId || "none"})`);
      applyVars(DEFAULT_THEME);
      setLoaded(true);
      return;
    }

    console.log(`[ThemeProvider] Loading theme: ${themeId}`);

    // Method 1: Try dynamic import (Vite handles this)
    const cssPath = `/src/themes/${themeId}.css`;

    // Check if CSS file already loaded
    const existingLink = document.querySelector(`link[data-theme="${themeId}"]`);
    if (existingLink) {
      console.log(`[ThemeProvider] Theme ${themeId} already loaded`);
      setLoaded(true);
      return;
    }

    // Create link element to load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    link.setAttribute("data-theme", themeId);

    link.onload = () => {
      console.log(`[ThemeProvider] ✓ Theme ${themeId} loaded successfully`);
      setLoaded(true);
      setError(null);
    };

    link.onerror = (e) => {
      console.error(`[ThemeProvider] ✗ Failed to load theme ${themeId}:`, e);
      console.error(`[ThemeProvider] Tried path: ${cssPath}`);
      console.error(`[ThemeProvider] Make sure src/themes/${themeId}.css exists`);
      setError(`Theme file not found: ${themeId}.css`);
      applyVars(DEFAULT_THEME);
      setLoaded(true);
    };

    document.head.appendChild(link);

    // Cleanup: remove previous theme links
    return () => {
      const oldLinks = document.querySelectorAll('link[data-theme]');
      oldLinks.forEach((old) => {
        if (old.getAttribute("data-theme") !== themeId) {
          old.remove();
        }
      });
    };
  }, [theme]);

  // Apply CSS variables directly as fallback
  function applyVars(vars) {
    Object.entries(vars).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });
  }

  // Debug output (only in development)
  if (import.meta.env.DEV && error) {
    return (
      <div style={{
        position: "fixed", bottom: 8, right: 8, zIndex: 9999,
        background: "#c62828", color: "#fff", padding: "8px 16px",
        borderRadius: "8px", fontSize: "0.8rem", maxWidth: "400px",
      }}>
        <strong>Theme Error:</strong> {error}
      </div>
    );
  }

  return null;
}

// Debug helper: call this in browser console to check current theme
// window.checkTheme()
if (typeof window !== "undefined") {
  window.checkTheme = () => {
    const root = getComputedStyle(document.documentElement);
    const primary = root.getPropertyValue("--color-primary").trim();
    const bg = root.getPropertyValue("--color-bg").trim();
    const text = root.getPropertyValue("--color-text").trim();
    console.log("Current theme variables:");
    console.log("  --color-primary:", primary || "NOT SET");
    console.log("  --color-bg:", bg || "NOT SET");
    console.log("  --color-text:", text || "NOT SET");

    const themeLink = document.querySelector('link[data-theme]');
    console.log("Loaded theme file:", themeLink?.getAttribute("data-theme") || "none");

    return { primary, bg, text, themeFile: themeLink?.getAttribute("data-theme") };
  };
}