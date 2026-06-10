// src/lib/razorpay.js
// Razorpay subscription + one-time payment integration
// Plans: Free | Premium ₹499/mo | Enterprise ₹1,999/mo

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

// ═══════════════════════════════════════════════════
// PLAN CONFIG
// ═══════════════════════════════════════════════════

export const PLANS = {
  free: {
    id:       "free",
    name:     "Free",
    price:    0,
    interval: null,
    color:    "#64748b",
    features: [
      "3 specialty templates",
      "3 pages (Home, Services, Contact)",
      "1 doctor profile",
      "WhatsApp button",
      "yourname.clinicsite.in subdomain",
      "Basic SEO auto-configured",
      "Mobile optimized",
    ],
    limits: [
      "No appointment booking",
      "No custom domain",
      "ClinicSite branding",
    ],
  },
  premium: {
    id:              "premium",
    name:            "Premium",
    price:           499,
    razorpay_plan_id: import.meta.env.VITE_RAZORPAY_PLAN_PREMIUM, // set in .env
    interval:        "monthly",
    color:           "#3b82f6",
    highlight:       true,
    features: [
      "20+ specialty templates",
      "Unlimited pages",
      "Up to 10 doctor profiles",
      "Appointment booking (50/mo)",
      "Custom domain connection",
      "Patient testimonials",
      "Health blog (5 posts)",
      "Full SEO dashboard",
      "Analytics",
      "Email support",
    ],
    limits: ["Single branch only"],
  },
  enterprise: {
    id:              "enterprise",
    name:            "Enterprise",
    price:           1999,
    razorpay_plan_id: import.meta.env.VITE_RAZORPAY_PLAN_ENTERPRISE,
    interval:        "monthly",
    color:           "#a855f7",
    features: [
      "Everything in Premium",
      "Multi-branch management",
      "Unlimited appointments",
      "Lab reports portal",
      "WhatsApp API integration",
      "Multi-language (4 languages)",
      "Staff portal",
      "Dedicated account manager",
      "Custom branding removal",
    ],
    limits: [],
  },
};

// ═══════════════════════════════════════════════════
// LOAD RAZORPAY SCRIPT
// ═══════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════
// CREATE SUBSCRIPTION (via your Supabase Edge Function)
// ═══════════════════════════════════════════════════

async function createSubscription(planId, clinicId) {
  // Your Supabase edge function calls Razorpay server-side
  // to create a subscription and returns the subscription_id
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

// ═══════════════════════════════════════════════════
// OPEN RAZORPAY CHECKOUT
// ═══════════════════════════════════════════════════

export async function openCheckout({ plan, clinic, user, onSuccess, onError }) {
  const loaded = await loadRazorpay();
  if (!loaded) { onError?.("Failed to load payment gateway"); return; }

  try {
    const subscriptionId = await createSubscription(
      PLANS[plan].razorpay_plan_id,
      clinic.id
    );

    const options = {
      key:         RAZORPAY_KEY,
      subscription_id: subscriptionId,
      name:        "ClinicSite",
      description: `${PLANS[plan].name} Plan — ₹${PLANS[plan].price}/month`,
      image:       "https://clinicsite.in/logo.png",

      prefill: {
        name:  clinic.name,
        email: user.email,
        contact: clinic.phone || "",
      },

      theme: { color: PLANS[plan].color },

      notes: {
        clinic_id:   clinic.id,
        clinic_name: clinic.name,
        plan:        plan,
      },

      handler: async (response) => {
        // response.razorpay_payment_id
        // response.razorpay_subscription_id
        // response.razorpay_signature
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

// ═══════════════════════════════════════════════════
// VERIFY PAYMENT + ACTIVATE PLAN (Edge Function)
// ═══════════════════════════════════════════════════

async function verifyAndActivate(paymentResponse, clinicId, plan) {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`,
    {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        ...paymentResponse,
        clinic_id: clinicId,
        plan,
      }),
    }
  );
  const data = await res.json();
  if (!data.ok) throw new Error("Payment verification failed");
  return data;
}

// ═══════════════════════════════════════════════════
// CANCEL SUBSCRIPTION
// ═══════════════════════════════════════════════════

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
