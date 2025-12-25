import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Check, Trophy } from "lucide-react";

interface DayStreak {
  date: Date;
  completed: boolean;
}

export function StreakTracker() {
  const [streak, setStreak] = useState(7);
  const [todayCompleted, setTodayCompleted] = useState(false);

  // Generate last 7 days
  const last7Days: DayStreak[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date,
      completed: i < 6 ? true : todayCompleted, // Last 6 days completed, today depends on state
    };
  });

  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  const handleMarkComplete = () => {
    if (!todayCompleted) {
      setTodayCompleted(true);
      setStreak((prev) => prev + 1);
    }
  };

  return (
    <div className="rounded-2xl bg-card p-6 shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Streak Tracker</h2>
        <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1">
          <Flame className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-accent">{streak}</span>
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
          <span className="text-sm text-muted-foreground">Progress to 30 days</span>
          <span className="text-sm font-medium text-foreground">{streak}/30</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${(streak / 30) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Next milestone */}
      <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
          <Trophy className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Next milestone: 14 days</p>
          <p className="text-xs text-muted-foreground">{14 - streak} days to go!</p>
        </div>
      </div>

      {/* Mark complete button */}
      {!todayCompleted && (
        <button
          onClick={handleMarkComplete}
          className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
        >
          Mark Today Complete
        </button>
      )}
    </div>
  );
}
