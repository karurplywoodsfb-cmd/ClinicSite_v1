// src/components/AIBlogGenerator.jsx
// AI-powered blog generator using Anthropic Claude API (claude-sonnet-4-6)
// Props: clinic, supabaseClient

import { useState, useEffect } from "react";
import { usePlanEnforcement } from "../hooks/usePlanEnforcement";
import { PlanUpgradeModal } from "./PlanUpgradeModal";

const BLOG_TOPICS = {
  Dental: [
    "5 Signs You Need to Visit a Dentist",
    "How to Prevent Cavities in Children",
    "Dental Implants vs Dentures — Which is Right for You?",
    "Why Regular Teeth Cleaning Matters",
    "Managing Dental Anxiety — Tips for Nervous Patients",
  ],
  Dermatology: [
    "How to Build a Simple Skincare Routine",
    "Understanding Acne — Causes and Treatments",
    "Sun Protection Guide for Indian Skin",
    "When to See a Dermatologist for Hair Loss",
    "Safe Laser Treatments for Dark Skin Tones",
  ],
  Cardiology: [
    "Warning Signs of Heart Disease You Shouldn't Ignore",
    "How Diet Affects Your Heart Health",
    "Understanding Blood Pressure Readings",
    "Exercise and Heart Health — A Practical Guide",
    "Stress and Its Impact on Cardiovascular Health",
  ],
  Orthopedics: [
    "Back Pain Relief — What Actually Works",
    "When Does a Joint Pain Need Surgery?",
    "Physiotherapy vs Surgery for Knee Pain",
    "Sports Injuries — Prevention and Recovery",
    "Osteoporosis — Early Signs and Prevention",
  ],
  default: [
    "Importance of Regular Health Checkups",
    "Managing Chronic Conditions Through Lifestyle Changes",
    "When to Visit a Specialist vs General Physician",
    "Understanding Your Medical Reports",
    "Preventive Healthcare — A Complete Guide",
  ],
};

const TONE_OPTIONS = [
  { id: "educational",  label: "Educational",  desc: "Clear, informative, factual" },
  { id: "friendly",     label: "Friendly",      desc: "Warm, approachable, easy to read" },
  { id: "professional", label: "Professional",  desc: "Clinical, authoritative, precise" },
];

const LENGTH_OPTIONS = [
  { id: "short",  label: "Short",  desc: "~400 words" },
  { id: "medium", label: "Medium", desc: "~700 words" },
  { id: "long",   label: "Long",   desc: "~1100 words" },
];

function stripMarkdown(text) {
  return text
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/^[-*+]\s+/gm, "• ")
    .replace(/^\d+\.\s+/gm, "")
    .trim();
}

export default function AIBlogGenerator({ clinic, supabaseClient }) {
  const [posts,      setPosts]      = useState([]);
  const [topic,      setTopic]      = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [tone,       setTone]       = useState("educational");
  const [length,     setLength]     = useState("medium");
  const [generating, setGenerating] = useState(false);
  const [generated,  setGenerated]  = useState(null); // { title, content, excerpt, tags }
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState("");
  const [activePost, setActivePost] = useState(null);
  const [view,       setView]       = useState("list"); // list | generate | read
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");
  const { checkLimit, incrementUsage, limits, getRemaining } = usePlanEnforcement();

  const specialty   = clinic?.specialty || "General";
  const topicList   = BLOG_TOPICS[specialty] || BLOG_TOPICS.default;

  const maxPosts = limits?.features.custom_pages || 1;
  const remainingPosts = getRemaining("custom_pages");

  useEffect(() => { loadPosts(); }, [clinic?.id]);

  const loadPosts = async () => {
    if (!clinic?.id) return;
    try {
      const { data } = await supabaseClient
        .from("blog_posts")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("created_at", { ascending: false });
      setPosts(data || []);
    } catch (e) { console.error(e); }
  };

  const generate = async () => {
    // PLAN ENFORCEMENT: Check if user can create more blog posts
    const canCreate = await checkLimit("custom_pages", 1);
    if (!canCreate) {
      setUpgradeFeature("custom_pages");
      setShowUpgrade(true);
      return;
    }
    const finalTopic = customTopic.trim() || topic;
    if (!finalTopic) { setError("Please select or enter a topic."); return; }

    setError(""); setGenerating(true); setGenerated(null);

    const wordCount = { short: 400, medium: 700, long: 1100 }[length];
    const toneDesc  = { educational: "clear and informative", friendly: "warm and approachable", professional: "clinical and authoritative" }[tone];

    const prompt = `You are a medical content writer for ${clinic?.name || "a clinic"}, a ${specialty} clinic in ${clinic?.city || "India"}.

Write a blog article about: "${finalTopic}"

Requirements:
- Approximately ${wordCount} words
- Tone: ${toneDesc}
- Written for Indian patients
- Include a compelling title
- Include practical, accurate medical information
- Add a medical disclaimer at the end
- Follow NMC guidelines — no false claims, no guaranteed cure language
- Do NOT use markdown headers (##) or bold (**) — use plain text with clear paragraphs
- Structure: Title, Introduction, 3-4 main sections, Conclusion, Disclaimer

Respond ONLY in this JSON format (no other text):
{
  "title": "Article title here",
  "excerpt": "2-sentence summary for blog listing",
  "content": "Full article text here as plain paragraphs separated by \\n\\n",
  "tags": ["tag1", "tag2", "tag3"],
  "read_time": "X min read"
}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data?.error?.message || "API error");

      const raw  = data.content?.[0]?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setGenerated(parsed);
      setView("generate");
    } catch (e) {
      setError("Generation failed: " + (e.message || "Unknown error. Check API connection."));
    } finally {
      setGenerating(false);
    }
  };

  const savePost = async () => {
    // PLAN ENFORCEMENT: Double-check limit before saving
    const canSave = await checkLimit("custom_pages", 1);
    if (!canSave) {
      setUpgradeFeature("custom_pages");
      setShowUpgrade(true);
      return;
    }
    if (!generated || !clinic?.id) return;
    setSaving(true); setSaved(false);
    try {
      const slug = generated.title
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        .slice(0, 80);

      const { error: dbErr } = await supabaseClient.from("blog_posts").insert({
        clinic_id:  clinic.id,
        title:      generated.title,
        excerpt:    generated.excerpt,
        content:    generated.content,
        tags:       generated.tags,
        read_time:  generated.read_time,
        slug,
        status:     "published",
        created_at: new Date().toISOString(),
      });

      if (dbErr) throw new Error(dbErr.message);
      // PLAN ENFORCEMENT: Increment usage after successful save
      await incrementUsage("custom_pages", 1);
      setSaved(true);
      await loadPosts();
      setTimeout(() => { setSaved(false); setView("list"); setGenerated(null); }, 1500);
    } catch (e) {
      setError("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (postId) => {
    if (!confirm("Delete this article?")) return;
    await supabaseClient.from("blog_posts").delete().eq("id", postId);
    await loadPosts();
    if (activePost?.id === postId) { setActivePost(null); setView("list"); }
  };

  const S = {
    card:   { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:20 },
    btn:    { border:"none", borderRadius:8, padding:"10px 20px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },
    label:  { fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:1, marginBottom:6, display:"block" },
    input:  { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:8, padding:"10px 14px", fontSize:14, color:"#e2e8f0", fontFamily:"inherit",
              outline:"none", boxSizing:"border-box" },
  };

  // ── LIST VIEW ─────────────────────────────────────────────────
  if (view === "list") return (
    <div style={{ maxWidth:800, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:"#e2e8f0", margin:0 }}>Blog & Content</h2>
          <div style={{ fontSize:13, color:"#64748b", marginTop:4 }}>{posts.length} article{posts.length !== 1 ? "s" : ""} published <span style={{ marginLeft:8, color: remainingPosts <= 0 ? "#f87171" : "#64748b" }}>({remainingPosts} of {maxPosts > 100000 ? "Unlimited" : maxPosts} remaining)</span></div>
        </div>
        <button onClick={() => { if (remainingPosts <= 0) { setUpgradeFeature("custom_pages"); setShowUpgrade(true); } else { setView("generate"); } }} disabled={remainingPosts <= 0} style={{ ...S.btn, background: remainingPosts <= 0 ? "#475569" : "#1565c0", color:"white", opacity: remainingPosts <= 0 ? 0.5 : 1 }}>
          {remainingPosts <= 0 ? "⚠ Limit Reached" : "✨ Generate New Article"}
        </button>
      </div>

      {remainingPosts <= 2 && remainingPosts > 0 && (
        <div style={{ padding:"10px 14px", background:"rgba(234,179,8,0.1)", border:"1px solid rgba(234,179,8,0.2)", borderRadius:8, fontSize:13, color:"#fbbf24", marginBottom:16 }}>
          You have {remainingPosts} article{remainingPosts !== 1 ? "s" : ""} remaining on your plan. <a href="/pricing" style={{ color:"#fbbf24", textDecoration:"underline" }}>Upgrade</a> for unlimited articles.
        </div>
      )}
      {posts.length === 0 ? (
        <div style={{ ...S.card, textAlign:"center", padding:60 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✍️</div>
          <div style={{ color:"#64748b", fontSize:15, marginBottom:20 }}>No articles yet. Generate your first one with AI.</div>
          <button onClick={() => { if (remainingPosts <= 0) { setUpgradeFeature("custom_pages"); setShowUpgrade(true); } else { setView("generate"); } }} disabled={remainingPosts <= 0} style={{ ...S.btn, background: remainingPosts <= 0 ? "#475569" : "#1565c0", color:"white", opacity: remainingPosts <= 0 ? 0.5 : 1 }}>
            ✨ Generate First Article
          </button>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {posts.map(post => (
            <div key={post.id} style={{ ...S.card, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ flex:1, cursor:"pointer" }} onClick={() => { setActivePost(post); setView("read"); }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                  <span style={{ fontSize:10, background:"rgba(21,101,192,0.2)", color:"#7dd3fc",
                    borderRadius:4, padding:"2px 8px", fontWeight:600 }}>
                    {post.status || "published"}
                  </span>
                  <span style={{ fontSize:11, color:"#475569" }}>{post.read_time}</span>
                  <span style={{ fontSize:11, color:"#334155" }}>
                    {new Date(post.created_at).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <div style={{ fontSize:15, fontWeight:600, color:"#e2e8f0", marginBottom:6 }}>{post.title}</div>
                <div style={{ fontSize:13, color:"#64748b", lineHeight:1.5 }}>{post.excerpt}</div>
                {post.tags?.length > 0 && (
                  <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
                    {post.tags.map(t => (
                      <span key={t} style={{ fontSize:10, background:"rgba(255,255,255,0.05)",
                        color:"#475569", borderRadius:4, padding:"2px 7px" }}>#{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display:"flex", gap:8, marginLeft:16, flexShrink:0 }}>
                <a href={`/${clinic.slug}/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"
                  style={{ ...S.btn, background:"rgba(255,255,255,0.05)", color:"#94a3b8",
                    padding:"8px 14px", textDecoration:"none" }}>
                  🔗
                </a>
                <button onClick={() => deletePost(post.id)}
                  style={{ ...S.btn, background:"rgba(239,68,68,0.1)", color:"#f87171", padding:"8px 14px" }}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    <PlanUpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        requiredPlan="premium"
        featureName={upgradeFeature}
      />
    </div>
  );

  // ── GENERATE VIEW ─────────────────────────────────────────────
  if (view === "generate") return (
    <div style={{ maxWidth:680, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <button onClick={() => { setView("list"); setGenerated(null); setError(""); }}
          style={{ ...S.btn, background:"rgba(255,255,255,0.05)", color:"#94a3b8", padding:"8px 14px" }}>
          ← Back
        </button>
        <h2 style={{ fontSize:20, fontWeight:700, color:"#e2e8f0", margin:0 }}>Generate Article</h2>
      </div>

      {!generated ? (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {/* Topic selector */}
          <div style={S.card}>
            <label style={S.label}>Choose a Topic</label>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
              {topicList.map(t => (
                <div key={t} onClick={() => { setTopic(t); setCustomTopic(""); }}
                  style={{ padding:"10px 14px", borderRadius:8, cursor:"pointer",
                    background: topic === t && !customTopic ? "rgba(21,101,192,0.2)" : "rgba(255,255,255,0.03)",
                    border: topic === t && !customTopic ? "1px solid rgba(21,101,192,0.4)" : "1px solid rgba(255,255,255,0.06)",
                    fontSize:14, color: topic === t && !customTopic ? "#7dd3fc" : "#94a3b8",
                    transition:"all .15s" }}>
                  {t}
                </div>
              ))}
            </div>
            <label style={S.label}>Or Enter Custom Topic</label>
            <input value={customTopic} onChange={e => { setCustomTopic(e.target.value); setTopic(""); }}
              placeholder="e.g. Managing diabetes through diet in India"
              style={S.input}/>
          </div>

          {/* Tone */}
          <div style={S.card}>
            <label style={S.label}>Tone</label>
            <div style={{ display:"flex", gap:10 }}>
              {TONE_OPTIONS.map(t => (
                <div key={t.id} onClick={() => setTone(t.id)}
                  style={{ flex:1, padding:"10px 14px", borderRadius:8, cursor:"pointer", textAlign:"center",
                    background: tone === t.id ? "rgba(21,101,192,0.2)" : "rgba(255,255,255,0.03)",
                    border: tone === t.id ? "1px solid rgba(21,101,192,0.4)" : "1px solid rgba(255,255,255,0.06)",
                    transition:"all .15s" }}>
                  <div style={{ fontSize:13, fontWeight:600, color: tone === t.id ? "#7dd3fc" : "#94a3b8" }}>{t.label}</div>
                  <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Length */}
          <div style={S.card}>
            <label style={S.label}>Article Length</label>
            <div style={{ display:"flex", gap:10 }}>
              {LENGTH_OPTIONS.map(l => (
                <div key={l.id} onClick={() => setLength(l.id)}
                  style={{ flex:1, padding:"10px 14px", borderRadius:8, cursor:"pointer", textAlign:"center",
                    background: length === l.id ? "rgba(21,101,192,0.2)" : "rgba(255,255,255,0.03)",
                    border: length === l.id ? "1px solid rgba(21,101,192,0.4)" : "1px solid rgba(255,255,255,0.06)",
                    transition:"all .15s" }}>
                  <div style={{ fontSize:13, fontWeight:600, color: length === l.id ? "#7dd3fc" : "#94a3b8" }}>{l.label}</div>
                  <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>{l.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {error && <div style={{ padding:"12px 16px", background:"rgba(239,68,68,0.1)",
            border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, fontSize:13, color:"#f87171" }}>
            ⚠ {error}
          </div>}

          <button onClick={generate} disabled={generating || (!topic && !customTopic.trim())}
            style={{ ...S.btn, background:"#1565c0", color:"white", padding:"14px",
              fontSize:15, opacity: generating || (!topic && !customTopic.trim()) ? .5 : 1 }}>
            {generating ? "✨ Generating article…" : "✨ Generate Article"}
          </button>

          {generating && (
            <div style={{ textAlign:"center", color:"#475569", fontSize:13, marginTop:-8 }}>
              This takes about 15–20 seconds…
            </div>
          )}
        </div>
      ) : (
        /* Generated article preview */
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ ...S.card, borderColor:"rgba(21,101,192,0.3)" }}>
            <div style={{ fontSize:11, color:"#7dd3fc", fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>
              ✨ Generated Article
            </div>
            <h3 style={{ fontSize:20, fontWeight:700, color:"#e2e8f0", marginBottom:8 }}>{generated.title}</h3>
            <div style={{ fontSize:13, color:"#64748b", marginBottom:12 }}>{generated.excerpt}</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
              {generated.tags?.map(t => (
                <span key={t} style={{ fontSize:11, background:"rgba(21,101,192,0.15)",
                  color:"#7dd3fc", borderRadius:4, padding:"2px 8px" }}>#{t}</span>
              ))}
              <span style={{ fontSize:11, color:"#475569" }}>{generated.read_time}</span>
            </div>
            <div style={{ maxHeight:320, overflowY:"auto", padding:"16px",
              background:"rgba(0,0,0,0.2)", borderRadius:8,
              fontSize:14, color:"#94a3b8", lineHeight:1.8, whiteSpace:"pre-wrap" }}>
              {generated.content}
            </div>
          </div>

          {error && <div style={{ padding:"12px 16px", background:"rgba(239,68,68,0.1)",
            border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, fontSize:13, color:"#f87171" }}>⚠ {error}</div>}

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={savePost} disabled={saving || saved}
              style={{ ...S.btn, background: saved ? "#16a34a" : "#1565c0", color:"white",
                flex:1, padding:"13px", fontSize:15 }}>
              {saved ? "✓ Published!" : saving ? "Publishing…" : "📤 Publish Article"}
            </button>
            <button onClick={() => setGenerated(null)}
              style={{ ...S.btn, background:"rgba(255,255,255,0.05)", color:"#94a3b8", padding:"13px 20px" }}>
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── READ VIEW ─────────────────────────────────────────────────
  if (view === "read" && activePost) return (
    <div style={{ maxWidth:680, fontFamily:"'DM Sans',sans-serif" }}>
      <button onClick={() => { setView("list"); setActivePost(null); }}
        style={{ ...S.btn, background:"rgba(255,255,255,0.05)", color:"#94a3b8", padding:"8px 14px", marginBottom:20 }}>
        ← Back to Articles
      </button>
      <div style={S.card}>
        <div style={{ fontSize:11, color:"#475569", marginBottom:8 }}>
          {new Date(activePost.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}
          {" · "}{activePost.read_time}
        </div>
        <h2 style={{ fontSize:22, fontWeight:700, color:"#e2e8f0", marginBottom:10 }}>{activePost.title}</h2>
        <div style={{ fontSize:14, color:"#64748b", marginBottom:20, fontStyle:"italic" }}>{activePost.excerpt}</div>
        <div style={{ fontSize:15, color:"#94a3b8", lineHeight:1.85, whiteSpace:"pre-wrap" }}>{activePost.content}</div>
        {activePost.tags?.length > 0 && (
          <div style={{ display:"flex", gap:6, marginTop:20, flexWrap:"wrap" }}>
            {activePost.tags.map(t => (
              <span key={t} style={{ fontSize:11, background:"rgba(255,255,255,0.05)",
                color:"#475569", borderRadius:4, padding:"2px 8px" }}>#{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return null;
}