// supabase/functions/verify-payment/index.ts
// Verifies Razorpay payment signature and upgrades clinic plan.
// Called by: src/lib/razorpay.js → verifyAndActivate()
//
// Deploy: supabase functions deploy verify-payment

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac }   from "https://deno.land/std@0.168.0/node/crypto.ts";

const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;
const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY        = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CORS = {
  "Access-Control-Allow-Origin":  "https://clinicsite.in",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Content-Type":                 "application/json",
};

// Razorpay plan ID → our plan tier mapping
const PLAN_MAP: Record<string, string> = {
  [Deno.env.get("RAZORPAY_PLAN_PREMIUM")    || ""]: "premium",
  [Deno.env.get("RAZORPAY_PLAN_ENTERPRISE") || ""]: "enterprise",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // ── Auth check ──────────────────────────────────────────────
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
    }

    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      clinic_id,
      plan,
    } = await req.json();

    // ── Verify signature ─────────────────────────────────────────
    const body      = `${razorpay_payment_id}|${razorpay_subscription_id}`;
    const expected  = createHmac("sha256", RAZORPAY_KEY_SECRET)
                        .update(body)
                        .digest("hex");

    if (expected !== razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Invalid payment signature" }),
        { status: 400, headers: CORS }
      );
    }

    // ── Determine plan from subscription or passed plan param ────
    let resolvedPlan = plan;
    if (!resolvedPlan && razorpay_subscription_id) {
      // Look up which plan was used
      const credentials = btoa(`${Deno.env.get("RAZORPAY_KEY_ID")}:${RAZORPAY_KEY_SECRET}`);
      const subRes = await fetch(
        `https://api.razorpay.com/v1/subscriptions/${razorpay_subscription_id}`,
        { headers: { "Authorization": `Basic ${credentials}` } }
      );
      if (subRes.ok) {
        const sub = await subRes.json();
        resolvedPlan = PLAN_MAP[sub.plan_id] || "premium";
      }
    }
    resolvedPlan = resolvedPlan || "premium";

    // ── Upgrade clinic plan ───────────────────────────────────────
    const { data: updatedClinic, error: updateErr } = await supabase
      .from("clinics")
      .update({
        plan:             resolvedPlan,
        plan_updated_at:  new Date().toISOString(),
        razorpay_sub_id:  razorpay_subscription_id,
      })
      .eq("id", clinic_id)
      .eq("owner_id", user.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // ── Record payment ────────────────────────────────────────────
    await supabase.from("payments").insert({
      clinic_id,
      user_id:             user.id,
      razorpay_payment_id,
      razorpay_sub_id:     razorpay_subscription_id,
      plan:                resolvedPlan,
      status:              "paid",
      paid_at:             new Date().toISOString(),
    }).catch(() => {}); // non-blocking if table doesn't exist yet

    return new Response(
      JSON.stringify({ ok: true, plan: resolvedPlan, clinic: updatedClinic }),
      { headers: CORS }
    );

  } catch (err) {
    console.error("verify-payment error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: CORS }
    );
  }
});
