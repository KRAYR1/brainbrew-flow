# Whiskers — BrainBrews Focus Guard

Companion Chrome extension. Overlays the Whiskers AI cat on blocked sites
(YouTube, Netflix, etc.) whenever a BrainBrews Pomodoro **work** session is
running.

## Install (unpacked)
1. Download & unzip `whiskers-extension.zip` from BrainBrews Settings.
2. Open `chrome://extensions`.
3. Toggle **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped folder.

Open BrainBrews at least once so the extension can read your Pomodoro state
and blocked list.

## Repackage after edits
```bash
rm -f public/whiskers-extension.zip
cd extension && nix run nixpkgs#zip -- -r ../public/whiskers-extension.zip .
```
