// src/components/ThemeProvider.jsx
// FIX: Reads from src/lib/themes.js (single source of truth).
//      No more duplicate theme maps.

import { useEffect } from "react";
import { applyTheme, removeTheme } from "../lib/themes";

export default function ThemeProvider({ theme }) {
  useEffect(() => {
    applyTheme(theme);
    return () => removeTheme();
  }, [theme]);

  return null; // purely side-effectful
}

// Debug helper: call window.checkTheme() in browser console
if (typeof window !== "undefined") {
  window.checkTheme = () => {
    const root = getComputedStyle(document.documentElement);
    return {
      primary: root.getPropertyValue("--color-primary").trim() || "NOT SET",
      bg:      root.getPropertyValue("--color-bg").trim()      || "NOT SET",
      text:    root.getPropertyValue("--color-text").trim()    || "NOT SET",
    };
  };
}
