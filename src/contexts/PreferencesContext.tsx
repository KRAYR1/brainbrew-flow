import { createContext, useContext, ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export interface UserPreferences {
  // Timer settings
  timerSettings: {
    work: number;
    shortBreak: number;
    longBreak: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
  };
  // Appearance
  appearance: {
    accentColor: string;
    showMotivationalQuotes: boolean;
    compactMode: boolean;
  };
  // Streak settings
  streakSettings: {
    dailyGoal: number; // pomodoros per day
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string;
  };
  // Custom quotes
  customQuotes: Array<{ text: string; author: string }>;
  // Dashboard widgets
  dashboardWidgets: {
    showTimer: boolean;
    showStreak: boolean;
    showStats: boolean;
    showQuickActions: boolean;
  };
}

const defaultPreferences: UserPreferences = {
  timerSettings: {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    autoStartBreaks: false,
    autoStartPomodoros: false,
  },
  appearance: {
    accentColor: "indigo",
    showMotivationalQuotes: true,
    compactMode: false,
  },
  streakSettings: {
    dailyGoal: 4,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: "",
  },
  customQuotes: [],
  dashboardWidgets: {
    showTimer: true,
    showStreak: true,
    showStats: true,
    showQuickActions: true,
  },
};

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  updateTimerSettings: (updates: Partial<UserPreferences["timerSettings"]>) => void;
  updateAppearance: (updates: Partial<UserPreferences["appearance"]>) => void;
  updateStreakSettings: (updates: Partial<UserPreferences["streakSettings"]>) => void;
  updateDashboardWidgets: (updates: Partial<UserPreferences["dashboardWidgets"]>) => void;
  addCustomQuote: (quote: { text: string; author: string }) => void;
  removeCustomQuote: (index: number) => void;
  resetToDefaults: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useLocalStorage<UserPreferences>(
    "brainbrew-preferences",
    defaultPreferences
  );

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const updateTimerSettings = (updates: Partial<UserPreferences["timerSettings"]>) => {
    setPreferences((prev) => ({
      ...prev,
      timerSettings: { ...prev.timerSettings, ...updates },
    }));
  };

  const updateAppearance = (updates: Partial<UserPreferences["appearance"]>) => {
    setPreferences((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, ...updates },
    }));
  };

  const updateStreakSettings = (updates: Partial<UserPreferences["streakSettings"]>) => {
    setPreferences((prev) => ({
      ...prev,
      streakSettings: { ...prev.streakSettings, ...updates },
    }));
  };

  const updateDashboardWidgets = (updates: Partial<UserPreferences["dashboardWidgets"]>) => {
    setPreferences((prev) => ({
      ...prev,
      dashboardWidgets: { ...prev.dashboardWidgets, ...updates },
    }));
  };

  const addCustomQuote = (quote: { text: string; author: string }) => {
    setPreferences((prev) => ({
      ...prev,
      customQuotes: [...prev.customQuotes, quote],
    }));
  };

  const removeCustomQuote = (index: number) => {
    setPreferences((prev) => ({
      ...prev,
      customQuotes: prev.customQuotes.filter((_, i) => i !== index),
    }));
  };

  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        updatePreferences,
        updateTimerSettings,
        updateAppearance,
        updateStreakSettings,
        updateDashboardWidgets,
        addCustomQuote,
        removeCustomQuote,
        resetToDefaults,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
