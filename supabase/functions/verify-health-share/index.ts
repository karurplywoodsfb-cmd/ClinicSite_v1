// supabase/functions/verify-health-share/index.ts
// ─────────────────────────────────────────────────────────────────
// Front desk enters the OTP the patient read off their own WhatsApp.
// On success, the health_share_requests row flips to 'approved' with a
// 24h grant window — RLS policies in migration 0006 check exactly this
// row to allow cross-clinic reads. Rate-limited to 5 attempts per request
// to prevent OTP brute-forcing.
//
// Deploy: supabase functions deploy verify-health-share
// ─────────────────────────────────────────────────────────────────

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY      = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MAX_ATTEMPTS  = 5;
const GRANT_HOURS    = 24;

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

async function sha256(text: string) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const asCaller = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data: { user }, error: authErr } = await asCaller.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Not authenticated." }), { status: 401 });

    const { requestId, otp } = await req.json();
    if (!requestId || !otp) return new Response(JSON.stringify({ error: "requestId and otp are required." }), { status: 400 });

    const { data: reqRow, error: fetchErr } = await admin
      .from("health_share_requests").select("*").eq("id", requestId).single();
    if (fetchErr || !reqRow) return new Response(JSON.stringify({ error: "Request not found." }), { status: 404 });

    if (reqRow.status !== "pending") {
      return new Response(JSON.stringify({ error: `This request is already ${reqRow.status}.` }), { status: 400 });
    }
    if (new Date(reqRow.otp_expires_at) < new Date()) {
      await admin.from("health_share_requests").update({ status: "expired" }).eq("id", requestId);
      return new Response(JSON.stringify({ error: "This code has expired. Ask the patient to request again." }), { status: 400 });
    }
    if (reqRow.attempts >= MAX_ATTEMPTS) {
      return new Response(JSON.stringify({ error: "Too many incorrect attempts. Request a new code." }), { status: 429 });
    }

    const otpHash = await sha256(otp);
    if (otpHash !== reqRow.otp_hash) {
      await admin.from("health_share_requests").update({ attempts: reqRow.attempts + 1 }).eq("id", requestId);
      return new Response(JSON.stringify({ error: "Incorrect code." }), { status: 400 });
    }

    const grantedUntil = new Date(Date.now() + GRANT_HOURS * 60 * 60 * 1000).toISOString();
    await admin.from("health_share_requests")
      .update({ status: "approved", granted_until: grantedUntil })
      .eq("id", requestId);

    return new Response(JSON.stringify({ data: { grantedUntil } }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("verify-health-share error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
