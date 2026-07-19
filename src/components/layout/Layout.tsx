import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Menu,
  Brain,
  LayoutDashboard,
  FileText,
  BookOpen,
  Sparkles,
  Layers,
  Flame,
} from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/contexts/PreferencesContext";

interface LayoutProps {
  children: React.ReactNode;
}

const mobileTabs = [
  { path: "/", icon: LayoutDashboard, label: "Home" },
  { path: "/notes", icon: FileText, label: "Notes" },
  { path: "/chat", icon: Sparkles, label: "Brainy", primary: true },
  { path: "/assignments", icon: BookOpen, label: "Tasks" },
  { path: "/flashcards", icon: Layers, label: "Cards" },
];

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/notes": "Notes",
  "/assignments": "Assignments",
  "/calendar": "Calendar",
  "/timetable": "Timetable",
  "/chat": "Brainy B",
  "/flashcards": "Flashcards",
  "/settings": "Settings",
};

export function Layout({ children }: LayoutProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { preferences } = usePreferences();
  const title = pageTitles[location.pathname] ?? "BrainBrews";

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar (hidden on mobile) */}
      <Sidebar />

      {/* Mobile top app bar */}
      <header
        className="md:hidden sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex h-14 items-center gap-2 px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Open menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card active:scale-95 transition-transform"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 p-0 bg-sidebar"
              onClick={() => setOpen(false)}
            >
              <div className="[&_aside]:!block [&_aside]:!static [&_aside]:!h-full [&_aside]:!w-full [&_aside]:!border-0">
                <Sidebar />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 flex-col leading-tight">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              BrainBrews
            </span>
            <span className="text-base font-bold text-foreground">{title}</span>
          </div>

          <div className="flex h-9 items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 text-accent">
            <Flame className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {preferences.streakSettings.currentStreak}
            </span>
          </div>
        </div>
      </header>

      <main className="md:ml-64 min-h-screen">
        <div
          className="relative px-4 py-4 sm:p-6 lg:p-8 md:pb-8"
          style={{
            paddingBottom: "calc(6rem + env(safe-area-inset-bottom))",
          }}
        >
          {children}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/90 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-5 px-1 pt-1.5 pb-1">
          {mobileTabs.map((t) => {
            const active = location.pathname === t.path;
            if (t.primary) {
              return (
                <li key={t.path} className="flex items-start justify-center">
                  <NavLink
                    to={t.path}
                    aria-label={t.label}
                    className={cn(
                      "-mt-6 flex h-14 w-14 items-center justify-center rounded-full border-4 border-background shadow-lg transition-transform active:scale-95",
                      "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground"
                    )}
                  >
                    <t.icon className="h-6 w-6" />
                  </NavLink>
                </li>
              );
            }
            return (
              <li key={t.path}>
                <NavLink
                  to={t.path}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-10 items-center justify-center rounded-full transition-colors",
                      active && "bg-primary/12"
                    )}
                  >
                    <t.icon className="h-5 w-5" />
                  </span>
                  <span>{t.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
