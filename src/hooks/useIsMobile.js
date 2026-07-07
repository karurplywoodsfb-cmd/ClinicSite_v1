// src/hooks/useIsMobile.js
// Since every template uses inline React styles (not CSS classes),
// there's no way to write a real @media query for them. This hook
// tracks viewport width so templates can switch layout values
// (grid columns, padding, nav visibility) in JS instead.

import { useState, useEffect } from "react";

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}
