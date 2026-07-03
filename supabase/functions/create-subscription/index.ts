// supabase/functions/create-subscription/index.ts
// Creates a Razorpay subscription for a clinic upgrading their plan.
// Called by: src/lib/razorpay.js → openCheckout()
//
// Deploy: supabase functions deploy create-subscription
// Secrets needed:
//   RAZORPAY_KEY_ID      — from Razorpay Dashboard → Settings → API Keys
//   RAZORPAY_KEY_SECRET  — from Razorpay Dashboard → Settings → API Keys

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAZORPAY_KEY_ID     = Deno.env.get("RAZORPAY_KEY_ID")!;
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;
const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY        = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CORS = {
  "Access-Control-Allow-Origin":  "https://clinicsite.in",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Content-Type":                 "application/json",
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

    const { plan_id, clinic_id } = await req.json();
    if (!plan_id || !clinic_id) {
      return new Response(JSON.stringify({ error: "plan_id and clinic_id required" }), { status: 400, headers: CORS });
    }

    // ── Verify clinic belongs to this user ───────────────────────
    const { data: clinic } = await supabase
      .from("clinics")
      .select("id, name, owner_id")
      .eq("id", clinic_id)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!clinic) {
      return new Response(JSON.stringify({ error: "Clinic not found" }), { status: 404, headers: CORS });
    }

    // ── Create Razorpay subscription ─────────────────────────────
    const credentials = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const rzpRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        plan_id,
        quantity:         1,
        total_count:      120, // 10 years max
        customer_notify:  1,
        notes: {
          clinic_id:   clinic.id,
          clinic_name: clinic.name,
          user_id:     user.id,
        },
      }),
    });

    if (!rzpRes.ok) {
      const err = await rzpRes.json();
      throw new Error(err.error?.description || "Razorpay subscription creation failed");
    }

    const subscription = await rzpRes.json();

    // ── Store pending subscription in DB ─────────────────────────
    await supabase.from("subscriptions").upsert({
      clinic_id:       clinic.id,
      user_id:         user.id,
      razorpay_sub_id: subscription.id,
      plan_id,
      status:          "created",
      created_at:      new Date().toISOString(),
    }).catch(() => {}); // non-blocking if table doesn't exist yet

    return new Response(
      JSON.stringify({ subscription_id: subscription.id }),
      { headers: CORS }
    );

  } catch (err) {
    console.error("create-subscription error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: CORS }
    );
  }
});
