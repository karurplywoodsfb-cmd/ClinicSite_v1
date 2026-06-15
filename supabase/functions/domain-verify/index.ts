// supabase/functions/domain-verify/index.ts
// Edge Function — manages custom domains via Vercel API
// Required env vars (set in Supabase dashboard → Edge Functions → Secrets):
//   VERCEL_TOKEN     — your Vercel API token
//   VERCEL_PROJECT_ID — your Vercel project ID (from project settings)
//   VERCEL_TEAM_ID   — optional, only if project is under a team

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERCEL_TOKEN      = Deno.env.get("VERCEL_TOKEN")!;
const VERCEL_PROJECT_ID = Deno.env.get("VERCEL_PROJECT_ID")!;
const VERCEL_TEAM_ID    = Deno.env.get("VERCEL_TEAM_ID") || "";
// These are auto-injected by Supabase — do NOT add them as secrets manually
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const teamParam = VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : "";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Vercel API helpers ────────────────────────────────────────
async function vercelRequest(method: string, path: string, body?: object) {
  const res = await fetch(`https://api.vercel.com${path}?${teamParam.slice(1)}`, {
    method,
    headers: {
      "Authorization": `Bearer ${VERCEL_TOKEN}`,
      "Content-Type":  "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function addDomainToVercel(domain: string) {
  return vercelRequest("POST", `/v10/projects/${VERCEL_PROJECT_ID}/domains`, { name: domain });
}

async function removeDomainFromVercel(domain: string) {
  return vercelRequest("DELETE", `/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`);
}

async function checkDomainOnVercel(domain: string) {
  return vercelRequest("GET", `/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`);
}

// ── Main handler ──────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, domain, clinicId } = await req.json();
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ── ADD ───────────────────────────────────────────────────
    if (action === "add") {
      const { ok, data } = await addDomainToVercel(domain);

      if (!ok && data?.error?.code !== "domain_already_in_use") {
        // Update error status in DB
        await sb.from("clinics").update({
          domain_status: "error",
          domain_error:  data?.error?.message || "Failed to add domain to Vercel",
        }).eq("id", clinicId);

        return new Response(JSON.stringify({ success: false, error: data?.error?.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Domain added — return DNS instructions
      // Vercel returns verification records we need to show the clinic
      const verification = data?.verification || [];
      const dnsInstructions = buildDnsInstructions(domain, verification);

      return new Response(JSON.stringify({
        success: true,
        dnsInstructions,
        vercelData: data,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── CHECK ─────────────────────────────────────────────────
    if (action === "check") {
      const { ok, data } = await checkDomainOnVercel(domain);

      if (!ok) {
        return new Response(JSON.stringify({ verified: false, status: "error", error: data?.error?.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const verified = data?.verified === true;
      const status   = verified ? "verified" : "pending";

      // Update DB
      await sb.from("clinics").update({
        domain_status:      status,
        domain_verified_at: verified ? new Date().toISOString() : null,
        domain_error:       null,
      }).eq("id", clinicId);

      return new Response(JSON.stringify({
        verified,
        status,
        vercelData: data,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── REMOVE ────────────────────────────────────────────────
    if (action === "remove") {
      await removeDomainFromVercel(domain);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// ── Build human-readable DNS instructions ──────────────────────
function buildDnsInstructions(domain: string, verification: any[]) {
  const isSubdomain = domain.split(".").length > 2; // e.g. www.drsmith.in
  const rootDomain  = domain.split(".").slice(-2).join("."); // drsmith.in

  const instructions = [];

  if (isSubdomain) {
    instructions.push({
      type:  "CNAME",
      host:  domain.replace(`.${rootDomain}`, ""), // e.g. "www"
      value: "cname.vercel-dns.com",
      ttl:   "Auto / 3600",
    });
  } else {
    // Apex domain — use A records
    instructions.push(
      { type: "A", host: "@", value: "76.76.21.21", ttl: "Auto / 3600" },
    );
  }

  // Add any Vercel verification TXT records if present
  for (const v of verification || []) {
    if (v.type === "TXT") {
      instructions.push({
        type:  "TXT",
        host:  v.domain.replace(`.${rootDomain}`, "") || "@",
        value: v.value,
        ttl:   "Auto / 3600",
        note:  "Verification record — can be removed after domain is verified",
      });
    }
  }

  return { domain, rootDomain, isSubdomain, records: instructions };
}