import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Check, Trophy, Target } from "lucide-react";
import { usePreferences } from "@/contexts/PreferencesContext";

interface DayStreak {
  date: Date;
  completed: boolean;
}

export function StreakTracker() {
  const { preferences, updateStreakSettings } = usePreferences();
  const { streakSettings } = preferences;
  const [todayCompleted, setTodayCompleted] = useState(
    streakSettings.lastActiveDate === new Date().toDateString()
  );

  // Generate last 7 days
  const last7Days: DayStreak[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toDateString();
    const isToday = i === 6;
    return {
      date,
      completed: isToday ? todayCompleted : i < 6 && streakSettings.currentStreak > (6 - i),
    };
  });

  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  const handleMarkComplete = () => {
    if (!todayCompleted) {
      setTodayCompleted(true);
      const newStreak = streakSettings.currentStreak + 1;
      updateStreakSettings({
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streakSettings.longestStreak),
        lastActiveDate: new Date().toDateString(),
      });
    }
  };

  const progressToNextMilestone = () => {
    const milestones = [7, 14, 30, 60, 100, 365];
    const nextMilestone = milestones.find((m) => m > streakSettings.currentStreak) || 365;
    return {
      next: nextMilestone,
      progress: (streakSettings.currentStreak / nextMilestone) * 100,
      remaining: nextMilestone - streakSettings.currentStreak,
    };
  };

  const milestone = progressToNextMilestone();

  return (
    <div className="rounded-2xl bg-card p-6 shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Streak Tracker</h2>
        <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1">
          <Flame className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-accent">{streakSettings.currentStreak}</span>
        </div>
      </div>

      {/* Week view */}
      <div className="mb-6 flex justify-between gap-2">
        {last7Days.map((day, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {dayNames[day.date.getDay()]}
            </span>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                day.completed
                  ? "bg-success text-success-foreground"
                  : "border-2 border-dashed border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              {day.completed ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-xs">{day.date.getDate()}</span>
              )}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Progress to {milestone.next} days</span>
          <span className="text-sm font-medium text-foreground">
            {streakSettings.currentStreak}/{milestone.next}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${milestone.progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
            <Trophy className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{streakSettings.longestStreak}</p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{streakSettings.dailyGoal}</p>
            <p className="text-xs text-muted-foreground">Daily Goal</p>
          </div>
        </div>
      </div>

      {/* Mark complete button */}
      {!todayCompleted && (
        <button
          onClick={handleMarkComplete}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
        >
          Mark Today Complete
        </button>
      )}
      {todayCompleted && (
        <div className="text-center py-2.5 text-sm font-medium text-success">
          ✓ Today's goal completed!
        </div>
      )}
    </div>
  );
}
