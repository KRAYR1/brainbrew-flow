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

export interface StudyTimetable {
  id: string;
  name: string;
  routine: DailyRoutine;
  subjects: string[];
  generatedSlots: TimeSlot[];
  createdAt: string;
}
