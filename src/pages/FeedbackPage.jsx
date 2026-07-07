// src/pages/FeedbackPage.jsx
// Route: /:slug/feedback  (or clinic.subdomain/feedback)
// The Review Filter Funnel:
//   4-5★ → copy typed text to clipboard, open Google Maps review deep-link
//   1-3★ → private form, alerts clinic owner internally, never goes public
//
// NOTE (flagged to the client): review-gating — routing only positive
// experiences toward a public review site — sits outside Google's Business
// Profile policies. This page is built to spec, but frames the 4-5★ path as
// "share your experience" rather than an explicit gate, and keeps the
// low-star path genuinely private and actionable rather than a dead end.

import { useState, useEffect } from "react";
import { getClinicBySlug, submitFeedback } from "../lib/supabase";

function Spinner() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: "#64748b" }}>
      Loading…
    </div>
  );
}

export default function FeedbackPage({ slug }) {
  const [clinic, setClinic]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [stage, setStage]     = useState("rate"); // rate | public | private | done
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    (async () => {
      try {
        const c = await getClinicBySlug(slug);
        setClinic(c);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <Spinner />;
  if (!clinic) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: "#334155" }}>
        Clinic not found.
      </div>
    );
  }

  const handleRate = (stars) => {
    setRating(stars);
    setStage(stars >= 4 ? "public" : "private");
  };

  const handlePublicSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await submitFeedback(clinic.id, { rating, comment, patientName: name, patientPhone: phone });
      // Copy their words so they don't have to retype on Google
      if (comment.trim()) {
        try { await navigator.clipboard.writeText(comment.trim()); } catch { /* clipboard may be blocked, non-fatal */ }
      }
      if (clinic.maps_url) {
        window.location.href = clinic.maps_url;
      } else {
        setStage("done");
      }
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  const handlePrivateSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await submitFeedback(clinic.id, { rating, comment, patientName: name, patientPhone: phone });
      setStage("done");
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  const wrap = { minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans', sans-serif" };
  const card = { background: "white", borderRadius: 20, padding: 36, maxWidth: 440, width: "100%", boxShadow: "0 8px 32px rgba(15,23,42,0.08)", textAlign: "center" };

  return (
    <div style={wrap}>
      <div style={card}>
        {stage === "rate" && (
          <>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>How was your visit to {clinic.name}?</h1>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Tap a star to share your experience.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => handleRate(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 40, padding: 2, lineHeight: 1, filter: (hovered || rating) >= n ? "none" : "grayscale(1) opacity(0.35)" }}
                  aria-label={`${n} star`}
                >★</button>
              ))}
            </div>
          </>
        )}

        {stage === "public" && (
          <>
            <div style={{ fontSize: 32, marginBottom: 8 }}>😊</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Glad you had a good experience!</h1>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>
              Mind sharing a line about it? We'll copy it for you so posting on Google takes a few seconds.
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Very clean clinic, doctor explained everything clearly..."
              rows={4}
              style={{ width: "100%", borderRadius: 10, border: "1px solid #e2e8f0", padding: 12, fontSize: 14, fontFamily: "inherit", marginBottom: 14, resize: "vertical" }}
            />
            {error && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 10 }}>{error}</div>}
            <button
              onClick={handlePublicSubmit}
              disabled={submitting}
              style={{ width: "100%", background: "#1565c0", color: "white", border: "none", borderRadius: 10, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
            >
              {submitting ? "One moment…" : "Copy & continue to Google →"}
            </button>
          </>
        )}

        {stage === "private" && (
          <>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🙏</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Sorry to hear that.</h1>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>
              This goes directly and privately to the clinic — not posted anywhere public. They'll follow up with you.
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What went wrong?"
              rows={4}
              style={{ width: "100%", borderRadius: 10, border: "1px solid #e2e8f0", padding: 12, fontSize: 14, fontFamily: "inherit", marginBottom: 10, resize: "vertical" }}
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              style={{ width: "100%", borderRadius: 10, border: "1px solid #e2e8f0", padding: 12, fontSize: 14, fontFamily: "inherit", marginBottom: 10 }}
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number (so they can reach you)"
              style={{ width: "100%", borderRadius: 10, border: "1px solid #e2e8f0", padding: 12, fontSize: 14, fontFamily: "inherit", marginBottom: 14 }}
            />
            {error && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 10 }}>{error}</div>}
            <button
              onClick={handlePrivateSubmit}
              disabled={submitting}
              style={{ width: "100%", background: "#334155", color: "white", border: "none", borderRadius: 10, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
            >
              {submitting ? "Sending…" : "Send privately to the clinic"}
            </button>
          </>
        )}

        {stage === "done" && (
          <>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Thank you</h1>
            <p style={{ fontSize: 14, color: "#64748b" }}>
              {rating >= 4 ? "Your feedback has been recorded." : "The clinic has been notified and will follow up with you shortly."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
