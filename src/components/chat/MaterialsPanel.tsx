import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { extractFileText } from "@/lib/fileExtract";
import { StudyMaterial } from "@/types";
import { FileText, Upload, Trash2, Pencil, Check, Eye, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  materials: StudyMaterial[];
  nearLimit: boolean;
  onAdd: (name: string, text: string) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onToggle: (id: string) => void;
  onSetAll: (selected: boolean) => void;
}

export function MaterialsPanel({
  materials,
  nearLimit,
  onAdd,
  onRemove,
  onRename,
  onToggle,
  onSetAll,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [preview, setPreview] = useState<StudyMaterial | null>(null);
  const { toast } = useToast();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        try {
          const text = await extractFileText(file);
          if (!text || text.trim().length < 20) {
            toast({
              title: `Couldn't read ${file.name}`,
              description: "No selectable text found (scanned image?).",
              variant: "destructive",
            });
            continue;
          }
          onAdd(file.name.replace(/\.[^.]+$/, ""), text);
          toast({ title: `Added ${file.name}` });
        } catch (e) {
          console.error(e);
          toast({ title: `Failed to read ${file.name}`, variant: "destructive" });
        }
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const selectedCount = materials.filter((m) => m.selected).length;

  return (
    <div className="flex h-full flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        {busy ? (
          <Loader2 className="mx-auto mb-1 h-5 w-5 animate-spin text-primary" />
        ) : (
          <Upload className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
        )}
        <p className="text-xs font-medium text-foreground">Drop study material</p>
        <p className="text-[11px] text-muted-foreground">PDF, DOCX, TXT, MD</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {nearLimit && (
        <p className="rounded-lg bg-destructive/10 p-2 text-[11px] text-destructive">
          Your materials are close to this browser's storage limit. Delete a few old files.
        </p>
      )}

      {materials.length > 0 && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {selectedCount} of {materials.length} active
          </span>
          <button
            className="underline"
            onClick={() => onSetAll(selectedCount !== materials.length)}
          >
            {selectedCount === materials.length ? "Deselect all" : "Select all"}
          </button>
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto">
        {materials.length === 0 && (
          <p className="px-1 pt-4 text-center text-xs text-muted-foreground">
            No materials yet. Upload your notes and Brainy B will use only those.
          </p>
        )}
        {materials.map((m) => (
          <div
            key={m.id}
            className="flex items-start gap-2 rounded-xl border border-border bg-card p-2.5"
          >
            <Checkbox
              checked={m.selected}
              onCheckedChange={() => onToggle(m.id)}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              {editingId === m.id ? (
                <div className="flex gap-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 text-xs"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      if (editName.trim()) onRename(m.id, editName.trim());
                      setEditingId(null);
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <p className="truncate text-xs font-medium text-foreground">
                  <FileText className="mr-1 inline h-3 w-3 text-primary" />
                  {m.name}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {m.wordCount.toLocaleString()} words
              </p>
            </div>
            <div className="flex shrink-0 gap-0.5">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setPreview(m)}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => {
                  setEditingId(m.id);
                  setEditName(m.name);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-destructive"
                onClick={() => onRemove(m.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
          </DialogHeader>
          <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
            {preview?.text.slice(0, 20000)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
