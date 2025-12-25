import { Layout } from "@/components/layout/Layout";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { StreakTracker } from "@/components/StreakTracker";
import { motion } from "framer-motion";
import { BookOpen, FileText, Calendar, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Note, Assignment } from "@/types";

const quickActions = [
  { icon: FileText, label: "New Note", path: "/notes", color: "bg-primary/10 text-primary" },
  { icon: BookOpen, label: "Add Assignment", path: "/assignments", color: "bg-accent/10 text-accent" },
  { icon: Calendar, label: "View Calendar", path: "/calendar", color: "bg-success/10 text-success" },
];

const Index = () => {
  const { preferences } = usePreferences();
  const { dashboardWidgets } = preferences;
  const [notes] = useLocalStorage<Note[]>("brainbrew-notes", []);
  const [assignments] = useLocalStorage<Assignment[]>("brainbrew-assignments", []);

  const completedAssignments = assignments.filter((a) => a.completed).length;
  const pendingAssignments = assignments.filter((a) => !a.completed).length;

  const stats = [
    { label: "Notes Created", value: notes.length.toString(), change: `${notes.length} total`, icon: FileText },
    { label: "Tasks Completed", value: completedAssignments.toString(), change: `${pendingAssignments} pending`, icon: TrendingUp },
    { label: "Current Streak", value: `${preferences.streakSettings.currentStreak}d`, change: `Best: ${preferences.streakSettings.longestStreak}d`, icon: TrendingUp },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`space-y-6 ${preferences.appearance.compactMode ? 'space-y-4' : ''}`}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Let's make today productive.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        {dashboardWidgets.showStats && (
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="rounded-xl bg-card p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Pomodoro Timer */}
          {dashboardWidgets.showTimer && (
            <motion.div variants={itemVariants}>
              <PomodoroTimer />
            </motion.div>
          )}

          {/* Streak Tracker */}
          {dashboardWidgets.showStreak && (
            <motion.div variants={itemVariants}>
              <StreakTracker />
            </motion.div>
          )}
        </div>

        {/* Quick Actions */}
        {dashboardWidgets.showQuickActions && (
          <motion.div variants={itemVariants}>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.path}
                  className="group flex items-center gap-3 rounded-xl bg-card p-4 shadow-card transition-all hover:shadow-card-hover"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state if all widgets hidden */}
        {!dashboardWidgets.showTimer && !dashboardWidgets.showStreak && !dashboardWidgets.showStats && !dashboardWidgets.showQuickActions && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">All widgets are hidden.</p>
            <Link to="/settings" className="mt-2 text-primary hover:underline">
              Go to Settings to enable widgets
            </Link>
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Index;
