// src/hooks/usePushNotifications.js
// Manages browser push notification subscription for clinic admins
// Call this inside AdminPanel — registers SW, gets permission, saves subscription

import { useState, useEffect, useCallback } from "react";

// ── VAPID public key ──────────────────────────────────────────────
// Generate your VAPID keys once using:
//   npx web-push generate-vapid-keys
// Then put the PUBLIC key here and PRIVATE key in your Supabase edge function secrets
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export function usePushNotifications({ supabase, clinicId }) {
  const [permission,    setPermission]    = useState(Notification.permission);
  const [subscription,  setSubscription]  = useState(null);
  const [swRegistration, setSwReg]        = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");

  // Register service worker on mount
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    navigator.serviceWorker.register("/sw.js")
      .then(reg => {
        setSwReg(reg);
        return reg.pushManager.getSubscription();
      })
      .then(sub => { if (sub) setSubscription(sub); })
      .catch(e => setError("Service worker error: " + e.message));
  }, []);

  // Request permission + subscribe
  const subscribe = useCallback(async () => {
    if (!swRegistration) { setError("Service worker not ready."); return; }
    if (!VAPID_PUBLIC_KEY) { setError("VITE_VAPID_PUBLIC_KEY not set in .env"); return; }

    setLoading(true); setError("");
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") { setError("Permission denied."); return; }

      const sub = await swRegistration.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      setSubscription(sub);

      // Save subscription to Supabase
      if (clinicId) {
        await supabase.from("push_subscriptions").upsert({
          clinic_id:    clinicId,
          subscription: JSON.stringify(sub),
          updated_at:   new Date().toISOString(),
        }, { onConflict: "clinic_id" });
      }
    } catch (e) {
      setError("Subscribe failed: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [swRegistration, clinicId, supabase]);

  // Unsubscribe
  const unsubscribe = useCallback(async () => {
    if (!subscription) return;
    setLoading(true);
    try {
      await subscription.unsubscribe();
      setSubscription(null);
      if (clinicId) {
        await supabase.from("push_subscriptions").delete().eq("clinic_id", clinicId);
      }
    } catch (e) {
      setError("Unsubscribe failed: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [subscription, clinicId, supabase]);

  // Send a local test notification
  const sendTest = useCallback(async () => {
    if (!swRegistration || permission !== "granted") return;
    await swRegistration.showNotification("Test Notification 🏥", {
      body:    "Push notifications are working! You'll be notified of new appointments.",
      icon:    "/icon-192.png",
      tag:     "test",
      vibrate: [200, 100, 200],
    });
  }, [swRegistration, permission]);

  const isSupported   = "serviceWorker" in navigator && "PushManager" in window;
  const isSubscribed  = !!subscription;
  const isDenied      = permission === "denied";

  return { isSupported, isSubscribed, isDenied, permission, loading, error, subscribe, unsubscribe, sendTest };
}
