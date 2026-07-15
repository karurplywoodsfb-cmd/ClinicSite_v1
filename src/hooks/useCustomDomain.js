// src/hooks/useCustomDomain.js
// Detects if the app is running on a custom clinic domain
// Returns { isCustomDomain, clinicSlug, loading }
// Used in App.jsx to render the correct clinic site directly

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const PLATFORM_DOMAINS = [
  "waspace.in",
  "www.waspace.in",
  "kdcv101.vercel.app",
  "localhost",
  "127.0.0.1",
];

export function useCustomDomain() {
  const [state, setState] = useState({
    isCustomDomain: false,
    clinicSlug:     null,
    loading:        true,
  });

  useEffect(() => {
    const hostname = window.location.hostname;
    const isPlatform = PLATFORM_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`));

    if (isPlatform) {
      setState({ isCustomDomain: false, clinicSlug: null, loading: false });
      return;
    }

    // Not a platform domain — look up clinic by custom_domain
    supabase
      .from("clinics")
      .select("slug")
      .eq("custom_domain", hostname)
      .eq("domain_status", "verified")
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setState({ isCustomDomain: true, clinicSlug: null, loading: false });
        } else {
          setState({ isCustomDomain: true, clinicSlug: data.slug, loading: false });
        }
      });
  }, []);

  return state;
}
