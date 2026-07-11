// src/components/admin/BlogPage.jsx
// AdminPanel "Blog & Content" tab — plan-limit banner + AIBlogGenerator.
// Extracted from AdminPanel.jsx.

import AIBlogGenerator from "../AIBlogGenerator";
import { supabase } from "../../lib/supabase";

export default function BlogPage({ clinic, planContext, onRequestUpgrade }) {
  const limit = planContext.limits?.features?.custom_pages ?? 1;
  const remaining = planContext.getRemaining("custom_pages");

  return (
    <div>
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)",
        borderRadius:10, padding:"10px 16px", marginBottom:16,
      }}>
        <span style={{ fontSize:13, color: remaining === 0 ? "#ef4444" : "#64748b" }}>
          {limit >= 999999 ? "Unlimited blog posts" : `${remaining} of ${limit} pages remaining this month`}
        </span>
        {remaining === 0 && (
          <button onClick={onRequestUpgrade} style={{
            fontSize:12, color:"#1e88e5", background:"none", border:"none",
            cursor:"pointer", textDecoration:"underline",
          }}>Upgrade for more</button>
        )}
      </div>
      <AIBlogGenerator clinic={clinic} supabaseClient={supabase}/>
    </div>
  );
}
