import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ChatMessage } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Send, Trash2, Sparkles, Bot, User, FolderOpen, Layers } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { useAssistant } from "@/contexts/AssistantContext";
import { useStudyMaterials } from "@/hooks/useStudyMaterials";
import { MaterialsPanel } from "@/components/chat/MaterialsPanel";

const BRAINY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/jarvis-assistant`;

interface QuizState {
  topic: string;
  total: number;
  asked: { question: string; answer: string; verdict: string }[];
  correct: number;
}

const QUICK_ACTIONS = [
  { label: "Summarize", prompt: "Summarize my study material into the key points." },
  { label: "Make notes", prompt: "Create a note in my Notes with clear structured notes from my study material." },
  { label: "Make a deck", prompt: "Create a flashcard deck from my study material." },
  { label: "Quiz me", prompt: "Quiz me on my study material, one question at a time, and grade my answers." },
];

const Chat = () => {
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>("brainbrew-chat-history", []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const { toast } = useToast();
  const { executeAction } = useAssistant();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mats = useStudyMaterials();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  const handleQuizTool = (tc: { name: string; args: any }): string | null => {
    if (tc.name === "start_quiz") {
      setQuiz({
        topic: tc.args.topic || "Study material",
        total: Number(tc.args.total) || 0,
        asked: [],
        correct: 0,
      });
      return `Quiz started: ${tc.args.topic || "Study material"}.`;
    }
    if (tc.name === "grade_answer") {
      const verdict = tc.args.verdict || "incorrect";
      setQuiz((q) =>
        q
          ? {
              ...q,
              asked: [
                ...q.asked,
                {
                  question: tc.args.question || "",
                  answer: tc.args.correctAnswer || "",
                  verdict,
                },
              ],
              correct: q.correct + (verdict === "correct" ? 1 : 0),
            }
          : q,
      );
      const icon = verdict === "correct" ? "✅" : verdict === "partial" ? "🟡" : "❌";
      return `${icon} ${verdict}${tc.args.explanation ? ` — ${tc.args.explanation}` : ""}`;
    }
    if (tc.name === "end_quiz") {
      return `Quiz finished. ${tc.args.summary || ""}`.trim();
    }
    return null;
  };

  const saveQuizAsDeck = async () => {
    if (!quiz || quiz.asked.length === 0) return;
    const r = await executeAction({
      name: "create_flashcard_deck",
      args: {
        name: `${quiz.topic} — Quiz`,
        cards: quiz.asked.map((a) => ({ question: a.question, answer: a.answer })),
      },
    });
    toast({ title: "Saved as deck", description: r });
  };

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch(BRAINY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          context: { path: window.location.pathname, quizActive: !!quiz },
          materials: mats.buildPayload(),
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          toast({ title: "Rate limit hit", description: "Please wait a moment.", variant: "destructive" });
        } else if (resp.status === 402) {
          toast({ title: "AI credits exhausted", description: "Add credits to continue.", variant: "destructive" });
        } else {
          toast({ title: "Chat error", description: "Could not reach Brainy B.", variant: "destructive" });
        }
        setLoading(false);
        return;
      }

      const data = await resp.json();
      const actionResults: string[] = [];
      for (const tc of data.toolCalls || []) {
        const quizResult = handleQuizTool(tc);
        if (quizResult !== null) {
          actionResults.push(quizResult);
          continue;
        }
        const r = await executeAction(tc);
        actionResults.push(r);
      }

      const content =
        (data.message || "").trim() ||
        (actionResults.length ? actionResults.join("\n") : "…");
      const suffix =
        actionResults.length && data.message
          ? "\n\n" + actionResults.map((a) => `✓ ${a}`).join("\n")
          : "";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: content + suffix,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.error(e);
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setMessages([]);
    setQuiz(null);
    toast({ title: "Chat cleared" });
  };

  const panel = (
    <MaterialsPanel
      materials={mats.materials}
      nearLimit={mats.nearLimit}
      onAdd={mats.addMaterial}
      onRemove={mats.removeMaterial}
      onRename={mats.renameMaterial}
      onToggle={mats.toggleMaterial}
      onSetAll={mats.setAllSelected}
    />
  );

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <Sparkles className="h-6 w-6 text-primary" />
                Brainy B
              </h1>
              <p className="text-sm text-muted-foreground">
                Upload your study material and ask for notes, decks, or a quiz.
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {mats.selected.length > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {mats.selected.length} material{mats.selected.length > 1 ? "s" : ""} active
                  </span>
                )}
                {quiz && (
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                    Quiz: {quiz.correct}/{quiz.asked.length}
                    {quiz.total ? ` of ${quiz.total}` : ""}
                  </span>
                )}
                {quiz && quiz.asked.length > 0 && (
                  <button
                    onClick={saveQuizAsDeck}
                    className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px]"
                  >
                    <Layers className="h-3 w-3" /> Save as deck
                  </button>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <FolderOpen className="mr-1.5 h-4 w-4" />
                    Materials
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] sm:w-96">
                  <SheetHeader>
                    <SheetTitle>Study materials</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 h-[calc(100vh-8rem)]">{panel}</div>
                </SheetContent>
              </Sheet>
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clear}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto rounded-2xl bg-card p-6 shadow-card"
          >
            {messages.length === 0 && !loading && (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <Bot className="mb-3 h-12 w-12 opacity-40" />
                <p className="text-sm">Say hi to Brainy B.</p>
                <p className="mt-1 text-xs">
                  Add your notes on the right, then try "Quiz me on chapter 3".
                </p>
              </div>
            )}
            <div className="space-y-4">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                  {m.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                    Thinking…
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                disabled={loading}
                onClick={() => setInput(a.prompt)}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground disabled:opacity-50"
              >
                {a.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 rounded-2xl bg-card p-3 shadow-card">
            <Textarea
              ref={inputRef}
              placeholder="Ask Brainy B anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              className="resize-none border-0 focus-visible:ring-0"
            />
            <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon" className="h-auto">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <aside className="hidden w-80 shrink-0 flex-col rounded-2xl bg-card p-4 shadow-card lg:flex">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <FolderOpen className="h-4 w-4 text-primary" />
            Study materials
          </h2>
          <div className="min-h-0 flex-1">{panel}</div>
        </aside>
      </div>
    </Layout>
  );
};

export default Chat;
