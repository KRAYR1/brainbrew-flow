import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  Sun, 
  Moon, 
  Coffee, 
  Utensils, 
  BookOpen, 
  Dumbbell,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Trash2,
  Edit2,
  Plus,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useToast } from "@/hooks/use-toast";
import { Subject } from "@/types";
import { 
  DailyRoutine, 
  StudyTimetable, 
  TimeSlot, 
  DayOfWeek, 
  DAYS_OF_WEEK, 
  DAY_LABELS, 
  DAY_FULL_LABELS,
  WeeklySchedule 
} from "@/types/timetable";

const defaultSubjects: Subject[] = [
  { id: "1", name: "Mathematics", color: "bg-blue-500" },
  { id: "2", name: "Physics", color: "bg-purple-500" },
  { id: "3", name: "Chemistry", color: "bg-green-500" },
  { id: "4", name: "Biology", color: "bg-orange-500" },
  { id: "5", name: "English", color: "bg-pink-500" },
  { id: "6", name: "History", color: "bg-yellow-500" },
  { id: "7", name: "Computer Science", color: "bg-indigo-500" },
];

const defaultRoutine: DailyRoutine = {
  wakeUpTime: "06:00",
  sleepTime: "22:00",
  breakfastTime: "07:00",
  lunchTime: "12:30",
  dinnerTime: "19:00",
  exerciseTime: "17:00",
  studyHoursPerDay: 6,
  preferredStudyTime: "morning",
};

const activityIcons: Record<string, React.ReactNode> = {
  study: <BookOpen className="h-4 w-4" />,
  break: <Coffee className="h-4 w-4" />,
  meal: <Utensils className="h-4 w-4" />,
  sleep: <Moon className="h-4 w-4" />,
  free: <Sun className="h-4 w-4" />,
  exercise: <Dumbbell className="h-4 w-4" />,
};

const activityColors: Record<string, string> = {
  study: "bg-primary/20 border-primary/30 text-primary",
  break: "bg-success/20 border-success/30 text-success",
  meal: "bg-warning/20 border-warning/30 text-warning",
  sleep: "bg-muted border-border text-muted-foreground",
  free: "bg-accent/20 border-accent/30 text-accent",
  exercise: "bg-destructive/20 border-destructive/30 text-destructive",
};

const Timetable = () => {
  const [subjects] = useLocalStorage<Subject[]>("brainbrew-subjects", defaultSubjects);
  const [timetables, setTimetables] = useLocalStorage<StudyTimetable[]>("brainbrew-timetables", []);
  const [routine, setRoutine] = useState<DailyRoutine>(defaultRoutine);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(["monday", "tuesday", "wednesday", "thursday", "friday"]);
  const [timetableName, setTimetableName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditSlotDialogOpen, setIsEditSlotDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{ day: DayOfWeek; slot: TimeSlot } | null>(null);
  const [activeTimetable, setActiveTimetable] = useState<StudyTimetable | null>(
    timetables.length > 0 ? timetables[0] : null
  );
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("monday");
  const [viewMode, setViewMode] = useState<"day" | "week">("week");
  const { toast } = useToast();

  const parseTime = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const formatTimeFromMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const generateDaySlots = (daySubjects: string[]): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    let currentTime = parseTime(routine.wakeUpTime);
    const sleepTime = parseTime(routine.sleepTime);
    const breakfastTime = parseTime(routine.breakfastTime);
    const lunchTime = parseTime(routine.lunchTime);
    const dinnerTime = parseTime(routine.dinnerTime);
    const exerciseTime = routine.exerciseTime ? parseTime(routine.exerciseTime) : null;

    const mealDuration = 30;
    const breakDuration = 15;
    const exerciseDuration = 60;
    const studySessionDuration = 50;
    
    let studyMinutesRemaining = routine.studyHoursPerDay * 60;
    let subjectIndex = 0;

    const fixedEvents: Array<{ time: number; duration: number; type: TimeSlot["activity"]; label: string }> = [
      { time: breakfastTime, duration: mealDuration, type: "meal", label: "Breakfast" },
      { time: lunchTime, duration: mealDuration, type: "meal", label: "Lunch" },
      { time: dinnerTime, duration: mealDuration, type: "meal", label: "Dinner" },
    ];

    if (exerciseTime) {
      fixedEvents.push({ time: exerciseTime, duration: exerciseDuration, type: "exercise", label: "Exercise" });
    }

    fixedEvents.sort((a, b) => a.time - b.time);

    while (currentTime < sleepTime) {
      const nextEvent = fixedEvents.find(e => e.time >= currentTime && e.time < currentTime + 60);
      
      if (nextEvent && currentTime <= nextEvent.time) {
        if (nextEvent.time > currentTime) {
          const gapDuration = nextEvent.time - currentTime;
          if (gapDuration >= studySessionDuration && studyMinutesRemaining > 0 && daySubjects.length > 0) {
            const subject = daySubjects[subjectIndex % daySubjects.length];
            slots.push({
              id: Date.now().toString() + Math.random(),
              startTime: formatTimeFromMinutes(currentTime),
              endTime: formatTimeFromMinutes(currentTime + studySessionDuration),
              activity: "study",
              subject,
            });
            currentTime += studySessionDuration;
            studyMinutesRemaining -= studySessionDuration;
            subjectIndex++;

            if (currentTime + breakDuration <= nextEvent.time) {
              slots.push({
                id: Date.now().toString() + Math.random(),
                startTime: formatTimeFromMinutes(currentTime),
                endTime: formatTimeFromMinutes(currentTime + breakDuration),
                activity: "break",
                label: "Short Break",
              });
              currentTime += breakDuration;
            }
          } else if (gapDuration > 0) {
            slots.push({
              id: Date.now().toString() + Math.random(),
              startTime: formatTimeFromMinutes(currentTime),
              endTime: formatTimeFromMinutes(nextEvent.time),
              activity: "free",
              label: "Free Time",
            });
            currentTime = nextEvent.time;
          }
        }

        slots.push({
          id: Date.now().toString() + Math.random(),
          startTime: formatTimeFromMinutes(nextEvent.time),
          endTime: formatTimeFromMinutes(nextEvent.time + nextEvent.duration),
          activity: nextEvent.type,
          label: nextEvent.label,
        });
        currentTime = nextEvent.time + nextEvent.duration;
        fixedEvents.splice(fixedEvents.indexOf(nextEvent), 1);
      } else if (studyMinutesRemaining > 0 && currentTime + studySessionDuration <= sleepTime && daySubjects.length > 0) {
        const subject = daySubjects[subjectIndex % daySubjects.length];
        slots.push({
          id: Date.now().toString() + Math.random(),
          startTime: formatTimeFromMinutes(currentTime),
          endTime: formatTimeFromMinutes(currentTime + studySessionDuration),
          activity: "study",
          subject,
        });
        currentTime += studySessionDuration;
        studyMinutesRemaining -= studySessionDuration;
        subjectIndex++;

        if (currentTime + breakDuration <= sleepTime && studyMinutesRemaining > 0) {
          slots.push({
            id: Date.now().toString() + Math.random(),
            startTime: formatTimeFromMinutes(currentTime),
            endTime: formatTimeFromMinutes(currentTime + breakDuration),
            activity: "break",
            label: "Short Break",
          });
          currentTime += breakDuration;
        }
      } else {
        const nextFixedEvent = fixedEvents[0];
        const endTime = nextFixedEvent ? Math.min(nextFixedEvent.time, sleepTime) : sleepTime;
        
        if (endTime > currentTime) {
          slots.push({
            id: Date.now().toString() + Math.random(),
            startTime: formatTimeFromMinutes(currentTime),
            endTime: formatTimeFromMinutes(endTime),
            activity: "free",
            label: "Free Time",
          });
          currentTime = endTime;
        } else {
          break;
        }
      }
    }
    return slots;
  };

  const generateTimetable = () => {
    if (selectedSubjects.length === 0) {
      toast({ title: "Please select at least one subject", variant: "destructive" });
      return;
    }

    if (!timetableName.trim()) {
      toast({ title: "Please enter a name for your timetable", variant: "destructive" });
      return;
    }

    if (selectedDays.length === 0) {
      toast({ title: "Please select at least one day", variant: "destructive" });
      return;
    }

    const weeklySchedule: WeeklySchedule = {};
    selectedDays.forEach(day => {
      weeklySchedule[day] = generateDaySlots(selectedSubjects);
    });

    const newTimetable: StudyTimetable = {
      id: Date.now().toString(),
      name: timetableName,
      routine,
      subjects: selectedSubjects,
      generatedSlots: weeklySchedule[selectedDays[0]] || [],
      weeklySchedule,
      activeDays: selectedDays,
      createdAt: new Date().toISOString(),
    };

    setTimetables([newTimetable, ...timetables]);
    setActiveTimetable(newTimetable);
    setIsCreateDialogOpen(false);
    setTimetableName("");
    setSelectedSubjects([]);
    setSelectedDays(["monday", "tuesday", "wednesday", "thursday", "friday"]);
    toast({ title: "Weekly timetable generated!" });
  };

  const deleteTimetable = (id: string) => {
    const updated = timetables.filter(t => t.id !== id);
    setTimetables(updated);
    if (activeTimetable?.id === id) {
      setActiveTimetable(updated[0] || null);
    }
    toast({ title: "Timetable deleted" });
  };

  const updateSlot = (day: DayOfWeek, slotId: string, updates: Partial<TimeSlot>) => {
    if (!activeTimetable?.weeklySchedule) return;

    const updatedSchedule = { ...activeTimetable.weeklySchedule };
    updatedSchedule[day] = updatedSchedule[day].map(slot => 
      slot.id === slotId ? { ...slot, ...updates } : slot
    );

    const updatedTimetable = { ...activeTimetable, weeklySchedule: updatedSchedule };
    setActiveTimetable(updatedTimetable);
    setTimetables(timetables.map(t => t.id === updatedTimetable.id ? updatedTimetable : t));
  };

  const deleteSlot = (day: DayOfWeek, slotId: string) => {
    if (!activeTimetable?.weeklySchedule) return;

    const updatedSchedule = { ...activeTimetable.weeklySchedule };
    updatedSchedule[day] = updatedSchedule[day].filter(slot => slot.id !== slotId);

    const updatedTimetable = { ...activeTimetable, weeklySchedule: updatedSchedule };
    setActiveTimetable(updatedTimetable);
    setTimetables(timetables.map(t => t.id === updatedTimetable.id ? updatedTimetable : t));
    toast({ title: "Slot deleted" });
  };

  const addSlot = (day: DayOfWeek) => {
    if (!activeTimetable?.weeklySchedule) return;

    const newSlot: TimeSlot = {
      id: Date.now().toString() + Math.random(),
      startTime: "09:00",
      endTime: "09:50",
      activity: "study",
      subject: selectedSubjects[0] || subjects[0]?.name || "Study",
    };

    const updatedSchedule = { ...activeTimetable.weeklySchedule };
    updatedSchedule[day] = [...(updatedSchedule[day] || []), newSlot];

    const updatedTimetable = { ...activeTimetable, weeklySchedule: updatedSchedule };
    setActiveTimetable(updatedTimetable);
    setTimetables(timetables.map(t => t.id === updatedTimetable.id ? updatedTimetable : t));
    toast({ title: "Slot added" });
  };

  const getSubjectColor = (subjectName: string) => {
    const subject = subjects.find((s) => s.name === subjectName);
    return subject?.color || "bg-gray-500";
  };

  const getDaySlots = (day: DayOfWeek): TimeSlot[] => {
    if (!activeTimetable) return [];
    return activeTimetable.weeklySchedule?.[day] || activeTimetable.generatedSlots || [];
  };

  const openEditSlotDialog = (day: DayOfWeek, slot: TimeSlot) => {
    setEditingSlot({ day, slot: { ...slot } });
    setIsEditSlotDialogOpen(true);
  };

  const saveEditedSlot = () => {
    if (!editingSlot) return;
    updateSlot(editingSlot.day, editingSlot.slot.id, editingSlot.slot);
    setIsEditSlotDialogOpen(false);
    setEditingSlot(null);
    toast({ title: "Slot updated" });
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Study Timetable</h1>
            <p className="text-muted-foreground">Create a personalized weekly study schedule</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Timetable
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Your Weekly Timetable</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Timetable Name */}
                <div className="space-y-2">
                  <Label>Timetable Name</Label>
                  <Input
                    placeholder="e.g., Weekday Schedule, Exam Prep..."
                    value={timetableName}
                    onChange={(e) => setTimetableName(e.target.value)}
                  />
                </div>

                {/* Day Selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Active Days
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <label
                        key={day}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 cursor-pointer transition-all ${
                          selectedDays.includes(day)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Checkbox
                          checked={selectedDays.includes(day)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDays([...selectedDays, day]);
                            } else {
                              setSelectedDays(selectedDays.filter((d) => d !== day));
                            }
                          }}
                        />
                        <span className="text-sm font-medium">{DAY_FULL_LABELS[day]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Daily Routine */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Daily Routine
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Wake Up Time</Label>
                      <Input
                        type="time"
                        value={routine.wakeUpTime}
                        onChange={(e) => setRoutine({ ...routine, wakeUpTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sleep Time</Label>
                      <Input
                        type="time"
                        value={routine.sleepTime}
                        onChange={(e) => setRoutine({ ...routine, sleepTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Breakfast Time</Label>
                      <Input
                        type="time"
                        value={routine.breakfastTime}
                        onChange={(e) => setRoutine({ ...routine, breakfastTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Lunch Time</Label>
                      <Input
                        type="time"
                        value={routine.lunchTime}
                        onChange={(e) => setRoutine({ ...routine, lunchTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dinner Time</Label>
                      <Input
                        type="time"
                        value={routine.dinnerTime}
                        onChange={(e) => setRoutine({ ...routine, dinnerTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Exercise Time (Optional)</Label>
                      <Input
                        type="time"
                        value={routine.exerciseTime || ""}
                        onChange={(e) => setRoutine({ ...routine, exerciseTime: e.target.value || undefined })}
                      />
                    </div>
                  </div>
                </div>

                {/* Study Preferences */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Study Preferences
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Study Hours Per Day: {routine.studyHoursPerDay} hours</Label>
                      <Slider
                        value={[routine.studyHoursPerDay]}
                        onValueChange={([value]) => setRoutine({ ...routine, studyHoursPerDay: value })}
                        min={1}
                        max={12}
                        step={0.5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred Study Time</Label>
                      <Select
                        value={routine.preferredStudyTime}
                        onValueChange={(value: DailyRoutine["preferredStudyTime"]) =>
                          setRoutine({ ...routine, preferredStudyTime: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning (6 AM - 12 PM)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                          <SelectItem value="evening">Evening (5 PM - 9 PM)</SelectItem>
                          <SelectItem value="night">Night (9 PM onwards)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Subject Selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Select Subjects to Study</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {subjects.map((subject) => (
                      <label
                        key={subject.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                          selectedSubjects.includes(subject.name)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Checkbox
                          checked={selectedSubjects.includes(subject.name)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSubjects([...selectedSubjects, subject.name]);
                            } else {
                              setSelectedSubjects(selectedSubjects.filter((s) => s !== subject.name));
                            }
                          }}
                        />
                        <div className={`h-3 w-3 rounded-full ${subject.color}`} />
                        <span className="text-sm font-medium">{subject.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button onClick={generateTimetable} className="w-full gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Weekly Timetable
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Saved Timetables */}
        {timetables.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {timetables.map((tt) => (
              <button
                key={tt.id}
                onClick={() => setActiveTimetable(tt)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                  activeTimetable?.id === tt.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-muted"
                }`}
              >
                <Calendar className="h-4 w-4" />
                {tt.name}
              </button>
            ))}
          </div>
        )}

        {/* Edit Slot Dialog */}
        <Dialog open={isEditSlotDialogOpen} onOpenChange={setIsEditSlotDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Time Slot</DialogTitle>
            </DialogHeader>
            {editingSlot && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={editingSlot.slot.startTime}
                      onChange={(e) => setEditingSlot({
                        ...editingSlot,
                        slot: { ...editingSlot.slot, startTime: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={editingSlot.slot.endTime}
                      onChange={(e) => setEditingSlot({
                        ...editingSlot,
                        slot: { ...editingSlot.slot, endTime: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Activity</Label>
                  <Select
                    value={editingSlot.slot.activity}
                    onValueChange={(value: TimeSlot["activity"]) => setEditingSlot({
                      ...editingSlot,
                      slot: { ...editingSlot.slot, activity: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="study">Study</SelectItem>
                      <SelectItem value="break">Break</SelectItem>
                      <SelectItem value="meal">Meal</SelectItem>
                      <SelectItem value="exercise">Exercise</SelectItem>
                      <SelectItem value="free">Free Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editingSlot.slot.activity === "study" && (
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select
                      value={editingSlot.slot.subject || ""}
                      onValueChange={(value) => setEditingSlot({
                        ...editingSlot,
                        slot: { ...editingSlot.slot, subject: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.name}>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${subject.color}`} />
                              {subject.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {editingSlot.slot.activity !== "study" && (
                  <div className="space-y-2">
                    <Label>Label</Label>
                    <Input
                      value={editingSlot.slot.label || ""}
                      onChange={(e) => setEditingSlot({
                        ...editingSlot,
                        slot: { ...editingSlot.slot, label: e.target.value }
                      })}
                      placeholder="e.g., Lunch, Short Break..."
                    />
                  </div>
                )}
                <Button onClick={saveEditedSlot} className="w-full">Save Changes</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Active Timetable Display */}
        {activeTimetable ? (
          <motion.div
            key={activeTimetable.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader className="flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-lg">{activeTimetable.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeTimetable.subjects.length} subjects • {activeTimetable.routine.studyHoursPerDay}h study time • {activeTimetable.activeDays?.length || 1} days
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg bg-muted p-1">
                    <button
                      onClick={() => setViewMode("day")}
                      className={`px-3 py-1 text-sm rounded-md transition-all ${
                        viewMode === "day" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      Day
                    </button>
                    <button
                      onClick={() => setViewMode("week")}
                      className={`px-3 py-1 text-sm rounded-md transition-all ${
                        viewMode === "week" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      Week
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteTimetable(activeTimetable.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === "day" ? (
                  <>
                    {/* Day Selector */}
                    <div className="flex items-center justify-between mb-4">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          const activeDays = activeTimetable.activeDays || DAYS_OF_WEEK;
                          const currentIndex = activeDays.indexOf(selectedDay);
                          const prevIndex = currentIndex > 0 ? currentIndex - 1 : activeDays.length - 1;
                          setSelectedDay(activeDays[prevIndex]);
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex gap-2">
                        {(activeTimetable.activeDays || DAYS_OF_WEEK).map((day) => (
                          <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-all ${
                              selectedDay === day
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {DAY_LABELS[day]}
                          </button>
                        ))}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          const activeDays = activeTimetable.activeDays || DAYS_OF_WEEK;
                          const currentIndex = activeDays.indexOf(selectedDay);
                          const nextIndex = currentIndex < activeDays.length - 1 ? currentIndex + 1 : 0;
                          setSelectedDay(activeDays[nextIndex]);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Day View Slots */}
                    <div className="space-y-2">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={selectedDay}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-2"
                        >
                          {getDaySlots(selectedDay).map((slot, index) => (
                            <motion.div
                              key={slot.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className={`group flex items-center gap-4 rounded-lg border p-3 ${activityColors[slot.activity]}`}
                            >
                              <div className="flex items-center gap-2 w-32 shrink-0">
                                <span className="text-sm font-mono font-medium">{slot.startTime}</span>
                                <ChevronRight className="h-3 w-3 opacity-50" />
                                <span className="text-sm font-mono font-medium">{slot.endTime}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-1">
                                {activityIcons[slot.activity]}
                                {slot.activity === "study" && slot.subject ? (
                                  <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${getSubjectColor(slot.subject)}`} />
                                    <span className="font-medium">{slot.subject}</span>
                                  </div>
                                ) : (
                                  <span className="font-medium capitalize">{slot.label || slot.activity}</span>
                                )}
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => openEditSlotDialog(selectedDay, slot)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => deleteSlot(selectedDay, slot.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </AnimatePresence>
                      <Button
                        variant="outline"
                        className="w-full gap-2 mt-4"
                        onClick={() => addSlot(selectedDay)}
                      >
                        <Plus className="h-4 w-4" />
                        Add Time Slot
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Week View */
                  <div className="overflow-x-auto">
                    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${(activeTimetable.activeDays || DAYS_OF_WEEK).length}, minmax(140px, 1fr))` }}>
                      {(activeTimetable.activeDays || DAYS_OF_WEEK).map((day) => (
                        <div key={day} className="space-y-2">
                          <div className="text-center py-2 bg-muted rounded-lg font-semibold text-sm">
                            {DAY_FULL_LABELS[day]}
                          </div>
                          <div className="space-y-1">
                            {getDaySlots(day).slice(0, 8).map((slot) => (
                              <div
                                key={slot.id}
                                onClick={() => openEditSlotDialog(day, slot)}
                                className={`p-2 rounded-md text-xs cursor-pointer hover:opacity-80 transition-opacity ${activityColors[slot.activity]}`}
                              >
                                <div className="font-mono text-[10px] opacity-70">
                                  {slot.startTime}-{slot.endTime}
                                </div>
                                <div className="font-medium truncate">
                                  {slot.activity === "study" ? slot.subject : (slot.label || slot.activity)}
                                </div>
                              </div>
                            ))}
                            {getDaySlots(day).length > 8 && (
                              <div className="text-center text-xs text-muted-foreground py-1">
                                +{getDaySlots(day).length - 8} more
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => addSlot(day)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Study Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Total Study Time</div>
                  <div className="text-2xl font-bold text-primary">
                    {activeTimetable.routine.studyHoursPerDay}h/day
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Active Days</div>
                  <div className="text-2xl font-bold text-foreground">
                    {activeTimetable.activeDays?.length || 1}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Subjects</div>
                  <div className="text-2xl font-bold text-foreground">
                    {activeTimetable.subjects.length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Weekly Hours</div>
                  <div className="text-2xl font-bold text-success">
                    {(activeTimetable.routine.studyHoursPerDay * (activeTimetable.activeDays?.length || 1)).toFixed(0)}h
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-16 shadow-card">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No timetable created yet</p>
            <p className="text-sm text-muted-foreground/70">Generate a personalized weekly study schedule</p>
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Timetable;
