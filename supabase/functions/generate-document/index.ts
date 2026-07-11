// supabase/functions/generate-document/index.ts
// ─────────────────────────────────────────────────────────────────
// Called directly over HTTP (from lib/supabase.js:sendPrescription /
// sendInvoice) — not a DB webhook. Handles both document types since
// the PDF-render + upload + WhatsApp-send plumbing is identical either way.
//
// Deploy: supabase functions deploy generate-document
//
// Security note: this uses TWO Supabase clients on purpose —
//   `asCaller`  — anon key + the caller's own JWT, so staff_role() resolves
//                 auth.uid() correctly and enforces the same RBAC as the UI.
//   `admin`     — service-role key, used only AFTER the permission check
//                 passes, for storage upload + signed URL + reading full
//                 patient PII the caller's own RLS might not expose directly.
// ─────────────────────────────────────────────────────────────────

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF }        from "https://esm.sh/jspdf@2.5.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY      = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MSG91_KEY     = Deno.env.get("MSG91_API_KEY")!;
const MSG91_WA      = Deno.env.get("MSG91_WA_SENDER")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

async function sendWhatsAppDocument(phone: string, link: string, filename: string, caption: string) {
  const mobile = phone.replace(/\D/g, "");
  const to     = mobile.startsWith("91") ? mobile : `91${mobile}`;
  // NOTE: mirrors the existing text-message payload shape used elsewhere in
  // this repo (appointment-trigger, feedback-alert), extended to MSG91's
  // "document" type. Double-check this exact shape against the MSG91
  // dashboard for your account before relying on it in production —
  // media-message payloads occasionally differ by API version.
  await fetch("https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/", {
    method:  "POST",
    headers: { "authkey": MSG91_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      integrated_number: MSG91_WA,
      content_type: "document",
      payload: {
        to, type: "document",
        document: { link, filename, caption },
      },
    }),
  });
}

function buildPrescriptionPdf(clinic: any, doctor: any, patient: any, rx: any, items: any[]) {
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(16); doc.text(clinic.name || "Clinic", 14, y); y += 8;
  doc.setFontSize(10); doc.text(doctor?.name ? `Dr. ${doctor.name}` : "", 14, y); y += 10;

  doc.setFontSize(11);
  doc.text(`Patient: ${patient.name}`, 14, y); y += 6;
  doc.text(`Phone: ${patient.phone}`, 14, y); y += 6;
  doc.text(`Date: ${new Date(rx.created_at).toLocaleDateString("en-IN")}`, 14, y); y += 10;

  if (rx.diagnosis) { doc.text(`Diagnosis: ${rx.diagnosis}`, 14, y); y += 10; }

  doc.setFontSize(12); doc.text("Rx", 14, y); y += 8;
  doc.setFontSize(10);
  for (const item of items) {
    const line = `${item.drug_name}${item.strength ? " " + item.strength : ""} — ${item.dosage_instructions}${item.quantity ? "  (Qty: " + item.quantity + ")" : ""}`;
    const wrapped = doc.splitTextToSize(line, 180);
    doc.text(wrapped, 14, y);
    y += wrapped.length * 6 + 2;
  }

  if (rx.notes) { y += 4; doc.setFontSize(9); doc.text(doc.splitTextToSize(`Notes: ${rx.notes}`, 180), 14, y); }

  y = 280;
  doc.setFontSize(8); doc.setTextColor(150);
  doc.text("This document is for informational reference. Always follow your doctor's verbal instructions.", 14, y);

  return doc.output("arraybuffer");
}

function buildInvoicePdf(clinic: any, patient: any, invoice: any, items: any[]) {
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(16); doc.text(clinic.name || "Clinic", 14, y); y += 10;
  doc.setFontSize(11);
  doc.text(`Invoice #${invoice.invoice_number}`, 14, y); y += 6;
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString("en-IN")}`, 14, y); y += 6;
  if (patient) { doc.text(`Patient: ${patient.name} (${patient.phone})`, 14, y); y += 10; } else { y += 4; }

  doc.setFontSize(10);
  for (const item of items) {
    doc.text(item.description, 14, y);
    doc.text(`Rs. ${Number(item.amount).toFixed(2)}`, 160, y);
    y += 7;
  }

  y += 4;
  doc.line(14, y, 196, y); y += 8;
  doc.text(`Subtotal: Rs. ${Number(invoice.subtotal).toFixed(2)}`, 130, y); y += 6;
  if (invoice.discount > 0) { doc.text(`Discount: -Rs. ${Number(invoice.discount).toFixed(2)}`, 130, y); y += 6; }
  if (invoice.tax > 0)      { doc.text(`Tax: Rs. ${Number(invoice.tax).toFixed(2)}`, 130, y); y += 6; }
  doc.setFontSize(12);
  doc.text(`Total: Rs. ${Number(invoice.total).toFixed(2)}`, 130, y); y += 8;
  doc.setFontSize(10);
  doc.text(`Payment: ${invoice.payment_status.toUpperCase()}${invoice.payment_mode ? " via " + invoice.payment_mode.toUpperCase() : ""}`, 14, y);

  return doc.output("arraybuffer");
}

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const asCaller = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${jwt}` } } });

    const { data: { user }, error: authErr } = await asCaller.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Not authenticated." }), { status: 401 });

    const { type, id } = await req.json();
    if (!["prescription", "invoice"].includes(type) || !id) {
      return new Response(JSON.stringify({ error: "type must be 'prescription' or 'invoice', and id is required." }), { status: 400 });
    }

    if (type === "prescription") {
      // Permission check runs AS THE CALLER so staff_role()'s auth.uid() resolves correctly.
      const { data: rx, error: rxErr } = await asCaller
        .from("prescriptions").select("*, patients(name, phone), doctors(name), clinics(name)")
        .eq("id", id).single();
      if (rxErr || !rx) return new Response(JSON.stringify({ error: "Prescription not found or not authorized." }), { status: 404 });

      const { data: items } = await admin.from("prescription_items").select("*").eq("prescription_id", id).order("sort_order");

      const pdfBytes = buildPrescriptionPdf(rx.clinics, rx.doctors, rx.patients, rx, items || []);
      const path = `${rx.clinic_id}/prescriptions/${id}.pdf`;

      const { error: upErr } = await admin.storage.from("patient-documents").upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });
      if (upErr) return new Response(JSON.stringify({ error: upErr.message }), { status: 500 });

      const { data: signed } = await admin.storage.from("patient-documents").createSignedUrl(path, 1800);
      await sendWhatsAppDocument(rx.patients.phone, signed!.signedUrl, "prescription.pdf", `Prescription from ${rx.clinics.name}`);
      await admin.from("prescriptions").update({ pdf_path: path, sent_at: new Date().toISOString() }).eq("id", id);

      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    }

    // type === "invoice"
    const { data: invoice, error: invErr } = await asCaller
      .from("invoices").select("*, patients(name, phone), clinics(name)")
      .eq("id", id).single();
    if (invErr || !invoice) return new Response(JSON.stringify({ error: "Invoice not found or not authorized." }), { status: 404 });

    const { data: items } = await admin.from("invoice_items").select("*").eq("invoice_id", id).order("sort_order");

    const pdfBytes = buildInvoicePdf(invoice.clinics, invoice.patients, invoice, items || []);
    const path = `${invoice.clinic_id}/invoices/${id}.pdf`;

    const { error: upErr } = await admin.storage.from("patient-documents").upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (upErr) return new Response(JSON.stringify({ error: upErr.message }), { status: 500 });

    const { data: signed } = await admin.storage.from("patient-documents").createSignedUrl(path, 1800);

    if (invoice.patients?.phone) {
      await sendWhatsAppDocument(invoice.patients.phone, signed!.signedUrl, `invoice-${invoice.invoice_number}.pdf`, `Invoice #${invoice.invoice_number} from ${invoice.clinics.name}`);
    }
    await admin.from("invoices").update({ pdf_path: path, sent_at: new Date().toISOString() }).eq("id", id);

    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("generate-document error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
