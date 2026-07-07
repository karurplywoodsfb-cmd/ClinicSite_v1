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

// Mirrors src/lib/queueEngine.js — kept in sync manually since edge functions
// can't import from src/. If you change the rolling-average logic there,
// update it here too.
function rollingAvg(doneTokens: any[], fallback: number, sampleSize = 10) {
  const durations = doneTokens
    .filter(t => t.called_at && t.done_at)
    .slice(-sampleSize)
    .map(t => (new Date(t.done_at).getTime() - new Date(t.called_at).getTime()) / 60000)
    .filter(m => m > 0 && m < 120);
  if (durations.length < 3) return fallback;
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
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

      const { data: doneTokens } = await supabase
        .from("queue_tokens")
        .select("called_at, done_at")
        .eq("clinic_id", clinic.id)
        .eq("status", "done")
        .order("done_at", { ascending: false })
        .limit(15);

      const avgMinutes = rollingAvg(doneTokens || [], clinic.avg_appt_minutes_default || 15);

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
