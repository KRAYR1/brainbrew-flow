## Goal

Let users upload study materials inside Brainy B, then ask it to do whatever they want with them — make notes, build a flashcard deck, or quiz them with grading and explanations — always grounded in the uploaded content.

## 1. Study Materials library

- New "Materials" panel on the Brainy B chat page (drawer on mobile, side panel on desktop).
- Drag-and-drop or file-picker upload of PDF, DOCX, TXT, MD. Text is extracted in the browser with the existing extractor, so files never leave the device — only text is sent.
- Each material is saved locally with name, extracted text, word count, and date. Users can rename, delete, and preview.
- Checkbox per material to include it in the current request. A header chip shows "3 materials active".
- Long materials are trimmed to a safe size before sending, with the most relevant sections prioritized.

## 2. Grounded Brainy B

- Selected material text is passed to the assistant as clearly delimited source material, with instructions to answer only from it and to say when something isn't covered.
- Brainy B decides what to do based on the user's request — no mode switch needed:
  - "make notes on this" → creates a note in Notes, grounded in the material
  - "make me a deck" → creates a flashcard deck with SM-2 fields initialized, opens in Flashcards
  - "quiz me" → starts an in-chat quiz
- Quick-action buttons above the composer (Summarize, Make notes, Make a deck, Quiz me) just prefill the message, so everything stays conversational.

## 3. Quiz mode with grading

- Brainy B asks one question at a time from the material, waits for the answer, then grades it (correct / partially correct / incorrect), explains why, cites the relevant part of the source, and moves on.
- Running score shown in the chat header while a quiz is active; end-of-quiz summary lists weak spots.
- A "Save as deck" action turns the quizzed questions into a flashcard deck.

## Technical notes

- New `src/hooks/useStudyMaterials.ts` (localStorage-backed) and `src/components/chat/MaterialsPanel.tsx`; `Material` type added to `src/types/index.ts`.
- `src/pages/Chat.tsx` gains the panel, quick actions, and passes `materials` in the request context.
- `supabase/functions/jarvis-assistant/index.ts`: accepts a `materials` payload, injects it as grounded source material in the system prompt, adds `start_quiz`, `grade_answer`, and `end_quiz` tools alongside the existing ones, and keeps the strict no-outside-knowledge rule from the flashcard function.
- `src/contexts/AssistantContext.tsx`: handles the new quiz tools and ensures AI-created decks get SM-2 fields via `initCard`.
- Storage guard: warn when total material text approaches the browser storage limit.
