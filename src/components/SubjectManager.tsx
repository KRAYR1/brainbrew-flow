import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Subject } from "@/types";
import { useToast } from "@/hooks/use-toast";

const colorOptions = [
  { name: "Blue", value: "bg-blue-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Red", value: "bg-red-500" },
  { name: "Teal", value: "bg-teal-500" },
  { name: "Cyan", value: "bg-cyan-500" },
  { name: "Emerald", value: "bg-emerald-500" },
  { name: "Rose", value: "bg-rose-500" },
];

interface SubjectManagerProps {
  subjects: Subject[];
  onSubjectsChange: (subjects: Subject[]) => void;
  assignmentCounts: Record<string, number>;
}

export function SubjectManager({ subjects, onSubjectsChange, assignmentCounts }: SubjectManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubject, setNewSubject] = useState({ name: "", color: "bg-blue-500" });
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const handleAddSubject = () => {
    if (!newSubject.name.trim()) {
      toast({ title: "Please enter a subject name", variant: "destructive" });
      return;
    }
    if (subjects.some((s) => s.name.toLowerCase() === newSubject.name.toLowerCase())) {
      toast({ title: "Subject already exists", variant: "destructive" });
      return;
    }
    const subject: Subject = {
      id: Date.now().toString(),
      name: newSubject.name.trim(),
      color: newSubject.color,
    };
    onSubjectsChange([...subjects, subject]);
    setNewSubject({ name: "", color: "bg-blue-500" });
    setIsAdding(false);
    toast({ title: "Subject added!" });
  };

  const handleUpdateSubject = (id: string, updates: Partial<Subject>) => {
    onSubjectsChange(
      subjects.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    setEditingSubject(null);
    toast({ title: "Subject updated!" });
  };

  const handleDeleteSubject = (subject: Subject) => {
    const count = assignmentCounts[subject.name] || 0;
    if (count > 0) {
      toast({
        title: `Cannot delete "${subject.name}"`,
        description: `There are ${count} assignment${count > 1 ? "s" : ""} using this subject.`,
        variant: "destructive",
      });
      return;
    }
    onSubjectsChange(subjects.filter((s) => s.id !== subject.id));
    toast({ title: "Subject deleted" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="h-4 w-4" />
          Manage Subjects
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Subjects</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Existing subjects */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <AnimatePresence>
              {subjects.map((subject) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 bg-background"
                >
                  {editingSubject?.id === subject.id ? (
                    <>
                      <Input
                        value={editingSubject.name}
                        onChange={(e) =>
                          setEditingSubject({ ...editingSubject, name: e.target.value })
                        }
                        className="flex-1 h-8"
                      />
                      <div className="flex gap-1">
                        {colorOptions.slice(0, 6).map((color) => (
                          <button
                            key={color.value}
                            onClick={() =>
                              setEditingSubject({ ...editingSubject, color: color.value })
                            }
                            className={`h-6 w-6 rounded-full ${color.value} ${
                              editingSubject.color === color.value
                                ? "ring-2 ring-offset-2 ring-primary"
                                : ""
                            }`}
                          />
                        ))}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() =>
                          handleUpdateSubject(subject.id, {
                            name: editingSubject.name,
                            color: editingSubject.color,
                          })
                        }
                      >
                        <Check className="h-4 w-4 text-success" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditingSubject(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className={`h-4 w-4 rounded-full shrink-0 ${subject.color}`} />
                      <span className="flex-1 font-medium text-foreground">{subject.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {assignmentCounts[subject.name] || 0} tasks
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditingSubject(subject)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleDeleteSubject(subject)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add new subject */}
          {isAdding ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4"
            >
              <Input
                placeholder="Subject name"
                value={newSubject.name}
                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewSubject({ ...newSubject, color: color.value })}
                    className={`h-8 w-8 rounded-full transition-all ${color.value} ${
                      newSubject.color === color.value
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-105"
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddSubject} className="flex-1">
                  Add Subject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setNewSubject({ name: "", color: "bg-blue-500" });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4" />
              Add New Subject
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
