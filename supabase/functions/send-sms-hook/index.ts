// supabase/functions/send-sms-hook/index.ts
// ─────────────────────────────────────────────────────────────────
// This is a Supabase Auth HOOK, not a regular API endpoint — Supabase Auth
// itself calls this whenever phone-based OTP needs to go out (sign-in,
// sign-up, phone MFA). It replaces the built-in Twilio/MessageBird/Vonage
// senders with your existing MSG91 WhatsApp integration, so the Health
// Locker's patient login uses the same channel as everything else in
// this app instead of requiring a second SMS vendor account.
//
// SETUP (one-time, in the Supabase Dashboard):
//   1. Authentication → Providers → Phone → enable Phone provider
//   2. Authentication → Hooks → "Send SMS hook" → type: HTTPS →
//      paste this function's URL after deploying it
//   3. Supabase generates a signing secret (starts with `v1,whsec_`) —
//      set it as SEND_SMS_HOOK_SECRET in this function's env vars
//   4. Deploy: supabase functions deploy send-sms-hook --no-verify-jwt
//      (--no-verify-jwt is required — Auth Hooks aren't called with a
//      user JWT, they're verified via the webhook signature instead)
// ─────────────────────────────────────────────────────────────────

import { serve }  from "https://deno.land/std@0.168.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const HOOK_SECRET = Deno.env.get("SEND_SMS_HOOK_SECRET")!; // strip the "v1,whsec_" prefix below
const MSG91_KEY   = Deno.env.get("MSG91_API_KEY")!;
const MSG91_WA    = Deno.env.get("MSG91_WA_SENDER")!;

async function sendWhatsAppOtp(phone: string, otp: string) {
  const mobile = phone.replace(/\D/g, "");
  const to     = mobile.startsWith("91") ? mobile : `91${mobile}`;
  await fetch("https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/", {
    method:  "POST",
    headers: { "authkey": MSG91_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      integrated_number: MSG91_WA,
      content_type: "text",
      payload: {
        to, type: "text",
        text: { body: `Your Health Locker verification code is: ${otp}\n\nDon't share this with anyone.` },
      },
    }),
  });
}

serve(async (req) => {
  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const base64Secret = HOOK_SECRET.replace("v1,whsec_", "");
    const wh = new Webhook(base64Secret);

    // Throws if the signature doesn't match — this IS the authentication
    // for this endpoint, since Auth Hooks don't send a user JWT.
    const { user, sms } = wh.verify(payload, headers) as any;

    await sendWhatsAppOtp(user.phone, sms.otp);

    return new Response(JSON.stringify({}), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-sms-hook error:", err);
    // Supabase Auth expects a specific error shape on failure.
    return new Response(
      JSON.stringify({ error: { http_code: 500, message: "Failed to send OTP." } }),
      { status: 500 }
    );
  }
});
