import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ChatMessage } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Send, Trash2, Sparkles, Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { useAssistant } from "@/contexts/AssistantContext";

const BRAINY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/jarvis-assistant`;

const Chat = () => {
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>("brainbrew-chat-history", []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { executeAction } = useAssistant();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
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
          context: { path: window.location.pathname },
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
    toast({ title: "Chat cleared" });
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <Sparkles className="h-6 w-6 text-primary" />
              Brainy B
            </h1>
            <p className="text-sm text-muted-foreground">
              Your tutor and assistant in one — ask anything or tell me to do something.
            </p>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clear}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
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
                Try: "Explain photosynthesis" or "Start a 30 minute focus session."
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

        <div className="flex gap-2 rounded-2xl bg-card p-3 shadow-card">
          <Textarea
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
          <Button onClick={send} disabled={loading || !input.trim()} size="icon" className="h-auto">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
