// supabase/functions/appointment-trigger/index.ts
// ─────────────────────────────────────────────────────────────────
// Supabase Edge Function — fires when new appointment is inserted
// Deploy: supabase functions deploy appointment-trigger
// ─────────────────────────────────────────────────────────────────

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MSG91_KEY     = Deno.env.get("MSG91_API_KEY")!;
const MSG91_WA      = Deno.env.get("MSG91_WA_SENDER")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Send WhatsApp via MSG91 ───────────────────────────────────────
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

// ── Send SMS via MSG91 ────────────────────────────────────────────
async function sendSMS(phone: string, message: string) {
  const mobile = phone.replace(/\D/g, "");
  const to     = mobile.startsWith("91") ? mobile : `91${mobile}`;

  await fetch("https://api.msg91.com/api/v2/sendsms", {
    method:  "POST",
    headers: { "authkey": MSG91_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: "CLNSTE", route: "4", country: "91",
      sms: [{ message, to: [to] }],
    }),
  });
}

// ── Main handler ──────────────────────────────────────────────────
serve(async (req) => {
  try {
    const payload = await req.json();

    // Supabase DB Webhook sends: { type, table, record, old_record }
    const { type, record: appt } = payload;

    if (type !== "INSERT" && type !== "UPDATE") {
      return new Response("OK", { status: 200 });
    }

    // Fetch clinic details
    const { data: clinic } = await supabase
      .from("clinics")
      .select("name, phone, whatsapp, address")
      .eq("id", appt.clinic_id)
      .single();

    if (!clinic) return new Response("Clinic not found", { status: 404 });

    // ── New booking inserted ──────────────────────────────────────
    if (type === "INSERT") {
      const patientMsg =
        `✅ *Appointment Booked!*\n\n` +
        `Hi ${appt.patient_name},\n\n` +
        `Your appointment at *${clinic.name}* is received.\n\n` +
        `📅 *Date:* ${appt.appt_date}\n` +
        `⏰ *Time:* ${appt.appt_time || "To be confirmed"}\n` +
        `🦷 *Service:* ${appt.service}\n` +
        `📍 ${clinic.address}\n\n` +
        `We will call you within 30 minutes to confirm.\n` +
        `_${clinic.name} · ${clinic.phone}_`;

      const ownerMsg =
        `🔔 *New Appointment!*\n\n` +
        `👤 ${appt.patient_name}\n` +
        `📞 ${appt.phone}\n` +
        `🦷 ${appt.service}\n` +
        `📅 ${appt.appt_date} at ${appt.appt_time || "TBD"}\n` +
        `${appt.notes ? `📝 Notes: ${appt.notes}` : ""}`;

      await Promise.allSettled([
        sendWhatsApp(appt.phone, patientMsg),
        sendSMS(appt.phone,
          `Hi ${appt.patient_name}! Appointment at ${clinic.name} on ${appt.appt_date} received. We'll confirm shortly. ${clinic.phone}`
        ),
        sendWhatsApp(clinic.whatsapp || clinic.phone, ownerMsg),
      ]);
    }

    // ── Status changed to confirmed ───────────────────────────────
    if (type === "UPDATE" && appt.status === "confirmed") {
      const msg =
        `✅ *Appointment Confirmed!*\n\n` +
        `Hi ${appt.patient_name},\n` +
        `*${clinic.name}* confirmed your appointment.\n\n` +
        `📅 ${appt.appt_date} at ${appt.appt_time}\n` +
        `🦷 ${appt.service}\n\n` +
        `See you soon! 😊`;

      await sendWhatsApp(appt.phone, msg);
      await sendSMS(appt.phone,
        `Confirmed! Your appointment at ${clinic.name} is on ${appt.appt_date} at ${appt.appt_time}. See you soon!`
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
// Daily reminders are handled by supabase/functions/daily-reminders/index.ts
