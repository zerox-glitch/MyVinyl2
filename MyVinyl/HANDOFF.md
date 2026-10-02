# Vynyl Record — Android (PWA) handoff

React 19 + Vite 8 + Tailwind v4 + three.js. Runs as an installable Android PWA.

## Run
pnpm install && pnpm dev     # pnpm build -> dist/ (deploy over HTTPS to install on Android)

## Map
- src/App.tsx — app shell: bottom tabs (Studio / Master Vault), Player overlay. Full-screen on phones, Android device frame on wide screens.
- src/screens/Studio.tsx — mic recording / file import, vinyl preset + appearance selection, pressing.
- src/screens/Vault.tsx — saved records list.
- src/screens/Player.tsx — playback, seek, label photo (add/replace/remove).
- src/components/Turntable.tsx — three.js turntable: spinning record, label photo texture, tonearm (lower on play, tracks progress, lifts on seek, rests on pause/end).
- src/lib/dsp.ts — vinyl DSP (saturation, wow, flutter, noise, crackle, pops) + WAV export.
- src/lib/db.ts — IndexedDB persistence (records, audio, label photos).
- src/lib/pro.ts — Free vs Pro: limits, which items are free, plans, entitlement store, DEMO billing adapter, free-export watermark.
- src/components/Paywall.tsx — paywall / plan sheet, ProBadge, Go Pro header button.
- public/manifest.webmanifest, public/sw.js, public/icon.svg — PWA install + offline.

## Native APK
Wrap with Capacitor: `npx cap init`, `npx cap add android`, add RECORD_AUDIO permission to AndroidManifest.xml, `pnpm build && npx cap sync`.

## Notes
- vite.config.ts imports `.figma/make/site.json` (page title/meta). Keep the hidden `.figma/` folder when copying the project, or remove that import and the `figmaSiteConfiguration(...)` plugin line and set `<title>` in index.html directly.
- The other `figma*` plugins in vite.config.ts are dev-only helpers for Figma Make and can be safely deleted outside it.

## Paywall & Google Play Billing
- All gating reads `src/lib/pro.ts` (`FREE` limits, `isFree()`, `usePro()`, `openPaywall()`). To change what's free, edit `FREE` only.
- `billing.purchase()` / `billing.restore()` are a DEMO: they store Pro in localStorage, no payment. Replace just these two with Google Play Billing:
  - TWA (Bubblewrap): Digital Goods API `window.getDigitalGoodsService('https://play.google.com/billing')` + PaymentRequest; restore = `service.listPurchases()`.
  - Capacitor: a Play Billing plugin; restore = query purchases for the signed-in Google account.
- Create Play Console products with ids `monthly`, `yearly` (subscriptions) and `lifetime` (one-time, non-consumable). Acknowledge purchases after granting Pro.
- Restore needs no server — Google returns what the account owns. A server is optional (receipt verification, real-time subscription notifications).
- Remove `billing.signOutDemo()` and its "Switch back to Free (demo)" link, and the "Demo build" line in Paywall.tsx, before release. Point the Terms/Privacy links at real pages.
- Storage stays local (IndexedDB); Pro status restores via Google, records do not move between phones.
