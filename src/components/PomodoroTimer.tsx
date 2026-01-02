import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePreferences, SoundType } from "@/contexts/PreferencesContext";
import { useTimerSound } from "@/hooks/useTimerSound";

type TimerMode = "work" | "shortBreak" | "longBreak";

export function PomodoroTimer() {
  const { preferences, updateTimerSettings, updateStreakSettings } = usePreferences();
  const { timerSettings } = preferences;
  const { playSound } = useTimerSound();
  
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(timerSettings.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [localSettings, setLocalSettings] = useState(timerSettings);

  const totalTime = timerSettings[mode] * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const resetTimer = useCallback(() => {
    setTimeLeft(timerSettings[mode] * 60);
    setIsRunning(false);
  }, [mode, timerSettings]);

  useEffect(() => {
    setTimeLeft(timerSettings[mode] * 60);
  }, [mode, timerSettings]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      
      // Play sound notification
      if (timerSettings.soundEnabled) {
        playSound(timerSettings.soundType, timerSettings.soundVolume);
      }
      
      if (mode === "work") {
        const newSessions = sessions + 1;
        setSessions(newSessions);
        
        // Update streak if goal reached
        if (newSessions >= preferences.streakSettings.dailyGoal) {
          const today = new Date().toDateString();
          if (preferences.streakSettings.lastActiveDate !== today) {
            const newStreak = preferences.streakSettings.currentStreak + 1;
            updateStreakSettings({
              currentStreak: newStreak,
              longestStreak: Math.max(newStreak, preferences.streakSettings.longestStreak),
              lastActiveDate: today,
            });
          }
        }
        
        if (newSessions % 4 === 0) {
          setMode("longBreak");
          if (timerSettings.autoStartBreaks) setIsRunning(true);
        } else {
          setMode("shortBreak");
          if (timerSettings.autoStartBreaks) setIsRunning(true);
        }
      } else {
        setMode("work");
        if (timerSettings.autoStartPomodoros) setIsRunning(true);
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, sessions, timerSettings, preferences.streakSettings, updateStreakSettings, playSound]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSaveSettings = () => {
    updateTimerSettings(localSettings);
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
                    value={localSettings.work}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, work: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shortBreak">Short Break (minutes)</Label>
                  <Input
                    id="shortBreak"
                    type="number"
                    value={localSettings.shortBreak}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, shortBreak: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="longBreak">Long Break (minutes)</Label>
                  <Input
                    id="longBreak"
                    type="number"
                    value={localSettings.longBreak}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, longBreak: Number(e.target.value) })
                    }
                  />
                </div>
                
                {/* Sound Settings */}
                <div className="border-t pt-4 mt-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {localSettings.soundEnabled ? (
                        <Volume2 className="h-4 w-4 text-primary" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Label htmlFor="soundEnabled">Sound Notification</Label>
                    </div>
                    <Switch
                      id="soundEnabled"
                      checked={localSettings.soundEnabled}
                      onCheckedChange={(checked) =>
                        setLocalSettings({ ...localSettings, soundEnabled: checked })
                      }
                    />
                  </div>
                  
                  {localSettings.soundEnabled && (
                    <>
                      <div className="grid gap-2 mb-4">
                        <Label>Notification Sound</Label>
                        <Select
                          value={localSettings.soundType}
                          onValueChange={(value: SoundType) =>
                            setLocalSettings({ ...localSettings, soundType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bell">Bell</SelectItem>
                            <SelectItem value="chime">Chime</SelectItem>
                            <SelectItem value="digital">Digital</SelectItem>
                            <SelectItem value="gentle">Gentle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Volume: {Math.round(localSettings.soundVolume * 100)}%</Label>
                        <Slider
                          value={[localSettings.soundVolume]}
                          onValueChange={([value]) =>
                            setLocalSettings({ ...localSettings, soundVolume: value })
                          }
                          min={0}
                          max={1}
                          step={0.1}
                        />
                      </div>
                    </>
                  )}
                </div>
                
                <Button onClick={handleSaveSettings}>Save Settings</Button>
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

        {/* Progress towards daily goal */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Daily Goal</span>
            <span className="font-medium text-foreground">
              {sessions}/{preferences.streakSettings.dailyGoal}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((sessions / preferences.streakSettings.dailyGoal) * 100, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
