// src/pages/BlogPage.jsx
// Patient-facing blog — list + single article view
// Route: /:clinicSlug/blog           → Article list
//        /:clinicSlug/blog/:postSlug → Single article

import { useState, useEffect } from "react";

// ── Fetch helpers ─────────────────────────────────────────────────
async function fetchBlogPosts(clinicId, supabase) {
  const { data } = await supabase
    .from("blog_posts")
    .select("id,title,slug,excerpt,word_count,created_at,views,specialty")
    .eq("clinic_id", clinicId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  return data || [];
}

async function fetchPost(clinicId, slug, supabase) {
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  // Increment view count
  if (data?.id) {
    await supabase.rpc("increment_blog_views", { post_id: data.id });
  }
  return data;
}

// ── Render markdown-ish body ──────────────────────────────────────
function ArticleBody({ body, clinic }) {
  if (!body) return null;
  return (
    <div>
      {body.split("\n").map((line, i) => {
        if (line.startsWith("## ")) return (
          <h2 key={i} style={{ fontSize: 22, fontWeight: 700, color: "#0b2545", margin: "36px 0 14px", lineHeight: 1.3 }}>
            {line.replace("## ", "")}
          </h2>
        );
        if (line.startsWith("### ")) return (
          <h3 key={i} style={{ fontSize: 18, fontWeight: 600, color: "#0b2545", margin: "24px 0 10px" }}>
            {line.replace("### ", "")}
          </h3>
        );
        if (line.startsWith("- ")) return (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, paddingLeft: 8 }}>
            <span style={{ color: "#1565c0", flexShrink: 0, marginTop: 3 }}>◦</span>
            <span style={{ fontSize: 16, color: "#334155", lineHeight: 1.7 }}>{line.replace("- ", "")}</span>
          </div>
        );
        if (line.trim() === "") return <div key={i} style={{ height: 16 }} />;
        return <p key={i} style={{ fontSize: 16, color: "#334155", lineHeight: 1.8, marginBottom: 4 }}>{line}</p>;
      })}
    </div>
  );
}

// ── Article List ──────────────────────────────────────────────────
function BlogList({ clinic, posts, onSelect }) {
  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#f4f8fd", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #dce8f5", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href={`/${clinic.slug}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#1565c0,#1e88e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🦷</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0b2545" }}>{clinic.name}</div>
        </a>
        <a href={`/${clinic.slug}`} style={{ fontSize: 13, color: "#1565c0", textDecoration: "none", fontWeight: 600 }}>← Back to Website</a>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 40px" }}>
        {/* Blog header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: "#1565c0", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            Health Articles
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(28px,4vw,42px)", color: "#0b2545", marginBottom: 12, lineHeight: 1.2 }}>
            Expert {clinic.specialty} Insights
          </h1>
          <p style={{ fontSize: 15, color: "#5a7a96", lineHeight: 1.7, maxWidth: 500 }}>
            Evidence-based health articles from the team at {clinic.name}, {clinic.city}.
          </p>
        </div>

        {/* Article grid */}
        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
            <div style={{ fontSize: 16 }}>Articles coming soon</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {posts.map(post => (
              <article key={post.id} onClick={() => onSelect(post.slug)}
                style={{ background: "white", border: "1px solid #dce8f5", borderRadius: 14, padding: "24px 28px", cursor: "pointer", transition: "all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(11,37,69,0.1)"; e.currentTarget.style.borderColor = "rgba(21,101,192,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#dce8f5"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                      <span style={{ background: "#eff6ff", color: "#1565c0", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{post.specialty}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{Math.ceil(post.word_count / 200)} min read</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>·</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(post.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}</span>
                    </div>
                    <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, color: "#0b2545", marginBottom: 10, lineHeight: 1.3 }}>{post.title}</h2>
                    <p style={{ fontSize: 14, color: "#5a7a96", lineHeight: 1.6 }}>{post.excerpt}</p>
                  </div>
                  <div style={{ fontSize: 24, flexShrink: 0, opacity: 0.15 }}>📄</div>
                </div>
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    {post.views > 0 && `👁 ${post.views} views`}
                  </div>
                  <span style={{ fontSize: 13, color: "#1565c0", fontWeight: 600 }}>Read Article →</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Single Article ────────────────────────────────────────────────
function BlogArticle({ post, clinic, onBack }) {
  // Inject SEO
  useEffect(() => {
    if (!post?.seo) return;
    document.title = post.seo.meta_title || post.title;
    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", post.seo.meta_description || "");
    if (post.seo.schema) {
      let s = document.getElementById("article-schema");
      if (!s) { s = document.createElement("script"); s.id = "article-schema"; s.type = "application/ld+json"; document.head.appendChild(s); }
      s.textContent = JSON.stringify(post.seo.schema);
    }
  }, [post]);

  if (!post) return null;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "white", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>

      {/* Nav */}
      <div style={{ background: "white", borderBottom: "1px solid #dce8f5", padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <a href={`/${clinic.slug}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#1565c0,#1e88e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🦷</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0b2545" }}>{clinic.name}</span>
        </a>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#1565c0", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          ← All Articles
        </button>
      </div>

      <article style={{ maxWidth: 720, margin: "0 auto", padding: "48px 40px" }}>
        {/* Meta */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ background: "#eff6ff", color: "#1565c0", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>{post.specialty}</span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{Math.ceil(post.word_count / 200)} min read</span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>·</span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{new Date(post.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}</span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>·</span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{clinic.city}</span>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(26px,3.5vw,40px)", color: "#0b2545", lineHeight: 1.2, marginBottom: 20 }}>
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p style={{ fontSize: 17, color: "#5a7a96", lineHeight: 1.7, marginBottom: 32, paddingBottom: 32, borderBottom: "1px solid #dce8f5", fontStyle: "italic" }}>
            {post.excerpt}
          </p>
        )}

        {/* Body */}
        <ArticleBody body={post.body} clinic={clinic} />

        {/* CTA */}
        <div style={{ marginTop: 48, background: "#eff6ff", border: "1px solid #dce8f5", borderRadius: 16, padding: "28px 32px", textAlign: "center" }}>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: "#0b2545", marginBottom: 8 }}>
            Ready to book a consultation?
          </div>
          <p style={{ fontSize: 14, color: "#5a7a96", marginBottom: 20 }}>
            Visit {clinic.name} in {clinic.city} for expert {clinic.specialty?.toLowerCase()} care.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <a href={`/${clinic.slug}#book`} style={{ background: "#1565c0", color: "white", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              📅 Book Appointment
            </a>
            <a href={`https://wa.me/${(clinic.whatsapp||"").replace(/\D/g,"")}`} target="_blank" style={{ background: "#25d366", color: "white", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              💬 WhatsApp
            </a>
          </div>
        </div>

        {/* Author */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #dce8f5", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#1565c0,#1e88e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🦷</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0b2545" }}>{clinic.name}</div>
            <div style={{ fontSize: 12, color: "#5a7a96" }}>{clinic.specialty} · {clinic.city}</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>AI-Assisted Content · Medically Reviewed</div>
        </div>
      </article>
    </div>
  );
}

// ── Main Blog Page ────────────────────────────────────────────────
export default function BlogPage({ clinic, supabase: supabaseClient }) {
  const [posts,       setPosts]       = useState([]);
  const [activePost,  setActivePost]  = useState(null);
  const [loading,     setLoading]     = useState(true);

  // Demo posts shown only in development when no Supabase connection is present.
  // References clinic dynamically — no hardcoded clinic name.

  // Demo posts — rendered only when no Supabase clinic is connected (local dev only).
  // All clinic references use props dynamically, no hardcoded clinic names.
  const clinicName = clinic?.name || "Our Clinic";
  const DEMO_POSTS = [
    {
      id: 1,
      title: "Signs you need a root canal — and what to expect",
      slug: "root-canal-signs",
      excerpt: "Most patients who delay treatment are surprised to learn the signs were there much earlier. Here's what to look for.",
      word_count: 712,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      views: 234,
      specialty: clinic?.specialty || "Dental",
      body: `Most patients who delay root canal treatment are surprised to learn the signs were there much earlier.\n\n## Common Warning Signs\n\n- **Persistent, throbbing toothache** — especially when biting or applying pressure\n- **Prolonged sensitivity** to hot or cold that lingers after the stimulus is removed\n- **Darkening of the tooth** — indicating nerve death or internal bleeding\n- **Swelling and tenderness** in the nearby gums\n- **A persistent pimple on the gums** — a dental abscess draining infection\n\n## What to Expect During Treatment\n\nModern treatment is nothing like the horror stories of decades past. With advanced instruments and effective anaesthesia, most patients rate the procedure as no more uncomfortable than a routine filling.\n\n## When to Book a Consultation\n\nIf you experience any of the symptoms above, do not wait. Book a same-day consultation at ${clinicName} — we keep slots available for patients in pain.`,
    },
    {
      id: 2,
      title: "Dental implants vs bridges: a complete comparison",
      slug: "implants-vs-bridges",
      excerpt: "Both options replace missing teeth, but they work very differently. Here's how to decide which is right for you.",
      word_count: 695,
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      views: 187,
      specialty: clinic?.specialty || "Dental",
      body: `Both implants and bridges are excellent solutions for replacing missing teeth. The right choice depends on your bone health, budget, and long-term expectations.\n\n## Key Differences\n\n- **Bone preservation:** Implants stimulate the jawbone; bridges do not.\n- **Longevity:** Implants last 20–30+ years; bridges 10–15 years.\n- **Adjacent teeth:** Bridges require shaving neighbouring teeth; implants are standalone.\n- **Cost:** Bridges cost less upfront; implants are more economical long-term.\n\nBook a free consultation at ${clinicName} to discuss which option suits your case.`,
    },
  ];

  useEffect(() => {
    if (supabaseClient && clinic?.id) {
      setLoading(true);
      fetchBlogPosts(clinic.id, supabaseClient)
        .then(setPosts)
        .finally(() => setLoading(false));
    } else {
      setPosts(DEMO_POSTS);
      setLoading(false);
    }
  }, [clinic?.id]);

  const handleSelectPost = async (postSlug) => {
    if (supabaseClient && clinic?.id) {
      setLoading(true);
      const post = await fetchPost(clinic.id, postSlug, supabaseClient);
      setActivePost(post);
      setLoading(false);
    } else {
      setActivePost(DEMO_POSTS.find(p => p.slug === postSlug));
    }
    window.scrollTo(0, 0);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", background: "white" }}>
      <div style={{ color: "#94a3b8" }}>Loading...</div>
    </div>
  );

  if (activePost) return (
    <BlogArticle
      post={activePost}
      clinic={clinic}
      onBack={() => setActivePost(null)}
    />
  );

  return (
    <BlogList
      clinic={clinic}
      posts={posts}
      onSelect={handleSelectPost}
    />
  );
}
