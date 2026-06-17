// src/components/PlanEnforcementProvider.tsx
import React, { createContext, useContext } from 'react';
import { usePlanEnforcement } from '../hooks/usePlanEnforcement';

const PlanContext = createContext<ReturnType<typeof usePlanEnforcement> | null>(null);

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
