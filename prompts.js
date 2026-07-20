/* Přihořívá — seed deck.
 *
 * POLARITY CONVENTION (always): the LEFT end is the "negative" pole
 * (less / worse / colder / weaker / more mundane), the RIGHT end the
 * "positive" pole (more / better / hotter / stronger / more extreme).
 *
 * Each card: { id, cs:[left,right], en:[left,right] }  — en is optional
 * (Czech-culture-only cards may omit it). A card joins the pool for a
 * language only if it has labels in that language.
 *
 * This is the v1 seed (~45 cards). It grows toward ~120 in the next pass.
 */
const SEED_PROMPTS = [
  // ---- physical / measurable ----
  { id: "s001", cs: ["Studené", "Horké"],            en: ["Cold", "Hot"] },
  { id: "s002", cs: ["Malé", "Velké"],               en: ["Small", "Big"] },
  { id: "s003", cs: ["Pomalé", "Rychlé"],            en: ["Slow", "Fast"] },
  { id: "s004", cs: ["Tiché", "Hlasité"],            en: ["Quiet", "Loud"] },
  { id: "s005", cs: ["Lehké", "Těžké"],              en: ["Light", "Heavy"] },
  { id: "s006", cs: ["Staré", "Nové"],               en: ["Old", "New"] },
  { id: "s007", cs: ["Hladké", "Drsné"],             en: ["Smooth", "Rough"] },
  { id: "s008", cs: ["Blízko", "Daleko"],            en: ["Near", "Far"] },
  { id: "s009", cs: ["Obyčejné", "Bizarní"],         en: ["Ordinary", "Bizarre"] },
  { id: "s010", cs: ["Kulaté", "Hranaté"],           en: ["Round", "Angular"] },

  // ---- opinion / taste ----
  { id: "s011", cs: ["Podceňované", "Přeceňované"],  en: ["Underrated", "Overrated"] },
  { id: "s012", cs: ["Trapné", "Cool"],              en: ["Cringe", "Cool"] },
  { id: "s013", cs: ["Zdravé", "Nezdravé"],          en: ["Healthy", "Unhealthy"] },
  { id: "s014", cs: ["Levné", "Drahé"],              en: ["Cheap", "Expensive"] },
  { id: "s015", cs: ["Nuda", "Zábava"],              en: ["Boring", "Fun"] },
  { id: "s016", cs: ["Ošklivé", "Krásné"],           en: ["Ugly", "Beautiful"] },
  { id: "s017", cs: ["Zbytečné", "Užitečné"],        en: ["Useless", "Useful"] },
  { id: "s018", cs: ["Kýč", "Umění"],                en: ["Kitsch", "Art"] },
  { id: "s019", cs: ["Béčkový film", "Trhák"],       en: ["B-movie", "Blockbuster"] },
  { id: "s020", cs: ["Retro", "Moderní"],            en: ["Retro", "Modern"] },

  // ---- food & drink ----
  { id: "s021", cs: ["Nechutné", "Lahodné"],         en: ["Gross", "Delicious"] },
  { id: "s022", cs: ["Slané", "Sladké"],             en: ["Salty", "Sweet"] },
  { id: "s023", cs: ["Zdravá svačina", "Hříšná mlsota"], en: ["Healthy snack", "Guilty treat"] },
  { id: "s024", cs: ["Všední jídlo", "Sváteční hostina"], en: ["Everyday meal", "Feast"] },

  // ---- moral / social ----
  { id: "s025", cs: ["Sobecké", "Nezištné"],         en: ["Selfish", "Selfless"] },
  { id: "s026", cs: ["Lež", "Pravda"],               en: ["Lie", "Truth"] },
  { id: "s027", cs: ["Zločin", "Hrdinství"],         en: ["Crime", "Heroism"] },
  { id: "s028", cs: ["Trapas", "Klidná pohoda"],     en: ["Embarrassment", "Total ease"] },
  { id: "s029", cs: ["Tabu", "Úplně normální"],      en: ["Taboo", "Totally normal"] },
  { id: "s030", cs: ["Neodpustitelné", "Odpustitelné"], en: ["Unforgivable", "Forgivable"] },

  // ---- abstract / absurd ----
  { id: "s031", cs: ["Chaos", "Řád"],                en: ["Chaos", "Order"] },
  { id: "s032", cs: ["Minulost", "Budoucnost"],      en: ["Past", "Future"] },
  { id: "s033", cs: ["Sen", "Realita"],              en: ["Dream", "Reality"] },
  { id: "s034", cs: ["Analogové", "Digitální"],      en: ["Analog", "Digital"] },
  { id: "s035", cs: ["Náhoda", "Osud"],              en: ["Coincidence", "Destiny"] },
  { id: "s036", cs: ["Pohádka", "Horor"],            en: ["Fairytale", "Horror"] },

  // ---- pop culture / everyday ----
  { id: "s037", cs: ["Introvert", "Extrovert"],      en: ["Introvert", "Extrovert"] },
  { id: "s038", cs: ["Ranní ptáče", "Noční sova"],   en: ["Early bird", "Night owl"] },
  { id: "s039", cs: ["Guilty pleasure", "Chlouba"],  en: ["Guilty pleasure", "Something to brag about"] },

  // ---- Czech-culture flavored (some without English) ----
  { id: "s040", cs: ["Kofola", "Šampaňské"],         en: ["Kofola", "Champagne"] },
  { id: "s041", cs: ["Panelák", "Vila"],             en: ["Prefab flat", "Villa"] },
  { id: "s042", cs: ["Hospoda", "Michelin restaurace"], en: ["Pub", "Michelin restaurant"] },
  { id: "s043", cs: ["Chalupa", "Luxusní hotel"],    en: ["Cottage", "Luxury hotel"] },
  { id: "s044", cs: ["Turista v Praze", "Místní"] },
  { id: "s045", cs: ["Naprosto ne-kačenka", "Klasická kačenka"] },
];

// expose for the plain-script app (no modules/build step)
window.SEED_PROMPTS = SEED_PROMPTS;
