// Runs inside BrainBrews. Mirrors Pomodoro state + blocker settings from the
// page into chrome.storage.local so the guard.js content script (running on
// other sites) can read them.
(function () {
  const STORAGE_KEY = "brainbrew-blocker";

  let latest = {
    isRunning: false,
    mode: "work",
    blockerEnabled: false,
    sites: [],
    updatedAt: Date.now(),
  };

  function readBlocker() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { enabled: false, sites: [] };
      const parsed = JSON.parse(raw);
      return {
        enabled: !!parsed.enabled,
        sites: Array.isArray(parsed.sites) ? parsed.sites : [],
      };
    } catch {
      return { enabled: false, sites: [] };
    }
  }

  function push() {
    const b = readBlocker();
    latest = {
      isRunning: latest.isRunning,
      mode: latest.mode,
      blockerEnabled: b.enabled,
      sites: b.sites,
      updatedAt: Date.now(),
    };
    try {
      chrome.storage.local.set({ bb_state: latest });
    } catch (e) {
      // extension context invalidated (reloaded) — ignore
    }
  }

  // Listen for Pomodoro broadcasts.
  window.addEventListener("pomodoro:state", (e) => {
    const d = e.detail || {};
    latest.isRunning = !!d.isRunning;
    latest.mode = d.mode || "work";
    push();
  });

  // Poll blocker settings (localStorage `storage` event doesn't fire in the
  // same tab that wrote it).
  setInterval(push, 2000);

  // Initial push.
  push();

  console.log("[Whiskers bridge] active on", location.hostname);
})();
