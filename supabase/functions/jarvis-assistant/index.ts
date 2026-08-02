const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Brainy B — a witty, proactive AI study companion for the BrainBrews app. You are TWO things in one:

1. A TUTOR: explain concepts clearly with simple examples, generate practice questions, summarize topics, and quiz the user. Use markdown — short paragraphs, bullet lists, **bold** key terms, and code blocks when relevant.
2. A DOER: perform real actions in the app via tools (notes, assignments, focus sessions, flashcards, quizzes, theme, navigation, goals).

Available actions:
- create_note, create_assignment, start_pomodoro, stop_pomodoro, create_flashcard_deck, set_theme, navigate, set_daily_goal, start_quiz, grade_answer, end_quiz

Rules:
- If a request implies an action, call the tool — don't just talk about it. You can chain multiple tools.
- If it's a question or learning request, teach it clearly. You can also save your explanation as a note if asked.
- Be warm, confident, and concise — Jarvis-from-Iron-Man energy. Keep action confirmations to 1–2 sentences; full tutoring answers can be longer when needed.

Quizzing:
- When the user asks to be quizzed, call start_quiz once, then ask ONE question at a time in your message text and stop.
- When the user replies with an answer, call grade_answer with the verdict and a short explanation, then immediately ask the next question in your message text.
- After the final question, call end_quiz with a short summary of weak spots.`;

const GROUNDING_PROMPT = `

=== STUDY MATERIAL MODE ===
The user has attached their own study material below. For ANY request about content (notes, summaries, flashcards, quizzes, explanations) you MUST use ONLY the facts, definitions, names, dates, formulas and concepts found in this material.
- Do NOT use outside knowledge. If something isn't covered, say so plainly.
- Every flashcard, quiz question and note point must be directly answerable from the material.
- When grading a quiz answer, cite the relevant snippet from the material.
- Prefer atomic, testable points; avoid duplicates and invented details.`;

const tools = [
  {
    type: "function",
    function: {
      name: "create_note",
      description: "Create a new note in the user's notes",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string", description: "Markdown content" },
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_assignment",
      description: "Add an assignment / task with optional due date",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          subject: { type: "string" },
          dueDate: { type: "string", description: "ISO date YYYY-MM-DD" },
          description: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "start_pomodoro",
      description: "Start a Pomodoro focus session for a given duration in minutes",
      parameters: {
        type: "object",
        properties: {
          minutes: { type: "number", description: "Duration in minutes, default 25" },
          mode: { type: "string", enum: ["work", "shortBreak", "longBreak"] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "stop_pomodoro",
      description: "Stop or pause the current Pomodoro session",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_flashcard_deck",
      description: "Create a flashcard deck with Q&A cards",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          cards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                answer: { type: "string" },
              },
              required: ["question", "answer"],
            },
          },
        },
        required: ["name", "cards"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "start_quiz",
      description: "Begin an interactive quiz session on a topic or the attached study material",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string" },
          total: { type: "number", description: "How many questions the quiz will have" },
        },
        required: ["topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "grade_answer",
      description: "Grade the user's answer to the previous quiz question",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string", description: "The question that was asked" },
          correctAnswer: { type: "string", description: "The correct answer from the material" },
          verdict: { type: "string", enum: ["correct", "partial", "incorrect"] },
          explanation: { type: "string" },
        },
        required: ["question", "correctAnswer", "verdict"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "end_quiz",
      description: "End the quiz and summarise performance",
      parameters: {
        type: "object",
        properties: { summary: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_theme",
      description: "Switch app theme",
      parameters: {
        type: "object",
        properties: {
          theme: { type: "string", enum: ["light", "dark", "system"] },
        },
        required: ["theme"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "navigate",
      description: "Navigate to a page in the app",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            enum: ["/", "/notes", "/assignments", "/calendar", "/timetable", "/chat", "/flashcards", "/settings"],
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_daily_goal",
      description: "Set the daily pomodoro goal",
      parameters: {
        type: "object",
        properties: { goal: { type: "number" } },
        required: ["goal"],
      },
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context, materials } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let sys = SYSTEM_PROMPT + (context ? `\n\nCurrent app context: ${JSON.stringify(context)}` : "");

    if (Array.isArray(materials) && materials.length > 0) {
      const blocks = materials
        .filter((m: any) => typeof m?.text === "string" && m.text.trim())
        .map(
          (m: any) =>
            `--- DOCUMENT: ${String(m.name ?? "Untitled").slice(0, 120)} ---\n${String(m.text).slice(0, 30000)}`,
        )
        .join("\n\n");
      if (blocks) {
        sys += GROUNDING_PROMPT + `\n\n=== SOURCE MATERIAL START ===\n${blocks}\n=== SOURCE MATERIAL END ===`;
      }
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, ...messages],
        tools,
        tool_choice: "auto",
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit hit. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const msg = data.choices?.[0]?.message ?? {};
    const toolCalls = (msg.tool_calls ?? []).map((tc: any) => ({
      name: tc.function?.name,
      args: (() => {
        try { return JSON.parse(tc.function?.arguments ?? "{}"); } catch { return {}; }
      })(),
    }));

    return new Response(
      JSON.stringify({ message: msg.content ?? "", toolCalls }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("jarvis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
