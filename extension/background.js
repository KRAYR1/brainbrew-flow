// Service worker: mostly passive. Storage changes propagate automatically to
// content scripts. We keep this here for future messaging needs and to satisfy
// the MV3 requirement.
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("bb_state", (r) => {
    if (!r.bb_state) {
      chrome.storage.local.set({
        bb_state: {
          isRunning: false,
          mode: "work",
          blockerEnabled: false,
          sites: [],
          updatedAt: Date.now(),
        },
      });
    }
  });
});
