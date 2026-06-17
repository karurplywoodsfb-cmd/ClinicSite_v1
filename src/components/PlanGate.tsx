// src/components/PlanGate.tsx
import React from 'react';
import { usePlanEnforcement } from '../hooks/usePlanEnforcement';
import { Lock, ArrowUp } from 'lucide-react';
import type { PlanTier } from '../config/planConfig';

interface PlanGateProps {
  feature: string;
  requiredPlan?: PlanTier;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PlanGate({ feature, requiredPlan = 'premium', children, fallback }: PlanGateProps) {
  const { canUseFeature, limits } = usePlanEnforcement();

  if (canUseFeature(feature, requiredPlan)) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10 p-6">
        <Lock className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-sm font-medium text-gray-600 text-center">
          {requiredPlan === 'premium' ? 'Premium' : 'Enterprise'} Feature
        </p>
        <p className="text-xs text-gray-500 mt-1 mb-3 text-center">
          Your current plan: <strong>{limits?.plan || 'Free'}</strong>
        </p>
        <button 
          onClick={() => window.location.href = '/pricing'}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <ArrowUp className="w-4 h-4" />
          Upgrade to {requiredPlan}
        </button>
      </div>
      <div className="opacity-50 pointer-events-none filter blur-[2px]">
        {children}
      </div>
    </div>
  );
}
