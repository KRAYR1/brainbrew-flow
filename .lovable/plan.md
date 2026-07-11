# Convert BrainBrew into an Installable App

Turn BrainBrew into an **Installable Web App (PWA)** so students can add it to their phone's home screen and launch it like a native app — no app store, no extra tooling. This is the fastest, lowest-friction path and fits BrainBrew's browser-first, offline-by-localStorage design.

If you later want App Store / Play Store distribution, we can wrap the same app with Capacitor as a follow-up.

## What the user will get

- A real app icon on iPhone and Android home screens
- Launches fullscreen (no browser address bar), feels like a native app
- Splash screen with BrainBrew branding and theme color
- Works on desktop too (installable via Chrome/Edge)

## What I'll build

1. **Web app manifest** (`public/manifest.webmanifest`)
  - Name: "BrainBrews: A Digital Knowledge and Task Management Platform", short name: "BrainBrews"
  - `display: standalone`, `start_url: /`, `scope: /`
  - Theme + background colors matched to BrainBrew's brand
  - Icon entries (192, 512, maskable)
2. **App icons** (`public/`)
  - Generate a BrainBrew icon set: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `favicon.ico`
3. **Head tags** in `index.html`
  - Link the manifest, theme-color meta, apple-touch-icon, apple-mobile-web-app-capable, and status bar style

## What I will NOT add (by design)

- No service worker, no `vite-plugin-pwa`, no offline caching — you didn't ask for offline, and BrainBrew's data already lives in localStorage. Adding a service worker in the Lovable preview causes stale-cache issues.
- No changes to app features, routing, auth, or data layer.

## Technical notes

- Icons will be generated fresh to match BrainBrew's brand (brain/beaker motif, on-brand accent color).
- Install prompts vary by browser: iOS Safari uses Share → Add to Home Screen; Android Chrome shows an install banner automatically.
- Installability works on the **published** app (`brainbrew.lovable.app` or your custom domain), not inside the Lovable editor preview iframe.

## After implementation

I'll tell you exactly how to install it on iPhone and Android so you can test on your own device.