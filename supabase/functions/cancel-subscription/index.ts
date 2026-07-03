// supabase/functions/cancel-subscription/index.ts
// Cancels Razorpay subscription and resets clinic to free plan.
// Called by: src/lib/razorpay.js → cancelSubscription()
//
// Deploy: supabase functions deploy cancel-subscription

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAZORPAY_KEY_ID     = Deno.env.get("RAZORPAY_KEY_ID")!;
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;
const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY        = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase    = createClient(SUPABASE_URL, SUPABASE_KEY);
const credentials = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

const CORS = {
  "Access-Control-Allow-Origin":  "https://clinicsite.in",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Content-Type":                 "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
    }

    const { clinic_id } = await req.json();

    // ── Get clinic + subscription ID ─────────────────────────────
    const { data: clinic } = await supabase
      .from("clinics")
      .select("id, razorpay_sub_id, owner_id")
      .eq("id", clinic_id)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!clinic) {
      return new Response(JSON.stringify({ error: "Clinic not found" }), { status: 404, headers: CORS });
    }

    // ── Cancel in Razorpay (cancel at end of billing period) ─────
    if (clinic.razorpay_sub_id) {
      await fetch(
        `https://api.razorpay.com/v1/subscriptions/${clinic.razorpay_sub_id}/cancel`,
        {
          method: "POST",
          headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type":  "application/json",
          },
          body: JSON.stringify({ cancel_at_cycle_end: 1 }),
        }
      );
    }

    // ── Downgrade to free ─────────────────────────────────────────
    const { data: updated } = await supabase
      .from("clinics")
      .update({
        plan:            "free",
        razorpay_sub_id: null,
        plan_updated_at: new Date().toISOString(),
      })
      .eq("id", clinic_id)
      .eq("owner_id", user.id)
      .select()
      .single();

    return new Response(JSON.stringify({ ok: true, clinic: updated }), { headers: CORS });

  } catch (err) {
    console.error("cancel-subscription error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: CORS }
    );
  }
});
