# Vlnová délka — Project Plan

A Czech-first, one-phone, pass-and-play Wavelength. Built as an installable PWA for
Barbora's iPhone 14 Pro Max — no App Store, no developer account, no server.
Companion document: [RESEARCH.md](RESEARCH.md).

---

## Guiding principles

1. **One phone, passed around.** Zero networking. All state lives on the device.
2. **As few screens as possible.** The dial IS the game. Everything else is a thin
   shell around it.
3. **Expandability is a launch feature, not an afterthought.** Adding a prompt must
   be doable mid-game-night in under 20 seconds, by anyone.
4. **Czech first, English available.** One global language toggle; prompts are
   per-language and translation is optional.
5. **No build step, no framework.** Plain HTML/CSS/JS. One person (or one Claude)
   can understand the whole codebase forever. Nothing to break in two years.

## Screen map (updated 2026-07-18 — no welcome screen)

```
app opens ─► ┌──────────────┐  Skrýt a předat  ┌───────────────┐
             │  NAPOVÍDÁŠ   │ ───────────────► │ PŘEDEJ TELEFON│
             │ dial+target  │                  │ gate [Hádám]  │
             └──────────────┘                  └──────┬────────┘
                    ▲                          ┌──────▼───────┐
             ┌──────┴────────┐                 │    HÁDÁŠ     │
             │PŘEDEJ DRUHÉMU │                 │ dial, drag   │
             │TÝMU [Napovídám]│                └──────┬───────┘
             └───────────────┘                 Odhalit│
                    ▲                          ┌──────▼───────┐
                    └───────────  Další ────── │   ODHALENÍ   │
                                               │ target+score │
                                               └──────────────┘

secret gesture (anywhere in-game) ─► ┌─────────────────────────┐
                                     │  KONFIG (hidden screen) │
                                     │ • wipe scores           │
                                     │ • add prompt            │
                                     │ • manage/switch batches │
                                     │ • language CZ/EN        │
                                     └─────────────────────────┘
```

- **No welcome screen.** The app boots straight into a live round (blue team's
  Napovídáš view). Zero friction between "open the app" and playing.
- **Napovídáš / Hádáš / Odhalení are one screen, three states** — same semicircular
  dial component throughout; what changes is whether the target is visible, whether
  the dial is draggable, which button shows, and the screen fill (team color system).
- **Pass gates**: full-screen black interstitials — *Předej telefon* [Hádám] within
  a team, *Předej druhému týmu* [Napovídám] between teams — so the target can never
  be accidentally seen mid-handoff.
- **KONFIG — the hidden config screen.** Not discoverable in the UI; opened by a
  secret gesture only Barbora (and trusted family admins) know. Current pick:
  **triple-tap the state chip (top-left corner) within ~1 second** — deliberate,
  never triggered by normal play, and works with iOS's touch quirks (long-press
  alternatives fight the system's text-selection/callout behaviors). In KONFIG:
  - **Wipe scores** — reset both teams to 0 for a fresh game night (with confirm).
  - **Add prompt** — the two-field form (left/right end), active language first,
    optional other-language fields.
  - **Manage prompt batches** — view/delete user prompts, and switch which batch
    (deck) is in play — e.g. seed deck, family-made deck, or both.
  - **Language toggle CZ/EN.**
  - Exit returns to the game exactly where it left off.

## Game rules (v1) — updated 2026-07-18

- **Two teams, alternating rounds**: MODRÝ TÝM and ZELENÝ TÝM. Each round one team's
  Napovídač gives the clue and their team guesses; then the phone passes to the other
  team (dedicated black "PŘEDEJ DRUHÉMU TÝMU" screen). Separate running scores per
  team, shown under the team name (current team big, opponent smaller).
- **Scoring ladder** (Barbora's spec, differs from official 4/3/2): bullseye
  **Hoří +5**, then **Teplo +3**, **Přihořívá +2**, miss **Zima 0**.
- **Screen color system**: each team has a light fill for clue-giving and a deep fill
  for guessing (blue pair / green pair); the reveal screen fill matches the scored
  band color (red/orange/yellow/gray).
- **Scorebug (no team words in the header)**: two team-colored chips with score
  numerals, top right; the active team's chip is "lifted" with the hard shadow.
  Team identity is carried entirely by color — the teams are named Blue and Green.
- Target position is random each round; cards are drawn without repeats until the
  active-language pool is exhausted, then reshuffled.
- **Skip a card without extra chrome**: on the Napovídáš screen, tapping the prompt
  labels themselves opens a full-screen confirm styled like the pass gates — big
  „PŘESKOČIT?" with buttons „PŘESKOČIT!" (draws a new card + target) and „ZRUŠIT".
  No new buttons on the play screen; the prompt is the affordance.

## Data model & storage

```js
// Seed prompts: prompts.js shipped with the app (versioned with the code)
// User prompts: localStorage key "wavelength.userPrompts"
{ id: "p042", cs: ["Studené", "Horké"], en: ["Cold", "Hot"] }   // en optional, and vice versa
```

- **Prompt polarity convention (always)**: the LEFT end of the spectrum is the
  "negative" pole (less, worse, colder, weaker, more mundane…), the RIGHT end the
  "positive" pole (more, better, hotter, stronger, more extreme…). Every seed and
  user prompt must follow this orientation — it keeps the dial intuitive and
  consistent across cards. E.g. „Studené → Horké", „Trapné → Cool",
  „Naprosto ne-kačenka → Klasická kačenka".
- Active language filters the pool: a prompt participates iff it has labels in that
  language. Used-card tracking and score persist across accidental refreshes
  (localStorage), so a bumped phone never loses a game night.
- **Seed deck: ~120 prompts**, authored Czech-first across the categories in
  RESEARCH.md §3 (physical, opinion, moral/social, absurd, family-friendly pop
  culture), most with English versions, plus a handful of Czech-culture-only cards.
- **Backup**: settings offers one-tap export of user prompts (share sheet / copy as
  JSON) and paste-to-import. Cheap insurance, also how family members' best cards
  can migrate into the seed deck later.

## Technical notes

- **Stack**: `index.html` + `style.css` + `app.js` + `prompts.js` + `manifest.json` +
  `sw.js` + icons. SVG dial; pointer-events drag mapped to angle.
- **PWA**: standalone display, portrait-only layout with a "rotate back" overlay
  (iOS has no orientation-lock API), Screen Wake Lock during rounds (works on
  installed web apps since iOS 18.4), service worker for full offline.
- **Hosting**: GitHub Pages from a repo we'll create (free HTTPS, trivial updates:
  push → app self-updates next time it's online). Install once via Safari →
  Share → *Add to Home Screen*.
- **Testing during development**: local dev server + the in-app browser here, plus
  on-phone checks over the local network or via the deployed page.

## Build phases (with your checkpoints)

**Phase 0 — Alignment (now).** You review both documents and the open questions
below. ✋ *Checkpoint: green-light the plan.*

**Phase 1 — The dial.** Static page with the semicircular dial: target wedge
rendering, smooth drag, the hide/reveal states, reveal animation. This is the soul
of the app — we get it feeling great in the browser preview before anything else.
✋ *Checkpoint: you play with the dial.*

**Phase 2 — The game loop.** Round flow (Napovídáš → pass gate → Hádáš → Odhalení →
team handoff), team scoring, card skip, ~20 placeholder prompts. **Done** —
including localStorage persistence: scores, team turn, current card, target,
needle, and any open overlay survive a refresh or accidental close.
✋ *Checkpoint: you play a full two-team cycle in the preview.*

**Phase 3 — The prompt engine + hidden KONFIG screen.**
- **3a — Prompt engine + seed deck v1. Done.** `prompts.js` (~45 CZ-first cards,
  EN where it translates cleanly, polarity left−/right+). No-repeat drawing from a
  language-filtered pool of seed + user cards; user cards and settings persist in
  localStorage; the current card + used-set survive refresh.
- **3b — KONFIG screen. Done.** Secret entry = triple-tap the state tag. Inside:
  add-a-card form (active language + optional other language, polarity-labeled),
  manage/delete your cards, CZ/EN toggle, wipe scores (with confirm).
- **3c — Grow the seed deck to ~120. Next.** The big content pass to review together.
- **3d — Export/import backup + batch switching. Todo.**
✋ *Checkpoint: you review the seed prompts (you know your family!), the gesture,
and the add flow.*

**Phase 4 — Feel & polish.** Typography, colors, animations, sound-free juice,
wake lock, rotate guard, empty states, Czech UI copy check.
✋ *Checkpoint: final look-and-feel pass.*

**Phase 5 — Ship to your phone.** Create GitHub repo, deploy to Pages, PWA
manifest/service-worker verification, walk you through Add to Home Screen, on-phone
smoke test. ✋ *Checkpoint: it's on your home screen and works in airplane mode.*

**Phase 6 — Family playtest & iterate.** You play with real humans; we fix what
annoys them.

## Decisions (answered 2026-07-17)

1. **Score display**: running co-op total, dismissible. ✅
2. **Seed deck tone**: family-safe with wit; cheeky and slightly controversial is
   fine, nothing explicitly sexual. ✅
3. **App name**: **„Přihořívá"** (Barbora's pick — the Czech hot/cold guessing
   shout, "getting warmer!"). No official Czech edition of Wavelength exists, so
   the name is fully ours. 9 chars — fits the home-screen label. ✅
4. **Hosting**: Barbora has a GitHub account; deploy via GitHub Pages. ✅
