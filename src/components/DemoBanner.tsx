import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, RotateCcw, LogIn, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEMO_FLAG_KEY,
  exitDemoMode,
  isDemoMode,
  resetDemoWorkspace,
} from "@/lib/demoSeed";
import { useToast } from "@/hooks/use-toast";

export const DemoBanner = () => {
  const [demo, setDemo] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const refresh = () => setDemo(isDemoMode());

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === DEMO_FLAG_KEY || e.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Also re-check on route change so the banner appears immediately after seeding.
  useEffect(refresh, [location.pathname]);

  if (!demo) return null;
  if (location.pathname === "/auth") return null;

  const handleReset = () => {
    resetDemoWorkspace();
    toast({ title: "Demo reset", description: "Fresh sample data loaded." });
    // Force a soft reload so context/state re-hydrates from localStorage.
    window.location.reload();
  };

  const handleExit = () => {
    exitDemoMode();
    navigate("/auth", { replace: true });
    setTimeout(() => window.location.reload(), 50);
  };

  return (
    <div className="sticky top-0 z-40 border-b border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-3 py-2 text-xs sm:text-sm sm:gap-3 sm:px-4">
        <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">Demo mode — data stays in your browser.</span>
        </span>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Button size="sm" variant="ghost" onClick={handleReset} className="h-8 gap-1.5 px-2">
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button size="sm" variant="default" onClick={handleExit} className="h-8 gap-1.5 px-2">
            <LogIn className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign up to save</span>
            <span className="sm:hidden">Sign up</span>
          </Button>
          <button
            aria-label="Dismiss demo banner"
            onClick={() => setDemo(false)}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
