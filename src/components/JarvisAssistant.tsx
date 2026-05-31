import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, Loader2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAssistant } from "@/contexts/AssistantContext";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const JARVIS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/jarvis-assistant`;

type Msg = { role: "user" | "assistant"; content: string; actions?: string[] };

const SUGGESTIONS = [
  "Explain the French Revolution in simple terms",
  "Start a 45 minute focus session",
  "Quiz me on photosynthesis",
  "Create 5 flashcards on World War II",
  "Add an assignment: Math homework due Friday",
  "Switch to dark mode",
];

export function JarvisAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const { executeAction } = useAssistant();
  const { toast } = useToast();
  const recogRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Keyboard shortcut: Cmd/Ctrl + J
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({ title: "Voice not supported", description: "Try Chrome/Edge.", variant: "destructive" });
      return;
    }
    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = false;
    r.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + t : t));
    };
    r.onend = () => setListening(false);
    r.start();
    recogRef.current = r;
    setListening(true);
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setLoading(true);

    try {
      const resp = await fetch(JARVIS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          context: { path: window.location.pathname },
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast({
          title: resp.status === 402 ? "AI credits exhausted" : "Jarvis error",
          description: err.error || "Try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const data = await resp.json();
      const actionResults: string[] = [];
      for (const tc of data.toolCalls || []) {
        const r = await executeAction(tc);
        actionResults.push(r);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message || (actionResults.length ? "Done." : "…"),
          actions: actionResults,
        },
      ]);
    } catch (e) {
      console.error(e);
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30"
        aria-label="Open Brainy B"
      >
        <Sparkles className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-end bg-background/40 backdrop-blur-sm p-4 sm:items-end"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="flex h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/10 to-accent/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Brainy B</h2>
                    <p className="text-xs text-muted-foreground">Tutor + doer · ⌘J</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Hello. I can act across the app — notes, assignments, focus sessions, flashcards, settings. Just ask.
                    </p>
                    <div className="space-y-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          className="block w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-muted"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                      {m.actions && m.actions.length > 0 && (
                        <div className="mt-2 space-y-1 border-t border-border/50 pt-2">
                          {m.actions.map((a, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="h-1.5 w-1.5 rounded-full bg-success" />
                              {a}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Thinking…
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-border p-3">
                <div className="flex items-end gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder="Ask Jarvis to do anything…"
                    rows={1}
                    className="min-h-[40px] resize-none"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleVoice}
                    className={listening ? "bg-destructive/10 text-destructive" : ""}
                  >
                    {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button onClick={() => send()} size="icon" disabled={loading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
