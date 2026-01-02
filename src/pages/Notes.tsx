import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, FileText, Download, Upload, Trash2, Edit3, Save, X, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Note } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";

const Notes = () => {
  const [notes, setNotes] = useLocalStorage<Note[]>("brainbrew-notes", []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [editedNote, setEditedNote] = useState({ title: "", content: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createNote = () => {
    if (!newNote.title.trim()) {
      toast({ title: "Please enter a title", variant: "destructive" });
      return;
    }
    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes([note, ...notes]);
    setNewNote({ title: "", content: "" });
    setIsDialogOpen(false);
    toast({ title: "Note created successfully!" });
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);
    toast({ title: "Note deleted" });
  };

  const startEditing = () => {
    if (selectedNote) {
      setEditedNote({ title: selectedNote.title, content: selectedNote.content });
      setIsEditing(true);
    }
  };

  const saveEdit = () => {
    if (selectedNote) {
      const updatedNotes = notes.map((note) =>
        note.id === selectedNote.id
          ? { ...note, title: editedNote.title, content: editedNote.content, updatedAt: new Date().toISOString() }
          : note
      );
      setNotes(updatedNotes);
      setSelectedNote({ ...selectedNote, title: editedNote.title, content: editedNote.content });
      setIsEditing(false);
      toast({ title: "Note saved!" });
    }
  };

  const exportNotesPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("BrainBrew Notes", margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Exported on ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 15;

    notes.forEach((note, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Note title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${note.title}`, margin, yPosition);
      yPosition += 7;

      // Date
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text(`Last updated: ${new Date(note.updatedAt).toLocaleString()}`, margin, yPosition);
      yPosition += 7;

      // Content
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const splitContent = doc.splitTextToSize(note.content || "No content", maxWidth);
      
      splitContent.forEach((line: string) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });

      yPosition += 10; // Space between notes
    });

    doc.save(`brainbrew-notes-${new Date().toISOString().split("T")[0]}.pdf`);
    toast({ title: "Notes exported as PDF!" });
  };

  const exportNotesJSON = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportName = `brainbrew-notes-${new Date().toISOString().split("T")[0]}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportName);
    linkElement.click();
    toast({ title: "Notes exported as JSON!" });
  };

  const exportSingleNotePDF = (note: Note) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPosition = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(note.title, margin, yPosition);
    yPosition += 10;

    // Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(`Last updated: ${new Date(note.updatedAt).toLocaleString()}`, margin, yPosition);
    yPosition += 15;

    // Content
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const splitContent = doc.splitTextToSize(note.content || "No content", maxWidth);
    
    splitContent.forEach((line: string) => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 7;
    });

    const safeName = note.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    doc.save(`${safeName}.pdf`);
    toast({ title: "Note exported as PDF!" });
  };

  const importNotes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedNotes = JSON.parse(e.target?.result as string);
          if (Array.isArray(importedNotes)) {
            setNotes([...importedNotes, ...notes]);
            toast({ title: `Imported ${importedNotes.length} notes!` });
          }
        } catch {
          toast({ title: "Invalid file format", variant: "destructive" });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] gap-6">
        {/* Notes list */}
        <div className="flex w-80 flex-col rounded-2xl bg-card p-4 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Notes</h2>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportNotesPDF}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportNotesJSON}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={importNotes}
              />
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Add note dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mb-4 w-full gap-2">
                <Plus className="h-4 w-4" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Note title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                />
                <Textarea
                  placeholder="Start writing..."
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={6}
                />
                <Button onClick={createNote} className="w-full">
                  Create Note
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Notes list */}
          <div className="flex-1 space-y-2 overflow-y-auto">
            <AnimatePresence>
              {filteredNotes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => {
                    setSelectedNote(note);
                    setIsEditing(false);
                  }}
                  className={`cursor-pointer rounded-lg p-3 transition-all ${
                    selectedNote?.id === note.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-foreground">{note.title}</h3>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {note.content.substring(0, 50)}...
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredNotes.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No notes found</p>
              </div>
            )}
          </div>
        </div>

        {/* Note editor */}
        <div className="flex-1 rounded-2xl bg-card p-6 shadow-card">
          {selectedNote ? (
            <div className="flex h-full flex-col">
              <div className="mb-4 flex items-center justify-between">
                {isEditing ? (
                  <Input
                    value={editedNote.title}
                    onChange={(e) => setEditedNote({ ...editedNote, title: e.target.value })}
                    className="text-xl font-semibold"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-foreground">{selectedNote.title}</h1>
                )}
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="icon" onClick={saveEdit}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => exportSingleNotePDF(selectedNote)} title="Export as PDF">
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={startEditing}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteNote(selectedNote.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Last updated: {new Date(selectedNote.updatedAt).toLocaleString()}
              </p>
              {isEditing ? (
                <Textarea
                  value={editedNote.content}
                  onChange={(e) => setEditedNote({ ...editedNote, content: e.target.value })}
                  className="flex-1 resize-none"
                />
              ) : (
                <div className="flex-1 overflow-y-auto whitespace-pre-wrap text-foreground">
                  {selectedNote.content || "Start writing..."}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 opacity-30" />
                <p>Select a note or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Notes;
