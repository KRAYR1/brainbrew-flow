import { useEffect, useMemo, useState } from "react";
import { Flashcard } from "@/types";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Eye } from "lucide-react";
import { applyRating, isDue, nextIntervalLabel, Rating } from "@/lib/srs";

interface Props {
  cards: Flashcard[];
  onUpdate?: (updated: Flashcard[]) => void;
}

export function FlashcardStudy({ cards, onUpdate }: Props) {
  // Working copy of cards we mutate as ratings are applied
  const [working, setWorking] = useState<Flashcard[]>(cards);
  // Queue of indices into `working` that are due in this session
  const [queue, setQueue] = useState<number[]>(() =>
    cards.map((c, i) => (isDue(c) ? i : -1)).filter((i) => i >= 0),
  );
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    setWorking(cards);
    setQueue(cards.map((c, i) => (isDue(c) ? i : -1)).filter((i) => i >= 0));
    setRevealed(false);
    setReviewed(0);
  }, [cards]);

  const currentIdx = queue[0];
  const current = currentIdx != null ? working[currentIdx] : null;
  const finished = !current;

  const dueCount = queue.length;
  const totalDue = useMemo(
    () => working.filter((c) => isDue(c)).length,
    [working],
  );

  const rate = (rating: Rating) => {
    if (currentIdx == null || !current) return;
    const updatedCard = applyRating(current, rating);
    const newWorking = working.map((c, i) => (i === currentIdx ? updatedCard : c));
    setWorking(newWorking);
    onUpdate?.(newWorking);

    // Re-queue if "Again" (review later in same session)
    const rest = queue.slice(1);
    const nextQueue = rating === 0 ? [...rest, currentIdx] : rest;
    setQueue(nextQueue);
    setRevealed(false);
    setReviewed((n) => n + 1);
  };

  const restart = () => {
    setQueue(working.map((c, i) => (isDue(c) ? i : -1)).filter((i) => i >= 0));
    setRevealed(false);
    setReviewed(0);
  };

  if (working.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">No cards in this deck.</p>;
  }

  if (finished) {
    return (
      <div className="space-y-4 py-6 text-center">
        <h3 className="text-xl font-bold">All caught up</h3>
        <p className="text-muted-foreground">
          You reviewed {reviewed} card{reviewed === 1 ? "" : "s"}. No more cards due right now.
        </p>
        <Button onClick={restart} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" />
          Review again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Due: {dueCount}</span>
        <span>Reviewed: {reviewed}</span>
      </div>

      <div
        className="relative min-h-[16rem] cursor-pointer select-none"
        onClick={() => !revealed && setRevealed(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current.id}-${revealed ? "a" : "q"}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="rounded-2xl bg-primary/5 p-6 text-center shadow-card"
          >
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Question
            </p>
            <p className="text-lg font-medium text-foreground whitespace-pre-wrap">
              {current.question}
            </p>

            {revealed && (
              <>
                <div className="my-4 border-t border-border" />
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Answer
                </p>
                <p className="text-base text-foreground whitespace-pre-wrap">
                  {current.answer}
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {!revealed ? (
        <Button className="w-full" onClick={() => setRevealed(true)}>
          <Eye className="mr-2 h-4 w-4" />
          Show answer
        </Button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          <RatingButton label="Again" hint={nextIntervalLabel(current, 0)} onClick={() => rate(0)} variant="destructive" />
          <RatingButton label="Hard" hint={nextIntervalLabel(current, 1)} onClick={() => rate(1)} variant="outline" />
          <RatingButton label="Good" hint={nextIntervalLabel(current, 2)} onClick={() => rate(2)} variant="secondary" />
          <RatingButton label="Easy" hint={nextIntervalLabel(current, 3)} onClick={() => rate(3)} />
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {totalDue} card{totalDue === 1 ? "" : "s"} due in this deck
      </p>
    </div>
  );
}

function RatingButton({
  label,
  hint,
  onClick,
  variant = "default",
}: {
  label: string;
  hint: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary";
}) {
  return (
    <Button onClick={onClick} variant={variant} className="flex h-auto flex-col py-2">
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-[10px] opacity-80">{hint}</span>
    </Button>
  );
}
