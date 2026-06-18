// src/components/UsageBar.tsx
import React from 'react';
import { usePlanContext } from './PlanEnforcementProvider'; // Fixed import path to use context

interface UsageBarProps {
  feature: string;
  label: string;
}

export function UsageBar({ feature, label }: UsageBarProps) {
  // Switched from usePlanEnforcement() to usePlanContext()
  const { getRemaining, getUsagePercent, limits } = usePlanContext();

  const percent = getUsagePercent(feature);
  const remaining = getRemaining(feature);
  const limit = limits?.features[feature as keyof typeof limits.features] as number || 0;

  const color = percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-yellow-500' : 'bg-green-500';
  const isUnlimited = typeof limit === 'number' && limit > 100000;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">
          {isUnlimited ? 'Unlimited' : `${remaining} remaining`}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all duration-500 ${isUnlimited ? 'bg-purple-500' : color}`}
          style={{ width: `${isUnlimited ? 100 : percent}%` }}
        />
      </div>
    </div>
  );
}