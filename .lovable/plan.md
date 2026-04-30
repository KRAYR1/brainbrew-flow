# BrainBrew: AI Chatbot + Flashcard Generator

Add two new study features powered by Lovable AI (Lovable Cloud), accessible from the sidebar.

## 1. AI Study Chatbot (`/chat`)

A conversational study assistant that helps explain concepts, summarize topics, quiz the user, and answer doubts.

- New page `src/pages/Chat.tsx` with a full chat UI (message bubbles, input box, send button, "clear chat" action).
- Streaming token-by-token responses rendered with `react-markdown` (so formatted lists, code, bold render properly).
- Conversation history kept in `localStorage` (`brainbrew-chat-history`) so it persists across reloads; user can clear it.
- System prompt tuned for a friendly study tutor (concise explanations, examples, follow-up questions).
- Surfaces friendly toasts on rate-limit (429) and credit-exhausted (402) errors.

## 2. Flashcard Generator (`/flashcards`)

A page where students build decks of flashcards in three ways:

**a) Generate from a file** (PDF, DOCX, TXT, MD)
- Upload via drag-drop / file picker.
- PDF parsed in-browser with `pdfjs-dist`, DOCX with `mammoth`, plain text read directly.
- Extracted text sent to an edge function which asks Lovable AI to return structured flashcards (question/answer pairs) using tool calling for reliable JSON.
- User can pick how many cards to generate (e.g. 5 / 10 / 20) and a difficulty level.

**b) Generate from pasted text**
- Textarea where user pastes notes; same generation pipeline as files.

**c) Manual entry**
- Form to add a card (question + answer) directly to the current deck.
- Edit and delete existing cards inline.

**Deck features**
- Multiple named decks, stored in `localStorage` (`brainbrew-flashcard-decks`).
- Study mode: flip-card animation (framer-motion), "Got it" / "Review again" buttons, progress indicator, shuffle option.
- Export deck to JSON; export deck to PDF (reuse jsPDF pattern from Notes).

## Backend (Lovable Cloud)

Two Supabase edge functions, both using the Lovable AI Gateway (`LOVABLE_API_KEY` auto-provisioned):

- `supabase/functions/study-chat/index.ts` — streaming chat endpoint, model `google/gemini-3-flash-preview`, system prompt for tutoring, returns SSE stream.
- `supabase/functions/generate-flashcards/index.ts` — non-streaming, uses tool calling with a JSON schema `{ cards: [{ question, answer }] }` to guarantee structured output. Accepts `{ text, count, difficulty }`.

Both functions handle 429 / 402 with clear JSON error messages forwarded to the client. `config.toml` updated with both functions (`verify_jwt = false` so they work without auth, since the app is currently localStorage-only).

If Lovable Cloud isn't enabled yet, it will be enabled as part of this work so `LOVABLE_API_KEY` is available.

## Navigation & types

- Add `MessageSquare` (Chat) and `Layers` (Flashcards) entries to `src/components/layout/Sidebar.tsx`.
- Register `/chat` and `/flashcards` routes in `src/App.tsx`.
- Add `ChatMessage`, `Flashcard`, `FlashcardDeck` interfaces to `src/types/index.ts`.

## Technical notes

- New deps: `react-markdown`, `pdfjs-dist`, `mammoth`.
- All AI calls go through edge functions — no API keys on the client, no direct provider calls.
- File parsing happens client-side to avoid uploading user documents anywhere; only extracted text is sent to the edge function.
- Reuse existing `useLocalStorage` hook, shadcn UI components (Dialog, Button, Input, Textarea, Tabs, Card), and toast system.

## Files added / changed

Added:
- `src/pages/Chat.tsx`
- `src/pages/Flashcards.tsx`
- `src/components/flashcards/FlashcardStudy.tsx`
- `src/components/flashcards/DeckEditor.tsx`
- `src/lib/fileExtract.ts` (PDF/DOCX/TXT text extraction)
- `supabase/functions/study-chat/index.ts`
- `supabase/functions/generate-flashcards/index.ts`

Changed:
- `src/App.tsx` (routes)
- `src/components/layout/Sidebar.tsx` (nav items)
- `src/types/index.ts` (new interfaces)
- `package.json` (new deps)
- `supabase/config.toml` (register functions)
