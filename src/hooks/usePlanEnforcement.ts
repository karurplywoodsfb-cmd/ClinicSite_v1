// src/hooks/usePlanEnforcement.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { PlanTier } from '../config/planConfig';

export interface PlanLimits {
  plan: PlanTier;
  features: {
    appointments_monthly: number;
    staff_members: number;
    services: number;
    custom_pages: number;
    seo_keywords: number;
    chatbot_conversations: number;
    analytics_retention_days: number;
    storage_mb: number;
    custom_domain: boolean;
    white_label: boolean;
    api_access: boolean;
    priority_support: boolean;
    advanced_analytics: boolean;
    team_management: boolean;
    bulk_operations: boolean;
  };
}

export interface UsageData {
  feature_name: string;
  usage_count: number;
  usage_limit: number;
  percentage: number;
}

export function usePlanEnforcement() {
  const { user } = useAuth();
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current plan limits
  const fetchLimits = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_plan_limits', { p_profile_id: user.id });

      if (error) throw error;
      setLimits(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, [user]);

  // Fetch current usage
  const fetchUsage = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('plan_usage')
        .select('*')
        .eq('profile_id', user.id);

      if (error) throw error;

      const processed = data.map((item: any) => ({
        feature_name: item.feature_name,
        usage_count: item.usage_count,
        usage_limit: item.usage_limit,
        percentage: Math.round((item.usage_count / item.usage_limit) * 100)
      }));

      setUsage(processed);
    } catch (err: any) {
      setError(err.message);
    }
  }, [user]);

  // Check if feature is allowed
  const canUseFeature = useCallback((featureName: string, requiredPlan?: PlanTier): boolean => {
    if (!limits) return false;

    // Check boolean features
    const booleanFeatures = ['custom_domain', 'white_label', 'api_access', 'priority_support', 'advanced_analytics', 'team_management', 'bulk_operations'];
    if (booleanFeatures.includes(featureName)) {
      return limits.features[featureName as keyof typeof limits.features] === true;
    }

    // Check tier requirement
    if (requiredPlan) {
      const tiers: PlanTier[] = ['free', 'premium', 'enterprise'];
      const userTier = tiers.indexOf(limits.plan);
      const requiredTier = tiers.indexOf(requiredPlan);
      return userTier >= requiredTier;
    }

    return true;
  }, [limits]);

  // Check if limit reached
  const checkLimit = useCallback(async (featureName: string, increment: number = 1): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .rpc('check_plan_limit', {
          p_profile_id: user.id,
          p_feature_name: featureName,
          p_increment: increment
        });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Limit check failed:', err);
      return false;
    }
  }, [user]);

  // Increment usage
  const incrementUsage = useCallback(async (featureName: string, increment: number = 1) => {
    if (!user) return;

    await supabase.rpc('increment_plan_usage', {
      p_profile_id: user.id,
      p_feature_name: featureName,
      p_increment: increment
    });

    // Refresh usage data
    fetchUsage();
  }, [user, fetchUsage]);

  // Get remaining quota
  const getRemaining = useCallback((featureName: string): number => {
    const item = usage.find(u => u.feature_name === featureName);
    if (!item) return 0;
    return Math.max(0, item.usage_limit - item.usage_count);
  }, [usage]);

  // Get usage percentage
  const getUsagePercent = useCallback((featureName: string): number => {
    const item = usage.find(u => u.feature_name === featureName);
    if (!item) return 0;
    return item.percentage;
  }, [usage]);

  useEffect(() => {
    if (user) {
      Promise.all([fetchLimits(), fetchUsage()]).then(() => {
        setLoading(false);
      });
    }
  }, [user, fetchLimits, fetchUsage]);

  return {
    limits,
    usage,
    loading,
    error,
    canUseFeature,
    checkLimit,
    incrementUsage,
    getRemaining,
    getUsagePercent,
    refresh: () => {
      fetchLimits();
      fetchUsage();
    }
  };
}
