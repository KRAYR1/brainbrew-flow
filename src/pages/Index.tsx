import { Layout } from "@/components/layout/Layout";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { StreakTracker } from "@/components/StreakTracker";
import { motion } from "framer-motion";
import { BookOpen, FileText, Calendar, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const quickActions = [
  { icon: FileText, label: "New Note", path: "/notes", color: "bg-primary/10 text-primary" },
  { icon: BookOpen, label: "Add Assignment", path: "/assignments", color: "bg-accent/10 text-accent" },
  { icon: Calendar, label: "View Calendar", path: "/calendar", color: "bg-success/10 text-success" },
];

const stats = [
  { label: "Tasks Completed", value: "24", change: "+12%", icon: TrendingUp },
  { label: "Study Hours", value: "18.5h", change: "+8%", icon: TrendingUp },
  { label: "Notes Created", value: "12", change: "+5", icon: TrendingUp },
];

const Index = () => {
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
        className="space-y-6"
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
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="rounded-xl bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <span className="flex items-center gap-1 text-xs text-success">
                  <stat.icon className="h-3 w-3" />
                  {stat.change}
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Pomodoro Timer */}
          <motion.div variants={itemVariants}>
            <PomodoroTimer />
          </motion.div>

          {/* Streak Tracker */}
          <motion.div variants={itemVariants}>
            <StreakTracker />
          </motion.div>
        </div>

        {/* Quick Actions */}
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
      </motion.div>
    </Layout>
  );
};

export default Index;
