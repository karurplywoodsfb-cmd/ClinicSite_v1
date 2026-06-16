// supabase/functions/send-push/index.ts
// Called automatically via Supabase Database Webhook when new appointment is inserted
// OR called manually from BookingEngine after successful booking
//
// Required secrets (Supabase Dashboard → Edge Functions → send-push → Secrets):
//   VAPID_PUBLIC_KEY   — from: npx web-push generate-vapid-keys
//   VAPID_PRIVATE_KEY  — from: npx web-push generate-vapid-keys
//   VAPID_EMAIL        — e.g. mailto:admin@clinicsite.in

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY  = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_EMAIL       = Deno.env.get("VAPID_EMAIL") || "mailto:admin@clinicsite.in";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Minimal web-push implementation using Deno ────────────────
// We use the web-push npm package via esm.sh
async function sendWebPush(subscription: any, payload: string) {
  const webpush = await import("https://esm.sh/web-push@3.6.7");
  webpush.default.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  return webpush.default.sendNotification(
    JSON.parse(typeof subscription === "string" ? subscription : JSON.stringify(subscription)),
    payload
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Supports two call modes:
    // 1. Direct call: { clinic_id, appointment }
    // 2. DB webhook:  { type: "INSERT", record: { clinic_id, ... } }
    const isWebhook   = body.type === "INSERT";
    const appointment = isWebhook ? body.record : body.appointment;
    const clinicId    = isWebhook ? body.record?.clinic_id : body.clinic_id;

    if (!clinicId) throw new Error("clinic_id required");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get clinic info
    const { data: clinic } = await sb
      .from("clinics")
      .select("name, slug")
      .eq("id", clinicId)
      .single();

    // Get push subscription for this clinic
    const { data: subRecord } = await sb
      .from("push_subscriptions")
      .select("subscription")
      .eq("clinic_id", clinicId)
      .maybeSingle();

    if (!subRecord?.subscription) {
      return new Response(
        JSON.stringify({ success: false, reason: "No push subscription for this clinic" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build notification payload
    const patientName  = appointment?.patient_name  || "A patient";
    const serviceName  = appointment?.service_name  || "appointment";
    const appointDate  = appointment?.preferred_date
      ? new Date(appointment.preferred_date).toLocaleDateString("en-IN", { day:"numeric", month:"short" })
      : "soon";

    const payload = JSON.stringify({
      title:         `New Booking — ${clinic?.name || "Clinic"}`,
      body:          `${patientName} booked ${serviceName} for ${appointDate}`,
      icon:          "/icon-192.png",
      badge:         "/icon-72.png",
      tag:           `appointment-${appointment?.id || Date.now()}`,
      url:           `/admin/appointments`,
      appointmentId: appointment?.id,
    });

    await sendWebPush(subRecord.subscription, payload);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Push error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
