/**
 * Authentic, deep subtopics mapping for all competitive exam subjects
 */
export const SUBJECT_TOPICS_MAP: Record<string, string[]> = {
  maths: [
    "Percentage, Profit & Loss",
    "Ratio, Proportion & Partnership",
    "Simple & Compound Interest",
    "Time, Speed & Distance / Trains / Boats",
    "Time & Work / Pipes & Cisterns",
    "Algebra & Simplification",
    "Geometry & Mensuration (2D & 3D)",
    "Trigonometry & Heights/Distances",
    "Number System, HCF & LCM",
    "Data Interpretation (DI, Tables & Charts)",
    "Averages, Mixtures & Alligations",
  ],
  reasoning: [
    "Coding-Decoding & Word Formation",
    "Syllogisms & Venn Diagrams",
    "Blood Relations & Family Tree",
    "Direction & Distance Sense",
    "Seating Arrangement & Linear/Circular Puzzles",
    "Analogy & Classification",
    "Number Series & Missing Characters",
    "Non-Verbal Reasoning & Figure Counting",
    "Statement & Conclusions / Analytical Logic",
    "Mathematical Operations & Clock/Calendar",
  ],
  english: [
    "Spotting Errors & Grammar Rules",
    "Sentence Improvement & Correction",
    "Synonyms & Antonyms (Vocabulary)",
    "Idioms, Phrases & One Word Substitution",
    "Cloze Test & Fill in the Blanks",
    "Reading Comprehension Passages",
    "Para Jumbles & Sentence Rearrangement",
    "Active & Passive Voice Transformation",
    "Direct & Indirect Speech (Narration)",
    "Spelling Correction & Common Confusions",
  ],
  gk: [
    "Indian Polity & Constitution (Articles, Amendments)",
    "Modern Indian History & Freedom Struggle",
    "Ancient & Medieval Indian History",
    "Physical & Indian Geography (Rivers, Mountains, Climate)",
    "General Science in Everyday Life",
    "Indian Economy, Planning & Union Budget",
    "National & International Current Affairs",
    "Art, Culture, Festivals & Classical Dances of India",
    "Environment, Ecology & National Parks",
    "Sports, Awards, Books & Important Days",
  ],
  science: [
    "Physics - Mechanics, Light, Heat & Electricity",
    "Chemistry - Periodic Table, Acids, Bases & Metals",
    "Biology - Human Body Systems, Diseases & Nutrition",
    "Scientific Inventions, Discoveries & Space Tech",
    "Everyday Science & Environmental Innovations",
  ],
  biology: [
    "Human Physiology (Digestion, Circulation, Nervous System)",
    "Genetics & Molecular Basis of Inheritance",
    "Cell Biology: Structure, Function & Division",
    "Plant Physiology & Photosynthesis/Respiration",
    "Reproduction in Organisms & Human Reproduction",
    "Ecology, Ecosystems & Environmental Issues",
    "Biotechnology: Principles & Applications",
    "Diversity of Living Organisms & Taxonomy",
    "Evolution & Human Health and Disease",
  ],
  physics: [
    "Mechanics, Laws of Motion & Work-Energy-Power",
    "Rotational Motion & Gravitation",
    "Current Electricity & Magnetism",
    "Optics: Ray Optics & Wave Optics",
    "Thermodynamics & Kinetic Theory of Gases",
    "Modern Physics: Dual Nature, Atoms & Nuclei",
    "Semiconductor Electronics & Logic Gates",
    "Oscillations & Mechanical Waves",
  ],
  chemistry: [
    "Organic Chemistry: Hydrocarbons & Reaction Mechanisms",
    "Inorganic Chemistry: Coordination Compounds & P-Block",
    "Physical Chemistry: Thermodynamics & Equilibrium",
    "Chemical Bonding & Molecular Structure",
    "Electrochemistry & Chemical Kinetics",
    "Solutions & Solid State Chemistry",
    "Biomolecules, Polymers & Everyday Chemistry",
  ],
  hindi: [
    "संधि एवं संधि विच्छेद (Sandhi)",
    "समास एवं उनके भेद (Samas)",
    "विलोम एवं पर्यायवाची शब्द (Antonyms & Synonyms)",
    "मुहावरे एवं लोकोक्तियां (Idioms & Proverbs)",
    "वाक्य शुद्धि एवं वर्तनी सुधार (Sentence Correction)",
    "तत्सम एवं तद्भव शब्द (Tatsam & Tadbhav)",
    "अनेक शब्दों के लिए एक शब्द (One Word)",
    "रस, छंद एवं अलंकार",
  ],
  "state-gk": [
    "State History & Freedom Fighters",
    "State Geography, Rivers & Minerals",
    "State Government Schemes & Welfare Programs",
    "State Panchayati Raj & District Administration",
    "State Art, Fairs, Folk Dances & Culture",
    "State Budget & Economic Survey",
  ],
  "current-affairs": [
    "National & International Current Affairs",
    "Government Policies & New Legislative Acts",
    "Bilateral Summits & Global Indices/Rankings",
    "Science, Defence & Space Technology",
    "Economic Reforms, Inflation & Monetary Policy",
  ],
  domain: [
    "Subject Domain Core Concepts",
    "Theoretical Principles & Applied Problems",
    "Advanced Syllabus Questions",
  ],
};

export function getTopicsForSubject(subjectSlug?: string, subjectName?: string): string[] {
  if (!subjectSlug && !subjectName) {
    return SUBJECT_TOPICS_MAP.gk;
  }

  const slug = (subjectSlug || "").toLowerCase();
  const name = (subjectName || "").toLowerCase();

  if (slug.includes("math") || name.includes("math") || name.includes("quant") || name.includes("numerical")) {
    return SUBJECT_TOPICS_MAP.maths;
  }
  if (slug.includes("reas") || name.includes("reas") || name.includes("intelligence") || name.includes("mental")) {
    return SUBJECT_TOPICS_MAP.reasoning;
  }
  if (slug.includes("eng") || name.includes("eng") || name.includes("comprehension")) {
    return SUBJECT_TOPICS_MAP.english;
  }
  if (slug.includes("bio") || name.includes("bio") || name.includes("botany") || name.includes("zoology")) {
    return SUBJECT_TOPICS_MAP.biology;
  }
  if (slug.includes("phy") || name.includes("phy")) {
    return SUBJECT_TOPICS_MAP.physics;
  }
  if (slug.includes("chem") || name.includes("chem")) {
    return SUBJECT_TOPICS_MAP.chemistry;
  }
  if (slug.includes("hindi") || name.includes("hindi")) {
    return SUBJECT_TOPICS_MAP.hindi;
  }
  if (slug.includes("state") || name.includes("state")) {
    return SUBJECT_TOPICS_MAP["state-gk"];
  }
  if (slug.includes("sci") || name.includes("sci")) {
    return SUBJECT_TOPICS_MAP.science;
  }
  if (slug.includes("affair") || name.includes("affair") || name.includes("current")) {
    return SUBJECT_TOPICS_MAP["current-affairs"];
  }
  if (slug.includes("gk") || name.includes("gk") || name.includes("general") || name.includes("awareness") || name.includes("polity") || name.includes("history")) {
    return SUBJECT_TOPICS_MAP.gk;
  }

  return SUBJECT_TOPICS_MAP[slug] || SUBJECT_TOPICS_MAP.gk;
}
