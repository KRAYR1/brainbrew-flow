# Whiskers Companion Extension — Build Plan

## Goal
A downloadable Chrome/Chromium extension that enforces BrainBrews' blocked-sites list on external sites (YouTube, Netflix, etc.) during Pomodoro **work** sessions, using the same Whiskers overlay + `cat-intent` AI classifier.

## Architecture (how the pieces sync)

```text
 BrainBrews tab                    Extension                  Blocked site tab
 --------------                    ---------                  ----------------
 Pomodoro state  ──►  chrome.storage.local  ──►  content script reads state
 Blocked list    ──►  (via bridge script)        │
                                                 ▼
                                          If work session + host matches
                                                 ▼
                                          Inject Whiskers overlay iframe
                                                 ▼
                                          User submits intent
                                                 ▼
                                          fetch() → cat-intent edge fn
                                                 ▼
                                          entertainment → lock + redirect btn
                                          study        → fade out
```

**Sync mechanism:** BrainBrews already broadcasts a `pomodoro:state` CustomEvent and stores the blocked list in `localStorage["brainbrew-blocker"]`. A tiny **bridge content script** injected only on the BrainBrews origin listens for both and mirrors them into `chrome.storage.local`, which the extension's other content scripts read.

## Deliverables

### 1. Extension source — `extension/` directory in the repo

- `extension/manifest.json` — MV3, permissions: `storage`, `activeTab`, `scripting`; `host_permissions` for the BrainBrews origins (preview + published + localhost) and `<all_urls>` for the overlay content script.
- `extension/background.js` — Service worker. Listens for storage changes; on timer end, broadcasts a message to all tabs to remove the overlay.
- `extension/bridge.js` — Content script matched to BrainBrews origins only. Listens to `window` for `pomodoro:state` events and polls `localStorage["brainbrew-blocker"]`. Writes `{ isRunning, mode, blockerEnabled, sites, updatedAt }` into `chrome.storage.local`.
- `extension/guard.js` — Content script matched to `<all_urls>`. On load:
  1. Reads `chrome.storage.local` state.
  2. If (work session running) AND (blocker enabled) AND (current hostname matches any blocked site), injects the overlay.
  3. Subscribes to `chrome.storage.onChanged` to remove the overlay when the timer ends / mode changes to break.
- `extension/overlay.js` + `extension/overlay.css` — Vanilla-JS re-implementation of the FocusGuardOverlay visual (starfield, gradient bg, chatbot card, buttons). Uses a Shadow DOM root to avoid host-page CSS collisions. Fires `fetch()` directly at the cat-intent edge function URL with the anon key (both public).
- `extension/icon.png` (128×128) — Whiskers icon.

### 2. BrainBrews-side changes

- **`src/hooks/useBlockedSites.ts`** — no logic change, but bump a `updatedAt` timestamp on every write so the bridge sees changes reliably (optional; storage event already fires).
- **`src/components/PomodoroTimer.tsx`** — verify it already dispatches `pomodoro:state`; if it only dispatches on start/stop, ensure it also dispatches on mode change and completion. (Read-only check first; edit only if missing.)
- **New page section: `src/pages/Settings.tsx`** — add a "Companion Extension" card under the existing Blocked Sites section:
  - Brief 3-step install guide.
  - **Download button** that fetches `/whiskers-extension.zip` as a blob and triggers download (the workaround required for Lovable preview auth).
  - Link to `chrome://extensions` with copy button.

### 3. Packaging

- Zip `extension/` into `public/whiskers-extension.zip` using `nix run nixpkgs#zip` so it's served as a static asset at `/whiskers-extension.zip`.
- Re-zip whenever extension source changes (documented in a short `extension/README.md`).

## Behavior details

- **Trigger condition:** `state.isRunning === true && state.mode === "work" && state.blockerEnabled && sites.some(s => location.hostname.endsWith(s.url))`.
- **Overlay removal:** Any storage change where the new state fails the trigger → overlay fades and is removed from the DOM.
- **AI call from extension:** `POST https://jkoctfltndapqerdmgvn.supabase.co/functions/v1/cat-intent` with `apikey` + `Authorization: Bearer <anon>` headers. Both keys are already public.
- **Entertainment lock:** Overlay stays until either (a) user clicks "Take me to BrainBrews →" (opens BrainBrews in the same tab), or (b) the Pomodoro ends (auto-unlock).
- **Study approval:** Overlay fades, but re-triggers if the user navigates to another blocked site in the same work session (each page load re-checks).
- **No overlay on BrainBrews itself:** guard.js checks `location.hostname` against the BrainBrews origins and skips — the in-app `FocusGuardOverlay` handles that case.

## Out of scope

- Firefox port (Manifest V3 support differs; can be added later).
- Chrome Web Store publishing (unpacked install only, per Lovable extension guide).
- Blocking sites when *no* BrainBrews tab has ever been opened (bridge needs at least one visit to seed `chrome.storage.local`). Documented in the install guide.

## Verification

1. Build zip, confirm it appears at `/whiskers-extension.zip`.
2. Load unpacked in Chrome, open BrainBrews, start a work Pomodoro, open youtube.com in a new tab → overlay should appear within ~1s.
3. Type "watch a video" → entertainment card + redirect button.
4. End the Pomodoro → overlay auto-removes from the YouTube tab.
5. Start a break session → no overlay on newly-opened blocked sites.
