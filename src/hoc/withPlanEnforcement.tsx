// src/hoc/withPlanEnforcement.tsx
import React from 'react';
import { PlanGate } from '../components/PlanGate';
import type { PlanTier } from '../config/planConfig';

interface WithPlanOptions {
  feature: string;
  requiredPlan?: PlanTier;
  fallback?: React.ReactNode;
}

export function withPlanEnforcement<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithPlanOptions
) {
  return function WithPlanComponent(props: P) {
    return (
      <PlanGate
        feature={options.feature}
        requiredPlan={options.requiredPlan}
        fallback={options.fallback}
      >
        <WrappedComponent {...props} />
      </PlanGate>
    );
  };
}

// Usage example:
// export default withPlanEnforcement(CustomDomainSettings, {
//   feature: 'custom_domain',
//   requiredPlan: 'premium'
// });
