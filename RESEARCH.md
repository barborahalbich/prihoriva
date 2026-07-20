# Wavelength — Research Notes

Research for building a Czech-first, one-phone, pass-and-play version of Wavelength.
Written 2026-07-17.

---

## 1. What Wavelength is

Wavelength (2019, CMYK; designed by Wolfgang Warsch, Alex Hague, Justin Vickers) is a
social guessing game built around a single brilliant mechanic: **a hidden target on a
spectrum between two opposing concepts**.

One player — the **Psychic** — secretly sees where a target sits on a spectrum like
*Hot ↔ Cold* or *Underrated ↔ Overrated*. They give a single clue (a word or short
phrase) that they think "lives" at that spot on the spectrum. Everyone else then turns
a dial to where they think the target is, based only on that clue. Reveal, score,
laugh, argue, pass to the next Psychic.

### Core loop (physical game)

1. Draw a spectrum card, e.g. *Cheap ↔ Expensive*.
2. Psychic peeks at the randomized hidden target (a wedge somewhere on a semicircular dial).
3. Psychic gives a clue: e.g. "airport sandwich".
4. The team discusses and turns the dial to where they think the target is. The Psychic
   must stay silent (this is agonizing and hilarious — it's a core part of the fun).
5. The screen opens: score based on how close the dial is to the target center.

### Official scoring

The hidden target is a wedge made of 5 bands:
- **4 points** — dial in the center band (bullseye)
- **3 points** — one band off (either side)
- **2 points** — two bands off (either side)
- **0 points** — outside the wedge entirely

In the competitive team game, the *opposing* team can also guess whether the true
target is left or right of the dial for 1 point, and first team to 10 wins. There's
also an official **co-op mode**: 7 rounds, everyone on one team, add up total points
and compare against a score table ("Are you on the same wavelength?").

**Relevance for us:** the left/right opposing-team mechanic requires stable teams and
adds a screen/step. For casual family pass-and-play, the co-op / free-for-all scoring
(cumulative points, or just per-round delight) is the better fit. The 4/3/2/0 wedge is
essential though — it's what makes near-misses feel dramatic.

---

## 2. Why the game is fun (what we must preserve)

- **The clue is the game.** All the joy is in the moment someone says "lukewarm coffee"
  for *Hot ↔ Cold* and the table erupts into debate. The app should get out of the way:
  spectrum + dial + reveal, nothing else competing for attention.
- **The Psychic's silent agony.** Watching your team confidently drag the dial to the
  wrong side while you can't say anything. The pass-the-phone format actually
  *strengthens* this — the Psychic literally hands over control.
- **The reveal.** A satisfying animated reveal of the target wedge is the emotional
  payoff of every round. Worth polishing.
- **Debatable middles.** Great spectra have a rich, contestable middle ground.
  *Hot ↔ Cold* works because "lukewarm" genuinely exists. *Round ↔ Pointy* works
  because a cactus is honestly hard to place.
- **Low rules overhead.** Anyone can join mid-game. Non-gamers get it in one round.
  Our UI must be explainable in one sentence: "Read the clue, drag the dial, tap reveal."

## 3. Anatomy of a good prompt (spectrum pair)

Patterns observed across the official decks and community prompt lists:

| Pattern | Examples | Why it works |
|---|---|---|
| Physical/objective | Hot ↔ Cold, Heavy ↔ Light, Round ↔ Pointy | Everyone shares the scale; disagreement is about the *clue*, not the axis |
| Opinion/subjective | Overrated ↔ Underrated, Guilty pleasure ↔ Openly proud | Sparks personal debates — great for families who know each other |
| Moral/social | Rude ↔ Polite, Ethical ↔ Sketchy, Red flag ↔ Green flag | Comedy from calibration differences between generations |
| Absurd/creative | Normal ↔ Cursed, Would survive a horror movie ↔ Dies first | The clue-giver gets to be funny |
| Knowledge-light pop culture | Masterpiece ↔ Disaster (movies), Famous ↔ Obscure | Careful: must work across generations & countries |

Qualities of the best pairs:
- **True opposites with a continuous middle** — not binary (avoid *Alive ↔ Dead*).
- **Instantly understood ends** — no explanation needed.
- **Clue-space is huge** — hundreds of things can plausibly be placed on it.
- **Symmetric fun** — both ends are interesting to give clues near.

Weak prompts to avoid: pairs where one end is boring or nothing exists near it,
pairs requiring niche knowledge, and pairs that are secretly binary.

### Czech-first considerations

- Direct translation often works for physical spectra (*Horké ↔ Studené*,
  *Těžké ↔ Lehké*) but **cultural pairs should be authored natively**, not translated
  (e.g. *Zakázané v ČSSR ↔ Povinné v ČSSR*-style prompts land with the family in a way
  no translation of an American card would).
- Czech adjectives inflect by gender; use neuter or noun-phrase forms that read
  naturally as spectrum labels (*Trapné ↔ Cool*, *Podceňované ↔ Přeceňované*).
- Data model implication: each prompt stores **cs and en label pairs independently**;
  a prompt may exist in only one language and simply not appear when the other
  language is active. Translation is optional, not forced.

## 4. The official digital version (what we're NOT doing)

The official app (wavelength.zone) leaned into **remote online multiplayer**: rooms,
join codes, every player on their own phone, synced over the network. That's exactly
what we're avoiding. Our model is the *board game* model: one shared device, passed
around, everyone physically together. This kills all networking complexity — no
server, no accounts, no sync. The entire game is local state on one phone.

## 5. Getting it on the iPhone (no developer account)

**Answer: a Progressive Web App (PWA) added to the Home Screen from Safari.**

- **Zero cost, no Apple account needed.** Host the static files anywhere with HTTPS
  (GitHub Pages is free), open the URL in Safari once, tap Share → *Add to Home
  Screen*. Done — an icon like any app.
- **Full screen:** with `display: "standalone"` in the web manifest, it launches with
  no Safari chrome — looks and feels native, own icon, own splash/status bar theming.
- **Offline:** a service worker caches everything; after install it works with no
  internet (important for the cottage in the Czech countryside).
- **Data persistence:** home-screen web apps have their **own isolated storage,
  exempt from Safari's 7-day script-storage eviction** — user-added prompts in
  localStorage/IndexedDB persist indefinitely as long as the icon stays on the
  home screen. (We'll still build a one-tap export/backup of custom prompts for
  peace of mind.)
- **Keeping the screen awake:** the Screen Wake Lock API works in installed
  home-screen web apps on iOS 18.4+ (your iPhone 14 Pro Max runs iOS 18+). We'll
  request a wake lock during rounds so the phone doesn't dim mid-guess.
- **Orientation:** iOS does **not** support the programmatic orientation-lock API.
  Mitigation: design **portrait-only**; the layout simply never needs rotating, and
  we show a gentle "rotate back" overlay if the phone is turned sideways. In
  practice a semicircular dial in portrait is exactly how the physical game looks.
- Known iOS PWA limits that **don't affect us**: no push notifications needed, no
  Bluetooth, no background processing — this game needs none of that.

### Update flow

Push new code to GitHub Pages → next time the app opens with internet, the service
worker fetches the new version. No app store review, ever. Custom prompts live in
device storage, so app updates never touch them.

## 6. Design implications for our version (summary)

1. **One phone, hot-seat**: Psychic view (target visible) → "pass the phone" gate →
   Guesser view (target hidden, dial draggable) → Reveal (animated, shows points).
2. **Scoring**: keep the 4/3/2/0 wedge. Default to a casual cumulative co-op score
   with optional two-team mode considered later; don't build the opposing-team
   left/right bet in v1.
3. **Prompt database is a first-class feature**: bundled seed deck (Czech-first,
   ~120+ pairs, most with English versions) + user-added prompts stored on device,
   addable through a dead-simple in-app form. Duplicate-avoidance when drawing cards.
4. **Language toggle**: global cs/en switch; prompts drawn only from the active
   language's pool.
5. **Portrait-only PWA on GitHub Pages**, offline-capable, wake-lock during play.

---

## Sources

- [UltraBoardGames — Wavelength official rules](https://www.ultraboardgames.com/wavelength/game-rules.php)
- [Geeky Hobbies — Wavelength rules & instructions](https://www.geekyhobbies.com/wavelength-2019-board-game-rules-and-instructions-for-how-to-play/)
- [Happy Piranha — How to play Wavelength](https://happypiranha.com/blogs/board-game-rules/how-to-play-wavelength-board-game-rules)
- [CardYard — Wavelength prompts & spectrum pair ideas](https://www.cardyard.ai/wavelength-prompts)
- [wavelengthgame.blog — 200+ Wavelength prompts](https://wavelengthgame.blog/wavelength-prompts)
- [MagicBell — PWA iOS limitations & Safari support](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Apple Developer Forums — PWA data persistence beyond 7 days](https://developer.apple.com/forums/thread/710157)
- [WebKit bug 254545 — Wake Lock in Home Screen web apps (fixed iOS 18.4)](https://bugs.webkit.org/show_bug.cgi?id=254545)
- [caniuse — Screen Wake Lock API](https://caniuse.com/wake-lock)
