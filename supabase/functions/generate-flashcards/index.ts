const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { text, count = 10, difficulty = "medium" } = await req.json();
    if (typeof text !== "string" || text.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Provide at least 20 characters of source text." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const safeCount = Math.min(Math.max(parseInt(String(count), 10) || 10, 1), 30);
    // Truncate very long inputs to keep token usage reasonable
    const trimmed = text.slice(0, 18000);

    const systemPrompt = `You are a flashcard generator. You MUST create study flashcards using ONLY the facts, definitions, names, dates, formulas, and concepts that appear in the SOURCE MATERIAL the user provides.

Strict rules:
- Do NOT use outside knowledge. If a fact is not in the source, do not include it.
- Each question must be directly answerable from the source.
- Each answer must be supported by the source (paraphrase is fine; do not invent details).
- Prefer atomic cards: one concept per card. Avoid duplicates.
- If the source is too short or off-topic, return as many high-quality cards as you can (even if fewer than requested) rather than fabricating.
- Cover the most important, testable points: definitions, key terms, cause/effect, examples, formulas, dates, names.
- Difficulty "${difficulty}": easy = recall/definitions, medium = explain/compare, hard = apply/analyze.
- Keep questions under ~25 words and answers under ~50 words. Student-friendly language.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Generate up to ${safeCount} flashcards STRICTLY from the SOURCE MATERIAL below. Do not use any information that is not in this text.\n\n=== SOURCE MATERIAL START ===\n${trimmed}\n=== SOURCE MATERIAL END ===`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_flashcards",
              description: "Return an array of flashcards.",
              parameters: {
                type: "object",
                properties: {
                  cards: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        answer: { type: "string" },
                      },
                      required: ["question", "answer"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["cards"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_flashcards" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit hit. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    let cards: Array<{ question: string; answer: string }> = [];
    if (args) {
      try {
        const parsed = typeof args === "string" ? JSON.parse(args) : args;
        cards = Array.isArray(parsed.cards) ? parsed.cards : [];
      } catch (e) {
        console.error("Failed to parse tool args:", e);
      }
    }

    return new Response(JSON.stringify({ cards }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-flashcards error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
