// supabase/functions/request-health-share/index.ts
// ─────────────────────────────────────────────────────────────────
// Called when a doctor/receptionist at Clinic B wants to see a patient's
// history from other clinics. Generates an OTP and sends it to the
// PATIENT's phone (not the requester) — the patient reads it off their
// own WhatsApp and tells the front desk, which is the realistic in-person
// flow for a walk-in. verify-health-share (separate function) checks it.
//
// Deploy: supabase functions deploy request-health-share
// ─────────────────────────────────────────────────────────────────

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY      = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MSG91_KEY     = Deno.env.get("MSG91_API_KEY")!;
const MSG91_WA      = Deno.env.get("MSG91_WA_SENDER")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

async function sha256(text: string) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function sendWhatsApp(phone: string, message: string) {
  const mobile = phone.replace(/\D/g, "");
  const to     = mobile.startsWith("91") ? mobile : `91${mobile}`;
  await fetch("https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/", {
    method:  "POST",
    headers: { "authkey": MSG91_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      integrated_number: MSG91_WA,
      content_type: "text",
      payload: { to, type: "text", text: { body: message } },
    }),
  });
}

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const asCaller = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${jwt}` } } });

    const { data: { user }, error: authErr } = await asCaller.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Not authenticated." }), { status: 401 });

    const { clinicId, patientPhone } = await req.json();
    if (!clinicId || !patientPhone) {
      return new Response(JSON.stringify({ error: "clinicId and patientPhone are required." }), { status: 400 });
    }

    // Confirm the caller actually has a role at this clinic (owner/doctor/receptionist)
    // — run AS THE CALLER so staff_role()'s auth.uid() resolves correctly.
    const { data: roleCheck } = await asCaller.rpc("staff_role", { p_clinic_id: clinicId });
    if (!roleCheck) return new Response(JSON.stringify({ error: "Not authorized for this clinic." }), { status: 403 });

    // Does this phone even have records elsewhere? No point sending an OTP if not.
    const { data: elsewhere } = await admin
      .from("patients").select("clinic_id").eq("phone", patientPhone).neq("clinic_id", clinicId).limit(1);
    if (!elsewhere?.length) {
      return new Response(JSON.stringify({ error: "No records found for this phone number at other clinics." }), { status: 404 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await sha256(otp);

    const { data: request, error } = await admin
      .from("health_share_requests")
      .insert({
        requesting_clinic_id: clinicId,
        patient_phone: patientPhone,
        otp_hash: otpHash,
        otp_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
        requested_by: user.id,
      })
      .select()
      .single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    const { data: clinic } = await admin.from("clinics").select("name").eq("id", clinicId).single();
    await sendWhatsApp(patientPhone,
      `${clinic?.name || "A clinic"} is requesting access to your medical history from your other visits.\n\n` +
      `If this is you, share this code with them: ${otp}\n\n` +
      `This code expires in 10 minutes. Don't share it if you didn't request this.`
    );

    return new Response(JSON.stringify({ data: { requestId: request.id } }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("request-health-share error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
