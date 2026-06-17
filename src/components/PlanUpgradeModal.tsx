// src/components/PlanUpgradeModal.tsx
import React from 'react';
import { X, ArrowUp, Check } from 'lucide-react';
import { PLAN_PRICING, PLAN_FEATURES } from '../config/planConfig';
import type { PlanTier } from '../config/planConfig';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredPlan: PlanTier;
  featureName: string;
}

export function PlanUpgradeModal({ isOpen, onClose, requiredPlan, featureName }: PlanUpgradeModalProps) {
  if (!isOpen) return null;

  const pricing = PLAN_PRICING[requiredPlan];
  const feature = PLAN_FEATURES.find(f => f.name === featureName);

  const premiumFeatures = PLAN_FEATURES.filter(f => 
    (f.premium !== f.free) || (requiredPlan === 'enterprise' && f.enterprise !== f.free)
  ).slice(0, 6);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Upgrade Required</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>{feature?.description || 'This feature'}</strong> requires the <strong>{pricing.label}</strong> plan.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {premiumFeatures.map(f => (
            <div key={f.name} className="flex items-center gap-2 text-sm text-gray-600">
              <span style={{ color: "#22c55e", fontSize: 16, marginRight: 8 }}>✓</span>
              <span>{f.description}: <strong className="text-gray-800">
                {typeof f[requiredPlan] === 'boolean' 
                  ? (f[requiredPlan] ? 'Yes' : 'No')
                  : f[requiredPlan] > 100000 ? 'Unlimited' : f[requiredPlan]
                }
              </strong></span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.location.href = '/pricing'}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
          >
            ↑
            Upgrade to {pricing.label}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}