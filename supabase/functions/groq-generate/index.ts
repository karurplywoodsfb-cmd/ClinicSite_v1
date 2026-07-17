// supabase/functions/groq-generate/index.ts
// ─────────────────────────────────────────────────────────────────
// Generic server-side proxy to Groq's chat completions API.
// Keeps GROQ_API_KEY out of the browser bundle.
// Used by: SymptomTriage.jsx, AIBlogGenerator.jsx (both call this
// instead of an AI provider directly).
//
// Deploy: supabase functions deploy groq-generate
// Secret:  supabase secrets set GROQ_API_KEY=gsk_xxxxxxxxxxxx
//
// Request body:
//   {
//     system?: string,          // optional system prompt
//     prompt: string,           // user message
//     max_tokens?: number,      // default 1000
//     json?: boolean            // if true, forces valid-JSON output
//   }
// Response body:
//   { text: string }            // raw model text (already JSON if json:true)
// ─────────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const GROQ_MODEL    = Deno.env.get("GROQ_MODEL") || "openai/gpt-oss-120b";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "https://clinicsite.in",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured on the server");
    }

    const { system, prompt, max_tokens = 1000, json = false } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'prompt' string in request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages = [];
    if (system) messages.push({ role: "system", content: system });
    messages.push({ role: "user", content: prompt });

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        max_tokens,
        temperature: 0.4,
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      throw new Error(data?.error?.message || `Groq API error (${groqRes.status})`);
    }

    const text = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
