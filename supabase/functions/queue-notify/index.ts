// supabase/functions/queue-notify/index.ts
// ─────────────────────────────────────────────────────────────────
// Supabase Edge Function — fires on UPDATE of `queue_tokens`.
// Wire up: Database → Webhooks → UPDATE on `queue_tokens` → this function
// (same DB Webhook pattern as appointment-trigger / feedback-alert)
//
// Sends the patient a WhatsApp when:
//   - their token gets skipped ("missed" tray)
//   - their position moves back (snoozed)
// Deliberately does NOT fire on every position shift (e.g. when the queue
// just moves forward naturally) — only on skip and on an explicit snooze,
// which are the two "penalty" actions patients actually need to know about.
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

serve(async (req) => {
  try {
    const payload = await req.json();
    const { type, record, old_record } = payload;

    if (type !== "UPDATE") return new Response("OK", { status: 200 });

    // Case 1: just got skipped
    const justSkipped = record.status === "skipped" && old_record.status !== "skipped";
    // Case 2: snoozed — status still 'waiting' but position moved backward (higher number = further back)
    const justSnoozed = record.status === "waiting" && old_record.status === "waiting" && record.position > old_record.position;

    if (!justSkipped && !justSnoozed) {
      return new Response("No notification needed", { status: 200 });
    }

    const { data: waitingCount } = await supabase
      .from("queue_tokens")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", record.clinic_id)
      .eq("queue_date", record.queue_date)
      .eq("status", "waiting")
      .lt("position", record.position);

    const aheadCount = waitingCount?.length ?? 0;

    let message;
    if (justSkipped) {
      message =
        `Your token #${record.token_number} was marked as missed since we called it but you weren't available.\n\n` +
        `No worries — let the front desk know you're here and they'll add you back into the queue right away.`;
    } else {
      message =
        `Heads up — your token #${record.token_number} has been moved back 2 places in the queue.\n\n` +
        `You're now behind about ${aheadCount} other patient(s). Check ${record.queue_date === new Date().toISOString().split("T")[0] ? "the live status page" : "with the front desk"} for the latest.`;
    }

    await sendWhatsApp(record.patient_phone, message);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("queue-notify error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
