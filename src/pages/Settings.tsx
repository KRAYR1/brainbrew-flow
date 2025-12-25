import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import {
  Clock,
  Palette,
  Target,
  Quote,
  LayoutDashboard,
  RotateCcw,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useToast } from "@/hooks/use-toast";

const accentColors = [
  { name: "Indigo", value: "indigo", class: "bg-indigo-500" },
  { name: "Blue", value: "blue", class: "bg-blue-500" },
  { name: "Purple", value: "purple", class: "bg-purple-500" },
  { name: "Pink", value: "pink", class: "bg-pink-500" },
  { name: "Rose", value: "rose", class: "bg-rose-500" },
  { name: "Orange", value: "orange", class: "bg-orange-500" },
  { name: "Amber", value: "amber", class: "bg-amber-500" },
  { name: "Emerald", value: "emerald", class: "bg-emerald-500" },
  { name: "Teal", value: "teal", class: "bg-teal-500" },
  { name: "Cyan", value: "cyan", class: "bg-cyan-500" },
];

const Settings = () => {
  const {
    preferences,
    updateTimerSettings,
    updateAppearance,
    updateStreakSettings,
    updateDashboardWidgets,
    addCustomQuote,
    removeCustomQuote,
    resetToDefaults,
  } = usePreferences();
  const { toast } = useToast();
  const [newQuote, setNewQuote] = useState({ text: "", author: "" });

  const handleAddQuote = () => {
    if (!newQuote.text.trim()) {
      toast({ title: "Please enter a quote", variant: "destructive" });
      return;
    }
    addCustomQuote({
      text: newQuote.text.trim(),
      author: newQuote.author.trim() || "Unknown",
    });
    setNewQuote({ text: "", author: "" });
    toast({ title: "Quote added!" });
  };

  const handleReset = () => {
    resetToDefaults();
    toast({ title: "Settings reset to defaults" });
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-4xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Customize your BrainBrew experience</p>
          </div>
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Timer Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Timer Settings
              </CardTitle>
              <CardDescription>
                Configure your Pomodoro timer durations and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Work Duration</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[preferences.timerSettings.work]}
                      onValueChange={([value]) => updateTimerSettings({ work: value })}
                      min={5}
                      max={60}
                      step={5}
                      className="flex-1"
                    />
                    <span className="w-12 text-right text-sm font-medium text-foreground">
                      {preferences.timerSettings.work}m
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Short Break</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[preferences.timerSettings.shortBreak]}
                      onValueChange={([value]) => updateTimerSettings({ shortBreak: value })}
                      min={1}
                      max={15}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-12 text-right text-sm font-medium text-foreground">
                      {preferences.timerSettings.shortBreak}m
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Long Break</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[preferences.timerSettings.longBreak]}
                      onValueChange={([value]) => updateTimerSettings({ longBreak: value })}
                      min={5}
                      max={30}
                      step={5}
                      className="flex-1"
                    />
                    <span className="w-12 text-right text-sm font-medium text-foreground">
                      {preferences.timerSettings.longBreak}m
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-start Breaks</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically start break timer after work session
                    </p>
                  </div>
                  <Switch
                    checked={preferences.timerSettings.autoStartBreaks}
                    onCheckedChange={(checked) =>
                      updateTimerSettings({ autoStartBreaks: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-start Pomodoros</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically start work timer after break
                    </p>
                  </div>
                  <Switch
                    checked={preferences.timerSettings.autoStartPomodoros}
                    onCheckedChange={(checked) =>
                      updateTimerSettings({ autoStartPomodoros: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Appearance
              </CardTitle>
              <CardDescription>Personalize how BrainBrew looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Accent Color</Label>
                <div className="flex flex-wrap gap-3">
                  {accentColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => updateAppearance({ accentColor: color.value })}
                      className={`group relative h-10 w-10 rounded-full transition-all ${color.class} ${
                        preferences.appearance.accentColor === color.value
                          ? "ring-2 ring-offset-2 ring-foreground scale-110"
                          : "hover:scale-105"
                      }`}
                      title={color.name}
                    >
                      {preferences.appearance.accentColor === color.value && (
                        <Check className="absolute inset-0 m-auto h-5 w-5 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <Label>Show Motivational Quotes</Label>
                  <p className="text-sm text-muted-foreground">
                    Display inspiring quotes in the corner
                  </p>
                </div>
                <Switch
                  checked={preferences.appearance.showMotivationalQuotes}
                  onCheckedChange={(checked) =>
                    updateAppearance({ showMotivationalQuotes: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce spacing for more content visibility
                  </p>
                </div>
                <Switch
                  checked={preferences.appearance.compactMode}
                  onCheckedChange={(checked) => updateAppearance({ compactMode: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Streak Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Streak Goals
              </CardTitle>
              <CardDescription>Set your daily productivity targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Daily Pomodoro Goal</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[preferences.streakSettings.dailyGoal]}
                    onValueChange={([value]) => updateStreakSettings({ dailyGoal: value })}
                    min={1}
                    max={12}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-20 text-right text-sm font-medium text-foreground">
                    {preferences.streakSettings.dailyGoal} pomodoros
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Complete this many pomodoros each day to maintain your streak
                </p>
              </div>
              <div className="flex gap-4 pt-4 border-t">
                <div className="flex-1 rounded-lg bg-muted p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {preferences.streakSettings.currentStreak}
                  </p>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                </div>
                <div className="flex-1 rounded-lg bg-muted p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {preferences.streakSettings.longestStreak}
                  </p>
                  <p className="text-sm text-muted-foreground">Longest Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Widgets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-primary" />
                Dashboard Widgets
              </CardTitle>
              <CardDescription>Choose which widgets to show on your dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <Label>Pomodoro Timer</Label>
                  <Switch
                    checked={preferences.dashboardWidgets.showTimer}
                    onCheckedChange={(checked) =>
                      updateDashboardWidgets({ showTimer: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <Label>Streak Tracker</Label>
                  <Switch
                    checked={preferences.dashboardWidgets.showStreak}
                    onCheckedChange={(checked) =>
                      updateDashboardWidgets({ showStreak: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <Label>Statistics</Label>
                  <Switch
                    checked={preferences.dashboardWidgets.showStats}
                    onCheckedChange={(checked) =>
                      updateDashboardWidgets({ showStats: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <Label>Quick Actions</Label>
                  <Switch
                    checked={preferences.dashboardWidgets.showQuickActions}
                    onCheckedChange={(checked) =>
                      updateDashboardWidgets({ showQuickActions: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Quotes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Quote className="h-5 w-5 text-primary" />
                Custom Quotes
              </CardTitle>
              <CardDescription>Add your own motivational quotes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new quote form */}
              <div className="space-y-3 rounded-lg border border-dashed p-4">
                <Textarea
                  placeholder="Enter your inspirational quote..."
                  value={newQuote.text}
                  onChange={(e) => setNewQuote({ ...newQuote, text: e.target.value })}
                  rows={2}
                />
                <div className="flex gap-3">
                  <Input
                    placeholder="Author (optional)"
                    value={newQuote.author}
                    onChange={(e) => setNewQuote({ ...newQuote, author: e.target.value })}
                    className="flex-1"
                  />
                  <Button onClick={handleAddQuote} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Quote
                  </Button>
                </div>
              </div>

              {/* Existing quotes */}
              {preferences.customQuotes.length > 0 && (
                <div className="space-y-2">
                  <Label>Your Quotes</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {preferences.customQuotes.map((quote, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-3 rounded-lg bg-muted p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">"{quote.text}"</p>
                          <p className="text-xs text-muted-foreground mt-1">— {quote.author}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => removeCustomQuote(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              {preferences.customQuotes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No custom quotes yet. Add your first one above!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Settings;
