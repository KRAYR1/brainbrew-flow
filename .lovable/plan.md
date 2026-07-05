
# BrainBrew Launch Polish Plan

Positioning: **"The All-in-One Student OS"** — one workspace that replaces Notion + Todoist + Google Calendar + Anki + Forest + ChatGPT for students. Whiskers is the AI layer that ties it together.

Delivered in three sequenced phases so you always have something shippable.

---

## Phase 1 — Demo Mode (ship-ready showcase)

Goal: anyone (investor, professor, first user) can hit the site and *experience* the app in 15 seconds — no signup, no empty screens.

1. **"Try the demo" entry point** on the landing page and login screen → seeds localStorage with a realistic student persona ("Maya, sophomore, Bio major").
2. **Seed dataset**:
   - 3 subjects (Biology, Calculus II, English Lit) with distinct accent colors
   - 12 tasks across today / this week / overdue
   - 6 notes (lecture notes, essay draft, formula sheet…)
   - 2 flashcard decks with SM-2 progress mid-review
   - Calendar events for the next 14 days
   - Pomodoro history (last 7 days of sessions)
   - A short Whiskers chat history
3. **"Demo mode" banner** at top: "You're exploring a demo. [Reset] · [Sign up to save]".
4. **Reset button** wipes and re-seeds cleanly.
5. **Guided tour** (optional, dismissable) — 5-step spotlight tour: Dashboard → Tasks → Flashcards → Pomodoro → Whiskers.

## Phase 2 — In-App UX Polish

Goal: every screen feels intentional and consistent, so the pitch-deck screenshots sell themselves.

1. **Onboarding flow** for new (non-demo) users: 3 screens — pick subjects & colors, add first task, meet Whiskers.
2. **Empty states** across every feature (tasks, notes, flashcards, calendar, chat) — illustrated, single CTA, no dead screens.
3. **Consistency pass**:
   - Unified page headers (title + subtitle + primary action)
   - Consistent card/list styling across notes, tasks, decks
   - Consistent spacing scale, button hierarchy, icon set
4. **Micro-animations**: fade-in on route change, scale-in on card open, subtle Whiskers idle animation.
5. **Dashboard upgrade**: hero "Today" view — today's tasks, next class, due flashcards, pomodoro streak, Whiskers nudge — all above the fold.
6. **Loading & error states** for every async surface (AI calls, exports).
7. **Keyboard shortcuts** + a `?` shortcut cheatsheet modal.
8. **Mobile responsive audit** (still web, but pitch demos happen on phones).

## Phase 3 — Landing Page + Pitch Deck

Goal: a public-facing site and a downloadable deck that sell the "Student OS" story.

### Landing page (`/`, when logged out)

Sections, in order:
1. **Hero** — headline "The Operating System for Students", subhead, two CTAs: "Try the demo" (no signup) and "Sign up free".
2. **Problem strip** — "Your notes are in Notion. Tasks in Todoist. Flashcards in Quizlet. Focus in Forest. Chat in ChatGPT. Five apps. Five subscriptions. Zero context."
3. **Solution / product showcase** — animated screenshots (real UI), one per pillar: Notes · Tasks · Calendar · Flashcards · Focus · Whiskers AI.
4. **"Whiskers" spotlight** — the AI companion, patent-pending badge.
5. **How it works** — 3 steps: Add your subjects → Live your semester → Whiskers keeps you on track.
6. **Feature grid** — 6 tiles covering the pillars.
7. **Social proof placeholder** — testimonial slots + "As seen in / Trusted by" logo row (empty-state ready).
8. **Pricing tease** — Free / Student Pro (coming soon) / Campus (B2B, contact).
9. **FAQ**.
10. **Footer** with links to pitch deck, patent notice, contact.

### Pitch deck (`/pitch` route + downloadable PDF)

Built with the slides skill (1920×1080, in-app viewer + print/PDF export):

1. Title — BrainBrew: The Student OS
2. The problem — app fragmentation for students (stats + quotes)
3. The insight — students don't need another app, they need one context
4. The product — screenshot montage of the six pillars
5. Whiskers — the AI layer + patent-pending
6. Demo — QR code + short URL to the live demo
7. Market — TAM (global higher-ed students), SAM, SOM
8. Business model — Free → Student Pro ($3/mo) → Campus licensing
9. Traction / roadmap — where we are, next 6/12 months
10. Competition — feature matrix vs Notion/Todoist/Anki/Forest
11. Moat — patent + AI context graph + switching costs (all data in one place)
12. Ask — what you're raising and what it funds
13. Team + contact

Deck is viewable in-browser (present mode, keyboard nav) and exportable as PDF.

---

## Technical Details

- **Demo seed**: single `src/lib/demoSeed.ts` module exporting a `seedDemoWorkspace()` function that writes to the same localStorage keys the app already uses. Guarded by a `brainbrew:demo` flag so the reset/exit banner knows to show.
- **Landing page**: new `src/pages/Landing.tsx` mounted at `/` for unauthenticated users; existing dashboard becomes `/app`. Route guard in `App.tsx`.
- **Pitch deck**: `src/pages/pitch/` using the slides-app skill pattern — `ScaledSlide` + `SlideLayout` at 1920×1080, `?print` param for PDF export, keyboard nav for present mode.
- **Design system**: audit `index.css` tokens; add landing-specific tokens (hero gradient, marketing-only accents) as semantic tokens, not hardcoded.
- **Animations**: use existing `fade-in`, `scale-in`, `hover-scale` utilities; add framer-motion only for landing hero if needed.
- **No backend changes** in phase 1–2. Phase 3 landing can stay static; email capture (if added) would go through Lovable Cloud.
- **SEO**: real `<title>` and `<meta description>` in `index.html`, Open Graph tags, single H1 on landing.

---

## Suggested build order (each phase is independently shippable)

1. Phase 1 (demo seed + banner + tour) — ~1 build turn
2. Phase 2 (onboarding, empty states, consistency, dashboard) — 2–3 turns
3. Phase 3a (landing page) — 1–2 turns
4. Phase 3b (pitch deck) — 1–2 turns

Approve and I'll start with Phase 1.
