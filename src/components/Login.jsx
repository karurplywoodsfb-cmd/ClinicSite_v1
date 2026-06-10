// src/components/Login.jsx
// Email OTP login for clinic owners
// Uses Supabase Magic Link / Email OTP — completely FREE, no Twilio

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login({ onLogin }) {
  const [email,   setEmail]   = useState("");
  const [otp,     setOtp]     = useState("");
  const [step,    setStep]    = useState("email"); // email | otp
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [resent,  setResent]  = useState(false);

  const handleSendOTP = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setEmail(trimmed);
      setStep("otp");
    } catch (e) {
      setError(e.message || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError("Enter the 6-digit code from your email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type:  "email",
      });
      if (error) throw error;
      onLogin(data.user);
    } catch (e) {
      setError("Invalid or expired code. Check your email or resend.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResent(false);
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setResent(true);
      setOtp("");
      setTimeout(() => setResent(false), 4000);
    } catch (e) {
      setError("Failed to resend. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #080c14 0%, #0d1a2e 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", padding: 20,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 58, height: 58, borderRadius: 16,
            background: "linear-gradient(135deg, #1565c0, #1e88e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, margin: "0 auto 16px",
            boxShadow: "0 8px 32px rgba(21,101,192,0.35)",
          }}>🦷</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9", margin: "0 0 6px" }}>
            ClinicSite Admin
          </h1>
          <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>
            {step === "email" ? "Sign in to manage your clinic website" : "Check your inbox for the code"}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18, padding: "32px 28px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
        }}>

          {/* STEP 1: Email */}
          {step === "email" && (
            <>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", fontFamily: "monospace", fontWeight: 600, letterSpacing: 0.8, marginBottom: 8, textTransform: "uppercase" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="doctor@yourclinic.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleSendOTP()}
                  autoFocus
                  style={{
                    width: "100%", padding: "12px 14px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1.5px solid rgba(255,255,255,0.1)",
                    color: "#e2e8f0", borderRadius: 10,
                    fontSize: 15, fontFamily: "inherit", outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {error && <ErrorBox msg={error} />}

              <button onClick={handleSendOTP} disabled={loading} style={primaryBtn(loading)}>
                {loading ? "Sending code..." : "Send Login Code →"}
              </button>

              <p style={{ fontSize: 12, color: "#334155", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
                We'll email you a 6-digit code.<br/>
                <span style={{ color: "#22c55e" }}>✓ Free</span> — no SMS or subscription needed.
              </p>
            </>
          )}

          {/* STEP 2: OTP */}
          {step === "otp" && (
            <>
              <div style={{ background: "rgba(21,101,192,0.08)", border: "1px solid rgba(21,101,192,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#475569", marginBottom: 2 }}>Code sent to</div>
                  <div style={{ fontSize: 14, color: "#7dd3fc", fontWeight: 600 }}>{email}</div>
                </div>
                <button onClick={() => { setStep("email"); setOtp(""); setError(""); }}
                  style={{ background: "none", border: "none", color: "#475569", fontSize: 12, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
                  Change
                </button>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, color: "#64748b", fontFamily: "monospace", fontWeight: 600, letterSpacing: 0.8, marginBottom: 8, textTransform: "uppercase" }}>
                  6-Digit Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g,"").slice(0,6)); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleVerifyOTP()}
                  autoFocus
                  style={{
                    width: "100%", padding: "16px 14px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1.5px solid rgba(255,255,255,0.1)",
                    color: "#e2e8f0", borderRadius: 10,
                    fontSize: 32, fontFamily: "monospace", outline: "none",
                    textAlign: "center", letterSpacing: 12,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {error  && <ErrorBox   msg={error} />}
              {resent && <SuccessBox msg="New code sent! Check your inbox." />}

              <button onClick={handleVerifyOTP} disabled={loading || otp.length !== 6} style={primaryBtn(loading || otp.length !== 6)}>
                {loading ? "Verifying..." : "Verify & Sign In →"}
              </button>

              <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#334155" }}>
                Didn't receive it?{" "}
                <button onClick={handleResend} disabled={loading}
                  style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, textDecoration: "underline" }}>
                  Resend code
                </button>
              </div>
              <p style={{ fontSize: 12, color: "#1e293b", textAlign: "center", marginTop: 8 }}>
                Check spam/junk folder if not in inbox.
              </p>
            </>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#1e293b", marginTop: 20 }}>
          New clinic? Account is created automatically on first sign in.
        </p>
      </div>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171", marginBottom: 16 }}>
      ⚠️ {msg}
    </div>
  );
}

function SuccessBox({ msg }) {
  return (
    <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#22c55e", marginBottom: 16 }}>
      ✓ {msg}
    </div>
  );
}

function primaryBtn(disabled) {
  return {
    width: "100%", padding: "13px",
    background: disabled ? "rgba(21,101,192,0.35)" : "linear-gradient(135deg, #1565c0, #1e88e5)",
    border: "none", borderRadius: 10, color: "white",
    fontSize: 15, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit", transition: "all .2s",
    boxShadow: disabled ? "none" : "0 4px 16px rgba(21,101,192,0.3)",
    opacity: disabled ? 0.7 : 1,
  };
}
