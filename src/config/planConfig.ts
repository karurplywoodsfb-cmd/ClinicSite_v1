// src/config/planConfig.ts
export const PLAN_TIERS = ['free', 'premium', 'enterprise'] as const;
export type PlanTier = typeof PLAN_TIERS[number];

export interface PlanFeature {
  name: string;
  type: 'boolean' | 'number';
  free: boolean | number;
  premium: boolean | number;
  enterprise: boolean | number;
  description: string;
}

export const PLAN_FEATURES: PlanFeature[] = [
  { name: 'appointments_monthly', type: 'number', free: 50, premium: 500, enterprise: 999999, description: 'Monthly appointments' },
  { name: 'staff_members', type: 'number', free: 3, premium: 15, enterprise: 999999, description: 'Staff members' },
  { name: 'services', type: 'number', free: 5, premium: 20, enterprise: 999999, description: 'Services listed' },
  { name: 'custom_pages', type: 'number', free: 1, premium: 10, enterprise: 999999, description: 'Custom pages' },
  { name: 'seo_keywords', type: 'number', free: 3, premium: 20, enterprise: 999999, description: 'SEO keywords' },
  { name: 'chatbot_conversations', type: 'number', free: 100, premium: 1000, enterprise: 999999, description: 'Chatbot conversations' },
  { name: 'analytics_retention_days', type: 'number', free: 7, premium: 90, enterprise: 365, description: 'Analytics retention' },
  { name: 'storage_mb', type: 'number', free: 100, premium: 1000, enterprise: 10000, description: 'Storage (MB)' },
  { name: 'custom_domain', type: 'boolean', free: false, premium: true, enterprise: true, description: 'Custom domain' },
  { name: 'white_label', type: 'boolean', free: false, premium: false, enterprise: true, description: 'White label' },
  { name: 'api_access', type: 'boolean', free: false, premium: false, enterprise: true, description: 'API access' },
  { name: 'priority_support', type: 'boolean', free: false, premium: true, enterprise: true, description: 'Priority support' },
  { name: 'advanced_analytics', type: 'boolean', free: false, premium: true, enterprise: true, description: 'Advanced analytics' },
  { name: 'team_management', type: 'boolean', free: false, premium: true, enterprise: true, description: 'Team management' },
  { name: 'bulk_operations', type: 'boolean', free: false, premium: false, enterprise: true, description: 'Bulk operations' },
];

export const PLAN_PRICING = {
  free: { monthly: 0, yearly: 0, label: 'Free' },
  premium: { monthly: 29, yearly: 290, label: 'Premium' },
  enterprise: { monthly: 99, yearly: 990, label: 'Enterprise' },
};

export function getFeatureLimit(feature: string, plan: PlanTier): number | boolean {
  const featureDef = PLAN_FEATURES.find(f => f.name === feature);
  if (!featureDef) return false;
  return featureDef[plan];
}

export function getPlanRank(plan: PlanTier): number {
  return PLAN_TIERS.indexOf(plan);
}

export function isPlanAtLeast(userPlan: PlanTier, requiredPlan: PlanTier): boolean {
  return getPlanRank(userPlan) >= getPlanRank(requiredPlan);
}
