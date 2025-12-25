import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BookOpen, Clock, Trash2, Check, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Assignment, Subject } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { SubjectManager } from "@/components/SubjectManager";

const defaultSubjects: Subject[] = [
  { id: "1", name: "Mathematics", color: "bg-blue-500" },
  { id: "2", name: "Physics", color: "bg-purple-500" },
  { id: "3", name: "Chemistry", color: "bg-green-500" },
  { id: "4", name: "Biology", color: "bg-orange-500" },
  { id: "5", name: "English", color: "bg-pink-500" },
  { id: "6", name: "History", color: "bg-yellow-500" },
  { id: "7", name: "Computer Science", color: "bg-indigo-500" },
];

const Assignments = () => {
  const [assignments, setAssignments] = useLocalStorage<Assignment[]>("brainbrew-assignments", []);
  const [subjects, setSubjects] = useLocalStorage<Subject[]>("brainbrew-subjects", defaultSubjects);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Calculate assignment counts per subject
  const assignmentCounts = useMemo(() => {
    return assignments.reduce((acc, assignment) => {
      acc[assignment.subject] = (acc[assignment.subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [assignments]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    subject: "",
    dueDate: "",
    description: "",
    priority: "medium" as Assignment["priority"],
  });
  const { toast } = useToast();

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSubject = filterSubject === "all" || assignment.subject === filterSubject;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "completed" && assignment.completed) ||
      (filterStatus === "pending" && !assignment.completed);
    return matchesSubject && matchesStatus;
  });

  // Group by subject
  const groupedAssignments = filteredAssignments.reduce((acc, assignment) => {
    const subject = assignment.subject;
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(assignment);
    return acc;
  }, {} as Record<string, Assignment[]>);

  const createAssignment = () => {
    if (!newAssignment.title.trim() || !newAssignment.subject || !newAssignment.dueDate) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    const assignment: Assignment = {
      id: Date.now().toString(),
      ...newAssignment,
      completed: false,
    };
    setAssignments([...assignments, assignment]);
    setNewAssignment({ title: "", subject: "", dueDate: "", description: "", priority: "medium" });
    setIsDialogOpen(false);
    toast({ title: "Assignment added!" });
  };

  const toggleComplete = (id: string) => {
    setAssignments(
      assignments.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a))
    );
  };

  const deleteAssignment = (id: string) => {
    setAssignments(assignments.filter((a) => a.id !== id));
    toast({ title: "Assignment deleted" });
  };

  const getSubjectColor = (subjectName: string) => {
    const subject = subjects.find((s) => s.name === subjectName);
    return subject?.color || "bg-gray-500";
  };

  const getPriorityColor = (priority: Assignment["priority"]) => {
    switch (priority) {
      case "high": return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium": return "bg-warning/10 text-warning border-warning/20";
      case "low": return "bg-success/10 text-success border-success/20";
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
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
            <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
            <p className="text-muted-foreground">Track your tasks by subject</p>
          </div>
          <div className="flex gap-3">
            <SubjectManager
              subjects={subjects}
              onSubjectsChange={setSubjects}
              assignmentCounts={assignmentCounts}
            />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Assignment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Assignment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                <Input
                  placeholder="Assignment title"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                />
                <Select
                  value={newAssignment.subject}
                  onValueChange={(value) => setNewAssignment({ ...newAssignment, subject: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
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
                <Input
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                />
                <Select
                  value={newAssignment.priority}
                  onValueChange={(value: Assignment["priority"]) =>
                    setNewAssignment({ ...newAssignment, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Description (optional)"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                />
                <Button onClick={createAssignment} className="w-full">
                  Create Assignment
                </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-card">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.name}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto text-sm text-muted-foreground">
            {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Assignments by subject */}
        <div className="space-y-6">
          <AnimatePresence>
            {Object.entries(groupedAssignments).map(([subject, subjectAssignments]) => (
              <motion.div
                key={subject}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="rounded-2xl bg-card p-6 shadow-card"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${getSubjectColor(subject)}`} />
                  <h2 className="text-lg font-semibold text-foreground">{subject}</h2>
                  <Badge variant="secondary" className="ml-auto">
                    {subjectAssignments.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {subjectAssignments.map((assignment) => {
                    const daysUntil = getDaysUntilDue(assignment.dueDate);
                    return (
                      <motion.div
                        key={assignment.id}
                        layout
                        className={`group flex items-center gap-4 rounded-xl border p-4 transition-all ${
                          assignment.completed
                            ? "border-border bg-muted/30 opacity-60"
                            : "border-border bg-background hover:shadow-md"
                        }`}
                      >
                        <button
                          onClick={() => toggleComplete(assignment.id)}
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                            assignment.completed
                              ? "border-success bg-success text-success-foreground"
                              : "border-muted-foreground/30 hover:border-primary"
                          }`}
                        >
                          {assignment.completed && <Check className="h-3 w-3" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3
                              className={`font-medium ${
                                assignment.completed ? "line-through text-muted-foreground" : "text-foreground"
                              }`}
                            >
                              {assignment.title}
                            </h3>
                            <Badge variant="outline" className={getPriorityColor(assignment.priority)}>
                              {assignment.priority}
                            </Badge>
                          </div>
                          {assignment.description && (
                            <p className="mt-1 text-sm text-muted-foreground truncate">
                              {assignment.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span
                              className={
                                daysUntil < 0
                                  ? "text-destructive"
                                  : daysUntil <= 2
                                  ? "text-warning"
                                  : ""
                              }
                            >
                              {daysUntil < 0
                                ? `${Math.abs(daysUntil)}d overdue`
                                : daysUntil === 0
                                ? "Due today"
                                : `${daysUntil}d left`}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                            onClick={() => deleteAssignment(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {Object.keys(groupedAssignments).length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-16 shadow-card">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">No assignments yet</p>
              <p className="text-sm text-muted-foreground/70">Add your first assignment to get started</p>
            </div>
          )}
        </div>
      </motion.div>
    </Layout>
  );
};

export default Assignments;
