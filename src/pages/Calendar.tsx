import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Assignment, Subject } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const defaultSubjects: Subject[] = [
  { id: "1", name: "Mathematics", color: "bg-blue-500" },
  { id: "2", name: "Physics", color: "bg-purple-500" },
  { id: "3", name: "Chemistry", color: "bg-green-500" },
  { id: "4", name: "Biology", color: "bg-orange-500" },
  { id: "5", name: "English", color: "bg-pink-500" },
  { id: "6", name: "History", color: "bg-yellow-500" },
  { id: "7", name: "Computer Science", color: "bg-indigo-500" },
];

const CalendarPage = () => {
  const [assignments] = useLocalStorage<Assignment[]>("brainbrew-assignments", []);
  const [subjects] = useLocalStorage<Subject[]>("brainbrew-subjects", defaultSubjects);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getSubjectColor = (subjectName: string) => {
    const subject = subjects.find((s) => s.name === subjectName);
    return subject?.color || "bg-gray-500";
  };

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentDate]);

  const getAssignmentsForDate = (date: Date) => {
    return assignments.filter((assignment) => {
      const dueDate = new Date(assignment.dueDate);
      return (
        dueDate.getDate() === date.getDate() &&
        dueDate.getMonth() === date.getMonth() &&
        dueDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const selectedDateAssignments = selectedDate ? getAssignmentsForDate(selectedDate) : [];

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">View your assignments on a timeline</p>
        </div>

        <div className="flex gap-6">
          {/* Calendar */}
          <div className="flex-1 rounded-2xl bg-card p-6 shadow-card">
            {/* Month navigation */}
            <div className="mb-6 flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold text-foreground">
                {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Day names */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const dayAssignments = getAssignmentsForDate(date);
                const isSelected =
                  selectedDate &&
                  date.getDate() === selectedDate.getDate() &&
                  date.getMonth() === selectedDate.getMonth();

                return (
                  <Tooltip key={date.toISOString()}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setSelectedDate(date)}
                        className={`group relative aspect-square rounded-lg p-1 transition-all hover:bg-muted ${
                          isSelected ? "bg-primary/10 ring-2 ring-primary" : ""
                        } ${isToday(date) ? "bg-accent/10" : ""}`}
                      >
                        <span
                          className={`absolute left-1/2 top-1 -translate-x-1/2 text-sm ${
                            isToday(date)
                              ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        {dayAssignments.length > 0 && (
                          <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                            {dayAssignments.slice(0, 3).map((assignment, i) => (
                              <div
                                key={i}
                                className={`h-1.5 w-1.5 rounded-full ${getSubjectColor(assignment.subject)}`}
                              />
                            ))}
                            {dayAssignments.length > 3 && (
                              <span className="text-[8px] text-muted-foreground">+{dayAssignments.length - 3}</span>
                            )}
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    {dayAssignments.length > 0 && (
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1">
                          {dayAssignments.map((assignment) => (
                            <div key={assignment.id} className="flex items-center gap-2 text-sm">
                              <div className={`h-2 w-2 rounded-full ${getSubjectColor(assignment.subject)}`} />
                              <span className="truncate">{assignment.title}</span>
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* Selected date details */}
          <div className="w-80 rounded-2xl bg-card p-6 shadow-card">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              {selectedDate
                ? selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : "Select a date"}
            </h3>

            {selectedDate && (
              <div className="space-y-3">
                {selectedDateAssignments.length > 0 ? (
                  selectedDateAssignments.map((assignment) => (
                    <motion.div
                      key={assignment.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`rounded-xl border p-4 ${
                        assignment.completed ? "bg-muted/30 opacity-60" : "bg-background"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${getSubjectColor(assignment.subject)}`} />
                        <span className="text-xs text-muted-foreground">{assignment.subject}</span>
                      </div>
                      <h4
                        className={`font-medium ${
                          assignment.completed ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {assignment.title}
                      </h4>
                      {assignment.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            assignment.priority === "high"
                              ? "border-destructive/30 text-destructive"
                              : assignment.priority === "medium"
                              ? "border-warning/30 text-warning"
                              : "border-success/30 text-success"
                          }
                        >
                          {assignment.priority}
                        </Badge>
                        {assignment.completed && (
                          <Badge variant="secondary">Completed</Badge>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No assignments due</p>
                  </div>
                )}
              </div>
            )}

            {!selectedDate && (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Click on a date to see assignments
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default CalendarPage;
