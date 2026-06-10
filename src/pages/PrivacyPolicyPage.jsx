// src/pages/PrivacyPolicyPage.jsx
// COMPLIANCE FIX E2 — Auto-generated Privacy Policy per clinic tenant
// Required by DPDP Act 2023, Section 5 + DPDP Rules 2025, Rule 3
// Route: /:clinicSlug/privacy-policy

export function generatePrivacyPolicy(clinic, doctor) {
  const today    = new Date().toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });
  const docName  = doctor?.name  || clinic?.name;
  const docEmail = clinic?.email || `info@${clinic?.slug || "clinic"}.in`;
  const docPhone = clinic?.phone || "";
  const regNo    = doctor?.reg_number || "Registration pending";
  const council  = doctor?.council_name || "Tamil Nadu Medical Council";

  return {
    version: 1,
    generated_at: new Date().toISOString(),
    content: `# Privacy Policy

**${clinic?.name}**
${clinic?.address || clinic?.city + ", Tamil Nadu"}

**Last Updated:** ${today}
**Version:** 1.0

---

## 1. Introduction

This Privacy Policy explains how ${clinic?.name} ("we", "our", "the clinic"), a registered medical practice operated by ${docName} (${regNo} — ${council}), collects, uses, and protects your personal data when you use our website or book an appointment.

This policy is issued in compliance with the **Digital Personal Data Protection Act, 2023** (DPDP Act) and the **DPDP Rules, 2025**.

---

## 2. Who We Are (Data Fiduciary)

**Name of Practice:** ${clinic?.name}
**Registered Practitioner:** ${docName}
**Medical Council Registration:** ${regNo} — ${council}
**Address:** ${clinic?.address || clinic?.city + ", Tamil Nadu, India"}
**Contact:** ${docPhone} | ${docEmail}

As the operator of this website, ${clinic?.name} is the **Data Fiduciary** as defined under Section 2(i) of the DPDP Act, 2023.

---

## 3. What Personal Data We Collect

When you book an appointment through our website, we collect:

- **Your name** — to identify you for appointment scheduling
- **Your phone number** — to confirm and remind you of appointments
- **Your email address** (optional) — for digital appointment receipts
- **Reason for consultation / service selected** — for appointment preparation
- **Date and time preference** — for scheduling purposes

We do **not** collect: payment card details, Aadhaar numbers, medical records, diagnosis information, or any other sensitive personal data through this website.

---

## 4. Purpose of Data Processing (Section 6, DPDP Act 2023)

Your personal data is collected and processed **solely** for the following stated purpose:

1. **Appointment Scheduling** — to book, confirm, reschedule, or cancel your appointment
2. **Appointment Reminders** — to send you SMS/WhatsApp reminders with your consent
3. **Clinical Communication** — to contact you regarding your consultation

Your data will **not** be used for marketing, sold to third parties, shared with advertisers, or used for any purpose other than those listed above.

---

## 5. Legal Basis for Processing

We process your data on the basis of your **freely given, specific, informed, and unambiguous consent**, obtained through the double-consent mechanism on our appointment booking form, in accordance with **Section 6 of the DPDP Act, 2023**.

---

## 6. Data Retention

Appointment records are retained for **3 (three) years** from the date of your appointment, in accordance with the Ministry of Health & Family Welfare guidelines on medical record retention.

After this period, your data is securely deleted unless a longer retention period is required by applicable law.

---

## 7. Data Security

Your personal data is stored on encrypted, access-controlled servers. We use industry-standard security measures to protect against unauthorised access, disclosure, or loss.

---

## 8. Third-Party Data Processors

We share your phone number with the following third-party service providers **only** for the purpose of sending appointment communications:

- **MSG91** (SMS/WhatsApp delivery) — Data Processing Agreement in place
- **Supabase** (Secure database infrastructure)

These processors are contractually prohibited from using your data for any other purpose.

---

## 9. Your Rights (Section 12–14, DPDP Act 2023)

You have the following rights regarding your personal data:

- **Right to Access** — Request a copy of the data we hold about you
- **Right to Correction** — Request correction of inaccurate data
- **Right to Erasure** — Request deletion of your data (subject to legal retention obligations)
- **Right to Withdraw Consent** — Withdraw consent at any time; this does not affect the lawfulness of processing before withdrawal
- **Right to Grievance Redressal** — Lodge a complaint with our Grievance Officer

---

## 10. Grievance Officer (Section 13, DPDP Act 2023)

For any data-related queries, requests, or complaints:

**Name:** ${docName}
**Email:** ${docEmail}
**Phone:** ${docPhone}
**Address:** ${clinic?.address || clinic?.city + ", Tamil Nadu"}

We will respond to all data requests within **30 days** of receipt.

---

## 11. Complaints to Data Protection Board

If you are not satisfied with our response, you may file a complaint with the **Data Protection Board of India** (once constituted under the DPDP Act, 2023) at **www.dpb.gov.in**.

---

## 12. Cookies

Our website uses only functionally necessary cookies. We do not use advertising or tracking cookies.

---

## 13. Changes to This Policy

We will notify you of any material changes to this policy by updating the "Last Updated" date above. Continued use of our website after changes constitutes acceptance of the updated policy.

---

*This Privacy Policy was generated in compliance with the Digital Personal Data Protection Act, 2023 and DPDP Rules, 2025.*`
  };
}

export default function PrivacyPolicyPage({ clinic, doctor }) {
  const policy = generatePrivacyPolicy(clinic, doctor);

  const renderMarkdown = (content) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("# "))  return <h1 key={i} style={{ fontFamily:"'DM Serif Display',serif", fontSize:32, color:"#0b2545", margin:"0 0 20px", lineHeight:1.2 }}>{line.replace("# ","")}</h1>;
      if (line.startsWith("## ")) return <h2 key={i} style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, color:"#0b2545", margin:"32px 0 12px", borderBottom:"1px solid #dce8f5", paddingBottom:8 }}>{line.replace("## ","")}</h2>;
      if (line.startsWith("**") && line.endsWith("**") && !line.includes(" ")) return <p key={i} style={{ fontSize:14, fontWeight:700, color:"#0b2545", margin:"4px 0" }}>{line.slice(2,-2)}</p>;
      if (line.startsWith("- "))  return <div key={i} style={{ display:"flex", gap:8, marginBottom:6, paddingLeft:8 }}><span style={{ color:"#1565c0", flexShrink:0 }}>◦</span><span style={{ fontSize:14, color:"#334155", lineHeight:1.7 }}>{line.replace("- ","")}</span></div>;
      if (line.startsWith("---")) return <hr key={i} style={{ border:"none", borderTop:"1px solid #dce8f5", margin:"24px 0" }} />;
      if (line.startsWith("*") && line.endsWith("*")) return <p key={i} style={{ fontSize:12, color:"#94a3b8", fontStyle:"italic", lineHeight:1.6 }}>{line.slice(1,-1)}</p>;
      if (line.trim() === "")   return <div key={i} style={{ height:8 }} />;
      // Bold inline
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} style={{ fontSize:14, color:"#334155", lineHeight:1.8, marginBottom:2 }}>
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color:"#0b2545" }}>{part}</strong> : part)}
        </p>
      );
    });
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"white", minHeight:"100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>

      {/* Nav */}
      <div style={{ background:"white", borderBottom:"1px solid #dce8f5", padding:"16px 40px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <a href={`/${clinic?.slug}`} style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
          <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#1565c0,#1e88e5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🦷</div>
          <span style={{ fontSize:14, fontWeight:700, color:"#0b2545" }}>{clinic?.name}</span>
        </a>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:11, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", color:"#22c55e", borderRadius:6, padding:"3px 10px", fontFamily:"monospace" }}>
            DPDP Act 2023 Compliant
          </span>
          <a href={`/${clinic?.slug}`} style={{ fontSize:13, color:"#1565c0", textDecoration:"none", fontWeight:600 }}>← Back to Website</a>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:760, margin:"0 auto", padding:"48px 40px 80px" }}>
        <div style={{ background:"#f0f7ff", border:"1px solid #dce8f5", borderRadius:12, padding:"16px 20px", marginBottom:32, display:"flex", gap:12, alignItems:"flex-start" }}>
          <span style={{ fontSize:20 }}>🔒</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#0b2545", marginBottom:4 }}>Your Data Rights Are Protected</div>
            <div style={{ fontSize:12, color:"#5a7a96", lineHeight:1.6 }}>
              This privacy policy is issued under the Digital Personal Data Protection Act, 2023 (India). It explains exactly what data we collect, why, and your rights. For questions, contact us at {clinic?.email || docEmail}.
            </div>
          </div>
        </div>
        {renderMarkdown(policy.content)}
        <div style={{ marginTop:40, padding:"16px 20px", background:"#f4f8fd", border:"1px solid #dce8f5", borderRadius:10, fontSize:11, color:"#94a3b8", fontFamily:"monospace", lineHeight:1.8 }}>
          Auto-generated by ClinicSite.in · Version {policy.version} · {new Date(policy.generated_at).toLocaleDateString("en-IN")} · DPDP Act 2023 · DPDP Rules 2025
        </div>
      </div>
    </div>
  );
}
