/**
 * Smart Topic, Subject, Syllabus Tag & PYQ Auto-Detector
 * Accurately detects syllabus domain, topics, and PYQ tags from question text.
 */

export interface TopicDetectionResult {
  detectedTopic?: string;
  detectedSubjectSlug?: string;
  detectedSyllabusTag?: string;
  detectedPyqInfo?: string;
  confidence: number;
}

interface PatternRule {
  regex: RegExp;
  subjectSlug: string;
  topic: string;
  syllabusTag: string;
  weight: number;
}

const TOPIC_RULES: PatternRule[] = [
  // --- Mathematics / Quantitative Aptitude ---
  {
    regex: /\b(percent|percentage|profit|loss|discount|marked\s*price|cost\s*price|selling\s*price|cp|sp|प्रतिशत|लाभ|हानि|छूट)\b/i,
    subjectSlug: "maths",
    topic: "Percentage, Profit & Loss",
    syllabusTag: "Arithmetic · Percentage & Profit/Loss",
    weight: 10,
  },
  {
    regex: /\b(ratio|proportion|partnership|अनुपात|समानुपात|साझेदारी)\b/i,
    subjectSlug: "maths",
    topic: "Ratio, Proportion & Partnership",
    syllabusTag: "Arithmetic · Ratio & Proportion",
    weight: 9,
  },
  {
    regex: /\b(simple\s*interest|compound\s*interest|\bsi\b|\bci\b|rate\s*of\s*interest|per\s*annum|साधारण\s*ब्याज|चक्रवृद्धि\s*ब्याज)\b/i,
    subjectSlug: "maths",
    topic: "Simple & Compound Interest",
    syllabusTag: "Arithmetic · SI & CI",
    weight: 9,
  },
  {
    regex: /\b(speed|distance|train|km\s*\/\s*h|m\s*\/\s*s|stream|boat|चाल|दूरी|समय|ट्रेन|नाव|धारा)\b/i,
    subjectSlug: "maths",
    topic: "Time, Speed & Distance / Trains / Boats",
    syllabusTag: "Arithmetic · Speed & Distance",
    weight: 9,
  },
  {
    regex: /\b(time\s*and\s*work|pipes?\s*and\s*cistern|work\s*done|कार्य\s*और\s*समय|नल\s*और\s*टंकी)\b/i,
    subjectSlug: "maths",
    topic: "Time & Work / Pipes & Cisterns",
    syllabusTag: "Arithmetic · Time & Work",
    weight: 9,
  },
  {
    regex: /\b(sin|cos|tan|cot|sec|cosec|trigonometr|hypotenuse|elevation|depression|त्रिकोणमिति)\b/i,
    subjectSlug: "maths",
    topic: "Trigonometry & Heights/Distances",
    syllabusTag: "Advanced Maths · Trigonometry",
    weight: 10,
  },
  {
    regex: /\b(triangle|circle|radius|diameter|tangent|chord|rhombus|trapezium|cone|cylinder|sphere|mensuration|वृत्त|त्रिभुज|त्रिज्या|क्षेत्रमिति)\b/i,
    subjectSlug: "maths",
    topic: "Geometry & Mensuration (2D & 3D)",
    syllabusTag: "Advanced Maths · Geometry & Mensuration",
    weight: 9,
  },
  {
    regex: /\b(algebra|polynomial|quadratic|x\s*\+\s*1\s*\/\s*x|factori[zs]ation|बीजगणित)\b/i,
    subjectSlug: "maths",
    topic: "Algebra & Simplification",
    syllabusTag: "Advanced Maths · Algebra",
    weight: 9,
  },
  {
    regex: /\b(hcf|lcm|divisib|prime\s*number|remainder|म\.स\.प|ल\.स\.प|संख्या\s*पद्धति)\b/i,
    subjectSlug: "maths",
    topic: "Number System, HCF & LCM",
    syllabusTag: "Arithmetic · Number System",
    weight: 8,
  },

  // --- Biology (NEET) ---
  {
    regex: /\b(dna|rna|gene|genetics|chromosome|mendel|allele|mutation|nucleotide|आनुवंशिकी|डीएनए|आरएनए)\b/i,
    subjectSlug: "biology",
    topic: "Genetics & Molecular Basis of Inheritance",
    syllabusTag: "Genetics · Molecular Basis of Inheritance",
    weight: 10,
  },
  {
    regex: /\b(cell|mitochondri|nucleus|ribosome|cytoplasm|mitosis|meiosis|organelle|कोशिका|माइटोकॉन्ड्रिया)\b/i,
    subjectSlug: "biology",
    topic: "Cell Biology: Structure, Function & Division",
    syllabusTag: "Cytology · Cell Biology",
    weight: 10,
  },
  {
    regex: /\b(photosynthesis|chlorophyll|xylem|phloem|transpiration|stomata|प्रकाश\s*संश्लेषण|जाइलम|फ्लोएम)\b/i,
    subjectSlug: "biology",
    topic: "Plant Physiology & Photosynthesis/Respiration",
    syllabusTag: "Botany · Plant Physiology",
    weight: 10,
  },
  {
    regex: /\b(heart|cardiac|artery|vein|blood|haemoglobin|neuron|synapse|nephron|kidney|digestion|हृदय|रक्त|न्यूरॉन|पाचन)\b/i,
    subjectSlug: "biology",
    topic: "Human Physiology (Digestion, Circulation, Nervous System)",
    syllabusTag: "Zoology · Human Physiology",
    weight: 10,
  },
  {
    regex: /\b(ecosystem|biodiversity|food\s*chain|trophic|biosphere|पारिस्थितिकी|जैव\s*विविधता)\b/i,
    subjectSlug: "biology",
    topic: "Ecology, Ecosystems & Environmental Issues",
    syllabusTag: "Ecology · Biodiversity & Environment",
    weight: 9,
  },

  // --- Physics ---
  {
    regex: /\b(velocity|acceleration|momentum|gravity|projectile|friction|newton|kinetic\s*energy|वेग|त्वरण|संवेग|गुरुत्वाकर्षण)\b/i,
    subjectSlug: "physics",
    topic: "Mechanics, Laws of Motion & Work-Energy-Power",
    syllabusTag: "Physics · Mechanics",
    weight: 9,
  },
  {
    regex: /\b(refraction|reflection|lens|mirror|focal\s*length|prism|wavelength|प्रकाश|लेंस|अपवर्तन|परावर्तन)\b/i,
    subjectSlug: "physics",
    topic: "Optics: Ray Optics & Wave Optics",
    syllabusTag: "Physics · Optics",
    weight: 10,
  },
  {
    regex: /\b(current|voltage|resistance|ohm|capacitance|resistor|magnetic|धारा|प्रतिरोध|विद्युत)\b/i,
    subjectSlug: "physics",
    topic: "Current Electricity & Magnetism",
    syllabusTag: "Physics · Electrodynamics",
    weight: 9,
  },
  {
    regex: /\b(thermodynamic|entropy|carnot|calorimet|heat\s*transfer|ऊष्मा|ऊष्मागतिकी)\b/i,
    subjectSlug: "physics",
    topic: "Thermodynamics & Kinetic Theory of Gases",
    syllabusTag: "Physics · Thermal Physics",
    weight: 9,
  },

  // --- Chemistry ---
  {
    regex: /\b(hydrocarbon|benzene|alkane|alkene|alkyne|alcohol|aldehyde|ketone|isomer|कार्बोनिक|हाइड्रोकार्बन)\b/i,
    subjectSlug: "chemistry",
    topic: "Organic Chemistry: Hydrocarbons & Reaction Mechanisms",
    syllabusTag: "Chemistry · Organic Chemistry",
    weight: 10,
  },
  {
    regex: /\b(periodic\s*table|orbital|hybridiz|electronegativity|coordination|आवर्त\s*सारणी|संकरण)\b/i,
    subjectSlug: "chemistry",
    topic: "Inorganic Chemistry: Coordination Compounds & P-Block",
    syllabusTag: "Chemistry · Inorganic Chemistry",
    weight: 9,
  },
  {
    regex: /\b(mole\s*concept|molarity|equilibrium|electrochem|catalyst|विलयन|साम्यावस्था)\b/i,
    subjectSlug: "chemistry",
    topic: "Physical Chemistry: Thermodynamics & Equilibrium",
    syllabusTag: "Chemistry · Physical Chemistry",
    weight: 9,
  },

  // --- Reasoning ---
  {
    regex: /\b(syllogism|all\s+are|some\s+are|no\s+is|conclusion|कथन|निष्कर्ष|न्याय\s*निगमन)\b/i,
    subjectSlug: "reasoning",
    topic: "Syllogisms & Venn Diagrams",
    syllabusTag: "Reasoning · Deductive Logic",
    weight: 9,
  },
  {
    regex: /\b(blood\s*relation|maternal|father|mother|brother|sister|uncle|रक्त\s*संबंध|माता|पिता|भाई|बहन)\b/i,
    subjectSlug: "reasoning",
    topic: "Blood Relations & Family Tree",
    syllabusTag: "Reasoning · Blood Relations",
    weight: 10,
  },
  {
    regex: /\b(coded\s*as|coding|decoding|कूट|डिकोडिंग)\b/i,
    subjectSlug: "reasoning",
    topic: "Coding-Decoding & Word Formation",
    syllabusTag: "Reasoning · Coding-Decoding",
    weight: 10,
  },
  {
    regex: /\b(circular\s*table|facing\s*north|facing\s*south|seating\s*arrangement|बैठक\s*व्यवस्था)\b/i,
    subjectSlug: "reasoning",
    topic: "Seating Arrangement & Linear/Circular Puzzles",
    syllabusTag: "Reasoning · Seating Arrangement",
    weight: 10,
  },

  // --- General Knowledge / Polity / History / Geography ---
  {
    regex: /\b(article|constitution|fundamental\s*rights|preamble|parliament|president|supreme\s*court|lok\s*sabha|rajya\s*sabha|अनुच्छेद|संविधान|मौलिक\s*अधिकार|संसद|राष्ट्रपति)\b/i,
    subjectSlug: "gk",
    topic: "Indian Polity & Constitution (Articles, Amendments)",
    syllabusTag: "Polity · Constitution of India",
    weight: 10,
  },
  {
    regex: /\b(battle\s*of|mughal|british|east\s*india|indus\s*valley|harappa|mauryan|ashoka|gandhi|1857|viceroy|इतिहास|मुगल|हड़प्पा|मौर्य|अशोक|गांधी)\b/i,
    subjectSlug: "gk",
    topic: "Modern Indian History & Freedom Struggle",
    syllabusTag: "History · Indian Freedom Struggle",
    weight: 10,
  },
  {
    regex: /\b(river|mountain|himalaya|plateau|monsoon|soil|national\s*park|sanctuary|नदी|पर्वत|हिमालय|मानसून|राष्ट्रीय\s*उद्यान)\b/i,
    subjectSlug: "gk",
    topic: "Physical & Indian Geography (Rivers, Mountains, Climate)",
    syllabusTag: "Geography · Physical Geography",
    weight: 9,
  },
  {
    regex: /\b(gdp|inflation|rbi|fiscal|monetary|budget|repo\s*rate|मुद्रास्फीति|बजट|अर्थव्यवस्था)\b/i,
    subjectSlug: "gk",
    topic: "Indian Economy, Planning & Union Budget",
    syllabusTag: "Economy · Indian Economy & Budget",
    weight: 9,
  },
];

const PYQ_REGEX = /(?:SSC\s*(?:CGL|CHSL|MTS|CPO)|RRB\s*(?:NTPC|GROUP\s*D|JE)|NEET(?:\s*UG)?|JEE(?:\s*MAIN|\s*ADV)?|UPSC(?:\s*CSE|\s*CSAT)?|CDS|NDA|IBPS(?:\s*PO|\s*CLERK)?|UP\s*POLICE|BPSC|UPPSC)\s*(?:[-–/]\s*)?(?:20\d\d|19\d\d)?(?:\s*Tier\s*[12])?/i;
const YEAR_REGEX = /\b(19\d\d|20[0-2]\d)\b/;

export function detectTopicAndSyllabus(text: string): TopicDetectionResult {
  if (!text || text.trim().length < 5) {
    return { confidence: 0 };
  }

  const clean = text.toLowerCase();
  let bestMatch: PatternRule | null = null;
  let maxWeight = 0;

  for (const rule of TOPIC_RULES) {
    if (rule.regex.test(clean)) {
      if (rule.weight > maxWeight) {
        maxWeight = rule.weight;
        bestMatch = rule;
      }
    }
  }

  // Detect PYQ Information if present in text
  let detectedPyq: string | undefined = undefined;
  const pyqMatch = text.match(PYQ_REGEX);
  if (pyqMatch) {
    detectedPyq = pyqMatch[0].trim();
  } else {
    const yearMatch = text.match(YEAR_REGEX);
    if (yearMatch) {
      detectedPyq = `PYQ ${yearMatch[0]}`;
    }
  }

  if (bestMatch) {
    return {
      detectedTopic: bestMatch.topic,
      detectedSubjectSlug: bestMatch.subjectSlug,
      detectedSyllabusTag: bestMatch.syllabusTag,
      detectedPyqInfo: detectedPyq,
      confidence: maxWeight >= 10 ? 0.95 : 0.8,
    };
  }

  return {
    detectedPyqInfo: detectedPyq,
    confidence: detectedPyq ? 0.6 : 0,
  };
}
