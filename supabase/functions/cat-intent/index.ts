const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Whiskers, a wise but playful cat guarding a student's Pomodoro focus session.
A user just tried to leave BrainBrews — possibly to visit a blocked site like YouTube, Netflix, Instagram, TikTok, etc.
You will receive their stated intent. Your job:
1. Classify it as "entertainment" or "study".
2. Reply in 1-2 short sentences (max 200 chars), in-character as a cat (subtle 🐾, "purr", "meow" okay — don't overdo it).
   - If entertainment: be firm but warm. Tell them to come back to BrainBrews and finish the Pomodoro. Mention what they can do AFTER the timer.
   - If study: be encouraging, acknowledge the legitimate need, but still nudge them to use BrainBrews' own notes/flashcards/chat if possible.
3. Output ONLY valid JSON, no markdown fences.

Format: {"classification":"entertainment"|"study","reply":"..."}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { intent, site } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (typeof intent !== "string" || !intent.trim()) {
      return new Response(JSON.stringify({ error: "intent required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMsg = `Blocked site context: ${site || "unknown"}\nStudent's stated intent: "${intent.trim()}"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      const status = response.status === 429 || response.status === 402 ? response.status : 500;
      return new Response(
        JSON.stringify({
          error:
            status === 429
              ? "Rate limit hit. Try again shortly."
              : status === 402
                ? "AI credits exhausted."
                : "AI gateway error",
        }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { classification?: string; reply?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
    const classification =
      parsed.classification === "study" ? "study" : "entertainment";
    const reply =
      parsed.reply?.toString().slice(0, 400) ||
      (classification === "entertainment"
        ? "Meow! That can wait — the Pomodoro is still running. Come back to BrainBrews and finish strong. 🐾"
        : "Purr — okay, but try the BrainBrews notes and AI tutor first. 🐾");

    return new Response(JSON.stringify({ classification, reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cat-intent error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
