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