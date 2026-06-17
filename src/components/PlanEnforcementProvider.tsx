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
  if (!context) throw new Error('usePlanContext must be used within PlanEnforcementProvider');
  return context;
};