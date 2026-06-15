// src/lib/domainApi.js
// Handles all custom domain operations — Supabase + Vercel via Edge Function

import { supabase } from "./supabase";

// ── Save domain & trigger Vercel add ────────────────────────────
export async function addCustomDomain(clinicId, domain) {
  const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");

  // 1. Save to Supabase
  const { error: dbError } = await supabase
    .from("clinics")
    .update({
      custom_domain:   cleaned,
      domain_status:   "pending",
      domain_added_at: new Date().toISOString(),
      domain_error:    null,
    })
    .eq("id", clinicId);

  if (dbError) throw new Error(dbError.message);

  // 2. Call edge function to add domain to Vercel project
  const { data, error: fnError } = await supabase.functions.invoke("domain-verify", {
    body: { action: "add", domain: cleaned, clinicId },
  });

  if (fnError) throw new Error(fnError.message);
  return data;
}

// ── Remove domain ────────────────────────────────────────────────
export async function removeCustomDomain(clinicId, domain) {
  const { error: fnError } = await supabase.functions.invoke("domain-verify", {
    body: { action: "remove", domain, clinicId },
  });
  if (fnError) throw new Error(fnError.message);

  const { error: dbError } = await supabase
    .from("clinics")
    .update({
      custom_domain:      null,
      domain_status:      "not_configured",
      domain_added_at:    null,
      domain_verified_at: null,
      domain_error:       null,
    })
    .eq("id", clinicId);

  if (dbError) throw new Error(dbError.message);
}

// ── Check verification status ─────────────────────────────────
export async function checkDomainStatus(clinicId, domain) {
  const { data, error } = await supabase.functions.invoke("domain-verify", {
    body: { action: "check", domain, clinicId },
  });
  if (error) throw new Error(error.message);
  return data; // { verified: bool, status: string, error?: string }
}

// ── Get clinic's current domain info ─────────────────────────
export async function getDomainInfo(clinicId) {
  const { data, error } = await supabase
    .from("clinics")
    .select("custom_domain, domain_status, domain_added_at, domain_verified_at, domain_error")
    .eq("id", clinicId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}
