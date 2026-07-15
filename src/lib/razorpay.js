// src/lib/razorpay.js
// Razorpay subscription + payment integration.
// Plan FEATURES are generated from planConfig.ts — single source of truth.
// UpgradeModal.jsx reads PLANS from here, so everything stays in sync.

import { PLAN_FEATURES, PLAN_PRICING, PLAN_DISPLAY_EMOJI } from "../config/planConfig";

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

// ── Generate human-readable feature strings from planConfig ──────
// These are what UpgradeModal.jsx displays — always derived from planConfig.ts

function formatLimit(value) {
  if (typeof value === "boolean") return value;
  if (value >= 999999) return "Unlimited";
  return value.toLocaleString("en-IN");
}

function buildFeatureLines(plan) {
  const lines   = [];
  const crossed = [];

  for (const f of PLAN_FEATURES) {
    const val  = f[plan];
    const free = f["free"];

    if (f.type === "boolean") {
      if (val === true)  lines.push(`${f.description}`);
      if (val === false) crossed.push(`${f.description}`);
    } else {
      const display = formatLimit(val);
      if (val === 0) {
        crossed.push(f.description);
      } else {
        lines.push(`${f.description}: ${display}`);
      }
    }
  }
  return { features: lines, limits: crossed };
}

// ── PLANS object (consumed by UpgradeModal.jsx) ──────────────────
// Pricing and Razorpay IDs from env vars + planConfig.
// Feature text auto-generated from planConfig — never hardcode here.

export const PLANS = {
  free: {
    id:       "free",
    name:     PLAN_PRICING.free.label,
    emoji:    PLAN_DISPLAY_EMOJI.free,
    price:    PLAN_PRICING.free.monthly,
    interval: null,
    color:    "#64748b",
    razorpay_plan_id: null,
    ...buildFeatureLines("free"),
  },
  premium: {
    id:              "premium",
    name:            PLAN_PRICING.premium.label,
    emoji:           PLAN_DISPLAY_EMOJI.premium,
    price:           PLAN_PRICING.premium.monthly,
    interval:        "monthly",
    color:           "#3b82f6",
    highlight:       true,
    razorpay_plan_id: import.meta.env.VITE_RAZORPAY_PLAN_PREMIUM,
    ...buildFeatureLines("premium"),
  },
  enterprise: {
    id:              "enterprise",
    name:            PLAN_PRICING.enterprise.label,
    emoji:           PLAN_DISPLAY_EMOJI.enterprise,
    price:           PLAN_PRICING.enterprise.monthly,
    interval:        "monthly",
    color:           "#a855f7",
    razorpay_plan_id: import.meta.env.VITE_RAZORPAY_PLAN_ENTERPRISE,
    ...buildFeatureLines("enterprise"),
  },
};

// ── Load Razorpay script ─────────────────────────────────────────
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script    = document.createElement("script");
    script.src      = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload   = () => resolve(true);
    script.onerror  = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Create subscription via Supabase Edge Function ───────────────
async function createSubscription(planId, clinicId) {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-subscription`,
    {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ plan_id: planId, clinic_id: clinicId }),
    }
  );
  const data = await res.json();
  if (!data.subscription_id) throw new Error("Failed to create subscription");
  return data.subscription_id;
}

// ── Open Razorpay checkout ───────────────────────────────────────
export async function openCheckout({ plan, clinic, user, onSuccess, onError }) {
  const loaded = await loadRazorpay();
  if (!loaded) { onError?.("Failed to load payment gateway"); return; }

  try {
    const subscriptionId = await createSubscription(
      PLANS[plan].razorpay_plan_id,
      clinic.id
    );

    const options = {
      key:             RAZORPAY_KEY,
      subscription_id: subscriptionId,
      name:            "ClinicSite",
      description:     `${PLANS[plan].name} Plan — ₹${PLANS[plan].price}/month`,
      image:           `${import.meta.env.VITE_APP_URL || "https://waspace.in"}/logo.png`,

      prefill: {
        name:    clinic.name,
        email:   user.email,
        contact: clinic.phone || "",
      },

      theme: { color: PLANS[plan].color },

      notes: {
        clinic_id:   clinic.id,
        clinic_name: clinic.name,
        plan,
      },

      handler: async (response) => {
        try {
          await verifyAndActivate(response, clinic.id, plan);
          onSuccess?.(response);
        } catch (e) {
          onError?.(e.message);
        }
      },

      modal: {
        ondismiss: () => console.log("Payment modal closed"),
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response) => {
      onError?.(response.error.description);
    });
    rzp.open();

  } catch (e) {
    onError?.(e.message || "Payment failed");
  }
}

// ── Verify payment + activate plan (Edge Function) ───────────────
async function verifyAndActivate(paymentResponse, clinicId, plan) {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`,
    {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ ...paymentResponse, clinic_id: clinicId, plan }),
    }
  );
  const data = await res.json();
  if (!data.ok) throw new Error("Payment verification failed");
  return data;
}

// ── Cancel subscription ──────────────────────────────────────────
export async function cancelSubscription(clinicId) {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`,
    {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ clinic_id: clinicId }),
    }
  );
  return res.json();
}
