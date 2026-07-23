/* Přihořívá — Phase 1: the dial + round micro-loop */

// ---------- geometry ----------
const CX = 200, CY = 200, R = 190;
const BAND_DEG = 6;                       // one band = 6° = 1/5 of a major dial section
const BAND_W = BAND_DEG / 180;            // band width in t-units (0..1)

// t ∈ [0,1] maps left → right across the semicircle
function pointAt(t, r = R) {
  const theta = Math.PI * (1 - t);
  return [CX + r * Math.cos(theta), CY - r * Math.sin(theta)];
}

function slicePath(t1, t2, r = R) {
  const [x1, y1] = pointAt(t1, r);
  const [x2, y2] = pointAt(t2, r);
  return `M ${CX} ${CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

// ---------- prompt engine ----------
const SETTINGS_KEY = "prihoriva.settings.v1";
const TOPICS_KEY = "prihoriva.topics.v1";
const DELSEED_KEY = "prihoriva.deletedSeeds.v1";
const CATS_KEY = "prihoriva.cats.v1";

let lang = "cs";                 // active language: "cs" | "en"
let playCat = "all";             // which category is in play ("all" = shuffle everything)
let topics = [];                 // every topic, on-device & editable: [{ id, cs?, en?, cat }]
let deletedSeeds = [];           // seed ids the player removed (so they don't return on merge)
let cats = [];                   // categories, on-device & editable: [{ key, cs, en }]
let current = null;              // the topic in play
let usedIds = new Set();         // topics drawn this cycle (no-repeat until the pool empties)

function isPair(v) { return Array.isArray(v) && v.length === 2 && v[0] && v[1]; }
function validTopic(p) { return p && p.id && (isPair(p.cs) || isPair(p.en)); }

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (s && (s.lang === "cs" || s.lang === "en")) lang = s.lang;
    if (s && typeof s.playCat === "string") playCat = s.playCat;
  } catch { /* ignore */ }
}
function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ lang, playCat })); } catch { /* ignore */ }
}

function saveTopics() {
  try {
    localStorage.setItem(TOPICS_KEY, JSON.stringify(topics));
    localStorage.setItem(DELSEED_KEY, JSON.stringify(deletedSeeds));
  } catch { /* ignore */ }
}

function validCat(c) { return c && c.key && (c.cs || c.en); }
function saveCats() {
  try { localStorage.setItem(CATS_KEY, JSON.stringify(cats)); } catch { /* ignore */ }
}
function loadCats() {
  try { const c = JSON.parse(localStorage.getItem(CATS_KEY)); if (Array.isArray(c) && c.length) cats = c.filter(validCat); } catch { /* ignore */ }
  if (!cats.length) cats = CATEGORIES.map((c) => ({ key: c.key, cs: c.cs, en: c.en }));
  if (!cats.some((c) => c.key === "jine")) cats.push({ key: "jine", cs: "Jiné", en: "Other" });  // permanent fallback
  saveCats();
}
function catLabelOf(c) { return c[lang] || c.cs || c.en || c.key; }
function catName(key) { const c = cats.find((x) => x.key === key); return c ? catLabelOf(c) : key; }
function catItems() { return cats.map((c) => ({ key: c.key, label: catLabelOf(c) })); }

// on-device topic store: the shipped deck is copied in on first run, then it's
// fully owned & editable here. New seed topics from later deploys merge in,
// unless the player deleted them.
function loadTopics() {
  try { const s = JSON.parse(localStorage.getItem(TOPICS_KEY)); if (Array.isArray(s)) topics = s.filter(validTopic); } catch { /* ignore */ }
  try { const d = JSON.parse(localStorage.getItem(DELSEED_KEY)); if (Array.isArray(d)) deletedSeeds = d.filter((x) => typeof x === "string"); } catch { /* ignore */ }

  // one-time migration from the old user-prompts key
  try {
    const old = JSON.parse(localStorage.getItem("prihoriva.userPrompts.v1"));
    if (Array.isArray(old)) {
      old.forEach((p) => { if (validTopic(p) && !topics.some((topic) => topic.id === p.id)) topics.push({ id: p.id, cs: p.cs, en: p.en, cat: p.cat || "jine" }); });
      localStorage.removeItem("prihoriva.userPrompts.v1");
    }
  } catch { /* ignore */ }

  // merge in seed topics we don't have yet and the player hasn't deleted
  const have = new Set(topics.map((topic) => topic.id));
  const gone = new Set(deletedSeeds);
  SEED_PROMPTS.forEach((p) => {
    if (!have.has(p.id) && !gone.has(p.id)) topics.push({ id: p.id, cs: p.cs, en: p.en, cat: p.cat || "jine" });
  });
  saveTopics();
}

// the active pool: topics with a label pair in the current language, in the chosen
// category (falls back to everything if that category has nothing to draw)
function pool() {
  const byLang = topics.filter((p) => isPair(p[lang]));
  if (playCat === "all") return byLang;
  const byCat = byLang.filter((p) => p.cat === playCat);
  return byCat.length ? byCat : byLang;
}

function drawPrompt() {
  const all = pool();
  if (all.length === 0) { current = null; return; }
  let candidates = all.filter((p) => !usedIds.has(p.id));
  if (candidates.length === 0) {                 // whole pool seen — reshuffle, avoid an instant repeat
    usedIds = current ? new Set([current.id]) : new Set();
    candidates = all.filter((p) => !usedIds.has(p.id));
    if (candidates.length === 0) candidates = all;
  }
  current = candidates[Math.floor(Math.random() * candidates.length)];
  usedIds.add(current.id);
}

function renderPrompt() {
  const [left, right] = current ? current[lang] : ["—", "—"];
  labelLeft.textContent = left;
  labelRight.textContent = right;
}

// ---------- elements ----------
const dial = document.getElementById("dial");
const wedgeEl = document.getElementById("wedge");
const ticksEl = document.getElementById("ticks");
const needleGroup = document.getElementById("needleGroup");
const labelLeft = document.getElementById("labelLeft");
const labelRight = document.getElementById("labelRight");
const stateHint = document.getElementById("stateHint");
const scoreChip = document.getElementById("scoreChip");
const primaryBtn = document.getElementById("primaryBtn");
const secondaryBtn = document.getElementById("secondaryBtn");
const passOverlay = document.getElementById("passOverlay");
const passTitle = document.getElementById("passTitle");
const passBtn = document.getElementById("passBtn");
const peekOverlay = document.getElementById("peekOverlay");
const peekYes = document.getElementById("peekYes");
const peekNo = document.getElementById("peekNo");
const skipOverlay = document.getElementById("skipOverlay");
const skipYes = document.getElementById("skipYes");
const skipNo = document.getElementById("skipNo");
const chipBlue = document.getElementById("chipBlue");
const chipGreen = document.getElementById("chipGreen");
const scoreBlue = document.getElementById("scoreBlue");
const scoreGreen = document.getElementById("scoreGreen");
const scorebugBtn = document.getElementById("scorebugBtn");
const resetOverlay = document.getElementById("resetOverlay");
const resetYes = document.getElementById("resetYes");
const resetNo = document.getElementById("resetNo");

// KONFIG (hidden config screen)
const konfigOverlay = document.getElementById("konfigOverlay");
const konfigClose = document.getElementById("konfigClose");
const langBtns = { cs: document.getElementById("langCs"), en: document.getElementById("langEn") };
const wipeBtn = document.getElementById("wipeBtn");
const playCats = document.getElementById("playCats");
const newTopicBtn = document.getElementById("newTopicBtn");
const filterTabs = document.getElementById("filterTabs");
const topicList = document.getElementById("topicList");
const topicCount = document.getElementById("topicCount");
const editOverlay = document.getElementById("editOverlay");
const editTitle = document.getElementById("editTitle");
const editClose = document.getElementById("editClose");
const editCats = document.getElementById("editCats");
const editCsL = document.getElementById("editCsL");
const editCsR = document.getElementById("editCsR");
const editEnL = document.getElementById("editEnL");
const editEnR = document.getElementById("editEnR");
const editError = document.getElementById("editError");
const editSave = document.getElementById("editSave");
const editDelete = document.getElementById("editDelete");
const editDeleteSec = document.getElementById("editDeleteSec");
const delOverlay = document.getElementById("delOverlay");
const delYes = document.getElementById("delYes");
const delNo = document.getElementById("delNo");
const newCatBtn = document.getElementById("newCatBtn");
const catList = document.getElementById("catList");
const catEditOverlay = document.getElementById("catEditOverlay");
const catEditTitle = document.getElementById("catEditTitle");
const catEditClose = document.getElementById("catEditClose");
const catCs = document.getElementById("catCs");
const catEn = document.getElementById("catEn");
const catError = document.getElementById("catError");
const catSave = document.getElementById("catSave");
const catDelete = document.getElementById("catDelete");
const catDeleteSec = document.getElementById("catDeleteSec");
const delCatOverlay = document.getElementById("delCatOverlay");
const delCatYes = document.getElementById("delCatYes");
const delCatNo = document.getElementById("delCatNo");
const discardOverlay = document.getElementById("discardOverlay");
const discardYes = document.getElementById("discardYes");
const discardNo = document.getElementById("discardNo");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const exportOverlay = document.getElementById("exportOverlay");
const exportClose = document.getElementById("exportClose");
const exportArea = document.getElementById("exportArea");
const copyBtn = document.getElementById("copyBtn");
const shareBtn = document.getElementById("shareBtn");
const copyOk = document.getElementById("copyOk");
const importOverlay = document.getElementById("importOverlay");
const importClose = document.getElementById("importClose");
const importArea = document.getElementById("importArea");
const importError = document.getElementById("importError");
const doImportBtn = document.getElementById("doImportBtn");
const importConfirmOverlay = document.getElementById("importConfirmOverlay");
const importConfirmYes = document.getElementById("importConfirmYes");
const importConfirmNo = document.getElementById("importConfirmNo");

// ---------- state ----------
let state = "psychic";        // psychic | guess | reveal
let target = 0.5;             // center of the wedge, t-units
let needle = 0.5;             // needle position, t-units

let currentTeam = "blue";
const scores = { blue: 0, green: 0 };
let lastPts = 0;              // points awarded in the round being revealed
let passMode = "guess";       // what the pass overlay leads into: guess | team

// ---------- dial rendering ----------
function drawTicks() {
  let html = "";
  for (let deg = 0; deg <= 180; deg += 6) {
    const t = deg / 180;
    const major = deg % 30 === 0;
    const [x1, y1] = pointAt(t, R - (major ? 16 : 9));
    const [x2, y2] = pointAt(t, R - 2);
    html += `<line class="tick${major ? " major" : ""}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }
  ticksEl.innerHTML = html;
}

function drawWedge() {
  const bands = [2, 3, 5, 3, 2];
  const rWedge = R - 2.5; // flush against the inner edge of the dial's 5px border
  let html = "";
  bands.forEach((points, i) => {
    const t1 = target + (i - 2.5) * BAND_W;
    const t2 = t1 + BAND_W;
    html += `<path class="band-${points}" d="${slicePath(t1, t2, rWedge)}"/>`;
  });
  bands.forEach((points, i) => {
    const mid = target + (i - 2) * BAND_W;
    const [x, y] = pointAt(mid, R - 32);
    html += `<text class="band-label" x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}">${points}</text>`;
  });
  wedgeEl.innerHTML = html;
}

function setNeedle(t) {
  needle = Math.max(0, Math.min(1, t));
  needleGroup.style.transform = `rotate(${180 * needle - 90}deg)`;
}

// ---------- dragging ----------
let dragging = false;

dial.addEventListener("pointerdown", (e) => {
  if (state !== "guess") return;
  dragging = true;
  dial.setPointerCapture(e.pointerId);
  moveNeedleTo(e);
});

dial.addEventListener("pointermove", (e) => {
  if (dragging) moveNeedleTo(e);
});

dial.addEventListener("pointerup", () => { dragging = false; save(); });
dial.addEventListener("pointercancel", () => { dragging = false; save(); });

function moveNeedleTo(e) {
  const rect = dial.getBoundingClientRect();
  const scale = 400 / rect.width;
  const x = (e.clientX - rect.left) * scale;
  const y = (e.clientY - rect.top) * scale;
  const angle = Math.atan2(CY - y, x - CX);       // 0 → right, π → left
  const t = 1 - angle / Math.PI;
  setNeedle(Math.max(0, Math.min(1, t)));
}

// ---------- scoring ----------
function scoreFor(needleT, targetT) {
  const diff = Math.abs(needleT - targetT);
  if (diff <= BAND_W * 0.5) return 5;
  if (diff <= BAND_W * 1.5) return 3;
  if (diff <= BAND_W * 2.5) return 2;
  return 0;
}

// ---------- localization (UI + the hot/cold ladder) ----------
const UI = {
  cs: {
    done: "Hotovo", language: "Jazyk", addTopic: "Přidat téma", optional: "(nepovinné)",
    phLeft: "Levá (−)", phRight: "Pravá (+)", myTopics: "Moje témata",
    noTopics: "Zatím žádná vlastní témata.", score: "Skóre", resetScore: "Vynulovat skóre",
    back: "Zpět k zadání",
    peekTitle: "Ukázat<br>zadání?", peekYes: "Ano, ukázat",
    skipTitle: "Přeskočit?", skipYes: "Ano, přeskočit",
    resetTitle: "Vynulovat<br>skóre?", resetYes: "Ano, vynulovat", cancel: "Zrušit",
    role_psychic: "Napovídáš", role_guess: "Hádáš", role_reveal: "Odhalení",
    btn_hide: "Skrýt a předat", btn_reveal: "Odhalit", btn_continue: "Pokračovat",
    pass_phone: "Předej<br>telefon", pass_cover: "Zakryj<br>displej",
    btn_guess: "Hádat", btn_clue: "Napovídat",
    band_0: "Zima", band_2: "Přihořívá", band_3: "Teplo", band_5: "Hoří",
    konfig: "KONFIG", play: "Hra", shuffle: "Zamíchat",
    discardTitle: "Zahodit<br>změny?", discardYes: "Ano, zahodit",
    topics: "Témata", newTopic: "Nové téma", editTopic: "Upravit téma", allCats: "Vše",
    category: "Kategorie", save: "Uložit", deleteTopic: "Smazat téma",
    deleteTitle: "Smazat<br>téma?", deleteYes: "Ano, smazat",
    errPair: "Vyplň oba konce, nebo žádný.", errNeedOne: "Vyplň aspoň jeden jazyk.",
    categories: "Kategorie", newCat: "Nová kategorie", newCatShort: "Nová",
    editCatTitle: "Upravit kategorii", deleteCat: "Smazat kategorii",
    deleteCatTitle: "Smazat<br>kategorii?", deleteCatNote: "Témata se přesunou do Jiné.",
    catNamePh: "Název", errCatName: "Vyplň název.",
    backup: "Záloha", restore: "Obnovit", exportBtn: "Zálohovat",
    exportHint: "Zkopíruj a ulož si tento text (např. do Poznámek).",
    copyBtn: "Kopírovat", shareBtn: "Sdílet", copiedMsg: "Zkopírováno!",
    importHint: "Vlož sem text zálohy.", restoreTitle: "Obnovit ze<br>zálohy?",
    restoreYes: "Ano, obnovit", importErr: "Neplatná záloha.",
  },
  en: {
    done: "Done", language: "Language", addTopic: "Add topic", optional: "(optional)",
    phLeft: "Left (−)", phRight: "Right (+)", myTopics: "My topics",
    noTopics: "No topics yet.", score: "Score", resetScore: "Reset score",
    back: "Back to the target",
    peekTitle: "Reveal the<br>clue?", peekYes: "Yes, reveal",
    skipTitle: "Skip the<br>prompt?", skipYes: "Yes, skip",
    resetTitle: "Reset<br>score?", resetYes: "Yes, reset", cancel: "Cancel",
    role_psychic: "Clue", role_guess: "Guess", role_reveal: "Reveal",
    btn_hide: "Conceal & pass", btn_reveal: "Reveal", btn_continue: "Continue",
    pass_phone: "Pass the<br>phone", pass_cover: "Hide the<br>screen",
    btn_guess: "Ready to guess", btn_clue: "Give a new clue",
    band_0: "Cold", band_2: "Warmer", band_3: "Hot", band_5: "On fire",
    konfig: "CONFIG", play: "Game", shuffle: "Shuffle",
    discardTitle: "Discard<br>changes?", discardYes: "Yes, discard",
    topics: "Topics", newTopic: "New topic", editTopic: "Edit topic", allCats: "All",
    category: "Category", save: "Save", deleteTopic: "Delete topic",
    deleteTitle: "Delete<br>topic?", deleteYes: "Yes, delete",
    errPair: "Fill in both ends, or neither.", errNeedOne: "Fill in at least one language.",
    categories: "Categories", newCat: "New category", newCatShort: "New",
    editCatTitle: "Edit category", deleteCat: "Delete category",
    deleteCatTitle: "Delete<br>category?", deleteCatNote: "Its topics move to Other.",
    catNamePh: "Name", errCatName: "Enter a name.",
    backup: "Backup", restore: "Restore", exportBtn: "Back up",
    exportHint: "Copy and save this text (e.g. to Notes).",
    copyBtn: "Copy", shareBtn: "Share", copiedMsg: "Copied!",
    importHint: "Paste your backup text here.", restoreTitle: "Restore from<br>backup?",
    restoreYes: "Yes, restore", importErr: "Invalid backup.",
  },
};
function t(key) { return (UI[lang] && UI[lang][key]) || UI.cs[key] || key; }

function pointsWord(n) {
  if (lang === "en") return n === 1 ? "point" : "points";
  if (n === 1) return "bod";
  if (n >= 2 && n <= 4) return "body";
  return "bodů";
}

// ---------- round flow ----------
function otherTeam() {
  return currentTeam === "blue" ? "green" : "blue";
}

function updateScoreboard() {
  scoreBlue.textContent = scores.blue;
  scoreGreen.textContent = scores.green;
  chipBlue.classList.toggle("active", currentTeam === "blue");
  chipGreen.classList.toggle("active", currentTeam === "green");
}

// ---------- persistence (a bumped phone never loses a game night) ----------
const SAVE_KEY = "prihoriva.game.v1";

function save() {
  try {
    const overlay = !passOverlay.hidden ? passMode : (!skipOverlay.hidden ? "skip" : null);
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      scores, currentTeam, state, currentId: current ? current.id : null,
      usedIds: [...usedIds], target, needle, lastPts, overlay,
    }));
  } catch { /* storage unavailable (private mode etc.) — play on without saving */ }
}

function restore() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!s || typeof s.target !== "number") return false;
    scores.blue = Number(s.scores?.blue) || 0;
    scores.green = Number(s.scores?.green) || 0;
    currentTeam = s.currentTeam === "green" ? "green" : "blue";
    target = Math.min(1, Math.max(0, s.target));
    lastPts = [0, 2, 3, 5].includes(s.lastPts) ? s.lastPts : 0;
    usedIds = new Set(Array.isArray(s.usedIds) ? s.usedIds : []);
    current = pool().find((p) => p.id === s.currentId) || null;
    if (!current) drawPrompt();     // saved card gone (deck or language changed) — draw fresh
    renderPrompt();
    drawWedge();
    setNeedle(typeof s.needle === "number" ? s.needle : 0.5);
    setState(["psychic", "guess", "reveal"].includes(s.state) ? s.state : "psychic");
    // re-cover the target if the phone was mid-handoff when it reloaded
    if (s.overlay === "guess" || s.overlay === "team") showPass(s.overlay);
    return true;
  } catch {
    return false;
  }
}

function showPass(mode) {
  passMode = mode;
  if (mode === "guess") {
    passTitle.innerHTML = t("pass_phone");
    passBtn.textContent = t("btn_guess");
  } else {
    passTitle.innerHTML = t("pass_cover");
    passBtn.textContent = t("btn_clue");
  }
  passOverlay.hidden = false;
  save();
}

function newRound() {
  drawPrompt();
  renderPrompt();

  // keep the whole wedge on the dial
  const margin = 2.5 * BAND_W;
  target = margin + Math.random() * (1 - 2 * margin);

  drawWedge();
  setNeedle(0.5);
  setState("psychic");
}

function setState(next) {
  state = next;
  const showWedge = state === "psychic" || state === "reveal";
  wedgeEl.classList.toggle("hidden-wedge", !showWedge);
  dial.classList.toggle("dial-disabled", state === "psychic");
  scoreChip.hidden = state !== "reveal";
  secondaryBtn.hidden = true;

  if (state === "psychic") {
    document.body.className = `team-${currentTeam} state-psychic`;
    stateHint.textContent = t("role_psychic");
    primaryBtn.textContent = t("btn_hide");
  } else if (state === "guess") {
    document.body.className = `team-${currentTeam} state-guess`;
    stateHint.textContent = t("role_guess");
    primaryBtn.textContent = t("btn_reveal");
  } else if (state === "reveal") {
    document.body.className = `team-${currentTeam} state-reveal r${lastPts}`;
    stateHint.textContent = t("role_reveal");
    const band = t(`band_${lastPts}`);
    scoreChip.textContent = lastPts === 0
      ? `${band}! 0 ${pointsWord(0)}`
      : `${band}! +${lastPts} ${pointsWord(lastPts)}`;
    scoreChip.classList.toggle("zero", lastPts === 0);
    primaryBtn.textContent = t("btn_continue");
  }
  updateScoreboard();
  save();
}

primaryBtn.addEventListener("click", () => {
  if (state === "psychic") {
    showPass("guess");
  } else if (state === "guess") {
    lastPts = scoreFor(needle, target);
    scores[currentTeam] += lastPts;
    setState("reveal");
  } else if (state === "reveal") {
    // set up the next round, then cover the screen so the next clue-giver can look privately
    currentTeam = otherTeam();
    newRound();
    showPass("team");
  }
});

passBtn.addEventListener("click", () => {
  passOverlay.hidden = true;
  if (passMode === "guess") setState("guess");
  else save();
});

// "back to the target" — the clue-giver forgot where it was; show the clue screen again
function backToClue() {
  peekOverlay.hidden = true;
  setState("psychic");
}
peekYes.addEventListener("click", backToClue);
peekNo.addEventListener("click", () => { peekOverlay.hidden = true; });

// tapping the prompt card: clue screen → skip; guessing screen → peek back at the target
document.getElementById("promptCard").addEventListener("click", () => {
  if (state === "psychic") skipOverlay.hidden = false;
  else if (state === "guess") peekOverlay.hidden = false;
});

skipYes.addEventListener("click", () => {
  skipOverlay.hidden = true;
  newRound();
});

skipNo.addEventListener("click", () => {
  skipOverlay.hidden = true;
  save();
});

// reset score (tap the scorebug → confirm)
scorebugBtn.addEventListener("click", () => { resetOverlay.hidden = false; });
resetNo.addEventListener("click", () => { resetOverlay.hidden = true; });
resetYes.addEventListener("click", () => {
  scores.blue = 0; scores.green = 0;
  updateScoreboard();
  resetOverlay.hidden = true;
  save();
});

// ---------- KONFIG (hidden config screen) ----------
const LANG_NAME = { cs: "Česky", en: "English" };

// secret entry: triple-tap the state tag within ~0.6s between taps
let tapCount = 0, lastTap = 0;
stateHint.addEventListener("click", () => {
  const now = Date.now();
  tapCount = now - lastTap < 600 ? tapCount + 1 : 1;
  lastTap = now;
  if (tapCount >= 3) { tapCount = 0; openKonfig(); }
});

function openKonfig() {
  syncLangUI();
  renderPlayCats();
  renderFilterTabs();
  renderTopicList();
  renderCatList();
  konfigOverlay.hidden = false;
}
function closeKonfig() {
  konfigOverlay.hidden = true;
  save();
}
konfigClose.addEventListener("click", closeKonfig);

function syncLangUI() {
  langBtns.cs.classList.toggle("active", lang === "cs");
  langBtns.en.classList.toggle("active", lang === "en");
}

function setLang(next) {
  if (next === lang || (next !== "cs" && next !== "en")) return;
  lang = next;
  saveSettings();
  if (!current || !isPair(current[lang])) drawPrompt();   // keep the card if it exists in the new language
  applyLang();
}

// re-render every string in the current language (static + dynamic)
function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  syncLangUI();
  renderPrompt();
  if (!konfigOverlay.hidden) { renderPlayCats(); renderFilterTabs(); renderTopicList(); renderCatList(); }
  setState(state);   // role tag, primary button, score chip
}
langBtns.cs.addEventListener("click", () => setLang("cs"));
langBtns.en.addEventListener("click", () => setLang("en"));

// wipe scores: reuse the same "Vynulovat skóre?" screen as the scorebug, then drop back to play
wipeBtn.addEventListener("click", () => {
  closeKonfig();
  resetOverlay.hidden = false;
});

// ---------- topic manager ----------
function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

let filterCat = "all";              // which category the manager list shows
let editingId = null;               // topic being edited (null = new)
let editCat = "jine";               // category selected in the edit overlay
let pendingDelId = null;            // topic queued for deletion
let editSnap = {};                  // snapshot of the edit form, to detect unsaved changes
let catSnap = {};
let discardTarget = null;           // which edit overlay a discard-confirm would close

// generic chip row: [{key,label}], highlight active, call onPick(key)
function renderChips(container, items, activeKey, onPick) {
  container.innerHTML = "";
  items.forEach((it) => {
    const b = document.createElement("button");
    b.className = "chip" + (it.key === activeKey ? " active" : "");
    b.textContent = it.label;
    b.addEventListener("click", () => onPick(it.key));
    container.appendChild(b);
  });
}

function renderFilterTabs() {
  const items = [{ key: "all", label: t("allCats") }].concat(catItems());
  renderChips(filterTabs, items, filterCat, (key) => { filterCat = key; renderFilterTabs(); renderTopicList(); });
}

// what to play: "Zamíchat" (shuffle everything) or a single category
function renderPlayCats() {
  const items = [{ key: "all", label: t("shuffle") }].concat(catItems());
  renderChips(playCats, items, playCat, (key) => {
    playCat = key;
    saveSettings();
    renderPlayCats();
    usedIds = new Set();                                    // fresh no-repeat cycle for the new selection
    if (playCat !== "all" && (!current || current.cat !== playCat)) { drawPrompt(); renderPrompt(); }
  });
}

function renderTopicList() {
  topicCount.textContent = String(topics.length);
  const shown = topics.filter((p) => filterCat === "all" || p.cat === filterCat);
  if (shown.length === 0) {
    topicList.innerHTML = `<li class="user-empty">${t("noTopics")}</li>`;
    return;
  }
  topicList.innerHTML = shown.map((p) => {
    const pair = isPair(p[lang]) ? p[lang] : (p.cs || p.en);
    const tag = filterCat === "all" ? `<span class="cat-tag">${escapeHtml(catName(p.cat))}</span>` : "";
    return `<li><button class="topic-row" data-id="${p.id}">`
      + `<span>${escapeHtml(pair[0])} → ${escapeHtml(pair[1])}</span>${tag}</button></li>`;
  }).join("");
}
topicList.addEventListener("click", (e) => {
  const row = e.target.closest(".topic-row");
  if (!row) return;
  openEdit(topics.find((p) => p.id === row.getAttribute("data-id")) || null);
});

newTopicBtn.addEventListener("click", () => openEdit(null));

function openEdit(topic) {
  editingId = topic ? topic.id : null;
  const isNew = !topic;
  editTitle.textContent = isNew ? t("newTopic") : t("editTopic");
  // a new topic inherits the category the manager is currently filtered to
  editCat = topic ? (topic.cat || "jine") : (filterCat !== "all" ? filterCat : "jine");
  editCsL.value = topic && topic.cs ? topic.cs[0] : "";
  editCsR.value = topic && topic.cs ? topic.cs[1] : "";
  editEnL.value = topic && topic.en ? topic.en[0] : "";
  editEnR.value = topic && topic.en ? topic.en[1] : "";
  editError.hidden = true;
  editDeleteSec.hidden = isNew;
  renderEditCats();
  editSnap = { csL: editCsL.value, csR: editCsR.value, enL: editEnL.value, enR: editEnR.value, cat: editCat };
  editOverlay.hidden = false;
}
function topicDirty() {
  return editCsL.value !== editSnap.csL || editCsR.value !== editSnap.csR
    || editEnL.value !== editSnap.enL || editEnR.value !== editSnap.enR || editCat !== editSnap.cat;
}
function renderEditCats() {
  renderChips(editCats, catItems(), editCat, (key) => {
    editCat = key;
    renderEditCats();
  });
}
editClose.addEventListener("click", () => {
  if (topicDirty()) { discardTarget = "topic"; discardOverlay.hidden = false; }
  else editOverlay.hidden = true;
});

function showEditError(msg) { editError.textContent = msg; editError.hidden = false; }

editSave.addEventListener("click", () => {
  const csL = editCsL.value.trim(), csR = editCsR.value.trim();
  const enL = editEnL.value.trim(), enR = editEnR.value.trim();
  const csOk = csL && csR, enOk = enL && enR;
  if ((csL || csR) && !csOk) { showEditError(t("errPair")); return; }
  if ((enL || enR) && !enOk) { showEditError(t("errPair")); return; }
  if (!csOk && !enOk) { showEditError(t("errNeedOne")); return; }

  let topic = editingId ? topics.find((p) => p.id === editingId) : null;
  if (topic) {
    if (csOk) topic.cs = [csL, csR]; else delete topic.cs;
    if (enOk) topic.en = [enL, enR]; else delete topic.en;
    topic.cat = editCat;
  } else {
    topic = { id: "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), cat: editCat };
    if (csOk) topic.cs = [csL, csR];
    if (enOk) topic.en = [enL, enR];
    topics.push(topic);
  }
  saveTopics();
  editOverlay.hidden = true;
  renderFilterTabs();
  renderTopicList();
  if (current && current.id === topic.id) renderPrompt();   // refresh the in-play card if it was edited
});

// delete a topic (with confirm)
editDelete.addEventListener("click", () => { pendingDelId = editingId; delOverlay.hidden = false; });
delNo.addEventListener("click", () => { delOverlay.hidden = true; });
delYes.addEventListener("click", () => {
  const id = pendingDelId;
  topics = topics.filter((p) => p.id !== id);
  if (id && id[0] === "s") deletedSeeds.push(id);   // don't let deleted seed topics return
  usedIds.delete(id);
  saveTopics();
  delOverlay.hidden = true;
  editOverlay.hidden = true;
  renderFilterTabs();
  renderTopicList();
});

// ---------- category manager ----------
let editingCatKey = null;
let pendingDelCat = null;

function renderCatList() {
  catList.innerHTML = cats.map((c) => {
    const count = topics.filter((tp) => tp.cat === c.key).length;
    return `<li><button class="topic-row" data-key="${escapeHtml(c.key)}">`
      + `<span>${escapeHtml(catLabelOf(c))}</span><span class="cat-tag">${count}</span></button></li>`;
  }).join("");
}
catList.addEventListener("click", (e) => {
  const row = e.target.closest(".topic-row");
  if (!row) return;
  openCatEdit(cats.find((c) => c.key === row.getAttribute("data-key")) || null);
});
newCatBtn.addEventListener("click", () => openCatEdit(null));

function openCatEdit(cat) {
  editingCatKey = cat ? cat.key : null;
  const isNew = !cat;
  catEditTitle.textContent = isNew ? t("newCat") : t("editCatTitle");
  catCs.value = cat ? (cat.cs || "") : "";
  catEn.value = cat ? (cat.en || "") : "";
  catError.hidden = true;
  catDeleteSec.hidden = isNew || cat.key === "jine";   // "Jiné" is the protected fallback
  catSnap = { cs: catCs.value, en: catEn.value };
  catEditOverlay.hidden = false;
}
function catDirty() { return catCs.value !== catSnap.cs || catEn.value !== catSnap.en; }
catEditClose.addEventListener("click", () => {
  if (catDirty()) { discardTarget = "cat"; discardOverlay.hidden = false; }
  else catEditOverlay.hidden = true;
});

// discard-changes confirm, shared by the topic and category editors
discardNo.addEventListener("click", () => { discardOverlay.hidden = true; });
discardYes.addEventListener("click", () => {
  discardOverlay.hidden = true;
  if (discardTarget === "topic") editOverlay.hidden = true;
  else if (discardTarget === "cat") catEditOverlay.hidden = true;
});

catSave.addEventListener("click", () => {
  const cs = catCs.value.trim(), en = catEn.value.trim();
  if (!cs && !en) { catError.textContent = t("errCatName"); catError.hidden = false; return; }
  const cat = editingCatKey ? cats.find((c) => c.key === editingCatKey) : null;
  if (cat) {
    cat.cs = cs || en; cat.en = en || cs;
  } else {
    cats.push({ key: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), cs: cs || en, en: en || cs });
  }
  saveCats();
  catEditOverlay.hidden = true;
  renderCatList(); renderPlayCats(); renderFilterTabs(); renderTopicList();
});

catDelete.addEventListener("click", () => { pendingDelCat = editingCatKey; delCatOverlay.hidden = false; });
delCatNo.addEventListener("click", () => { delCatOverlay.hidden = true; });
delCatYes.addEventListener("click", () => {
  const key = pendingDelCat;
  if (key && key !== "jine") {
    topics.forEach((tp) => { if (tp.cat === key) tp.cat = "jine"; });   // reassign, never orphan a topic
    cats = cats.filter((c) => c.key !== key);
    if (playCat === key) playCat = "all";
    if (filterCat === key) filterCat = "all";
    saveTopics(); saveCats(); saveSettings();
  }
  delCatOverlay.hidden = true;
  catEditOverlay.hidden = true;
  renderCatList(); renderPlayCats(); renderFilterTabs(); renderTopicList();
});

// ---------- backup / restore ----------
function exportData() {
  return JSON.stringify({ app: "prihoriva", v: 1, topics, cats, deletedSeeds });
}
function parseImport(text) {
  let d;
  try { d = JSON.parse(text); } catch { return null; }
  if (!d || d.app !== "prihoriva" || !Array.isArray(d.topics)) return null;
  if (!d.topics.filter(validTopic).length) return null;
  return d;
}
function applyImport(d) {
  topics = d.topics.filter(validTopic).map((p) => ({ id: p.id, cs: p.cs, en: p.en, cat: p.cat || "jine" }));
  cats = Array.isArray(d.cats) ? d.cats.filter(validCat).map((c) => ({ key: c.key, cs: c.cs, en: c.en })) : [];
  if (!cats.some((c) => c.key === "jine")) cats.push({ key: "jine", cs: "Jiné", en: "Other" });
  deletedSeeds = Array.isArray(d.deletedSeeds) ? d.deletedSeeds.filter((x) => typeof x === "string") : [];
  usedIds = new Set(); filterCat = "all"; playCat = "all";
  saveTopics(); saveCats(); saveSettings();
  drawPrompt(); renderPrompt();
}

exportBtn.addEventListener("click", () => {
  exportArea.value = exportData();
  copyOk.hidden = true;
  shareBtn.hidden = !navigator.share;
  exportOverlay.hidden = false;
});
exportClose.addEventListener("click", () => { exportOverlay.hidden = true; });
copyBtn.addEventListener("click", async () => {
  const text = exportArea.value;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    exportArea.focus(); exportArea.select();
    try { document.execCommand("copy"); } catch { /* ignore */ }
  }
  copyOk.hidden = false;
});
shareBtn.addEventListener("click", () => {
  if (navigator.share) navigator.share({ title: "Přihořívá", text: exportArea.value }).catch(() => {});
});

let pendingImport = null;
importBtn.addEventListener("click", () => {
  importArea.value = ""; importError.hidden = true; importOverlay.hidden = false;
});
importClose.addEventListener("click", () => { importOverlay.hidden = true; });
doImportBtn.addEventListener("click", () => {
  const d = parseImport(importArea.value.trim());
  if (!d) { importError.textContent = t("importErr"); importError.hidden = false; return; }
  pendingImport = d;
  importConfirmOverlay.hidden = false;
});
importConfirmNo.addEventListener("click", () => { importConfirmOverlay.hidden = true; });
importConfirmYes.addEventListener("click", () => {
  if (pendingImport) applyImport(pendingImport);
  importConfirmOverlay.hidden = true;
  importOverlay.hidden = true;
  renderPlayCats(); renderFilterTabs(); renderTopicList(); renderCatList();
});

// ---------- boot ----------
loadSettings();
loadCats();
loadTopics();
drawTicks();
if (!restore()) newRound();
applyLang();
