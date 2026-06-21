// src/contexts/AuthContext.jsx
// Single source of auth state: user, clinic, doctor, isSuperAdmin
// Replaces the inline state management that was in Router.jsx

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, getMyClinic } from "../lib/supabase";
import { generatePrivacyPolicy } from "../lib/privacyPolicy";

const AuthContext = createContext(null);

async function checkSuperAdmin(userId) {
  const { data } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", userId)
    .maybeSingle();
  return data?.is_superadmin === true;
}

async function loadDoctor(clinicId) {
  const { data } = await supabase
    .from("doctors")
    .select("*")
    .eq("clinic_id", clinicId)
    .maybeSingle();
  return data || null;
}

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null);
  const [clinic,       setClinic]       = useState(null);
  const [doctor,       setDoctor]       = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading,      setLoading]      = useState(true);

  const loadUserData = useCallback(async (u) => {
    try {
      const [sa, c] = await Promise.all([
        checkSuperAdmin(u.id).catch(() => false),
        getMyClinic().catch(() => null),
      ]);
      setIsSuperAdmin(sa);
      setClinic(c);
      if (c?.id) {
        const doc = await loadDoctor(c.id);
        setDoctor(doc);
      }
    } catch (e) {
      console.error("[AuthContext] loadUserData:", e.message);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        await loadUserData(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadUserData(session.user);
      } else {
        setUser(null);
        setClinic(null);
        setDoctor(null);
        setIsSuperAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  // Called after onboarding completes
  const onClinicCreated = useCallback(async (newClinic) => {
    setClinic(newClinic);
    try {
      const doc = await loadDoctor(newClinic.id);
      setDoctor(doc);
      const policy = generatePrivacyPolicy(newClinic, doc);
      await supabase
        .from("privacy_policies")
        .upsert({ clinic_id: newClinic.id, content: policy.content, version: policy.version })
        .catch(() => {});
    } catch (e) {
      console.error("[AuthContext] onClinicCreated:", e.message);
    }
  }, []);

  const value = {
    user,
    clinic,
    doctor,
    isSuperAdmin,
    loading,
    setClinic,
    setDoctor,
    onClinicCreated,
    logout: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider>");
  return ctx;
};
