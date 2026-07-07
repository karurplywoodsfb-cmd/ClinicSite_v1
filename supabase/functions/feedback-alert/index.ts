// supabase/functions/feedback-alert/index.ts
// ─────────────────────────────────────────────────────────────────
// Supabase Edge Function — fires when new feedback row is inserted
// with route = 'private' (1-3★). Alerts the clinic owner immediately
// so complaints get handled before they become public.
//
// Deploy:  supabase functions deploy feedback-alert
// Wire up: Database → Webhooks → INSERT on `feedback` → this function
//          (same DB Webhook pattern as appointment-trigger)
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
    const { type, record: fb } = payload;

    if (type !== "INSERT" || fb.route !== "private") {
      return new Response("OK", { status: 200 });
    }

    const { data: clinic } = await supabase
      .from("clinics")
      .select("name, phone, whatsapp")
      .eq("id", fb.clinic_id)
      .single();

    if (!clinic) return new Response("Clinic not found", { status: 404 });

    const stars = "★".repeat(fb.rating) + "☆".repeat(5 - fb.rating);
    const ownerMsg =
      `⚠️ *New Patient Complaint*\n\n` +
      `${stars} (${fb.rating}/5)\n` +
      `${fb.comment ? `"${fb.comment}"\n\n` : ""}` +
      `${fb.patient_name ? `From: ${fb.patient_name}\n` : ""}` +
      `${fb.patient_phone ? `📞 ${fb.patient_phone}\n\n` : "\n"}` +
      `This was kept private — not posted publicly. Reach out to resolve it.\n` +
      `_${clinic.name}_`;

    await sendWhatsApp(clinic.whatsapp || clinic.phone, ownerMsg);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("feedback-alert error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
