import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TimerMode = "work" | "shortBreak" | "longBreak";

interface TimerSettings {
  work: number;
  shortBreak: number;
  longBreak: number;
}

export function PomodoroTimer() {
  const [settings, setSettings] = useState<TimerSettings>({
    work: 25,
    shortBreak: 5,
    longBreak: 15,
  });
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(settings.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  const totalTime = settings[mode] * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const resetTimer = useCallback(() => {
    setTimeLeft(settings[mode] * 60);
    setIsRunning(false);
  }, [mode, settings]);

  useEffect(() => {
    setTimeLeft(settings[mode] * 60);
  }, [mode, settings]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (mode === "work") {
        setSessions((prev) => prev + 1);
        if ((sessions + 1) % 4 === 0) {
          setMode("longBreak");
        } else {
          setMode("shortBreak");
        }
      } else {
        setMode("work");
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, sessions]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const modeColors = {
    work: "from-primary to-primary/80",
    shortBreak: "from-success to-success/80",
    longBreak: "from-accent to-accent/80",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card p-6 shadow-card">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${modeColors[mode]} opacity-5`} />
      
      <div className="relative">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Pomodoro Timer</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Timer Settings</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="work">Work Duration (minutes)</Label>
                  <Input
                    id="work"
                    type="number"
                    value={settings.work}
                    onChange={(e) =>
                      setSettings({ ...settings, work: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shortBreak">Short Break (minutes)</Label>
                  <Input
                    id="shortBreak"
                    type="number"
                    value={settings.shortBreak}
                    onChange={(e) =>
                      setSettings({ ...settings, shortBreak: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="longBreak">Long Break (minutes)</Label>
                  <Input
                    id="longBreak"
                    type="number"
                    value={settings.longBreak}
                    onChange={(e) =>
                      setSettings({ ...settings, longBreak: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Mode selector */}
        <div className="mb-6 flex gap-2 rounded-lg bg-muted p-1">
          {(["work", "shortBreak", "longBreak"] as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setIsRunning(false);
              }}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                mode === m
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "work" ? "Focus" : m === "shortBreak" ? "Short Break" : "Long Break"}
            </button>
          ))}
        </div>

        {/* Timer display */}
        <div className="relative mx-auto mb-6 h-48 w-48">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-muted"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              className={mode === "work" ? "text-primary" : mode === "shortBreak" ? "text-success" : "text-accent"}
              strokeDasharray={283}
              initial={{ strokeDashoffset: 283 }}
              animate={{ strokeDashoffset: 283 - (progress / 100) * 283 }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground">{formatTime(timeLeft)}</span>
            <span className="text-sm text-muted-foreground capitalize">{mode === "shortBreak" ? "Break" : mode === "longBreak" ? "Long Break" : "Focus"}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={resetTimer}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            className={`h-14 w-14 rounded-full ${mode === "work" ? "bg-primary" : mode === "shortBreak" ? "bg-success" : "bg-accent"}`}
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="ml-0.5 h-6 w-6" />
            )}
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
            {sessions}
          </div>
        </div>
      </div>
    </div>
  );
}
