// src/components/PlanBadge.tsx
import React from 'react';
import { usePlanContext } from './PlanEnforcementProvider';

// Inline SVG icons (replace lucide-react)
const ZapIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
const StarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);
const CrownIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
);

export function PlanBadge() {
  const { limits } = usePlanContext();

  if (!limits) return null;

  const icons = {
    free: <ZapIcon className="w-4 h-4" />,
    premium: <StarIcon className="w-4 h-4" />,
    enterprise: <CrownIcon className="w-4 h-4" />,
  };

  const colors = {
    free: 'bg-gray-100 text-gray-600 border-gray-200',
    premium: 'bg-blue-100 text-blue-700 border-blue-200',
    enterprise: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[limits.plan]}`}>
      {icons[limits.plan]}
      {limits.plan.charAt(0).toUpperCase() + limits.plan.slice(1)}
    </span>
  );
}