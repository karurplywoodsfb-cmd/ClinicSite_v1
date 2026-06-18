// src/components/PlanEnforcementProvider.tsx
import React, { createContext, useContext } from 'react';
import { usePlanEnforcement } from '../hooks/usePlanEnforcement';
import type { PlanLimits, UsageData } from '../hooks/usePlanEnforcement';

interface PlanContextValue {
  limits: PlanLimits | null;
  usage: UsageData[];
  loading: boolean;
  error: string | null;
  canUseFeature: (featureName: string, requiredPlan?: string) => boolean;
  checkLimit: (featureName: string, increment?: number) => Promise<boolean>;
  incrementUsage: (featureName: string, increment?: number) => Promise<void>;
  getRemaining: (featureName: string) => number;
  getUsagePercent: (featureName: string) => number;
  refresh: () => void;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanEnforcementProvider({ children }: { children: React.ReactNode }) {
  const planData = usePlanEnforcement();

  return (
    <PlanContext.Provider value={planData}>
      {children}
    </PlanContext.Provider>
  );
}

export const usePlanContext = () => {
  const context = useContext(PlanContext);
  
  // Safe Fallback: Instead of crashing the entire application tree,
  // return safe default values if the provider isn't present upstream.
  if (!context) {
    console.warn('PlanEnforcementProvider context missing in parent application tree. Using safe fallbacks.');
    return {
      limits: null,
      usage: [],
      loading: false,
      error: null,
      canUseFeature: () => true, // Default to allowed to prevent UI lockouts
      checkLimit: async () => true,
      incrementUsage: async () => {},
      getRemaining: () => 999,
      getUsagePercent: () => 0,
      refresh: () => {},
    };
  }
  
  return context;
};