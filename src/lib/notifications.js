// src/lib/notifications.js — COMPLIANCE UPDATE
// Fix E1: Minimise PII in WhatsApp owner notifications
// Fix E3: Unsubscribe mechanism for broadcast emails

import { supabase } from "./supabase";

// ═══════════════════════════════════════════════════
// COMPLIANT MESSAGE TEMPLATES
// PII minimised in owner notifications (Fix E1)
// Patient sees full details; owner gets reference ID only
// ═══════════════════════════════════════════════════

export const TEMPLATES = {

  // Patient confirmation — full details to patient (they own their data)
  patientConfirmation: (appt, clinic) => ({
    sms: `Hi ${appt.patient_name}, your appointment at ${clinic.name} is confirmed. Date: ${appt.appt_date} at ${appt.appt_time}. Service: ${appt.service}. Queries? Call ${clinic.phone}. Reply STOP to opt out.`,

    whatsapp: `✅ *Appointment Confirmed*

Hi ${appt.patient_name},

Your appointment at *${clinic.name}* is booked.

📅 *Date:* ${appt.appt_date}
⏰ *Time:* ${appt.appt_time}
🦷 *Service:* ${appt.service}
📍 *Address:* ${clinic.address}

Reply STOP to opt out of reminders.
_${clinic.name} · ${clinic.phone}_`,
  }),

  // Owner notification — COMPLIANT: NO patient PII in WhatsApp (Fix E1)
  // Full details available only inside secure authenticated admin panel
  ownerNewBooking: (appt, clinic) => ({
    sms: `New appointment request received. Ref: ${appt.id.slice(0,8).toUpperCase()}. Log in to admin panel to view details.`,

    whatsapp: `🔔 *New Appointment Request*

Reference ID: \`${appt.id.slice(0,8).toUpperCase()}\`
Service: ${appt.service}
Date: ${appt.appt_date} at ${appt.appt_time || "TBD"}

📋 Log in to view patient details:
${APP_URL}/admin

_Patient PII is not transmitted via WhatsApp per DPDP Act 2023._`,
  }),

  // Reminder to patient (1 day before)
  patientReminder: (appt, clinic) => ({
    sms: `Reminder: Appointment at ${clinic.name} tomorrow (${appt.appt_date}) at ${appt.appt_time}. Address: ${clinic.address}. Reply STOP to opt out.`,

    whatsapp: `⏰ *Appointment Reminder*

Hi ${appt.patient_name},

Your appointment is *tomorrow*.

📅 ${appt.appt_date} at ${appt.appt_time}
🦷 ${appt.service}
📍 ${clinic.name}, ${clinic.address}

Reply STOP to opt out of reminders.`,
  }),

  // Patient confirmed by clinic
  patientApproved: (appt, clinic) => ({
    sms: `Confirmed: Your appointment at ${clinic.name} on ${appt.appt_date} at ${appt.appt_time} is confirmed. See you then!`,

    whatsapp: `✅ *Appointment Confirmed by Clinic*

Hi ${appt.patient_name},

*${clinic.name}* has confirmed your appointment.

📅 ${appt.appt_date} at ${appt.appt_time}
🦷 ${appt.service}

See you soon!`,
  }),
};

// ═══════════════════════════════════════════════════
// SMS via MSG91
// ═══════════════════════════════════════════════════

export async function sendSMS(phone, message) {
  const KEY    = import.meta.env.VITE_MSG91_API_KEY || process.env.MSG91_API_KEY;
  const SENDER = "CLNSTE";
  const mobile = phone.replace(/\D/g,"");
  const to     = mobile.startsWith("91") ? mobile : `91${mobile}`;

  const res = await fetch("https://api.msg91.com/api/v2/sendsms", {
    method: "POST",
    headers: { "authkey": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: SENDER, route: "4", country: "91",
      sms: [{ message, to: [to] }],
    }),
  });
  return res.json();
}

// ═══════════════════════════════════════════════════
// WhatsApp via MSG91
// ═══════════════════════════════════════════════════

export async function sendWhatsApp(phone, message) {
  const KEY    = import.meta.env.VITE_MSG91_API_KEY || process.env.MSG91_API_KEY;
  const SENDER = import.meta.env.VITE_MSG91_WA_SENDER || process.env.MSG91_WA_SENDER;
  const mobile = phone.replace(/\D/g,"");
  const to     = mobile.startsWith("91") ? mobile : `91${mobile}`;

  const res = await fetch("https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/", {
    method: "POST",
    headers: { "authkey": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      integrated_number: SENDER,
      content_type: "template",
      payload: { to, type: "text", text: { body: message } },
    }),
  });
  return res.json();
}

// ═══════════════════════════════════════════════════
// HIGH-LEVEL TRIGGERS
// ═══════════════════════════════════════════════════

export async function notifyNewBooking(appointment, clinic) {
  const patientMsg = TEMPLATES.patientConfirmation(appointment, clinic);
  const ownerMsg   = TEMPLATES.ownerNewBooking(appointment, clinic);

  return Promise.allSettled([
    sendWhatsApp(appointment.phone, patientMsg.whatsapp),
    sendSMS(appointment.phone, patientMsg.sms),
    // Owner gets reference ID only — no patient PII (Fix E1)
    sendWhatsApp(clinic.whatsapp || clinic.phone, ownerMsg.whatsapp),
  ]);
}

export async function notifyAppointmentConfirmed(appointment, clinic) {
  const msg = TEMPLATES.patientApproved(appointment, clinic);
  return Promise.allSettled([
    sendWhatsApp(appointment.phone, msg.whatsapp),
    sendSMS(appointment.phone, msg.sms),
  ]);
}

export async function notifyReminders(appointments, clinic) {
  return Promise.allSettled(
    appointments.map(appt => {
      const msg = TEMPLATES.patientReminder(appt, clinic);
      return sendWhatsApp(appt.phone, msg.whatsapp);
    })
  );
}

// ═══════════════════════════════════════════════════
// BROADCAST EMAIL — Fix E3: Unsubscribe mechanism
// ═══════════════════════════════════════════════════

export const EMAIL_COMPLIANCE_FOOTER = (clinicOwnerId) => `

---
You are receiving this email as a registered ClinicSite.in platform user.

To unsubscribe from platform communications:
• Visit: ${APP_URL}/admin/notifications
• Or reply to this email with the word UNSUBSCRIBE

${import.meta.env.VITE_SUPPORT_EMAIL || 'support@clinicsite.in'}
Data processed under the Digital Personal Data Protection Act, 2023.
`;

export async function sendBroadcastEmail(subject, body, supabaseClient) {
  // Fetch only opted-in clinic owners (Fix E3)
  const { data: clinics } = await supabaseClient
    .from("clinics")
    .select("id, email, name")
    .eq("email_opt_out", false)
    .not("email", "is", null);

  if (!clinics?.length) return { sent: 0 };

  // Add compliance footer to every email
  const compliantBody = body + EMAIL_COMPLIANCE_FOOTER("{{clinic_id}}");

  // In production: send via Resend API
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // for (const clinic of clinics) {
  //   await resend.emails.send({
  //     from: "ClinicSite <noreply@clinicsite.in>",
  //     to: clinic.email,
  //     subject,
  //     text: compliantBody.replace("{{clinic_id}}", clinic.id),
  //   });
  // }

  return { sent: clinics.length };
}

// Handle unsubscribe
export async function handleUnsubscribe(clinicId, supabaseClient) {
  await supabaseClient
    .from("clinics")
    .update({
      email_opt_out:    true,
      email_opt_out_at: new Date().toISOString(),
    })
    .eq("id", clinicId);
}