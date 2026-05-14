import { useMemo, useRef, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import { FlashcardDeck, Flashcard } from "@/types";
import {
  Plus,
  Layers,
  Upload,
  Sparkles,
  Trash2,
  Play,
  Edit3,
  Save,
  X,
  FileText,
} from "lucide-react";
import { extractFileText } from "@/lib/fileExtract";
import { supabase } from "@/integrations/supabase/client";
import { FlashcardStudy } from "@/components/flashcards/FlashcardStudy";
import { initCard, isDue } from "@/lib/srs";
import { motion, AnimatePresence } from "framer-motion";

const Flashcards = () => {
  const [decks, setDecks] = useLocalStorage<FlashcardDeck[]>("brainbrew-flashcard-decks", []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newDeckName, setNewDeckName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [studyOpen, setStudyOpen] = useState(false);

  const [pasteText, setPasteText] = useState("");
  const [count, setCount] = useState("10");
  const [difficulty, setDifficulty] = useState("medium");
  const [generating, setGenerating] = useState(false);

  const [manualQ, setManualQ] = useState("");
  const [manualA, setManualA] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const selected = useMemo(
    () => decks.find((d) => d.id === selectedId) ?? null,
    [decks, selectedId],
  );

  const updateDeck = (id: string, updater: (d: FlashcardDeck) => FlashcardDeck) => {
    setDecks((prev) =>
      prev.map((d) => (d.id === id ? { ...updater(d), updatedAt: new Date().toISOString() } : d)),
    );
  };

  const createDeck = () => {
    const name = newDeckName.trim();
    if (!name) {
      toast({ title: "Please enter a deck name", variant: "destructive" });
      return;
    }
    const deck: FlashcardDeck = {
      id: Date.now().toString(),
      name,
      cards: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDecks([deck, ...decks]);
    setSelectedId(deck.id);
    setNewDeckName("");
    setCreateOpen(false);
    toast({ title: "Deck created" });
  };

  const deleteDeck = (id: string) => {
    setDecks(decks.filter((d) => d.id !== id));
    if (selectedId === id) setSelectedId(null);
    toast({ title: "Deck deleted" });
  };

  const addManual = () => {
    if (!selected) return;
    if (!manualQ.trim() || !manualA.trim()) {
      toast({ title: "Question and answer are required", variant: "destructive" });
      return;
    }
    const card: Flashcard = initCard({
      id: Date.now().toString(),
      question: manualQ.trim(),
      answer: manualA.trim(),
    }) as Flashcard;
    updateDeck(selected.id, (d) => ({ ...d, cards: [...d.cards, card] }));
    setManualQ("");
    setManualA("");
    toast({ title: "Card added" });
  };

  const deleteCard = (cardId: string) => {
    if (!selected) return;
    updateDeck(selected.id, (d) => ({ ...d, cards: d.cards.filter((c) => c.id !== cardId) }));
  };

  const startEdit = (card: Flashcard) => {
    setEditingId(card.id);
    setEditQ(card.question);
    setEditA(card.answer);
  };

  const saveEdit = () => {
    if (!selected || !editingId) return;
    updateDeck(selected.id, (d) => ({
      ...d,
      cards: d.cards.map((c) =>
        c.id === editingId ? { ...c, question: editQ, answer: editA } : c,
      ),
    }));
    setEditingId(null);
  };

  const generateFromText = async (sourceText: string) => {
    if (!selected) {
      toast({ title: "Select or create a deck first", variant: "destructive" });
      return;
    }
    if (sourceText.trim().length < 20) {
      toast({ title: "Need more text to generate from", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-flashcards", {
        body: { text: sourceText, count: Number(count), difficulty },
      });
      if (error) {
        const msg = error.message || "Generation failed";
        toast({ title: "Generation failed", description: msg, variant: "destructive" });
        return;
      }
      const cards = (data?.cards ?? []) as Array<{ question: string; answer: string }>;
      if (cards.length === 0) {
        toast({ title: "No cards generated", variant: "destructive" });
        return;
      }
      const newCards: Flashcard[] = cards.map((c, i) =>
        initCard({
          id: `${Date.now()}-${i}`,
          question: c.question,
          answer: c.answer,
        }) as Flashcard,
      );
      updateDeck(selected.id, (d) => ({ ...d, cards: [...d.cards, ...newCards] }));
      toast({ title: `Added ${newCards.length} cards` });
      setPasteText("");
    } catch (e) {
      console.error(e);
      toast({ title: "Generation error", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleFileObject = async (file: File) => {
    if (!selected) {
      toast({ title: "Select or create a deck first", variant: "destructive" });
      return;
    }
    const okExt = /\.(pdf|docx|txt|md)$/i.test(file.name);
    if (!okExt) {
      toast({ title: "Unsupported file", description: "Use PDF, DOCX, TXT or MD", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      toast({ title: `Reading ${file.name}…` });
      const text = await extractFileText(file);
      if (!text || text.trim().length < 20) {
        toast({ title: "Couldn't extract enough text", variant: "destructive" });
        setGenerating(false);
        return;
      }
      await generateFromText(text);
    } catch (err) {
      console.error(err);
      toast({ title: "File parsing failed", variant: "destructive" });
      setGenerating(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (file) await handleFileObject(file);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFileObject(file);
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] gap-6">
        {/* Deck list */}
        <div className="flex w-72 flex-col rounded-2xl bg-card p-4 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Layers className="h-5 w-5 text-primary" />
              Decks
            </h2>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New deck</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <Input
                    placeholder="Deck name (e.g. Biology Ch. 4)"
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createDeck()}
                  />
                  <Button onClick={createDeck} className="w-full">
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            <AnimatePresence>
              {decks.map((d) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => setSelectedId(d.id)}
                  className={`group cursor-pointer rounded-lg p-3 transition-all ${
                    selectedId === d.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.cards.length} cards</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDeck(d.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {decks.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <Layers className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p>No decks yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto rounded-2xl bg-card p-6 shadow-card">
          {!selected ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              <div>
                <Layers className="mx-auto mb-3 h-12 w-12 opacity-30" />
                <p>Create or select a deck to get started</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{selected.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {selected.cards.length} cards · {selected.cards.filter((c) => isDue(c)).length} due now
                  </p>
                </div>
                <Button
                  disabled={selected.cards.length === 0}
                  onClick={() => setStudyOpen(true)}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Study
                </Button>
              </div>

              <Tabs defaultValue="generate">
                <TabsList>
                  <TabsTrigger value="generate">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate
                  </TabsTrigger>
                  <TabsTrigger value="manual">
                    <Plus className="mr-2 h-4 w-4" />
                    Manual
                  </TabsTrigger>
                  <TabsTrigger value="cards">
                    <FileText className="mr-2 h-4 w-4" />
                    Cards ({selected.cards.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="generate" className="space-y-4 pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Number of cards
                      </label>
                      <Select value={count} onValueChange={setCount}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[5, 10, 15, 20, 30].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Difficulty
                      </label>
                      <Select value={difficulty} onValueChange={setDifficulty}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-xl border border-dashed border-border p-6 text-center">
                    <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="mb-3 text-sm text-muted-foreground">
                      Upload a PDF, DOCX, TXT or MD file
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt,.md"
                      className="hidden"
                      onChange={handleFile}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={generating}
                    >
                      {generating ? "Generating…" : "Choose file"}
                    </Button>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Or paste your study material
                    </label>
                    <Textarea
                      rows={6}
                      placeholder="Paste notes, a chapter summary, lecture transcript…"
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                    />
                    <Button
                      className="mt-2"
                      onClick={() => generateFromText(pasteText)}
                      disabled={generating || pasteText.trim().length < 20}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {generating ? "Generating…" : "Generate cards"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="space-y-3 pt-4">
                  <Input
                    placeholder="Question"
                    value={manualQ}
                    onChange={(e) => setManualQ(e.target.value)}
                  />
                  <Textarea
                    placeholder="Answer"
                    value={manualA}
                    onChange={(e) => setManualA(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={addManual}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add card
                  </Button>
                </TabsContent>

                <TabsContent value="cards" className="space-y-2 pt-4">
                  {selected.cards.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No cards yet. Generate or add manually.
                    </p>
                  )}
                  {selected.cards.map((c) => (
                    <div key={c.id} className="rounded-lg border border-border p-3">
                      {editingId === c.id ? (
                        <div className="space-y-2">
                          <Input value={editQ} onChange={(e) => setEditQ(e.target.value)} />
                          <Textarea
                            value={editA}
                            onChange={(e) => setEditA(e.target.value)}
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEdit}>
                              <Save className="mr-1 h-3 w-3" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="mr-1 h-3 w-3" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{c.question}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{c.answer}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => startEdit(c)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => deleteCard(c.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      <Dialog open={studyOpen} onOpenChange={setStudyOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Studying: {selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && <FlashcardStudy cards={selected.cards} />}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Flashcards;
