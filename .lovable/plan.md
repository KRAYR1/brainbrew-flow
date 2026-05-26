Update the website name from "BrainBrew" to "BrainBrews" in all locations across the codebase.

Files to update:
1. `src/components/layout/Sidebar.tsx` — Logo text: `Brain<span>Brew</span>` → `Brain<span>Brews</span>`
2. `src/pages/Settings.tsx` — Descriptive copy mentioning "BrainBrew experience" and "BrainBrew looks"
3. `src/pages/Notes.tsx` — PDF export title "BrainBrew Notes"
4. `supabase/functions/study-chat/index.ts` — System prompt identity "BrainBrew Tutor"

This is a find-and-replace rename with no functional changes.