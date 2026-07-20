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
const USER_KEY = "prihoriva.userPrompts.v1";

let lang = "cs";                 // active language: "cs" | "en"
let userPrompts = [];            // family-added cards: [{ id, cs?, en? }]
let current = null;              // the card in play
let usedIds = new Set();         // cards drawn this cycle (no-repeat until the pool empties)

function isPair(v) { return Array.isArray(v) && v.length === 2 && v[0] && v[1]; }

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (s && (s.lang === "cs" || s.lang === "en")) lang = s.lang;
  } catch { /* ignore */ }
}
function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ lang })); } catch { /* ignore */ }
}
function loadUserPrompts() {
  try {
    const u = JSON.parse(localStorage.getItem(USER_KEY));
    if (Array.isArray(u)) userPrompts = u.filter((p) => p && p.id && (isPair(p.cs) || isPair(p.en)));
  } catch { /* ignore */ }
}
function saveUserPrompts() {
  try { localStorage.setItem(USER_KEY, JSON.stringify(userPrompts)); } catch { /* ignore */ }
}

// the active pool: every card carrying a label pair in the current language
function pool() {
  return [...SEED_PROMPTS, ...userPrompts].filter((p) => isPair(p[lang]));
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
const skipOverlay = document.getElementById("skipOverlay");
const skipYes = document.getElementById("skipYes");
const skipNo = document.getElementById("skipNo");
const chipBlue = document.getElementById("chipBlue");
const chipGreen = document.getElementById("chipGreen");
const scoreBlue = document.getElementById("scoreBlue");
const scoreGreen = document.getElementById("scoreGreen");

// KONFIG (hidden config screen)
const konfigOverlay = document.getElementById("konfigOverlay");
const konfigClose = document.getElementById("konfigClose");
const langBtns = { cs: document.getElementById("langCs"), en: document.getElementById("langEn") };
const wipeBtn = document.getElementById("wipeBtn");
const wipeConfirm = document.getElementById("wipeConfirm");
const wipeYes = document.getElementById("wipeYes");
const wipeNo = document.getElementById("wipeNo");
const addLeft = document.getElementById("addLeft");
const addRight = document.getElementById("addRight");
const addLeft2 = document.getElementById("addLeft2");
const addRight2 = document.getElementById("addRight2");
const addBtn = document.getElementById("addBtn");
const addError = document.getElementById("addError");
const addPrimaryName = document.getElementById("addPrimaryName");
const addOtherName = document.getElementById("addOtherName");
const userList = document.getElementById("userList");
const userCount = document.getElementById("userCount");

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

// hot/cold ladder: miss → bullseye
const SCORE_NAMES = { 0: "Zima", 2: "Přihořívá", 3: "Teplo", 5: "Hoří" };

function pointsWord(n) {
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
    passTitle.innerHTML = "Předej<br>telefon";
    passBtn.textContent = "Hádám";
  } else {
    passTitle.innerHTML = "Předej<br>druhému<br>týmu";
    passBtn.textContent = "Napovídám";
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
    stateHint.textContent = "Napovídáš";
    primaryBtn.textContent = "Skrýt a předat";
  } else if (state === "guess") {
    document.body.className = `team-${currentTeam} state-guess`;
    stateHint.textContent = "Hádáš";
    primaryBtn.textContent = "Odhalit";
  } else if (state === "reveal") {
    document.body.className = `team-${currentTeam} state-reveal r${lastPts}`;
    stateHint.textContent = "Odhalení";
    scoreChip.textContent = lastPts === 0
      ? `${SCORE_NAMES[0]}! 0 bodů`
      : `${SCORE_NAMES[lastPts]}! +${lastPts} ${pointsWord(lastPts)}`;
    scoreChip.classList.toggle("zero", lastPts === 0);
    primaryBtn.textContent = "Další";
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
    // hand the phone to the other team; new round waits under the overlay
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

// skip: tapping the prompt card on the clue-giving screen asks to skip the card
document.getElementById("promptCard").addEventListener("click", () => {
  if (state === "psychic") skipOverlay.hidden = false;
});

skipYes.addEventListener("click", () => {
  skipOverlay.hidden = true;
  newRound();
});

skipNo.addEventListener("click", () => {
  skipOverlay.hidden = true;
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
  renderUserList();
  resetAddForm();
  wipeConfirm.hidden = true;
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
  const other = lang === "cs" ? "en" : "cs";
  addPrimaryName.textContent = LANG_NAME[lang];
  addOtherName.textContent = LANG_NAME[other];
}

function setLang(next) {
  if (next === lang || (next !== "cs" && next !== "en")) return;
  lang = next;
  saveSettings();
  if (!current || !isPair(current[lang])) drawPrompt();   // keep the card if it exists in the new language
  renderPrompt();
  syncLangUI();
  save();
}
langBtns.cs.addEventListener("click", () => setLang("cs"));
langBtns.en.addEventListener("click", () => setLang("en"));

// wipe scores (with an inline confirm)
wipeBtn.addEventListener("click", () => { wipeConfirm.hidden = false; });
wipeNo.addEventListener("click", () => { wipeConfirm.hidden = true; });
wipeYes.addEventListener("click", () => {
  scores.blue = 0; scores.green = 0;
  updateScoreboard();
  wipeConfirm.hidden = true;
  save();
});

// add a card
function resetAddForm() {
  addLeft.value = ""; addRight.value = "";
  addLeft2.value = ""; addRight2.value = "";
  addError.hidden = true;
}
function showAddError(msg) { addError.textContent = msg; addError.hidden = false; }

addBtn.addEventListener("click", () => {
  const l = addLeft.value.trim(), r = addRight.value.trim();
  const l2 = addLeft2.value.trim(), r2 = addRight2.value.trim();
  if (!l || !r) { showAddError("Vyplň oba konce."); return; }
  const otherStarted = l2 || r2;
  if (otherStarted && (!l2 || !r2)) { showAddError("Druhý jazyk: vyplň oba konce, nebo žádný."); return; }
  const other = lang === "cs" ? "en" : "cs";
  const card = { id: "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) };
  card[lang] = [l, r];
  if (otherStarted) card[other] = [l2, r2];
  userPrompts.push(card);
  saveUserPrompts();
  resetAddForm();
  renderUserList();
});

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function renderUserList() {
  userCount.textContent = String(userPrompts.length);
  if (userPrompts.length === 0) {
    userList.innerHTML = '<li class="user-empty">Zatím žádné vlastní karty.</li>';
    return;
  }
  userList.innerHTML = userPrompts.map((p) => {
    const pair = p.cs || p.en;
    return `<li class="user-item"><span>${escapeHtml(pair[0])} → ${escapeHtml(pair[1])}</span>`
      + `<button class="user-del" data-id="${p.id}" aria-label="Smazat">×</button></li>`;
  }).join("");
}
userList.addEventListener("click", (e) => {
  const btn = e.target.closest(".user-del");
  if (!btn) return;
  const id = btn.getAttribute("data-id");
  userPrompts = userPrompts.filter((p) => p.id !== id);
  usedIds.delete(id);
  saveUserPrompts();
  renderUserList();
});

// ---------- boot ----------
loadSettings();
loadUserPrompts();
drawTicks();
if (!restore()) newRound();
