import { createContext, useContext, ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Note, Assignment, FlashcardDeck, Flashcard } from "@/types";
import { usePreferences } from "./PreferencesContext";

export type AssistantAction = { name: string; args: any };

interface AssistantContextType {
  executeAction: (action: AssistantAction) => Promise<string>;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const { updateTimerSettings, updateStreakSettings } = usePreferences();
  const [, setNotes] = useLocalStorage<Note[]>("brainbrew-notes", []);
  const [, setAssignments] = useLocalStorage<Assignment[]>("brainbrew-assignments", []);
  const [, setDecks] = useLocalStorage<FlashcardDeck[]>("brainbrew-flashcard-decks", []);

  const executeAction = useCallback(async (action: AssistantAction): Promise<string> => {
    const { name, args } = action;
    try {
      switch (name) {
        case "create_note": {
          const now = new Date().toISOString();
          const note: Note = {
            id: uid(),
            title: args.title || "Untitled",
            content: args.content || "",
            createdAt: now,
            updatedAt: now,
          };
          setNotes((prev) => [note, ...prev]);
          toast({ title: "Note created", description: note.title });
          return `Created note "${note.title}".`;
        }
        case "create_assignment": {
          const a: Assignment = {
            id: uid(),
            title: args.title || "Untitled task",
            subject: args.subject || "General",
            dueDate: args.dueDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
            description: args.description || "",
            priority: (args.priority as Assignment["priority"]) || "medium",
            completed: false,
          };
          setAssignments((prev) => [a, ...prev]);
          toast({ title: "Assignment added", description: a.title });
          return `Added assignment "${a.title}".`;
        }
        case "start_pomodoro": {
          const minutes = Math.max(1, Math.min(180, Number(args.minutes) || 25));
          const mode = args.mode || "work";
          window.dispatchEvent(new CustomEvent("jarvis:pomodoro", {
            detail: { action: "start", minutes, mode },
          }));
          if (mode === "work") updateTimerSettings({ work: minutes });
          else if (mode === "shortBreak") updateTimerSettings({ shortBreak: minutes });
          else if (mode === "longBreak") updateTimerSettings({ longBreak: minutes });
          navigate("/");
          toast({ title: "Focus session started", description: `${minutes} min` });
          return `Started a ${minutes}-minute session.`;
        }
        case "stop_pomodoro": {
          window.dispatchEvent(new CustomEvent("jarvis:pomodoro", { detail: { action: "stop" } }));
          toast({ title: "Session paused" });
          return "Paused.";
        }
        case "create_flashcard_deck": {
          const cards: Flashcard[] = (args.cards || []).map((c: any) => ({
            id: uid(),
            question: c.question,
            answer: c.answer,
          }));
          const deck: FlashcardDeck = {
            id: uid(),
            name: args.name || "New Deck",
            cards,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setDecks((prev) => [deck, ...prev]);
          toast({ title: "Deck created", description: `${deck.name} (${cards.length} cards)` });
          return `Created "${deck.name}" with ${cards.length} cards.`;
        }
        case "set_theme": {
          setTheme(args.theme);
          toast({ title: `Theme: ${args.theme}` });
          return `Theme switched to ${args.theme}.`;
        }
        case "navigate": {
          navigate(args.path);
          return `Navigated to ${args.path}.`;
        }
        case "set_daily_goal": {
          updateStreakSettings({ dailyGoal: Number(args.goal) || 4 });
          toast({ title: "Daily goal updated", description: `${args.goal} pomodoros` });
          return `Daily goal set to ${args.goal}.`;
        }
        default:
          return `Unknown action: ${name}`;
      }
    } catch (e) {
      console.error("Action failed", name, e);
      return `Failed: ${name}`;
    }
  }, [navigate, setTheme, toast, setNotes, setAssignments, setDecks, updateTimerSettings, updateStreakSettings]);

  return (
    <AssistantContext.Provider value={{ executeAction }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant must be used within AssistantProvider");
  return ctx;
}
