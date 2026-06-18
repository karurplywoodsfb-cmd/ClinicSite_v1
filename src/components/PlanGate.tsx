// src/components/PlanGate.tsx
import React from 'react';
import { usePlanContext } from './PlanEnforcementProvider'; // Fixed import path to use context
import type { PlanTier } from '../config/planConfig';

// Inline SVG icons
const LockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d=\"M7 11V7a5 5 0 0 1 10 0v4\"/></svg>
);

interface PlanGateProps {
  feature: string;
  requiredPlan?: PlanTier;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PlanGate({ feature, requiredPlan = 'premium', children, fallback }: PlanGateProps) {
  // Switched from usePlanEnforcement() to usePlanContext()
  const { canUseFeature, limits } = usePlanContext();

  if (canUseFeature(feature, requiredPlan)) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10 p-6">
        <LockIcon className=\"w-8 h-8 text-gray-400 mb-2\" />
        <p className="text-sm font-medium text-gray-600 text-center">
          {requiredPlan === 'premium' ? 'Premium' : 'Enterprise'} Feature
        </p>
        <p className="text-xs text-gray-500 mt-1 mb-3 text-center">
          Your current plan: <strong>{limits?.plan || 'Free'}</strong>
        </p>
        <button 
          onClick={() => window.location.href = '/pricing'}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          Upgrade Plan
        </button>
      </div>
      <div className="opacity-40 pointer-events-none select-none">
        {children}
      </div>
    </div>
  );
}