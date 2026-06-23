// src/hooks/usePlanEnforcement.ts
// FIXED:
// - Reads clinic plan directly using owner_id (correct column name)
// - Builds limits from planConfig.ts client-side — no RPC needed for limits
// - getRemaining returns full limit when no usage record exists (was returning 0)
// - canUseFeature works even while usage is loading

import { useState, useEffect, useCallback } from "react";
import { supabase }                          from "../lib/supabase";
import { PLAN_FEATURES, PLAN_TIERS }         from "../config/planConfig";
import type { PlanTier }                     from "../config/planConfig";

export interface PlanLimits {
  plan: PlanTier;
  features: Record<string, number | boolean>;
}

// Build a limits object from planConfig for a given plan tier
function buildLimits(plan: PlanTier): PlanLimits {
  const features: Record<string, number | boolean> = {};
  for (const f of PLAN_FEATURES) {
    features[f.name] = f[plan];
  }
  return { plan, features };
}

export function usePlanEnforcement() {
  const [limits,  setLimits]  = useState<PlanLimits | null>(null);
  const [usage,   setUsage]   = useState<Record<string, number>>({});
  const [userId,  setUserId]  = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Step 1: Get auth user ──────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Step 2: Get plan from clinics table using owner_id ─────────
  const fetchLimits = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await supabase
        .from("clinics")
        .select("plan")
        .eq("owner_id", userId)   // ← correct column name
        .maybeSingle();

      const plan = (PLAN_TIERS.includes(data?.plan) ? data.plan : "free") as PlanTier;
      setLimits(buildLimits(plan));
    } catch (e) {
      console.error("[usePlanEnforcement] fetchLimits:", e);
      setLimits(buildLimits("free")); // fail safe
    }
  }, [userId]);

  // ── Step 3: Get actual usage counts from plan_usage table ──────
  const fetchUsage = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await supabase
        .from("plan_usage")
        .select("feature_name, usage_count")
        .eq("profile_id", userId)
        .gte("period_start", new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString().split("T")[0]);

      const map: Record<string, number> = {};
      for (const row of (data || [])) {
        map[row.feature_name] = row.usage_count;
      }
      setUsage(map);
    } catch (e) {
      console.error("[usePlanEnforcement] fetchUsage:", e);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    Promise.all([fetchLimits(), fetchUsage()]).finally(() => setLoading(false));
  }, [userId, fetchLimits, fetchUsage]);

  // ── canUseFeature ──────────────────────────────────────────────
  const canUseFeature = useCallback((featureName: string, requiredPlan?: PlanTier): boolean => {
    if (!limits) return false;
    const val = limits.features[featureName];
    // Boolean feature (custom_domain, white_label, etc.)
    if (typeof val === "boolean") return val === true;
    // Tier requirement
    if (requiredPlan) {
      const rank = (p: PlanTier) => PLAN_TIERS.indexOf(p);
      return rank(limits.plan) >= rank(requiredPlan);
    }
    return true;
  }, [limits]);

  // ── checkLimit — calls RPC for server-side verification ────────
  const checkLimit = useCallback(async (featureName: string, increment = 1): Promise<boolean> => {
    if (!userId || !limits) return false;
    // Fast client-side check first
    const limit = limits.features[featureName];
    if (typeof limit === "boolean") return limit;
    const used = usage[featureName] ?? 0;
    if (used + increment > Number(limit)) return false;
    // Confirm server-side (prevents race conditions)
    try {
      const { data } = await supabase.rpc("check_plan_limit", {
        p_profile_id:   userId,
        p_feature_name: featureName,
        p_increment:    increment,
      });
      return data === true;
    } catch {
      // Fail open on RPC error — client-side check already passed
      return true;
    }
  }, [userId, limits, usage]);

  // ── incrementUsage ─────────────────────────────────────────────
  const incrementUsage = useCallback(async (featureName: string, increment = 1) => {
    if (!userId) return;
    // Optimistic local update
    setUsage(prev => ({ ...prev, [featureName]: (prev[featureName] ?? 0) + increment }));
    try {
      await supabase.rpc("increment_plan_usage", {
        p_profile_id:   userId,
        p_feature_name: featureName,
        p_increment:    increment,
      });
    } catch (e) {
      console.error("[usePlanEnforcement] incrementUsage:", e);
      fetchUsage(); // re-sync on error
    }
  }, [userId, fetchUsage]);

  // ── getRemaining — returns full limit if no usage yet ──────────
  const getRemaining = useCallback((featureName: string): number => {
    if (!limits) return 0;
    const limit = limits.features[featureName];
    if (typeof limit === "boolean") return limit ? 1 : 0;
    const used = usage[featureName] ?? 0;   // 0 if no record yet ← KEY FIX
    return Math.max(0, Number(limit) - used);
  }, [limits, usage]);

  // ── getUsagePercent ────────────────────────────────────────────
  const getUsagePercent = useCallback((featureName: string): number => {
    if (!limits) return 0;
    const limit = limits.features[featureName];
    if (!limit || typeof limit === "boolean") return 0;
    const used = usage[featureName] ?? 0;
    return Math.min(100, Math.round((used / Number(limit)) * 100));
  }, [limits, usage]);

  return {
    limits,
    loading,
    canUseFeature,
    checkLimit,
    incrementUsage,
    getRemaining,
    getUsagePercent,
    refresh: () => { fetchLimits(); fetchUsage(); },
  };
}
