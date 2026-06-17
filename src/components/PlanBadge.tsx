// src/components/PlanBadge.tsx
import React from 'react';
import { usePlanContext } from './PlanEnforcementProvider';
import { Crown, Star, Zap } from 'lucide-react';

export function PlanBadge() {
  const { limits } = usePlanContext();

  if (!limits) return null;

  const icons = {
    free: <Zap className="w-3 h-3" />,
    premium: <Star className="w-3 h-3" />,
    enterprise: <Crown className="w-3 h-3" />,
  };

  const colors = {
    free: 'bg-gray-100 text-gray-600 border-gray-200',
    premium: 'bg-blue-100 text-blue-700 border-blue-200',
    enterprise: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[limits.plan]}`}>
      {icons[limits.plan]}
      {limits.plan.charAt(0).toUpperCase() + limits.plan.slice(1)}
    </span>
  );
}
