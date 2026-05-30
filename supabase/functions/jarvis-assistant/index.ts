const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Jarvis — a proactive, witty, capable AI assistant for a student productivity app called BrainBrew. You can perform real actions in the app via tools.

Available actions you can take:
- create_note: when the user asks to take/make/save a note, jot something down, or save a summary
- create_assignment: when the user mentions homework, tasks, deadlines, or things to do
- start_pomodoro: when the user wants to focus, study, start a session, or set a timer (default 25 min)
- stop_pomodoro: to pause/stop the running session
- create_flashcard_deck: when the user wants flashcards, quizzes, or to study a topic
- set_theme: light / dark / system
- navigate: switch pages (paths: /, /notes, /assignments, /calendar, /timetable, /chat, /flashcards, /settings)
- set_daily_goal: change daily pomodoro goal

Rules:
- Take initiative — if a request implies an action, call the tool. Don't just talk about it.
- You can chain multiple tools in one response (e.g., create a note AND start a pomodoro).
- Keep replies short, warm, and confident — like Jarvis from Iron Man. 1-2 sentences max.
- After running tools, briefly confirm what you did.
- For flashcards, generate solid Q&A from your own knowledge if the user gives a topic.`;

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
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sys = SYSTEM_PROMPT + (context ? `\n\nCurrent app context: ${JSON.stringify(context)}` : "");

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
