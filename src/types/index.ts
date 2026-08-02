export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  description: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface StudyMaterial {
  id: string;
  name: string;
  text: string;
  wordCount: number;
  createdAt: string;
  selected: boolean;
}


export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  // Anki SM-2 spaced repetition state
  ease?: number;        // ease factor, default 2.5
  interval?: number;    // days until next review, default 0
  repetitions?: number; // successful reviews in a row, default 0
  dueAt?: string;       // ISO date when card is next due
  lapses?: number;      // times the card was forgotten
}

export interface FlashcardDeck {
  id: string;
  name: string;
  cards: Flashcard[];
  createdAt: string;
  updatedAt: string;
}
