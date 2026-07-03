// api/robots.js — serves /robots.txt
export default function handler(req, res) {
  const BASE = process.env.VITE_APP_URL || "https://clinicsite.in";
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "s-maxage=86400");
  res.status(200).send(
`User-agent: *
Allow: /

Sitemap: ${BASE}/sitemap.xml
`
  );
}
