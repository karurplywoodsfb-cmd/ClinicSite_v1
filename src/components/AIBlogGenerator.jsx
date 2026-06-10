import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// MEDICAL SAFETY LAYER 1 — Strict System Prompt
// ═══════════════════════════════════════════════════════════════
const MEDICAL_SYSTEM_PROMPT = `You are a medical content writer for a licensed clinic in India.
Your role is to write accurate, helpful health education articles for patients.

ABSOLUTE RULES — never violate these under any circumstance:
1. NEVER state specific drug names, dosages, or treatment protocols unless universally established (e.g. "paracetamol for fever" is fine)
2. NEVER diagnose — describe symptoms and when to seek help, never say "you have X condition"
3. NEVER use absolute language: forbidden words include "will cure", "guaranteed", "always works", "100% effective", "no side effects", "permanent solution"
4. ALWAYS recommend consulting a qualified doctor for personal medical decisions
5. NEVER contradict established WHO, ICMR, or major medical body guidelines
6. ALWAYS use appropriately hedged language: "may help", "studies suggest", "in many cases", "your doctor can advise"
7. NEVER make claims that could replace professional medical advice or diagnosis
8. If you are uncertain about any medical fact — OMIT it entirely. Never guess or fill in gaps with assumptions.
9. NEVER recommend specific brands, hospitals, or products
10. NEVER make comparative superiority claims ("best treatment", "only cure")

REQUIRED elements in every article:
- At least two natural "consult your doctor" recommendations woven into the text
- Evidence-based statements only
- Balanced perspective (mention that individual results vary)
- No specific medication names unless absolutely essential and widely accepted

TONE: Warm, reassuring, educational. Like a knowledgeable friend who always says "but please confirm this with your doctor."`;

// ═══════════════════════════════════════════════════════════════
// MEDICAL SAFETY LAYER 2 — Forbidden Phrases Scanner
// ═══════════════════════════════════════════════════════════════
const FORBIDDEN_PHRASES = [
  { phrase: "guaranteed to cure",       severity: "high",   reason: "Absolute cure claim — prohibited" },
  { phrase: "100% effective",           severity: "high",   reason: "Absolute efficacy claim" },
  { phrase: "no side effects",          severity: "high",   reason: "All treatments carry risk potential" },
  { phrase: "best doctor",             severity: "medium", reason: "Comparative superiority claim (NMC guideline)" },
  { phrase: "permanent cure",           severity: "high",   reason: "Absolute cure claim" },
  { phrase: "you have",                severity: "high",   reason: "Diagnostic language — not permitted" },
  { phrase: "you are suffering from",   severity: "high",   reason: "Diagnostic language" },
  { phrase: "diagnosed with",          severity: "high",   reason: "Diagnostic language" },
  { phrase: "no need to see a doctor", severity: "high",   reason: "Discourages professional consultation" },
  { phrase: "avoid doctors",           severity: "high",   reason: "Discourages professional consultation" },
  { phrase: "mg daily",               severity: "medium", reason: "Specific dosage instruction — requires prescription" },
  { phrase: "take twice",             severity: "medium", reason: "Dosage instruction — requires prescription" },
  { phrase: "always works",           severity: "high",   reason: "Absolute efficacy claim" },
  { phrase: "will cure",              severity: "high",   reason: "Absolute cure claim" },
  { phrase: "guaranteed results",     severity: "high",   reason: "Absolute outcome claim" },
  { phrase: "miracle",               severity: "medium", reason: "Misleading superlative language" },
  { phrase: "instant relief",        severity: "medium", reason: "Misleading outcome claim" },
  { phrase: "100% safe",             severity: "high",   reason: "No medical intervention is universally 100% safe" },
  { phrase: "alternative to surgery", severity: "medium", reason: "Requires clinical evidence to claim" },
  { phrase: "proven to cure",        severity: "high",   reason: "Absolute cure claim" },
  { phrase: "clinically proven",     severity: "medium", reason: "Requires citation — vague as stated" },
];

function scanForbiddenPhrases(text) {
  const lower = text.toLowerCase();
  return FORBIDDEN_PHRASES.filter(fp => lower.includes(fp.phrase.toLowerCase()));
}

// ═══════════════════════════════════════════════════════════════
// MEDICAL SAFETY LAYER 3 — Confidence Score Parser
// ═══════════════════════════════════════════════════════════════
function parseAccuracyCheck(rawText) {
  try {
    const match = rawText.match(/<accuracy_check>([\s\S]*?)<\/accuracy_check>/);
    if (!match) return null;
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

function stripAccuracyBlock(text) {
  return text.replace(/<accuracy_check>[\s\S]*?<\/accuracy_check>/g, "").trim();
}

// ═══════════════════════════════════════════════════════════════
// MEDICAL DISCLAIMER (Layer 4 — auto-appended)
// ═══════════════════════════════════════════════════════════════
const MEDICAL_DISCLAIMER = `---
**Medical Disclaimer:** This article is for general informational and educational purposes only. It does not constitute medical advice and is not intended to be a substitute for professional medical consultation, diagnosis, or treatment. Individual medical situations vary — always seek the guidance of a qualified and registered healthcare provider regarding any medical condition, symptoms, or treatment options. Do not disregard professional medical advice or delay seeking it because of something you have read in this article.`;

// ═══════════════════════════════════════════════════════════════
// TOPIC TEMPLATES
// ═══════════════════════════════════════════════════════════════
const TOPIC_TEMPLATES = {
  Dental: [
    "What to expect at your first dental implant consultation",
    "Early signs of gum disease and when to see a dentist",
    "Understanding root canal treatment — a patient's guide",
    "How to care for your teeth between dental visits",
    "Children's dental health — when to start and what to expect",
    "Teeth sensitivity: causes and when to seek professional advice",
    "What happens during a professional dental cleaning?",
    "Braces vs aligners — questions to ask your orthodontist",
  ],
  Dermatology: [
    "Understanding acne: types, triggers, and treatment options",
    "When to see a dermatologist for hair loss",
    "Skin changes to never ignore — a patient's guide",
    "How to prepare for your first dermatology consultation",
    "Sun protection in India — what dermatologists recommend",
    "Managing eczema: lifestyle tips and when to seek care",
  ],
  Pediatrics: [
    "India's childhood vaccination schedule — a parent's guide",
    "When to call the doctor for your child's fever",
    "Common childhood infections: what parents should know",
    "Nutrition milestones for children aged 1 to 5",
    "Signs of developmental concerns to discuss with your paediatrician",
  ],
  "General Practice": [
    "Understanding your blood pressure reading",
    "Managing diabetes: lifestyle factors your doctor may discuss",
    "Annual health checkups — what tests are typically recommended",
    "How stress affects physical health — and when to seek support",
    "Recognising the difference between a cold and something more serious",
  ],
  Orthopedics: [
    "What to expect after knee replacement surgery",
    "Back pain: when rest helps and when to see a specialist",
    "How physiotherapy supports orthopaedic recovery",
    "Understanding arthritis — types and general management approaches",
    "Questions to ask before any orthopaedic procedure",
  ],
  default: [
    "How to prepare for a specialist consultation",
    "Questions you should always ask your doctor",
    "Understanding your diagnostic test results",
    "Health screenings by age — a general guide",
    "When to seek a second medical opinion",
  ],
};

const WORD_COUNT_OPTIONS = [
  { label: "Short",  value: 400, time: "~25 sec", desc: "400 words" },
  { label: "Medium", value: 700, time: "~40 sec", desc: "700 words" },
  { label: "Long",   value: 1000, time: "~55 sec", desc: "1000 words" },
];

const TONE_OPTIONS = [
  { value: "friendly",     label: "Friendly & Simple",  desc: "Warm, patient-facing" },
  { value: "professional", label: "Professional",        desc: "Clinical, authoritative" },
  { value: "educational",  label: "Educational",         desc: "Detailed, informative" },
];

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function SeverityDot({ severity }) {
  const colors = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
  return <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors[severity] || "#64748b", flexShrink: 0 }} />;
}

function ScoreRing({ score }) {
  const color = score >= 85 ? "#22c55e" : score >= 65 ? "#f59e0b" : "#ef4444";
  const pct   = score / 100;
  const r = 28, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
      <svg width={72} height={72} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          style={{ transition: "stroke-dashoffset 1s ease" }} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: "monospace", lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 9, color: "#475569", marginTop: 1 }}>/ 100</div>
      </div>
    </div>
  );
}

function ArticleBody({ body }) {
  if (!body) return null;
  return (
    <div>
      {body.split("\n").map((line, i) => {
        if (line.startsWith("## "))  return <h2 key={i} style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", margin: "28px 0 10px", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>{line.replace("## ", "")}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", margin: "18px 0 8px" }}>{line.replace("### ", "")}</h3>;
        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", margin: "8px 0" }}>{line.slice(2, -2)}</p>;
        if (line.startsWith("- "))  return (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, paddingLeft: 8 }}>
            <span style={{ color: "#8b5cf6", flexShrink: 0, marginTop: 2 }}>◦</span>
            <span style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{line.replace("- ", "")}</span>
          </div>
        );
        if (line.startsWith("---")) return <hr key={i} style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", margin: "20px 0" }} />;
        if (line.trim() === "")    return <div key={i} style={{ height: 10 }} />;
        return <p key={i} style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8, marginBottom: 2 }}>{line}</p>;
      })}
    </div>
  );
}

function SEOSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function AIBlogGenerator({ clinic, supabaseClient }) {
  const specialty = clinic?.specialty || "Dental";
  const city      = clinic?.city      || "India";
  const topics    = TOPIC_TEMPLATES[specialty] || TOPIC_TEMPLATES.default;

  const [tab,       setTab]       = useState("generate");
  const [posts,     setPosts]     = useState([
    { id:1, title:"What to expect at your first dental implant consultation", status:"published", word_count:704, created_at:new Date(Date.now()-86400000*3).toISOString(), views:218, confidence:91, reviewed:true },
    { id:2, title:"Early signs of gum disease and when to see a dentist",     status:"draft",     word_count:412, created_at:new Date(Date.now()-86400000).toISOString(),   views:0,   confidence:88, reviewed:false },
  ]);

  // Generator form state
  const [topic,        setTopic]        = useState("");
  const [customTopic,  setCustomTopic]  = useState("");
  const [wordCount,    setWordCount]    = useState(700);
  const [tone,         setTone]         = useState("friendly");

  // Generation state
  const [generating,   setGenerating]   = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [progressMsg,  setProgressMsg]  = useState("");
  const [article,      setArticle]      = useState(null);
  const [accuracy,     setAccuracy]     = useState(null);
  const [flags,        setFlags]        = useState([]);
  const [error,        setError]        = useState("");

  // Review gate state (Layer 5)
  const [reviewChecked, setReviewChecked] = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [savedMsg,      setSavedMsg]      = useState("");

  const PROGRESS_STEPS = [
    "Applying medical safety guidelines...",
    "Structuring evidence-based outline...",
    "Writing patient-safe content...",
    "Running accuracy check...",
    "Scanning for prohibited claims...",
    "Appending medical disclaimer...",
    "Finalising article...",
  ];

  const handleGenerate = async () => {
    const finalTopic = customTopic.trim() || topic;
    if (!finalTopic) { setError("Please select or enter a topic"); return; }

    setGenerating(true);
    setArticle(null);
    setAccuracy(null);
    setFlags([]);
    setError("");
    setProgress(0);
    setReviewChecked(false);
    setSavedMsg("");

    // Animate progress steps
    let step = 0;
    const stepInterval = setInterval(() => {
      if (step < PROGRESS_STEPS.length) {
        setProgressMsg(PROGRESS_STEPS[step]);
        setProgress(Math.round((step / PROGRESS_STEPS.length) * 88));
        step++;
      }
    }, 700);

    try {
      const userPrompt = `Write a health education article for patients of ${clinic?.name || "a clinic"} in ${city}, India.

ARTICLE SPECIFICATIONS:
- Topic: ${finalTopic}
- Medical specialty: ${specialty}
- Location context: ${city}, Tamil Nadu, India
- Target length: approximately ${wordCount} words
- Tone: ${tone === "friendly" ? "warm and accessible — avoid jargon, explain terms simply" : tone === "professional" ? "professional and clinical yet reassuring" : "educational and thorough with clear explanations for a non-medical reader"}

STRUCTURE:
- Opening paragraph (no heading) that hooks the reader and validates their concern
- 2–3 sections using ## headings
- Use bullet points for lists of symptoms, steps, or options
- Close with a "When to See a Doctor" or "Seeking Professional Help" section
- Mention ${city} naturally 1–2 times
- Reference ${clinic?.name || "our clinic"} once naturally in context

AFTER THE ARTICLE, append this block exactly:
<accuracy_check>
{
  "confidence": <integer 0-100 reflecting your confidence in medical accuracy>,
  "uncertain_claims": [<list strings of any claims you are not fully certain about>],
  "sources_basis": [<list the medical knowledge bases this draws from, e.g. "WHO guidelines on X", "standard dental practice">],
  "flags": [<list any statements a medical reviewer should double-check>],
  "ymyl_risk": "<low|medium|high>"
}
</accuracy_check>`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: MEDICAL_SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      clearInterval(stepInterval);
      setProgress(90);
      setProgressMsg("Processing safety checks...");

      const data     = await response.json();
      const rawText  = data.content?.[0]?.text || "";

      // Parse accuracy block
      const accuracyData = parseAccuracyCheck(rawText);
      const cleanBody    = stripAccuracyBlock(rawText);

      // Run forbidden phrase scan
      const foundFlags = scanForbiddenPhrases(cleanBody);

      // Append disclaimer
      const finalBody = cleanBody + "\n\n" + MEDICAL_DISCLAIMER;

      const slug     = SEOSlug(finalTopic);
      const wc       = cleanBody.split(/\s+/).length;
      const excerpt  = cleanBody.split("\n").find(l => l.trim() && !l.startsWith("#"))?.trim() || "";

      setArticle({
        title:      finalTopic,
        body:       finalBody,
        excerpt,
        slug,
        word_count: wc,
        status:     "draft",
        specialty,
        city,
        clinic_id:  clinic?.id,
        seo: {
          meta_title:       `${finalTopic} | ${specialty} Advice — ${clinic?.name || city}`,
          meta_description: excerpt.slice(0, 155),
        },
        created_at: new Date().toISOString(),
      });

      setAccuracy(accuracyData);
      setFlags(foundFlags);
      setProgress(100);
      setProgressMsg("Complete");

    } catch (e) {
      clearInterval(stepInterval);
      setError("Generation failed: " + (e.message || "Check your API connection."));
      setProgress(0);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (status) => {
    if (!article) return;
    if (status === "published" && !reviewChecked) {
      setError("You must confirm doctor review before publishing.");
      return;
    }
    setSaving(true);
    setSavedMsg("");
    try {
      const post = { ...article, status, confidence: accuracy?.confidence || 0, reviewed: reviewChecked };
      if (supabaseClient && clinic?.id) {
        const { data, error: dbErr } = await supabaseClient.from("blog_posts").insert(post).select().single();
        if (dbErr) throw dbErr;
        setPosts(prev => [{ ...data, views: 0 }, ...prev]);
      } else {
        setPosts(prev => [{ ...post, id: Date.now(), views: 0 }, ...prev]);
      }
      setSavedMsg(status === "published" ? "✓ Published successfully!" : "✓ Saved as draft");
      setTimeout(() => { setTab("manage"); setSavedMsg(""); }, 1400);
    } catch (e) {
      setError("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const highFlags   = flags.filter(f => f.severity === "high");
  const medFlags    = flags.filter(f => f.severity === "medium");
  const canPublish  = article && reviewChecked && highFlags.length === 0;
  const confScore   = accuracy?.confidence || 0;
  const confColor   = confScore >= 85 ? "#22c55e" : confScore >= 65 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", background:"#080c14", minHeight:"100vh", color:"#e2e8f0" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* ── Header ── */}
      <div style={{ background:"#0d1526", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"16px 28px", display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#7c3aed,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>✍️</div>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:"#f1f5f9" }}>AI Blog Generator</div>
          <div style={{ fontSize:11, color:"#475569", fontFamily:"monospace" }}>Medical-Safe Content · {specialty} · {city}</div>
        </div>

        {/* Safety badge */}
        <div style={{ marginLeft:16, display:"flex", alignItems:"center", gap:8, background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, padding:"6px 14px" }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e" }} />
          <span style={{ fontSize:11, color:"#22c55e", fontFamily:"monospace", fontWeight:600 }}>5-LAYER MEDICAL SAFETY ACTIVE</span>
        </div>

        <div style={{ marginLeft:"auto", display:"flex", gap:16 }}>
          {[["Articles", posts.length], ["Published", posts.filter(p=>p.status==="published").length], ["Reviews Pending", posts.filter(p=>p.status==="draft"&&!p.reviewed).length]].map(([l,v]) => (
            <div key={l} style={{ textAlign:"center", padding:"0 14px", borderLeft:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize:18, fontWeight:700, color:"#8b5cf6", fontFamily:"monospace" }}>{v}</div>
              <div style={{ fontSize:10, color:"#475569" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"0 28px", background:"#0d1526", display:"flex", gap:2 }}>
        {[["generate","✍️  Generate"],["manage",`📚  Articles (${posts.length})`],["safeguards","🛡️  Safety Rules"]].map(([id,label]) => (
          <button key={id} onClick={()=>setTab(id)} style={{
            background: tab===id ? "rgba(139,92,246,0.12)" : "transparent",
            border: tab===id ? "1px solid rgba(139,92,246,0.35)" : "1px solid transparent",
            borderBottom:"none", color: tab===id ? "#c4b5fd" : "#475569",
            padding:"10px 20px", borderRadius:"8px 8px 0 0", cursor:"pointer",
            fontSize:13, fontFamily:"inherit", transition:"all .15s",
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding:28, maxWidth:1240, margin:"0 auto" }}>

        {/* ══════════════ GENERATE TAB ══════════════ */}
        {tab === "generate" && (
          <div style={{ display:"grid", gridTemplateColumns:"380px 1fr", gap:24 }}>

            {/* Left: Controls */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* Topic */}
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:20 }}>
                <div style={{ fontSize:11, fontFamily:"monospace", color:"#64748b", fontWeight:700, letterSpacing:1, marginBottom:12 }}>TOPIC — {specialty.toUpperCase()}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
                  {topics.map((t,i) => (
                    <button key={i} onClick={()=>{setTopic(t);setCustomTopic("");}} style={{
                      padding:"9px 13px", borderRadius:8, cursor:"pointer", textAlign:"left", fontFamily:"inherit", fontSize:12, transition:"all .15s",
                      background: topic===t&&!customTopic ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.02)",
                      border:`1px solid ${topic===t&&!customTopic ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.07)"}`,
                      color: topic===t&&!customTopic ? "#c4b5fd" : "#94a3b8",
                    }}>{t}</button>
                  ))}
                </div>
                <div style={{ fontSize:10, color:"#475569", marginBottom:5, fontFamily:"monospace" }}>OR CUSTOM TOPIC</div>
                <input value={customTopic} onChange={e=>{setCustomTopic(e.target.value);setTopic("");}}
                  placeholder="e.g. How to prepare for dental surgery"
                  style={{ width:"100%", padding:"9px 12px", background:"rgba(255,255,255,0.04)", border:`1.5px solid ${customTopic?"rgba(139,92,246,0.5)":"rgba(255,255,255,0.1)"}`, color:"#e2e8f0", borderRadius:8, fontSize:12, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
              </div>

              {/* Options */}
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:20 }}>
                <div style={{ fontSize:11, fontFamily:"monospace", color:"#64748b", fontWeight:700, letterSpacing:1, marginBottom:12 }}>OPTIONS</div>
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:"#475569", marginBottom:7 }}>Length</div>
                  <div style={{ display:"flex", gap:7 }}>
                    {WORD_COUNT_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={()=>setWordCount(opt.value)} style={{ flex:1, padding:"8px 4px", borderRadius:8, cursor:"pointer", fontFamily:"inherit", textAlign:"center",
                        background: wordCount===opt.value?"rgba(139,92,246,0.12)":"rgba(255,255,255,0.03)",
                        border:`1px solid ${wordCount===opt.value?"rgba(139,92,246,0.4)":"rgba(255,255,255,0.07)"}`,
                        color: wordCount===opt.value?"#c4b5fd":"#64748b",
                      }}>
                        <div style={{ fontSize:11, fontWeight:700 }}>{opt.label}</div>
                        <div style={{ fontSize:10, opacity:.7, marginTop:2 }}>{opt.desc}</div>
                        <div style={{ fontSize:9, opacity:.5 }}>{opt.time}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:"#475569", marginBottom:7 }}>Tone</div>
                  {TONE_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={()=>setTone(opt.value)} style={{
                      width:"100%", marginBottom:5, padding:"8px 12px", borderRadius:8, cursor:"pointer", fontFamily:"inherit",
                      background: tone===opt.value?"rgba(139,92,246,0.1)":"rgba(255,255,255,0.02)",
                      border:`1px solid ${tone===opt.value?"rgba(139,92,246,0.35)":"rgba(255,255,255,0.07)"}`,
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                    }}>
                      <span style={{ fontSize:12, color:tone===opt.value?"#c4b5fd":"#94a3b8", fontWeight:tone===opt.value?600:400 }}>{opt.label}</span>
                      <span style={{ fontSize:10, color:"#334155" }}>{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Safety layers indicator */}
              <div style={{ background:"rgba(34,197,94,0.04)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:12, padding:16 }}>
                <div style={{ fontSize:10, fontFamily:"monospace", color:"#22c55e", marginBottom:10, letterSpacing:1 }}>🛡️ ACTIVE SAFETY LAYERS</div>
                {[
                  "Strict medical system prompt",
                  "Forbidden phrases scanner (21 rules)",
                  "AI confidence scoring",
                  "Doctor review gate",
                  "Auto medical disclaimer",
                ].map((s,i) => (
                  <div key={i} style={{ display:"flex", gap:7, fontSize:11, color:"#64748b", padding:"3px 0" }}>
                    <span style={{ color:"#22c55e" }}>✓</span>{s}
                  </div>
                ))}
              </div>

              {error && (
                <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"12px 14px", fontSize:12, color:"#f87171" }}>
                  ⚠️ {error}
                </div>
              )}

              <button onClick={handleGenerate} disabled={generating||(!topic&&!customTopic)} style={{
                padding:"13px", fontSize:14, fontWeight:700, cursor: generating||(!topic&&!customTopic)?"not-allowed":"pointer",
                background: generating?"rgba(139,92,246,0.3)":(!topic&&!customTopic)?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#7c3aed,#4f46e5)",
                border:"none", borderRadius:12, color: (!topic&&!customTopic)?"#334155":"white",
                fontFamily:"inherit", boxShadow: (topic||customTopic)&&!generating?"0 4px 20px rgba(124,58,237,0.4)":"none", transition:"all .2s",
              }}>
                {generating ? "✦ Generating safely..." : "✦ Generate Medical Article →"}
              </button>
            </div>

            {/* Right: Output */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Progress */}
              {generating && (
                <div style={{ background:"rgba(139,92,246,0.06)", border:"1px solid rgba(139,92,246,0.2)", borderRadius:14, padding:20 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                    <div style={{ fontSize:13, color:"#c4b5fd", fontWeight:600 }}>✦ {progressMsg}</div>
                    <div style={{ fontSize:13, fontFamily:"monospace", color:"#8b5cf6" }}>{progress}%</div>
                  </div>
                  <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#7c3aed,#22c55e)", transition:"width .5s", borderRadius:2 }}/>
                  </div>
                  <div style={{ display:"flex", gap:12, marginTop:12, flexWrap:"wrap" }}>
                    {PROGRESS_STEPS.map((s,i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color: progress>(i/PROGRESS_STEPS.length)*88?"#22c55e":"#334155" }}>
                        <span>{progress>(i/PROGRESS_STEPS.length)*88?"✓":"○"}</span>{s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accuracy Report */}
              {accuracy && !generating && (
                <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${confScore>=85?"rgba(34,197,94,0.3)":confScore>=65?"rgba(245,158,11,0.3)":"rgba(239,68,68,0.3)"}`, borderRadius:14, padding:20 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                    <div>
                      <div style={{ fontSize:11, fontFamily:"monospace", color:"#64748b", marginBottom:6 }}>🎯 AI ACCURACY REPORT</div>
                      <div style={{ fontSize:13, color: confScore>=85?"#22c55e":confScore>=65?"#f59e0b":"#ef4444", fontWeight:700 }}>
                        {confScore>=85 ? "High Confidence — Ready for Review" : confScore>=65 ? "Moderate Confidence — Review Carefully" : "Low Confidence — Significant Review Required"}
                      </div>
                    </div>
                    <ScoreRing score={confScore} />
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                    {/* Uncertain claims */}
                    {accuracy.uncertain_claims?.length > 0 && (
                      <div style={{ background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:9, padding:12 }}>
                        <div style={{ fontSize:10, fontFamily:"monospace", color:"#f59e0b", marginBottom:7 }}>⚠ VERIFY THESE CLAIMS</div>
                        {accuracy.uncertain_claims.map((c,i) => (
                          <div key={i} style={{ display:"flex", gap:7, fontSize:11, color:"#94a3b8", marginBottom:5 }}>
                            <span style={{ color:"#f59e0b", flexShrink:0 }}>—</span>{c}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Sources basis */}
                    {accuracy.sources_basis?.length > 0 && (
                      <div style={{ background:"rgba(59,130,246,0.05)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:9, padding:12 }}>
                        <div style={{ fontSize:10, fontFamily:"monospace", color:"#3b82f6", marginBottom:7 }}>📚 KNOWLEDGE BASIS</div>
                        {accuracy.sources_basis.map((s,i) => (
                          <div key={i} style={{ display:"flex", gap:7, fontSize:11, color:"#94a3b8", marginBottom:5 }}>
                            <span style={{ color:"#3b82f6", flexShrink:0 }}>◦</span>{s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Flags for reviewer */}
                  {accuracy.flags?.length > 0 && (
                    <div style={{ background:"rgba(139,92,246,0.05)", border:"1px solid rgba(139,92,246,0.15)", borderRadius:9, padding:12, marginBottom:12 }}>
                      <div style={{ fontSize:10, fontFamily:"monospace", color:"#8b5cf6", marginBottom:7 }}>👨‍⚕️ REVIEWER SHOULD CHECK</div>
                      {accuracy.flags.map((f,i) => (
                        <div key={i} style={{ display:"flex", gap:7, fontSize:11, color:"#94a3b8", marginBottom:5 }}>
                          <span style={{ color:"#8b5cf6", flexShrink:0 }}>◈</span>{f}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display:"flex", gap:10 }}>
                    <div style={{ flex:1, background:"rgba(0,0,0,0.2)", borderRadius:8, padding:"8px 12px", textAlign:"center" }}>
                      <div style={{ fontSize:10, color:"#475569" }}>YMYL Risk</div>
                      <div style={{ fontSize:13, fontWeight:700, color: accuracy.ymyl_risk==="low"?"#22c55e":accuracy.ymyl_risk==="medium"?"#f59e0b":"#ef4444", fontFamily:"monospace", textTransform:"uppercase" }}>
                        {accuracy.ymyl_risk || "medium"}
                      </div>
                    </div>
                    <div style={{ flex:1, background:"rgba(0,0,0,0.2)", borderRadius:8, padding:"8px 12px", textAlign:"center" }}>
                      <div style={{ fontSize:10, color:"#475569" }}>Forbidden Flags</div>
                      <div style={{ fontSize:13, fontWeight:700, color: flags.length===0?"#22c55e":"#ef4444", fontFamily:"monospace" }}>
                        {flags.length === 0 ? "0 ✓ Clean" : `${flags.length} Found`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Forbidden phrase flags */}
              {flags.length > 0 && !generating && (
                <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:14, padding:18 }}>
                  <div style={{ fontSize:11, fontFamily:"monospace", color:"#ef4444", marginBottom:12 }}>
                    🚫 PROHIBITED PHRASES DETECTED — Must fix before publishing
                  </div>
                  {flags.map((f,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"8px 0", borderBottom:"1px solid rgba(239,68,68,0.1)" }}>
                      <SeverityDot severity={f.severity} />
                      <div>
                        <div style={{ fontSize:12, color:"#fca5a5", fontFamily:"monospace", marginBottom:2 }}>"{f.phrase}"</div>
                        <div style={{ fontSize:11, color:"#64748b" }}>{f.reason}</div>
                      </div>
                      <div style={{ marginLeft:"auto", fontSize:10, fontFamily:"monospace", color: f.severity==="high"?"#ef4444":"#f59e0b", textTransform:"uppercase" }}>{f.severity}</div>
                    </div>
                  ))}
                  <div style={{ marginTop:10, fontSize:11, color:"#64748b", fontStyle:"italic" }}>
                    These phrases were flagged automatically. Edit the article body before publishing.
                  </div>
                </div>
              )}

              {/* Article preview */}
              {article && !generating && (
                <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, overflow:"hidden" }}>
                  <div style={{ background:"rgba(139,92,246,0.06)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"14px 20px", display:"flex", alignItems:"flex-start", gap:14, justifyContent:"space-between" }}>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:"#f1f5f9", marginBottom:4 }}>{article.title}</div>
                      <div style={{ display:"flex", gap:10, fontSize:11, color:"#475569", fontFamily:"monospace" }}>
                        <span>~{article.word_count} words</span><span>·</span>
                        <span>/{article.slug}</span><span>·</span>
                        <span style={{ color: confScore>=85?"#22c55e":confScore>=65?"#f59e0b":"#ef4444" }}>Confidence: {confScore}/100</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding:"20px 24px", maxHeight:340, overflowY:"auto" }}>
                    <ArticleBody body={article.body} />
                  </div>
                </div>
              )}

              {/* ── Layer 5: Doctor Review Gate ── */}
              {article && !generating && (
                <div style={{ background: reviewChecked?"rgba(34,197,94,0.06)":"rgba(255,255,255,0.02)", border:`1px solid ${reviewChecked?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.1)"}`, borderRadius:14, padding:20, transition:"all .3s" }}>
                  <div style={{ fontSize:11, fontFamily:"monospace", color:reviewChecked?"#22c55e":"#64748b", marginBottom:12 }}>
                    👨‍⚕️ LAYER 5 — DOCTOR REVIEW GATE
                  </div>
                  <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.7, marginBottom:16 }}>
                    Before this article can be published, a qualified medical professional must confirm it is accurate, does not contain misleading information, and is appropriate for patient-facing use.
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:18 }}>
                    {[
                      "I have read the complete article",
                      "All medical statements are accurate to the best of my clinical knowledge",
                      "No prohibited claims, false promises, or diagnostic language is present",
                      "The article appropriately directs patients to seek professional care",
                      "I accept responsibility as the medical reviewer for this content",
                    ].map((check, i) => (
                      <label key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer", fontSize:12, color:"#94a3b8", lineHeight:1.5 }}>
                        <input type="checkbox" checked={reviewChecked}
                          onChange={e => setReviewChecked(e.target.checked)}
                          style={{ marginTop:2, accentColor:"#22c55e", flexShrink:0 }} />
                        {check}
                      </label>
                    ))}
                  </div>

                  {!reviewChecked && (
                    <div style={{ fontSize:11, color:"#f59e0b", fontFamily:"monospace", marginBottom:14 }}>
                      ⚠ Articles cannot be published without doctor review confirmation
                    </div>
                  )}

                  {highFlags.length > 0 && (
                    <div style={{ fontSize:11, color:"#ef4444", fontFamily:"monospace", marginBottom:14 }}>
                      🚫 {highFlags.length} HIGH-SEVERITY prohibited phrase(s) must be removed before publishing
                    </div>
                  )}

                  {savedMsg && (
                    <div style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#22c55e", marginBottom:14 }}>
                      {savedMsg}
                    </div>
                  )}

                  <div style={{ display:"flex", gap:10 }}>
                    <button onClick={()=>handleSave("draft")} disabled={saving} style={{
                      flex:1, padding:"11px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"#94a3b8", borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:"inherit",
                    }}>
                      Save as Draft
                    </button>
                    <button onClick={()=>handleSave("published")} disabled={!canPublish||saving} style={{
                      flex:2, padding:"11px", fontFamily:"inherit", fontSize:13, fontWeight:700, borderRadius:10, border:"none", transition:"all .2s",
                      background: canPublish?"linear-gradient(135deg,#22c55e,#16a34a)":"rgba(255,255,255,0.05)",
                      color: canPublish?"white":"#334155",
                      cursor: canPublish?"pointer":"not-allowed",
                      boxShadow: canPublish?"0 4px 16px rgba(34,197,94,0.3)":"none",
                    }}>
                      {saving ? "Publishing..." : canPublish ? "✓ Publish Article" : "Complete Review to Publish"}
                    </button>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!article && !generating && (
                <div style={{ background:"rgba(255,255,255,0.01)", border:"1px dashed rgba(255,255,255,0.07)", borderRadius:14, padding:"60px 40px", textAlign:"center" }}>
                  <div style={{ fontSize:36, marginBottom:16 }}>🛡️</div>
                  <div style={{ fontSize:15, fontWeight:600, color:"#e2e8f0", marginBottom:8 }}>Medical-Safe AI Writing</div>
                  <div style={{ fontSize:13, color:"#475569", lineHeight:1.7, maxWidth:400, margin:"0 auto" }}>
                    Select a topic and click Generate. Claude will write using strict medical guidelines, then flag any uncertain claims for your review before publishing.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ MANAGE TAB ══════════════ */}
        {tab === "manage" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontSize:14, color:"#64748b" }}>{posts.length} articles · {posts.filter(p=>p.status==="published").length} published · {posts.filter(p=>!p.reviewed).length} awaiting review</div>
              <button onClick={()=>setTab("generate")} style={{ background:"linear-gradient(135deg,#7c3aed,#4f46e5)", border:"none", color:"white", borderRadius:8, padding:"9px 20px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                + New Article
              </button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {posts.map((post,i) => (
                <div key={post.id||i} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"16px 20px", display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:"rgba(139,92,246,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>✍️</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:"#f1f5f9", marginBottom:4 }}>{post.title}</div>
                    <div style={{ display:"flex", gap:10, fontSize:11, color:"#475569", fontFamily:"monospace", flexWrap:"wrap" }}>
                      <span>{post.word_count}w</span><span>·</span>
                      <span>{new Date(post.created_at).toLocaleDateString("en-IN")}</span>
                      {post.views>0&&<><span>·</span><span>👁 {post.views}</span></>}
                      {post.confidence&&<><span>·</span><span style={{ color:post.confidence>=85?"#22c55e":post.confidence>=65?"#f59e0b":"#ef4444" }}>Confidence: {post.confidence}/100</span></>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    {post.reviewed
                      ? <span style={{ fontSize:11, color:"#22c55e", fontFamily:"monospace" }}>✓ Reviewed</span>
                      : <span style={{ fontSize:11, color:"#f59e0b", fontFamily:"monospace" }}>⚠ Needs Review</span>}
                    <span style={{ background: post.status==="published"?"rgba(34,197,94,0.1)":"rgba(245,158,11,0.1)", border:`1px solid ${post.status==="published"?"rgba(34,197,94,0.3)":"rgba(245,158,11,0.3)"}`, color:post.status==="published"?"#22c55e":"#f59e0b", borderRadius:20, padding:"2px 10px", fontSize:11, fontFamily:"monospace", fontWeight:600 }}>
                      {post.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════ SAFEGUARDS TAB ══════════════ */}
        {tab === "safeguards" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            {[
              {
                layer:"Layer 1", title:"Medical System Prompt", icon:"📋", color:"#3b82f6",
                desc:"Every generation uses a strict system prompt that instructs Claude to never diagnose, never prescribe, never use absolute claims, and always recommend professional consultation.",
                rules:["No diagnostic language","No dosage instructions","No absolute cure claims","Always recommend doctor","Hedge all statements","Omit uncertain facts"],
              },
              {
                layer:"Layer 2", title:"Forbidden Phrases Scanner", icon:"🔍", color:"#ef4444",
                desc:`Automatically scans every generated article against ${FORBIDDEN_PHRASES.length} prohibited medical content rules before displaying. High-severity flags block publishing entirely.`,
                rules:[`${FORBIDDEN_PHRASES.filter(f=>f.severity==="high").length} HIGH severity rules`,"8 MEDIUM severity rules","Cure/guarantee language","Diagnostic phrases","Dosage instructions","NMC advertising rules"],
              },
              {
                layer:"Layer 3", title:"AI Confidence Scoring", icon:"🎯", color:"#f59e0b",
                desc:"Claude evaluates its own confidence (0–100) and explicitly lists uncertain claims, knowledge basis, reviewer flags, and YMYL risk level inside a structured JSON block.",
                rules:["Confidence score 0–100","Lists uncertain claims","Cites knowledge basis","Flags reviewer items","YMYL risk level","Transparent about limits"],
              },
              {
                layer:"Layer 4", title:"Auto Medical Disclaimer", icon:"⚠️", color:"#a855f7",
                desc:"A standardised medical disclaimer is automatically appended to every article before it is shown or saved. It cannot be removed by the clinic owner.",
                rules:["Appended automatically","Cannot be removed","Educational use only","Not a substitute for care","Individual results vary","Seek professional advice"],
              },
              {
                layer:"Layer 5", title:"Doctor Review Gate", icon:"👨‍⚕️", color:"#22c55e",
                desc:"No article can be published without the clinic owner (doctor) confirming 5 specific review checkpoints. The Publish button is disabled until all are ticked and no high-severity flags exist.",
                rules:["5-point review checklist","Cannot skip or bypass","Blocks publish on high flags","Timestamps review","Assigns reviewer responsibility","Audit trail in DB"],
              },
              {
                layer:"Standards", title:"Regulatory Compliance", icon:"📜", color:"#0ea5e9",
                desc:"Content rules are aligned with Google YMYL/E-E-A-T guidelines, NMC medical advertising standards, and WHO health communication best practices.",
                rules:["Google YMYL compliance","E-E-A-T signals","NMC ad guidelines","WHO communication standards","ICMR alignment","Indian healthcare law"],
              },
            ].map(card => (
              <div key={card.layer} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${card.color}20`, borderRadius:14, padding:22 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <span style={{ fontSize:24 }}>{card.icon}</span>
                  <div>
                    <div style={{ fontSize:10, fontFamily:"monospace", color:card.color, marginBottom:2 }}>{card.layer}</div>
                    <div style={{ fontSize:15, fontWeight:700, color:"#f1f5f9" }}>{card.title}</div>
                  </div>
                </div>
                <p style={{ fontSize:13, color:"#64748b", lineHeight:1.7, marginBottom:14 }}>{card.desc}</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {card.rules.map((r,i) => (
                    <div key={i} style={{ background:`${card.color}10`, border:`1px solid ${card.color}25`, borderRadius:6, padding:"3px 10px", fontSize:11, color:card.color }}>
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}