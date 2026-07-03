// api/sitemap.js — Vercel serverless function
// Generates /sitemap.xml dynamically from all published clinics
// URL: https://clinicsite.in/sitemap.xml

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const BASE_URL = process.env.VITE_APP_URL || "https://clinicsite.in";

export default async function handler(req, res) {
  try {
    const { data: clinics } = await supabase
      .from("clinics")
      .select("slug, name, updated_at")
      .eq("is_published", true)
      .order("updated_at", { ascending: false });

    const staticPages = [
      { url: BASE_URL,         priority: "1.0", changefreq: "weekly"  },
      { url: `${BASE_URL}/login`, priority: "0.3", changefreq: "monthly" },
    ];

    const clinicPages = (clinics || []).flatMap(c => [
      {
        url:        `https://${c.slug}.clinicsite.in`,
        priority:   "0.9",
        changefreq: "weekly",
        lastmod:    c.updated_at ? c.updated_at.split("T")[0] : undefined,
      },
      {
        url:        `https://${c.slug}.clinicsite.in/blog`,
        priority:   "0.6",
        changefreq: "weekly",
      },
    ]);

    const all = [...staticPages, ...clinicPages];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${all.map(p => `  <url>
    <loc>${p.url}</loc>${p.lastmod ? `\n    <lastmod>${p.lastmod}</lastmod>` : ""}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).send(xml);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
