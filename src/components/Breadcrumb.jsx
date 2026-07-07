// src/components/Breadcrumb.jsx
// Sits below the nav, above the page title. Only render this on sub-pages
// (blog posts, and later individual service pages) — never on the homepage.
//
// Usage:
//   <Breadcrumb
//     items={[
//       { label: "Home", href: `/${clinic.slug}` },
//       { label: "Blog", href: `/${clinic.slug}/blog` },
//       { label: post.title }, // last item has no href — it's the current page
//     ]}
//     accentColor={C.accent}
//   />

export default function Breadcrumb({ items = [], accentColor = "#4a5f7a", textColor = "#12181f" }) {
  if (items.length < 2) return null; // nothing to show above the homepage itself

  return (
    <nav aria-label="Breadcrumb" style={{ padding:"18px 32px 0", fontSize:12 }}>
      <ol style={{
        display:"flex", alignItems:"center", gap:8, listStyle:"none",
        margin:0, padding:0, flexWrap:"wrap", color:"#8a8f98",
      }}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
              {isLast || !item.href ? (
                <span style={{ color:textColor, fontWeight:600 }} aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              ) : (
                <a href={item.href} style={{ color:accentColor, textDecoration:"none" }}>
                  {item.label}
                </a>
              )}
              {!isLast && <span>›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
