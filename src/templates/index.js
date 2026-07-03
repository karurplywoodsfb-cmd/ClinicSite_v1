// src/templates/index.js
import CorporateGiant    from "./CorporateGiant";
import EliteAesthetics   from "./EliteAesthetics";
import NordicSanctuary   from "./NordicSanctuary";
import TelehealthPlatform from "./TelehealthPlatform";
import SurgicalHub       from "./SurgicalHub";

export const TEMPLATES = {
  corporate:  {
    id:        "corporate",
    name:      "Corporate Giant",
    desc:      "Multi-Specialty Hospital",
    icon:      "🏥",
    component: CorporateGiant,
    bestFor:   ["General Practice","Cardiology","Orthopedics","Multi-Specialty"],
  },
  aesthetics: {
    id:        "aesthetics",
    name:      "Elite Aesthetics",
    desc:      "Luxury Editorial",
    icon:      "✨",
    component: EliteAesthetics,
    bestFor:   ["Dermatology","Cosmetic Surgery","Anti-Ageing"],
  },
  holistic: {
    id:        "holistic",
    name:      "Nordic Sanctuary",
    desc:      "Holistic & Calming",
    icon:      "🌿",
    component: NordicSanctuary,
    bestFor:   ["Ayurveda","Homeopathy","Physiotherapy","Wellness"],
  },
  telehealth: {
    id:        "telehealth",
    name:      "Telehealth Platform",
    desc:      "Digital-First SaaS",
    icon:      "📱",
    component: TelehealthPlatform,
    bestFor:   ["General Practice","Pediatrics","Psychiatry"],
  },
  surgical: {
    id:        "surgical",
    name:      "Surgical Hub",
    desc:      "Technical & Data-Driven",
    icon:      "⚕️",
    component: SurgicalHub,
    bestFor:   ["Orthopedics","Cardiology","Oncology","Neurology"],
  },
};

// Auto-suggest template based on specialty
export function suggestTemplate(specialty) {
  for (const [key, tmpl] of Object.entries(TEMPLATES)) {
    if (tmpl.bestFor.includes(specialty)) return key;
  }
  return "corporate"; // default fallback
}
// ── Template thumbnail layout previews ───────────────────────────
// Used by the Design tab in AdminPanel to show a mini visual preview
// of each template's layout style before the user picks it.
// Each is a pure SVG — no images needed, no external dependencies.

export const TEMPLATE_PREVIEWS = {
  corporate: `
    <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;border-radius:6px;">
      <rect width="120" height="80" fill="#0b1929"/>
      <!-- Navbar -->
      <rect x="0" y="0" width="120" height="10" fill="#0f2340"/>
      <rect x="6" y="3" width="20" height="4" rx="1" fill="#1e88e5"/>
      <rect x="85" y="3" width="14" height="4" rx="2" fill="#1565c0"/>
      <!-- Hero -->
      <rect x="0" y="10" width="120" height="28" fill="#112035"/>
      <rect x="8" y="16" width="40" height="5" rx="1" fill="#e2e8f0"/>
      <rect x="8" y="23" width="28" height="3" rx="1" fill="#475569"/>
      <rect x="8" y="30" width="16" height="5" rx="2" fill="#1565c0"/>
      <!-- Cards row -->
      <rect x="6"  y="42" width="32" height="20" rx="3" fill="#0f2340"/>
      <rect x="44" y="42" width="32" height="20" rx="3" fill="#0f2340"/>
      <rect x="82" y="42" width="32" height="20" rx="3" fill="#0f2340"/>
      <rect x="10" y="46" width="12" height="3" rx="1" fill="#1e88e5"/>
      <rect x="10" y="51" width="20" height="2" rx="1" fill="#334155"/>
      <rect x="10" y="55" width="16" height="2" rx="1" fill="#334155"/>
      <!-- Footer -->
      <rect x="0" y="70" width="120" height="10" fill="#060d18"/>
    </svg>`,

  aesthetics: `
    <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;border-radius:6px;">
      <rect width="120" height="80" fill="#faf7f4"/>
      <!-- Minimal nav -->
      <rect x="0" y="0" width="120" height="9" fill="#faf7f4"/>
      <rect x="6" y="3" width="18" height="3" rx="1" fill="#1a1a1a"/>
      <rect x="86" y="3" width="12" height="3" rx="1" fill="#c9a96e"/>
      <!-- Split hero -->
      <rect x="0" y="9" width="60" height="40" fill="#f0ebe4"/>
      <rect x="60" y="9" width="60" height="40" fill="#e8ddd4"/>
      <rect x="6" y="20" width="32" height="5" rx="1" fill="#1a1a1a"/>
      <rect x="6" y="27" width="24" height="2" rx="1" fill="#6b5e52"/>
      <rect x="6" y="35" width="14" height="5" rx="2" fill="#c9a96e"/>
      <!-- Services -->
      <rect x="6"  y="54" width="24" height="16" rx="2" fill="#f0ebe4"/>
      <rect x="34" y="54" width="24" height="16" rx="2" fill="#f0ebe4"/>
      <rect x="62" y="54" width="24" height="16" rx="2" fill="#f0ebe4"/>
      <rect x="90" y="54" width="24" height="16" rx="2" fill="#f0ebe4"/>
      <rect x="9"  y="57" width="14" height="2" rx="1" fill="#c9a96e"/>
      <rect x="9"  y="61" width="18" height="2" rx="1" fill="#9e8e82"/>
    </svg>`,

  holistic: `
    <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;border-radius:6px;">
      <rect width="120" height="80" fill="#f1f8e9"/>
      <!-- Centered nav -->
      <rect x="0" y="0" width="120" height="9" fill="#ffffff"/>
      <rect x="46" y="3" width="28" height="3" rx="1" fill="#2e7d32"/>
      <!-- Centered hero -->
      <rect x="20" y="14" width="80" height="4" rx="1" fill="#1b5e20"/>
      <rect x="30" y="20" width="60" height="3" rx="1" fill="#558b2f"/>
      <rect x="44" y="26" width="32" height="5" rx="2" fill="#2e7d32"/>
      <!-- Divider -->
      <line x1="50" y1="36" x2="70" y2="36" stroke="#a5d6a7" stroke-width="1"/>
      <!-- Icon cards -->
      <rect x="8"  y="42" width="32" height="24" rx="4" fill="#ffffff"/>
      <rect x="44" y="42" width="32" height="24" rx="4" fill="#ffffff"/>
      <rect x="80" y="42" width="32" height="24" rx="4" fill="#ffffff"/>
      <circle cx="24" cy="50" r="4" fill="#c8e6c9"/>
      <circle cx="60" cy="50" r="4" fill="#c8e6c9"/>
      <circle cx="96" cy="50" r="4" fill="#c8e6c9"/>
      <rect x="12" y="57" width="24" height="2" rx="1" fill="#558b2f"/>
      <rect x="48" y="57" width="24" height="2" rx="1" fill="#558b2f"/>
      <rect x="84" y="57" width="24" height="2" rx="1" fill="#558b2f"/>
      <!-- Footer -->
      <rect x="0" y="72" width="120" height="8" fill="#e8f5e9"/>
    </svg>`,

  telehealth: `
    <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;border-radius:6px;">
      <rect width="120" height="80" fill="#0a0f1e"/>
      <!-- Gradient hero area -->
      <rect x="0" y="0" width="120" height="45" fill="#0d1b3e"/>
      <!-- Navbar -->
      <rect x="0" y="0" width="120" height="9" fill="rgba(255,255,255,0.04)"/>
      <rect x="6" y="3" width="16" height="3" rx="1" fill="#60a5fa"/>
      <rect x="88" y="2.5" width="12" height="4" rx="2" fill="#2563eb"/>
      <!-- Hero content -->
      <rect x="8"  y="14" width="50" height="5" rx="1" fill="#f8fafc"/>
      <rect x="8"  y="21" width="36" height="3" rx="1" fill="#64748b"/>
      <rect x="8"  y="27" width="20" height="5" rx="2" fill="#2563eb"/>
      <!-- Dashboard widget right side -->
      <rect x="72" y="10" width="42" height="32" rx="4" fill="rgba(37,99,235,0.15)" stroke="rgba(96,165,250,0.2)" stroke-width="0.5"/>
      <rect x="76" y="14" width="14" height="2" rx="1" fill="#60a5fa"/>
      <rect x="76" y="18" width="30" height="8" rx="2" fill="rgba(255,255,255,0.05)"/>
      <rect x="76" y="28" width="30" height="8" rx="2" fill="rgba(255,255,255,0.05)"/>
      <!-- Stats row -->
      <rect x="6"  y="50" width="24" height="12" rx="3" fill="#111827"/>
      <rect x="34" y="50" width="24" height="12" rx="3" fill="#111827"/>
      <rect x="62" y="50" width="24" height="12" rx="3" fill="#111827"/>
      <rect x="90" y="50" width="24" height="12" rx="3" fill="#111827"/>
      <rect x="9"  y="53" width="10" height="2" rx="1" fill="#2563eb"/>
      <rect x="9"  y="57" width="16" height="2" rx="1" fill="#334155"/>
      <!-- Footer -->
      <rect x="0" y="70" width="120" height="10" fill="#060a14"/>
    </svg>`,

  surgical: `
    <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;border-radius:6px;">
      <rect width="120" height="80" fill="#f8fafc"/>
      <!-- Top accent bar -->
      <rect x="0" y="0" width="120" height="3" fill="#b91c1c"/>
      <!-- Navbar -->
      <rect x="0" y="3" width="120" height="9" fill="#ffffff"/>
      <rect x="6" y="5" width="18" height="5" rx="1" fill="#1e293b"/>
      <rect x="82" y="5.5" width="14" height="4" rx="2" fill="#b91c1c"/>
      <!-- Hero - left text, right image block -->
      <rect x="0"  y="12" width="65" height="35" fill="#f1f5f9"/>
      <rect x="65" y="12" width="55" height="35" fill="#e2e8f0"/>
      <rect x="8"  y="18" width="44" height="5" rx="1" fill="#0f172a"/>
      <rect x="8"  y="25" width="36" height="3" rx="1" fill="#475569"/>
      <rect x="8"  y="30" width="28" height="3" rx="1" fill="#475569"/>
      <rect x="8"  y="38" width="18" height="5" rx="2" fill="#b91c1c"/>
      <!-- Credentials bar -->
      <rect x="0" y="47" width="120" height="10" fill="#0f172a"/>
      <rect x="8"  y="50" width="20" height="4" rx="1" fill="rgba(255,255,255,0.7)"/>
      <rect x="34" y="50" width="20" height="4" rx="1" fill="rgba(255,255,255,0.7)"/>
      <rect x="60" y="50" width="20" height="4" rx="1" fill="rgba(255,255,255,0.7)"/>
      <rect x="86" y="50" width="20" height="4" rx="1" fill="rgba(255,255,255,0.7)"/>
      <!-- Services -->
      <rect x="6"  y="61" width="26" height="12" rx="2" fill="#ffffff" stroke="#e2e8f0" stroke-width="0.5"/>
      <rect x="36" y="61" width="26" height="12" rx="2" fill="#ffffff" stroke="#e2e8f0" stroke-width="0.5"/>
      <rect x="66" y="61" width="26" height="12" rx="2" fill="#ffffff" stroke="#e2e8f0" stroke-width="0.5"/>
      <rect x="96" y="61" width="18" height="12" rx="2" fill="#fee2e2"/>
      <rect x="9"  y="64" width="14" height="2" rx="1" fill="#b91c1c"/>
      <rect x="9"  y="68" width="18" height="2" rx="1" fill="#94a3b8"/>
    </svg>`,
};
