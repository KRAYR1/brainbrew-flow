## Goal
Make BrainBrews fully responsive so it fits properly on iPhone and Android screens (and tablets), instead of the current desktop-only layout that assumes a fixed 256px sidebar and wide viewport.

## Current problem
- `Layout.tsx` hardcodes `ml-64` on `<main>`, so on a 375px phone the content is pushed off-screen behind a 256px sidebar.
- `Sidebar.tsx` is a fixed `w-64` left rail always visible — no mobile drawer/hamburger.
- Several pages use desktop-first grids (`grid-cols-3`, wide cards, right-aligned headers) that squash on small screens.
- `viewport-fit=cover` is set, but no safe-area padding is applied, so iPhone notch/home-indicator overlaps content.
- Pomodoro, Flashcards, Chat, Calendar, Timetable have wide fixed elements that overflow on mobile.

## What to build

### 1. Responsive shell (biggest win)
- Convert `Layout.tsx` + `Sidebar.tsx` into a responsive shell:
  - **Mobile (<768px):** sidebar becomes a slide-in drawer (shadcn `Sheet`), triggered by a top hamburger bar. Main content is full width, no left margin. Bottom tab bar for the 4–5 most-used routes (Dashboard, Notes, Assignments, Chat, Flashcards) for native-app feel.
  - **Tablet/Desktop (≥768px):** keep current fixed sidebar, `ml-64` main.
- Add a compact top app bar on mobile showing the current page title + hamburger + streak chip.
- Apply iOS safe-area insets (`env(safe-area-inset-top/bottom)`) to the top bar and bottom tab bar so notch/home-indicator don't overlap.

### 2. Page-level responsive passes
Sweep each page and swap desktop grids for `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` patterns, shrink paddings on mobile (`p-4 lg:p-8`), stack header rows, and make tables/wide cards horizontally scrollable where needed:
- `Index` (dashboard) — stats grid 1→3 cols, header stacks.
- `Notes`, `Assignments`, `Flashcards`, `Calendar`, `Timetable`, `Chat`, `Settings` — same treatment; make modals/dialogs full-screen on mobile.
- `Auth` — center card, ensure it fits 320px width.
- `DemoBanner` — wrap to two lines / condense buttons on mobile.
- `FocusGuardOverlay` — ensure the cat + chat panel fit within small viewports.
- `PomodoroTimer` — shrink dial and controls for mobile.

### 3. Global CSS tweaks (`index.css`)
- Add `html, body { overscroll-behavior-y: none; }` for app-like feel.
- Add safe-area utility classes: `.pt-safe`, `.pb-safe`.
- Ensure base font sizes and tap targets are ≥44px on mobile.

### 4. Preview
- Switch preview to mobile viewport so you can see the changes immediately.

## Out of scope
- No changes to business logic, data, auth flow, AI, or Pomodoro behavior.
- No new native (Capacitor) packaging — it stays a PWA. (Say the word if you also want the native Capacitor wrap.)

## Technical notes
- Reuse existing shadcn `Sheet` for the drawer — no new deps.
- `useIsMobile()` hook already exists at `src/hooks/use-mobile.tsx`; use it to conditionally render drawer vs fixed sidebar and bottom tab bar.
- Bottom tab bar will add ~64px + safe-area bottom padding to main content on mobile only.
