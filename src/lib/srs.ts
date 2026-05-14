// Anki-inspired SM-2 spaced repetition.
// Ratings: 0 = Again, 1 = Hard, 2 = Good, 3 = Easy
import { Flashcard } from "@/types";

export type Rating = 0 | 1 | 2 | 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export function isDue(card: Flashcard, now = Date.now()): boolean {
  if (!card.dueAt) return true; // brand new card
  return new Date(card.dueAt).getTime() <= now;
}

export function initCard<T extends Partial<Flashcard>>(card: T): T {
  return {
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    lapses: 0,
    dueAt: new Date().toISOString(),
    ...card,
  };
}

export function applyRating(card: Flashcard, rating: Rating): Flashcard {
  let ease = card.ease ?? 2.5;
  let interval = card.interval ?? 0;
  let repetitions = card.repetitions ?? 0;
  let lapses = card.lapses ?? 0;

  if (rating === 0) {
    // Again — reset
    repetitions = 0;
    interval = 0; // review again in this session (~10 min handled by re-queue)
    lapses += 1;
    ease = Math.max(1.3, ease - 0.2);
  } else {
    if (rating === 1) {
      // Hard
      ease = Math.max(1.3, ease - 0.15);
      interval = repetitions === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
    } else if (rating === 2) {
      // Good
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 3;
      else interval = Math.round(interval * ease);
    } else {
      // Easy
      ease = ease + 0.15;
      if (repetitions === 0) interval = 4;
      else interval = Math.round(interval * ease * 1.3);
    }
    repetitions += 1;
  }

  const dueAt =
    interval === 0
      ? new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min for "Again"
      : new Date(Date.now() + interval * DAY_MS).toISOString();

  return { ...card, ease, interval, repetitions, lapses, dueAt };
}

export function nextIntervalLabel(card: Flashcard, rating: Rating): string {
  const preview = applyRating(card, rating);
  if (rating === 0) return "10m";
  const d = preview.interval ?? 0;
  if (d < 1) return "<1d";
  if (d < 30) return `${d}d`;
  if (d < 365) return `${Math.round(d / 30)}mo`;
  return `${Math.round(d / 365)}y`;
}
