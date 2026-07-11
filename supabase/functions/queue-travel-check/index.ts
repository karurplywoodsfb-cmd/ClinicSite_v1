// supabase/functions/queue-travel-check/index.ts
// ─────────────────────────────────────────────────────────────────
// Scheduled Edge Function — NOT triggered by a DB webhook like the others.
// Wire up via Supabase Dashboard → Edge Functions → queue-travel-check →
// Cron: */2 * * * *  (every 2 minutes, during clinic hours if you want to
// save invocations — Supabase Cron supports standard cron syntax).
//
// For each clinic with an active queue today, recomputes ETA for every
// waiting token that has a travel_minutes set and hasn't been alerted yet.
// Fires "leave now" WhatsApp the moment ETA drops to/below their travel time.
// ─────────────────────────────────────────────────────────────────

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MSG91_KEY    = Deno.env.get("MSG91_API_KEY")!;
const MSG91_WA     = Deno.env.get("MSG91_WA_SENDER")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sendWhatsApp(phone: string, message: string) {
  const mobile = phone.replace(/\D/g, "");
  const to     = mobile.startsWith("91") ? mobile : `91${mobile}`;
  await fetch("https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/", {
    method:  "POST",
    headers: { "authkey": MSG91_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      integrated_number: MSG91_WA,
      content_type: "template",
      payload: { to, type: "text", text: { body: message } },
    }),
  });
}

// Rolling-average is now computed in the database (see migration 0005's
// rolling_avg_minutes() function) — this is the single source of truth.
// Previously this file had its own JS reimplementation of queueEngine.js's
// getRollingAvgMinutes, with a comment saying "keep in sync manually."
// That's exactly the kind of duplication that silently drifts — removed.
async function rollingAvg(clinicId: string, fallback: number) {
  const { data, error } = await supabase.rpc("rolling_avg_minutes", {
    p_clinic_id: clinicId, p_fallback: fallback, p_sample_size: 10,
  });
  if (error) { console.error("rolling_avg_minutes RPC failed:", error.message); return fallback; }
  return data ?? fallback;
}

serve(async (_req) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data: clinics } = await supabase
      .from("clinics")
      .select("id, name, avg_appt_minutes_default");
    if (!clinics?.length) return new Response("No clinics", { status: 200 });

    let alertsSent = 0;

    for (const clinic of clinics) {
      const { data: waiting } = await supabase
        .from("queue_tokens")
        .select("*")
        .eq("clinic_id", clinic.id)
        .eq("queue_date", today)
        .eq("status", "waiting")
        .order("position", { ascending: true });

      if (!waiting?.length) continue;

      const pending = waiting.filter(t => t.travel_minutes && !t.travel_alert_sent);
      if (!pending.length) continue;

      const avgMinutes = await rollingAvg(clinic.id, clinic.avg_appt_minutes_default || 15);

      for (const token of pending) {
        const ahead = waiting.filter(t => t.position < token.position).length;
        const eta = ahead * avgMinutes;

        if (eta <= token.travel_minutes) {
          await sendWhatsApp(
            token.patient_phone,
            `⏰ It's time to leave for your appointment at ${clinic.name}!\n\n` +
            `Your token #${token.token_number} should be called in about ${eta} min.`
          );
          await supabase.from("queue_tokens").update({ travel_alert_sent: true }).eq("id", token.id);
          alertsSent++;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, alertsSent }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("queue-travel-check error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
