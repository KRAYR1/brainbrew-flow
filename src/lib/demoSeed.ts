import type {
  Assignment,
  ChatMessage,
  FlashcardDeck,
  Note,
  Subject,
} from "@/types";

export const DEMO_FLAG_KEY = "brainbrew-demo";

const KEYS = {
  subjects: "brainbrew-subjects",
  assignments: "brainbrew-assignments",
  notes: "brainbrew-notes",
  decks: "brainbrew-flashcard-decks",
  chat: "brainbrew-chat-history",
  timetables: "brainbrew-timetables",
  blocker: "brainbrew-blocker",
  preferences: "brainbrew-preferences",
} as const;

const iso = (d: Date) => d.toISOString();
const daysFromNow = (days: number, hour = 23, min = 59) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, min, 0, 0);
  return d;
};
const uid = (p: string, i: number) => `demo-${p}-${i}`;

const subjects: Subject[] = [
  { id: "demo-sub-bio", name: "Biology", color: "bg-emerald-500" },
  { id: "demo-sub-calc", name: "Calculus II", color: "bg-indigo-500" },
  { id: "demo-sub-lit", name: "English Lit", color: "bg-rose-500" },
];

const assignments: Assignment[] = [
  {
    id: uid("a", 1),
    title: "Lab report: Cellular respiration",
    subject: "Biology",
    dueDate: iso(daysFromNow(-2)),
    description: "Write-up of the mitochondria lab. Include controls, results and error analysis.",
    priority: "high",
    completed: false,
  },
  {
    id: uid("a", 2),
    title: "Problem set 7 — Integration by parts",
    subject: "Calculus II",
    dueDate: iso(daysFromNow(0, 23, 59)),
    description: "Exercises 4.1–4.6 from the textbook. Show all working.",
    priority: "high",
    completed: false,
  },
  {
    id: uid("a", 3),
    title: "Read chapters 4–5 of Beloved",
    subject: "English Lit",
    dueDate: iso(daysFromNow(0, 18, 0)),
    description: "Annotate motifs of memory and haunting for Thursday's discussion.",
    priority: "medium",
    completed: false,
  },
  {
    id: uid("a", 4),
    title: "Photosynthesis quiz",
    subject: "Biology",
    dueDate: iso(daysFromNow(1, 10, 0)),
    description: "Ch. 8 quiz — 20 questions.",
    priority: "medium",
    completed: false,
  },
  {
    id: uid("a", 5),
    title: "Draft essay outline — Toni Morrison",
    subject: "English Lit",
    dueDate: iso(daysFromNow(2, 23, 59)),
    description: "1-page outline with thesis and 3 supporting claims.",
    priority: "medium",
    completed: false,
  },
  {
    id: uid("a", 6),
    title: "Calc II — Practice midterm",
    subject: "Calculus II",
    dueDate: iso(daysFromNow(3, 20, 0)),
    description: "Self-graded practice test before Friday's real midterm.",
    priority: "high",
    completed: false,
  },
  {
    id: uid("a", 7),
    title: "Genetics reading — Ch. 12",
    subject: "Biology",
    dueDate: iso(daysFromNow(4, 23, 59)),
    description: "Take notes on Mendelian inheritance and Punnett squares.",
    priority: "low",
    completed: false,
  },
  {
    id: uid("a", 8),
    title: "Poetry response paper",
    subject: "English Lit",
    dueDate: iso(daysFromNow(6, 23, 59)),
    description: "2 pages on any Rita Dove poem from the anthology.",
    priority: "medium",
    completed: false,
  },
  {
    id: uid("a", 9),
    title: "Series & sequences worksheet",
    subject: "Calculus II",
    dueDate: iso(daysFromNow(7, 23, 59)),
    description: "Convergence tests — ratio, root, integral.",
    priority: "low",
    completed: false,
  },
  {
    id: uid("a", 10),
    title: "Biology field trip permission slip",
    subject: "Biology",
    dueDate: iso(daysFromNow(-5)),
    description: "Turn in signed slip.",
    priority: "low",
    completed: true,
  },
  {
    id: uid("a", 11),
    title: "Read The Bluest Eye — intro",
    subject: "English Lit",
    dueDate: iso(daysFromNow(-3)),
    description: "First 40 pages.",
    priority: "medium",
    completed: true,
  },
  {
    id: uid("a", 12),
    title: "Problem set 6",
    subject: "Calculus II",
    dueDate: iso(daysFromNow(-6)),
    description: "Handed in and graded.",
    priority: "medium",
    completed: true,
  },
];

const notes: Note[] = [
  {
    id: uid("n", 1),
    title: "Bio lecture — Cellular respiration",
    content:
      "# Cellular respiration\n\n**Three stages:** glycolysis → Krebs cycle → electron transport chain.\n\n- Glycolysis happens in the cytoplasm, produces 2 ATP net.\n- Krebs runs in the mitochondrial matrix.\n- ETC pumps H+ across the inner membrane → chemiosmosis → ~32 ATP.\n\n> Ask Prof. Alvarez how uncouplers like DNP shortcut this.",
    createdAt: iso(daysFromNow(-6, 10)),
    updatedAt: iso(daysFromNow(-1, 14)),
  },
  {
    id: uid("n", 2),
    title: "Calc II — Integration techniques cheat sheet",
    content:
      "# Integration cheat sheet\n\n1. **u-sub** — when you see a function and its derivative.\n2. **By parts** — ∫u dv = uv − ∫v du. LIATE for choosing u.\n3. **Partial fractions** — for rational functions.\n4. **Trig sub** — √(a²−x²) → x = a sinθ, etc.\n\nCommon mistake: forgetting +C.",
    createdAt: iso(daysFromNow(-9, 9)),
    updatedAt: iso(daysFromNow(-2, 20)),
  },
  {
    id: uid("n", 3),
    title: "Beloved — motifs so far",
    content:
      "# Motifs in Beloved\n\n- **Memory / rememory** — the past is a place you can walk back into.\n- **Water** — birth, the Middle Passage, baptism.\n- **The color red** — blood, shame, life.\n- **Trees** — the scar on Sethe's back as a chokecherry tree.\n\nThesis draft: Morrison uses fragmented memory as a form of resistance.",
    createdAt: iso(daysFromNow(-4, 21)),
    updatedAt: iso(daysFromNow(0, 8)),
  },
  {
    id: uid("n", 4),
    title: "Essay draft — Morrison outline",
    content:
      "## Outline\n\n1. Intro + thesis\n2. Claim 1: rememory as narrative structure\n3. Claim 2: silence as testimony\n4. Claim 3: the community as chorus\n5. Conclusion — reading as an act of witness",
    createdAt: iso(daysFromNow(-1, 22)),
    updatedAt: iso(daysFromNow(-1, 22, 30)),
  },
  {
    id: uid("n", 5),
    title: "Study plan — Calc midterm",
    content:
      "# Midterm plan\n\n- **Mon**: review integration techniques (1 hr)\n- **Tue**: practice midterm under time (2 hr)\n- **Wed**: office hours + flashcards\n- **Thu**: light review, sleep early\n- **Fri**: exam",
    createdAt: iso(daysFromNow(-3, 19)),
    updatedAt: iso(daysFromNow(-3, 19)),
  },
  {
    id: uid("n", 6),
    title: "Quick — Krebs cycle mnemonic",
    content:
      "**Citrate Is Krebs' Starting Substrate For Making Oxaloacetate**\n\nCitrate → Isocitrate → α-Ketoglutarate → Succinyl-CoA → Succinate → Fumarate → Malate → Oxaloacetate.",
    createdAt: iso(daysFromNow(0, 11)),
    updatedAt: iso(daysFromNow(0, 11)),
  },
];

const bioDeck: FlashcardDeck = {
  id: "demo-deck-bio",
  name: "Bio — Cellular respiration",
  createdAt: iso(daysFromNow(-8)),
  updatedAt: iso(daysFromNow(-1)),
  cards: [
    {
      id: "demo-c-b1",
      question: "Where does glycolysis take place?",
      answer: "In the cytoplasm.",
      ease: 2.6,
      interval: 4,
      repetitions: 2,
      dueAt: iso(daysFromNow(1)),
      lapses: 0,
    },
    {
      id: "demo-c-b2",
      question: "Net ATP produced by glycolysis?",
      answer: "2 ATP.",
      ease: 2.5,
      interval: 2,
      repetitions: 1,
      dueAt: iso(daysFromNow(0, 20)),
      lapses: 0,
    },
    {
      id: "demo-c-b3",
      question: "What drives ATP synthesis in the ETC?",
      answer: "A proton (H+) gradient across the inner mitochondrial membrane — chemiosmosis.",
      ease: 2.3,
      interval: 1,
      repetitions: 1,
      dueAt: iso(daysFromNow(0, 18)),
      lapses: 1,
    },
    {
      id: "demo-c-b4",
      question: "Final electron acceptor in aerobic respiration?",
      answer: "Oxygen.",
      ease: 2.8,
      interval: 7,
      repetitions: 3,
      dueAt: iso(daysFromNow(4)),
      lapses: 0,
    },
    {
      id: "demo-c-b5",
      question: "What is an uncoupler like DNP doing?",
      answer: "Making the inner membrane leaky to H+, so the gradient dissipates as heat instead of driving ATP synthase.",
      ease: 2.5,
      interval: 0,
      repetitions: 0,
      dueAt: iso(daysFromNow(0, 9)),
      lapses: 0,
    },
  ],
};

const calcDeck: FlashcardDeck = {
  id: "demo-deck-calc",
  name: "Calc II — Integration techniques",
  createdAt: iso(daysFromNow(-10)),
  updatedAt: iso(daysFromNow(-2)),
  cards: [
    {
      id: "demo-c-c1",
      question: "Integration by parts formula?",
      answer: "∫ u dv = uv − ∫ v du",
      ease: 2.7,
      interval: 6,
      repetitions: 3,
      dueAt: iso(daysFromNow(3)),
      lapses: 0,
    },
    {
      id: "demo-c-c2",
      question: "LIATE — what is it for?",
      answer: "A heuristic for choosing u in integration by parts: Logs, Inverse trig, Algebraic, Trig, Exponential.",
      ease: 2.4,
      interval: 2,
      repetitions: 2,
      dueAt: iso(daysFromNow(1)),
      lapses: 1,
    },
    {
      id: "demo-c-c3",
      question: "Trig sub for √(a² − x²)?",
      answer: "x = a sin θ, dx = a cos θ dθ.",
      ease: 2.5,
      interval: 1,
      repetitions: 1,
      dueAt: iso(daysFromNow(0, 16)),
      lapses: 0,
    },
    {
      id: "demo-c-c4",
      question: "When to use partial fractions?",
      answer: "When integrating a rational function P(x)/Q(x) with deg P < deg Q and Q factors nicely.",
      ease: 2.5,
      interval: 0,
      repetitions: 0,
      dueAt: iso(daysFromNow(0, 10)),
      lapses: 0,
    },
  ],
};

const decks: FlashcardDeck[] = [bioDeck, calcDeck];

const chat: ChatMessage[] = [
  {
    id: "demo-msg-1",
    role: "user",
    content: "Hey Whiskers, what should I focus on today?",
    createdAt: iso(daysFromNow(0, 8, 12)),
  },
  {
    id: "demo-msg-2",
    role: "assistant",
    content:
      "Morning, Maya 🐾 You have Problem Set 7 due tonight and a Beloved reading before your 6pm discussion. I'd knock out the calc first while your brain is fresh — 90 minutes with a pomodoro should do it.",
    createdAt: iso(daysFromNow(0, 8, 12, 30)),
  },
  {
    id: "demo-msg-3",
    role: "user",
    content: "Can you quiz me on the Krebs cycle from my Bio notes?",
    createdAt: iso(daysFromNow(0, 9, 5)),
  },
  {
    id: "demo-msg-4",
    role: "assistant",
    content:
      "Sure — first question: after acetyl-CoA joins oxaloacetate, what's the six-carbon molecule that forms? (Hint: it's the first step of your mnemonic.)",
    createdAt: iso(daysFromNow(0, 9, 5, 20)),
  },
];

const preferences = {
  accentColor: "emerald",
  focusGuard: { enabled: false, blockedSites: [] as string[] },
  whiskersName: "Whiskers",
  onboarded: true,
};

export function isDemoMode(): boolean {
  try {
    return window.localStorage.getItem(DEMO_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function seedDemoWorkspace() {
  try {
    window.localStorage.setItem(KEYS.subjects, JSON.stringify(subjects));
    window.localStorage.setItem(KEYS.assignments, JSON.stringify(assignments));
    window.localStorage.setItem(KEYS.notes, JSON.stringify(notes));
    window.localStorage.setItem(KEYS.decks, JSON.stringify(decks));
    window.localStorage.setItem(KEYS.chat, JSON.stringify(chat));
    // Only set preferences if the user hasn't already customized them.
    if (!window.localStorage.getItem(KEYS.preferences)) {
      window.localStorage.setItem(KEYS.preferences, JSON.stringify(preferences));
    }
    window.localStorage.setItem(DEMO_FLAG_KEY, "1");
  } catch (e) {
    console.error("Failed to seed demo workspace", e);
  }
}

export function resetDemoWorkspace() {
  seedDemoWorkspace();
}

export function exitDemoMode() {
  try {
    [
      KEYS.subjects,
      KEYS.assignments,
      KEYS.notes,
      KEYS.decks,
      KEYS.chat,
      KEYS.timetables,
      DEMO_FLAG_KEY,
    ].forEach((k) => window.localStorage.removeItem(k));
  } catch (e) {
    console.error("Failed to exit demo mode", e);
  }
}
