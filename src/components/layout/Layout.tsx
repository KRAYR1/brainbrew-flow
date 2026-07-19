import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, Brain, LayoutDashboard, FileText, BookOpen, Sparkles, Layers } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

const mobileTabs = [
  { path: "/", icon: LayoutDashboard, label: "Home" },
  { path: "/notes", icon: FileText, label: "Notes" },
  { path: "/assignments", icon: BookOpen, label: "Tasks" },
  { path: "/chat", icon: Sparkles, label: "Brainy" },
  { path: "/flashcards", icon: Layers, label: "Cards" },
];

export function Layout({ children }: LayoutProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar (hidden on mobile) */}
      <Sidebar />

      {/* Mobile top app bar */}
      <header
        className="md:hidden sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-4 h-14"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Open menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar" onClick={() => setOpen(false)}>
            {/* Reuse the same sidebar inside the drawer, forced visible */}
            <div className="[&_aside]:!block [&_aside]:!static [&_aside]:!h-full [&_aside]:!w-full [&_aside]:!border-0">
              <Sidebar />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold">
            Brain<span className="text-primary">Brews</span>
          </span>
        </div>
      </header>

      <main className="md:ml-64 min-h-screen">
        <div
          className="relative p-4 sm:p-6 lg:p-8 pb-24 md:pb-8"
          style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
        >
          {children}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-5">
          {mobileTabs.map((t) => {
            const active = location.pathname === t.path;
            return (
              <li key={t.path}>
                <NavLink
                  to={t.path}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <t.icon className="h-5 w-5" />
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
