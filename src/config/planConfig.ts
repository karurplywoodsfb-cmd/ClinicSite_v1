// src/config/planConfig.ts
// Single source of plan definitions, feature limits, and INR pricing.
// Pricing matches razorpay.js exactly.

export const PLAN_TIERS = ["free", "premium", "enterprise"] as const;
export type PlanTier = typeof PLAN_TIERS[number];

export interface PlanFeature {
  name:        string;
  type:        "boolean" | "number";
  free:        boolean | number;
  premium:     boolean | number;
  enterprise:  boolean | number;
  description: string;
}

export const PLAN_FEATURES: PlanFeature[] = [
  { name:"appointments_monthly",      type:"number",  free:50,     premium:500,    enterprise:999999, description:"Monthly appointments" },
  { name:"staff_members",             type:"number",  free:3,      premium:15,     enterprise:999999, description:"Staff members" },
  { name:"services",                  type:"number",  free:5,      premium:20,     enterprise:999999, description:"Services listed" },
  { name:"custom_pages",              type:"number",  free:1,      premium:10,     enterprise:999999, description:"Blog / custom pages" },
  { name:"seo_keywords",              type:"number",  free:3,      premium:20,     enterprise:999999, description:"SEO keywords" },
  { name:"chatbot_conversations",     type:"number",  free:100,    premium:1000,   enterprise:999999, description:"Chatbot conversations/month" },
  { name:"analytics_retention_days",  type:"number",  free:7,      premium:90,     enterprise:365,    description:"Analytics history (days)" },
  { name:"storage_mb",                type:"number",  free:100,    premium:1000,   enterprise:10000,  description:"Storage (MB)" },
  { name:"custom_domain",             type:"boolean", free:false,  premium:true,   enterprise:true,   description:"Custom domain" },
  { name:"white_label",               type:"boolean", free:false,  premium:false,  enterprise:true,   description:"White label (remove branding)" },
  { name:"api_access",                type:"boolean", free:false,  premium:false,  enterprise:true,   description:"API access" },
  { name:"priority_support",          type:"boolean", free:false,  premium:true,   enterprise:true,   description:"Priority support" },
  { name:"advanced_analytics",        type:"boolean", free:false,  premium:true,   enterprise:true,   description:"Advanced analytics" },
  { name:"team_management",           type:"boolean", free:false,  premium:true,   enterprise:true,   description:"Team management" },
  { name:"bulk_operations",           type:"boolean", free:false,  premium:false,  enterprise:true,   description:"Bulk operations" },
];

// ── Pricing in INR (matches razorpay.js) ─────────────────────────
export const PLAN_PRICING: Record<PlanTier, { monthly: number; yearly: number; label: string; currency: string }> = {
  free:       { monthly: 0,    yearly: 0,     label: "Free",       currency: "INR" },
  premium:    { monthly: 499,  yearly: 4990,  label: "Premium",    currency: "INR" },
  enterprise: { monthly: 1999, yearly: 19990, label: "Enterprise", currency: "INR" },
};

export const PLAN_DISPLAY_EMOJI: Record<PlanTier, string> = {
  free:       "🌱",
  premium:    "⭐",
  enterprise: "👑",
};

// ── Helpers ───────────────────────────────────────────────────────

export function getFeatureLimit(feature: string, plan: PlanTier): number | boolean {
  const def = PLAN_FEATURES.find(f => f.name === feature);
  if (!def) return false;
  return def[plan];
}

export function getPlanRank(plan: PlanTier): number {
  return PLAN_TIERS.indexOf(plan);
}

export function isPlanAtLeast(userPlan: PlanTier, requiredPlan: PlanTier): boolean {
  return getPlanRank(userPlan) >= getPlanRank(requiredPlan);
}

export function formatPrice(plan: PlanTier): string {
  const p = PLAN_PRICING[plan];
  if (p.monthly === 0) return "Free";
  return `₹${p.monthly.toLocaleString("en-IN")}/mo`;
}
