// supabase/functions/daily-reminders/index.ts
// ─────────────────────────────────────────────────────────────────
// Sends appointment reminder WhatsApp messages one day before.
// Deploy: supabase functions deploy daily-reminders
//
// Schedule in supabase/config.toml:
//   [functions.daily-reminders]
//   schedule = "30 12 * * *"   ← 6:00 PM IST (12:30 UTC) daily
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

serve(async (_req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin":  "https://clinicsite.in",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Content-Type":                 "application/json",
  };

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    // Fetch confirmed appointments for tomorrow with clinic info
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("*, clinics(name, phone, whatsapp, address)")
      .eq("appt_date", dateStr)
      .eq("status", "confirmed");

    if (error) throw error;
    if (!appointments?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), { headers: corsHeaders });
    }

    let sent = 0;
    for (const appt of appointments) {
      const clinic = appt.clinics;
      const msg =
        `⏰ *Appointment Reminder*\n\n` +
        `Hi ${appt.patient_name},\n\n` +
        `Your appointment is *tomorrow*!\n\n` +
        `📅 ${appt.appt_date} at ${appt.appt_time}\n` +
        `🦷 ${appt.service}\n` +
        `📍 ${clinic.name}\n${clinic.address}\n\n` +
        `Reply STOP to opt out of reminders.`;

      await sendWhatsApp(appt.phone, msg).catch(e =>
        console.error(`Reminder failed for appt ${appt.id}:`, e.message)
      );
      sent++;
    }

    return new Response(JSON.stringify({ ok: true, sent }), { headers: corsHeaders });

  } catch (err) {
    console.error("daily-reminders error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
