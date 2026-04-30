import { useMemo, useState } from "react";
import { Flashcard } from "@/types";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, RotateCcw, Check, X } from "lucide-react";

interface Props {
  cards: Flashcard[];
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function FlashcardStudy({ cards }: Props) {
  const [order, setOrder] = useState<Flashcard[]>(() => cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [gotIt, setGotIt] = useState(0);

  const current = order[index];
  const total = order.length;
  const finished = index >= total;

  const reset = () => {
    setOrder(cards);
    setIndex(0);
    setFlipped(false);
    setGotIt(0);
  };

  const shuffle = () => {
    setOrder(shuffleArray(cards));
    setIndex(0);
    setFlipped(false);
    setGotIt(0);
  };

  const next = (correct: boolean) => {
    if (correct) setGotIt((g) => g + 1);
    setFlipped(false);
    setIndex((i) => i + 1);
  };

  const progress = useMemo(() => {
    if (total === 0) return 0;
    return Math.round((index / total) * 100);
  }, [index, total]);

  if (total === 0) {
    return <p className="py-8 text-center text-muted-foreground">No cards to study.</p>;
  }

  if (finished) {
    return (
      <div className="space-y-4 py-6 text-center">
        <h3 className="text-xl font-bold">Done!</h3>
        <p className="text-muted-foreground">
          You got {gotIt} of {total} correct.
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={reset} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Restart
          </Button>
          <Button onClick={shuffle}>
            <Shuffle className="mr-2 h-4 w-4" />
            Shuffle & restart
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Card {index + 1} of {total}
        </span>
        <span>{progress}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className="relative h-64 cursor-pointer select-none"
        onClick={() => setFlipped((f) => !f)}
        style={{ perspective: 1000 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current.id}-${flipped ? "a" : "q"}`}
            initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`absolute inset-0 flex items-center justify-center rounded-2xl p-6 text-center shadow-card ${
              flipped ? "bg-accent/10" : "bg-primary/5"
            }`}
          >
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                {flipped ? "Answer" : "Question"}
              </p>
              <p className="text-lg font-medium text-foreground">
                {flipped ? current.answer : current.question}
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                Click card to flip
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={shuffle} size="sm">
          <Shuffle className="mr-2 h-4 w-4" />
          Shuffle
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => next(false)}>
            <X className="mr-2 h-4 w-4 text-destructive" />
            Review again
          </Button>
          <Button onClick={() => next(true)}>
            <Check className="mr-2 h-4 w-4" />
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
