/* Přihořívá — seed deck (the initial content of the on-device topic store).
 *
 * POLARITY CONVENTION (always): the LEFT end is the "negative" pole
 * (less / worse / colder / weaker / more mundane), the RIGHT end the
 * "positive" pole (more / better / hotter / stronger / more extreme).
 *
 * Each topic: { id, cs:[left,right], en:[left,right], cat }  — en optional
 * (Czech-culture-only topics may omit it); cat is a category key below.
 *
 * On first run these are copied into the on-device store; new ones added in
 * later deploys merge in (unless the player deleted them).
 */
const CATEGORIES = [
  { key: "fyz",   cs: "Fyzické",     en: "Physical" },
  { key: "nazor", cs: "Názory",      en: "Opinions" },
  { key: "jidlo", cs: "Jídlo",       en: "Food" },
  { key: "moral", cs: "Morální",     en: "Moral" },
  { key: "abstr", cs: "Abstraktní",  en: "Abstract" },
  { key: "pop",   cs: "Pop-kultura", en: "Pop culture" },
  { key: "cesko", cs: "Česko",       en: "Czech" },
  { key: "jine",  cs: "Jiné",        en: "Other" },
];

const SEED_PROMPTS = [
  // ---- physical / measurable ----
  { id: "s001", cat: "fyz", cs: ["Studené", "Horké"],            en: ["Cold", "Hot"] },
  { id: "s002", cat: "fyz", cs: ["Malé", "Velké"],               en: ["Small", "Big"] },
  { id: "s003", cat: "fyz", cs: ["Pomalé", "Rychlé"],            en: ["Slow", "Fast"] },
  { id: "s004", cat: "fyz", cs: ["Tiché", "Hlasité"],            en: ["Quiet", "Loud"] },
  { id: "s005", cat: "fyz", cs: ["Lehké", "Těžké"],              en: ["Light", "Heavy"] },
  { id: "s006", cat: "fyz", cs: ["Staré", "Nové"],               en: ["Old", "New"] },
  { id: "s007", cat: "fyz", cs: ["Hladké", "Drsné"],             en: ["Smooth", "Rough"] },
  { id: "s008", cat: "fyz", cs: ["Blízko", "Daleko"],            en: ["Near", "Far"] },
  { id: "s009", cat: "fyz", cs: ["Obyčejné", "Bizarní"],         en: ["Ordinary", "Bizarre"] },
  { id: "s010", cat: "fyz", cs: ["Kulaté", "Hranaté"],           en: ["Round", "Angular"] },

  // ---- opinion / taste ----
  { id: "s011", cat: "nazor", cs: ["Podceňované", "Přeceňované"],  en: ["Underrated", "Overrated"] },
  { id: "s012", cat: "nazor", cs: ["Trapné", "Cool"],              en: ["Cringe", "Cool"] },
  { id: "s013", cat: "nazor", cs: ["Zdravé", "Nezdravé"],          en: ["Healthy", "Unhealthy"] },
  { id: "s014", cat: "nazor", cs: ["Levné", "Drahé"],              en: ["Cheap", "Expensive"] },
  { id: "s015", cat: "nazor", cs: ["Nuda", "Zábava"],              en: ["Boring", "Fun"] },
  { id: "s016", cat: "nazor", cs: ["Ošklivé", "Krásné"],           en: ["Ugly", "Beautiful"] },
  { id: "s017", cat: "nazor", cs: ["Zbytečné", "Užitečné"],        en: ["Useless", "Useful"] },
  { id: "s018", cat: "nazor", cs: ["Kýč", "Umění"],                en: ["Kitsch", "Art"] },
  { id: "s019", cat: "nazor", cs: ["Béčkový film", "Trhák"],       en: ["B-movie", "Blockbuster"] },
  { id: "s020", cat: "nazor", cs: ["Retro", "Moderní"],            en: ["Retro", "Modern"] },

  // ---- food & drink ----
  { id: "s021", cat: "jidlo", cs: ["Nechutné", "Lahodné"],         en: ["Gross", "Delicious"] },
  { id: "s022", cat: "jidlo", cs: ["Slané", "Sladké"],             en: ["Salty", "Sweet"] },
  { id: "s023", cat: "jidlo", cs: ["Zdravá svačina", "Hříšná mlsota"], en: ["Healthy snack", "Guilty treat"] },
  { id: "s024", cat: "jidlo", cs: ["Všední jídlo", "Sváteční hostina"], en: ["Everyday meal", "Feast"] },

  // ---- moral / social ----
  { id: "s025", cat: "moral", cs: ["Sobecké", "Nezištné"],         en: ["Selfish", "Selfless"] },
  { id: "s026", cat: "moral", cs: ["Lež", "Pravda"],               en: ["Lie", "Truth"] },
  { id: "s027", cat: "moral", cs: ["Zločin", "Hrdinství"],         en: ["Crime", "Heroism"] },
  { id: "s028", cat: "moral", cs: ["Trapas", "Klidná pohoda"],     en: ["Embarrassment", "Total ease"] },
  { id: "s029", cat: "moral", cs: ["Tabu", "Úplně normální"],      en: ["Taboo", "Totally normal"] },
  { id: "s030", cat: "moral", cs: ["Neodpustitelné", "Odpustitelné"], en: ["Unforgivable", "Forgivable"] },

  // ---- abstract / absurd ----
  { id: "s031", cat: "abstr", cs: ["Chaos", "Řád"],                en: ["Chaos", "Order"] },
  { id: "s032", cat: "abstr", cs: ["Minulost", "Budoucnost"],      en: ["Past", "Future"] },
  { id: "s033", cat: "abstr", cs: ["Sen", "Realita"],              en: ["Dream", "Reality"] },
  { id: "s034", cat: "abstr", cs: ["Analogové", "Digitální"],      en: ["Analog", "Digital"] },
  { id: "s035", cat: "abstr", cs: ["Náhoda", "Osud"],              en: ["Coincidence", "Destiny"] },
  { id: "s036", cat: "abstr", cs: ["Pohádka", "Horor"],            en: ["Fairytale", "Horror"] },

  // ---- pop culture / everyday ----
  { id: "s037", cat: "pop", cs: ["Introvert", "Extrovert"],      en: ["Introvert", "Extrovert"] },
  { id: "s038", cat: "pop", cs: ["Ranní ptáče", "Noční sova"],   en: ["Early bird", "Night owl"] },
  { id: "s039", cat: "pop", cs: ["Guilty pleasure", "Chlouba"],  en: ["Guilty pleasure", "Something to brag about"] },

  // ---- Czech-culture flavored (some without English) ----
  { id: "s040", cat: "cesko", cs: ["Kofola", "Šampaňské"],         en: ["Kofola", "Champagne"] },
  { id: "s041", cat: "cesko", cs: ["Panelák", "Vila"],             en: ["Prefab flat", "Villa"] },
  { id: "s042", cat: "cesko", cs: ["Hospoda", "Michelin restaurace"], en: ["Pub", "Michelin restaurant"] },
  { id: "s043", cat: "cesko", cs: ["Chalupa", "Luxusní hotel"],    en: ["Cottage", "Luxury hotel"] },
  { id: "s044", cat: "cesko", cs: ["Turista v Praze", "Místní"] },
  { id: "s045", cat: "cesko", cs: ["Naprosto ne-kačenka", "Klasická kačenka"] },
];

// expose for the plain-script app (no modules/build step)
window.SEED_PROMPTS = SEED_PROMPTS;
window.CATEGORIES = CATEGORIES;
