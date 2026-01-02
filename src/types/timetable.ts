export interface TimeSlot {
  id: string;
  startTime: string; // HH:mm format
  endTime: string;
  activity: "study" | "break" | "meal" | "sleep" | "free" | "exercise";
  subject?: string;
  label?: string;
}

export interface DailyRoutine {
  wakeUpTime: string;
  sleepTime: string;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  exerciseTime?: string;
  studyHoursPerDay: number;
  preferredStudyTime: "morning" | "afternoon" | "evening" | "night";
}

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface WeeklySchedule {
  [key: string]: TimeSlot[]; // DayOfWeek -> TimeSlot[]
}

export interface StudyTimetable {
  id: string;
  name: string;
  routine: DailyRoutine;
  subjects: string[];
  generatedSlots: TimeSlot[]; // Legacy single-day
  weeklySchedule?: WeeklySchedule; // New weekly schedule
  activeDays: DayOfWeek[];
  createdAt: string;
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export const DAY_FULL_LABELS: Record<DayOfWeek, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};
