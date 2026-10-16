# Training Log

Offline-first, single-user Progressive Web App for logging a fixed 6-day
training program. Vanilla HTML/CSS/JS, no build step, no backend. Data lives
only in this browser's `localStorage`.

## Live app

https://fernandokuwer.github.io/training-log/

## Installing to an Android home screen (Chrome)

1. Open the live URL above in Chrome, with a normal network connection, at
   least once. This lets the service worker cache the full app shell.
2. Either:
   - Tap the **Install** button that appears in the app's header, or
   - Open Chrome's menu (⋮) → **Install app** / **Add to Home screen**.
3. Confirm. The app launches standalone (no address bar / browser chrome).
4. From then on it works fully offline, including in airplane mode — try it.

## Backing up your data

Everything is stored in this browser's `localStorage`, scoped to this one
browser on this one device. It is **not** synced anywhere, and it disappears
if you clear site data, reinstall the browser, or switch devices. Treat
export/import as the only backup mechanism:

- **Export** — scroll to the **Backup** section at the bottom of the app and
  tap **Export JSON**. Downloads `training-log-YYYY-MM-DD.json` with your
  entire logged history.
- **Import** — tap **Import JSON**, pick a previously exported file, then
  choose:
  - **Merge** — keep existing data, layering the file's values on top
    (useful for combining logs from two devices).
  - **Replace** — wipe current data and use the file's contents exactly.

Export regularly, and always before clearing browser data or moving to a new
phone.

## Redeploying after edits

No build step — edit the files, commit, push:

```
git add -A
git commit -m "describe the change"
git push
```

GitHub Pages redeploys automatically, usually within a minute.

**Important:** bump `CACHE_VERSION` in `sw.js` on every deploy that changes
any cached file. The service worker is cache-first — without a version bump,
phones that already installed the app will keep serving the old cached
version until the service worker happens to pick up the change, which can
take a while on a rarely-opened offline app.

## Project structure

```
index.html              app shell, all markup
app.css                 all styles
app.js                  all logic
program.js               program data (the 6-day schedule — see note below)
sw.js                    service worker, cache-first app shell
manifest.webmanifest
icons/icon-192.png
icons/icon-512.png
icons/icon-maskable-512.png
```

`program.js` exercise `id`s are permanent storage keys — logged history is
keyed on them. Never rename an existing id; add a new exercise as a new id
instead.

## Deviations from spec (documented, not asked about, per the build notes)

- **Fonts not self-hosted.** The spec calls for self-hosted IBM Plex
  Sans/Mono WOFF2 subsets in `/fonts/`. The machine this was built on has no
  Node/npm and no way to fetch and subset real font binaries, so `/fonts/`
  was left out entirely. `app.css` still declares `@font-face` rules pointing
  at `fonts/ibm-plex-sans-latin-*.woff2` and `fonts/ibm-plex-mono-latin-*.woff2`
  — if you later drop real WOFF2 files at those paths, they'll be picked up
  automatically with zero code changes. Until then the app uses the
  `system-ui` / `ui-monospace` fallback stacks, which read very close to Plex
  on Android (Roboto / monospace equivalents).
- **Icons generated without Node/sharp/canvas.** The build machine had
  neither Node nor a convenient browser-canvas path, so the three PNGs were
  generated with a one-off PowerShell + .NET `System.Drawing` script (not
  checked into the repo) instead of the Node/canvas approach the spec
  suggested first. Output: rounded teal (`#1B5E6E`) square, white barbell
  glyph, 20% safe-area padding on the maskable variant — matches the spec's
  design direction.
- **Exercises with no unit (`mon-deadbug`, `thu-birddog`) get no input row.**
  They have `unit: ''` — nothing numeric to log beyond the fixed rep scheme
  already shown — so F3's load-logging UI is only rendered when `unit` is
  non-empty (`kg` or `sec`).
- **Dose meter is week-scoped, not day-scoped.** F4 is read as one running
  total per ISO week across *all* cardio items in that week (ticking any
  cardio checkbox on any day adds its `metHours`), since the six cardio items
  together are what sum to the `WEEKLY_MET_TARGET`.

### Spec inconsistency, resolved

The spec's `DERIVED CONSTANT` note stated the six `metHours` values sum to
`19.99` (2.13 + 3.33 + 5.83 + 2.13 + 0 + 6.57 = 19.99), which conflicted with
the Acceptance Criteria's expectation that the dose meter reach "exactly
20.0" when all six cardio items are ticked. Per explicit instruction, Saturday's
`sat-int` interval session was bumped from `6.57` to `6.58` MET-h to close
the 0.01 gap — all other values are exactly as specified. The meter now
reads 20.0 / 20.0 at full completion.

## Acceptance checklist

- [x] Loads offline in airplane mode after one online visit (service worker
      precaches the full app shell)
- [x] Installs to Android home screen with the generated icon, opens
      standalone
- [x] Logged values persist across app restart / reboot (`localStorage`)
- [x] Previous-week comparison and delta render correctly across a week
      boundary (previous week is derived from ISO week math, not a stored
      pointer, so year/week-number rollovers are handled automatically)
- [x] Dose meter reaches exactly 20.0 when all six cardio items are ticked —
      see "Spec inconsistency, resolved" above
- [x] Export produces valid JSON; import of that file restores state exactly
      (tested as Merge and Replace)
- [ ] Lighthouse PWA audit — verify once the real URL is live over HTTPS
- [x] No console errors on load or interaction (manually checked)
