import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  Calendar, 
  Flame,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/notes", icon: FileText, label: "Notes" },
  { path: "/assignments", icon: BookOpen, label: "Assignments" },
  { path: "/calendar", icon: Calendar, label: "Calendar" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-sidebar-foreground">
            Brain<span className="text-primary">Brew</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <item.icon className="relative z-10 h-5 w-5" />
                <span className="relative z-10">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Streak indicator */}
        <div className="mx-3 mb-6 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 p-4">
          <div className="flex items-center gap-2 text-accent">
            <Flame className="h-5 w-5" />
            <span className="text-sm font-semibold">Current Streak</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-foreground">7 Days</p>
          <p className="text-xs text-muted-foreground">Keep it going!</p>
        </div>
      </div>
    </aside>
  );
}
