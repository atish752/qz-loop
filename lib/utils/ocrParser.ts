export interface ParsedQuestion {
  questionText: string;
  options: [string, string, string, string];
  correctOptionId: "A" | "B" | "C" | "D";
  explanation?: string;
  rawText: string;
}

export function parseQuestionAndOptions(rawText: string): ParsedQuestion {
  if (!rawText || typeof rawText !== "string") {
    return {
      questionText: "",
      options: ["", "", "", ""],
      correctOptionId: "A",
      explanation: "",
      rawText: "",
    };
  }

  // 1. Normalize text & line breaks
  let cleaned = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  // 2. Extract explanation / solution if present at the bottom
  let explanation = "";
  const explMatch = cleaned.match(
    /(?:^|\n)\s*(?:Explanation|Expl|Solution|Sol|व्याख्या|हल)\s*[:\-—]\s*([\s\S]+)$/i
  );
  if (explMatch) {
    explanation = explMatch[1].trim();
    cleaned = cleaned.substring(0, explMatch.index).trim();
  }

  // 3. Extract correct answer key if present (e.g., "Ans: B", "उत्तर: ख", "Key - 3")
  let correctOptionId: "A" | "B" | "C" | "D" = "A";
  const ansMatch = cleaned.match(
    /(?:^|\n)\s*(?:Answer|Ans|Correct\s*Option|Option|उत्तर|कुंजी|सही\s*उत्तर)\s*[:\-—]?\s*[\(\[]?([A-Da-d1-4कखगघअबसदIVXivx]+)[\)\]\.]?/i
  );
  if (ansMatch) {
    const rawChoice = ansMatch[1].trim();
    const upperChoice = rawChoice.toUpperCase();
    if (upperChoice === "1" || upperChoice === "A" || rawChoice === "क" || rawChoice === "अ" || upperChoice === "I") {
      correctOptionId = "A";
    } else if (upperChoice === "2" || upperChoice === "B" || rawChoice === "ख" || rawChoice === "ब" || upperChoice === "II") {
      correctOptionId = "B";
    } else if (upperChoice === "3" || upperChoice === "C" || rawChoice === "ग" || rawChoice === "स" || upperChoice === "III") {
      correctOptionId = "C";
    } else if (upperChoice === "4" || upperChoice === "D" || rawChoice === "घ" || rawChoice === "द" || upperChoice === "IV") {
      correctOptionId = "D";
    }

    // Remove the answer line from options parsing
    cleaned = cleaned.replace(ansMatch[0], "").trim();
  }

  // Helper to strip leading Question numbering e.g. "Q. 1", "Question 5:", "1.", "45)", etc.
  const stripQuestionPrefix = (text: string) => {
    return text
      .replace(/^(?:Q(?:uestion)?[\s\.\:\-]*\d*[\s\.\:\-]*|\d+[\.\:\)\-]\s*)/i, "")
      .trim();
  };

  // 4. Candidate Option Marker Schemes
  // Scheme A: Latin letters (A), (B), (C), (D) or A), B), C), D) or A., B., C., D. or [A], [B], [C], [D]
  // Scheme B: Hindi Devanagari (क), (ख), (ग), (घ) or (अ), (ब), (स), (द)
  // Scheme C: Numbers (1), (2), (3), (4) or 1), 2), 3), 4) or 1., 2., 3., 4.
  // Scheme D: Roman numerals (i), (ii), (iii), (iv)
  interface MarkerMatch {
    index: number;
    length: number;
  }

  const findSchemeMarkers = (
    text: string,
    patterns: [RegExp, RegExp, RegExp, RegExp]
  ): [MarkerMatch, MarkerMatch, MarkerMatch, MarkerMatch] | null => {
    const m1 = text.match(patterns[0]);
    if (!m1 || m1.index === undefined) return null;

    // Search for m2 only strictly AFTER m1
    const subAfter1 = text.substring(m1.index + m1[0].length);
    const m2Rel = subAfter1.match(patterns[1]);
    if (!m2Rel || m2Rel.index === undefined) return null;
    const m2Index = m1.index + m1[0].length + m2Rel.index;

    // Search for m3 only strictly AFTER m2
    const subAfter2 = text.substring(m2Index + m2Rel[0].length);
    const m3Rel = subAfter2.match(patterns[2]);
    if (!m3Rel || m3Rel.index === undefined) return null;
    const m3Index = m2Index + m2Rel[0].length + m3Rel.index;

    // Search for m4 only strictly AFTER m3
    const subAfter3 = text.substring(m3Index + m3Rel[0].length);
    const m4Rel = subAfter3.match(patterns[3]);
    if (!m4Rel || m4Rel.index === undefined) return null;
    const m4Index = m3Index + m3Rel[0].length + m4Rel.index;

    return [
      { index: m1.index, length: m1[0].length },
      { index: m2Index, length: m2Rel[0].length },
      { index: m3Index, length: m3Rel[0].length },
      { index: m4Index, length: m4Rel[0].length },
    ];
  };

  // We test schemes in order of specificity to avoid false positives:
  const candidateSchemes: [RegExp, RegExp, RegExp, RegExp][] = [
    // 1. Bracketed Latin: (A), (B), (C), (D) or [A], [B], [C], [D] or A), B), C), D)
    [
      /(?:^|\n|\s+)[\(\[]A[\)\]\.\:\-]\s*|(?:^|\n|\s+)A\)\s+/i,
      /(?:^|\n|\s+)[\(\[]B[\)\]\.\:\-]\s*|(?:^|\n|\s+)B\)\s+/i,
      /(?:^|\n|\s+)[\(\[]C[\)\]\.\:\-]\s*|(?:^|\n|\s+)C\)\s+/i,
      /(?:^|\n|\s+)[\(\[]D[\)\]\.\:\-]\s*|(?:^|\n|\s+)D\)\s+/i,
    ],
    // 2. Hindi Devanagari: (क) (ख) (ग) (घ) or (अ) (ब) (स) (द)
    [
      /(?:^|\n|\s+)[\(\[]?(?:क|अ)[\)\]\.\:\-]\s*/,
      /(?:^|\n|\s+)[\(\[]?(?:ख|ब)[\)\]\.\:\-]\s*/,
      /(?:^|\n|\s+)[\(\[]?(?:ग|स)[\)\]\.\:\-]\s*/,
      /(?:^|\n|\s+)[\(\[]?(?:घ|द)[\)\]\.\:\-]\s*/,
    ],
    // 3. Dot-separated Latin at start of line or with clear spacing: A. B. C. D.
    [
      /(?:^|\n|\s{2,})A[\.\:\-]\s+/i,
      /(?:^|\n|\s+)B[\.\:\-]\s+/i,
      /(?:^|\n|\s+)C[\.\:\-]\s+/i,
      /(?:^|\n|\s+)D[\.\:\-]\s+/i,
    ],
    // 4. Bracketed Numbers: (1), (2), (3), (4) or [1], [2], [3], [4] or 1), 2), 3), 4)
    [
      /(?:^|\n|\s+)[\(\[]1[\)\]\.\:\-]\s*|(?:^|\n|\s+)1\)\s*/,
      /(?:^|\n|\s+)[\(\[]2[\)\]\.\:\-]\s*|(?:^|\n|\s+)2\)\s*/,
      /(?:^|\n|\s+)[\(\[]3[\)\]\.\:\-]\s*|(?:^|\n|\s+)3\)\s*/,
      /(?:^|\n|\s+)[\(\[]4[\)\]\.\:\-]\s*|(?:^|\n|\s+)4\)\s*/,
    ],
    // 5. Roman numerals: (i), (ii), (iii), (iv)
    [
      /(?:^|\n|\s+)[\(\[]i[\)\]\.\:\-]\s*/i,
      /(?:^|\n|\s+)[\(\[]ii[\)\]\.\:\-]\s*/i,
      /(?:^|\n|\s+)[\(\[]iii[\)\]\.\:\-]\s*/i,
      /(?:^|\n|\s+)[\(\[]iv[\)\]\.\:\-]\s*/i,
    ],
  ];

  let questionText = "";
  let options: [string, string, string, string] = ["", "", "", ""];
  let matchedScheme = false;

  // Before running schemes, if text starts with question number and then has options,
  // we check if a scheme matches in the full text:
  for (const scheme of candidateSchemes) {
    const matches = findSchemeMarkers(cleaned, scheme);
    if (matches) {
      const [mA, mB, mC, mD] = matches;
      const potentialQ = cleaned.substring(0, mA.index).trim();
      const opt0 = cleaned.substring(mA.index + mA.length, mB.index).trim();
      const opt1 = cleaned.substring(mB.index + mB.length, mC.index).trim();
      const opt2 = cleaned.substring(mC.index + mC.length, mD.index).trim();
      const opt3 = cleaned.substring(mD.index + mD.length).trim();

      // Only accept if all options have content
      if (opt0 && opt1 && opt2 && opt3) {
        questionText = potentialQ;
        options = [opt0, opt1, opt2, opt3];
        matchedScheme = true;
        break;
      }
    }
  }

  // If no 4-marker scheme matched, try numbered options "1. 2. 3. 4."
  // Note: ensure "1." is NOT the question prefix by requiring question text before "1."
  if (!matchedScheme) {
    const numDotScheme: [RegExp, RegExp, RegExp, RegExp] = [
      /(?:\n|\s{2,})1[\.\:\-]\s+/,
      /(?:^|\n|\s+)2[\.\:\-]\s+/,
      /(?:^|\n|\s+)3[\.\:\-]\s+/,
      /(?:^|\n|\s+)4[\.\:\-]\s+/,
    ];
    const numMatches = findSchemeMarkers(cleaned, numDotScheme);
    if (numMatches) {
      const [mA, mB, mC, mD] = numMatches;
      const potentialQ = cleaned.substring(0, mA.index).trim();
      const opt0 = cleaned.substring(mA.index + mA.length, mB.index).trim();
      const opt1 = cleaned.substring(mB.index + mB.length, mC.index).trim();
      const opt2 = cleaned.substring(mC.index + mC.length, mD.index).trim();
      const opt3 = cleaned.substring(mD.index + mD.length).trim();
      if (opt0 && opt1 && opt2 && opt3) {
        questionText = potentialQ;
        options = [opt0, opt1, opt2, opt3];
        matchedScheme = true;
      }
    }
  }

  // Fallback heuristic: Line-by-line inspection
  if (!matchedScheme) {
    const lines = cleaned
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const questionLines: string[] = [];
    let optionIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check if line is an option marker
      const isA = /^[\(\[]?(?:A|1|क|अ)[\)\.\:\-\]]\s*/i.test(line);
      const isB = /^[\(\[]?(?:B|2|ख|ब)[\)\.\:\-\]]\s*/i.test(line);
      const isC = /^[\(\[]?(?:C|3|ग|स)[\)\.\:\-\]]\s*/i.test(line);
      const isD = /^[\(\[]?(?:D|4|घ|द)[\)\.\:\-\]]\s*/i.test(line);

      // Guard: If line 0 starts with "1.", it could be question number "1. What is..."
      const isFirstLineQuestionNumber = i === 0 && /^1[\.\:\)]\s+[A-Za-z\u0900-\u097F]{3,}/.test(line);

      if (isA && !isFirstLineQuestionNumber) {
        optionIdx = 0;
        options[0] = line.replace(/^[\(\[]?(?:A|1|क|अ)[\)\.\:\-\]]\s*/i, "").trim();
      } else if (isB) {
        optionIdx = 1;
        options[1] = line.replace(/^[\(\[]?(?:B|2|ख|ब)[\)\.\:\-\]]\s*/i, "").trim();
      } else if (isC) {
        optionIdx = 2;
        options[2] = line.replace(/^[\(\[]?(?:C|3|ग|स)[\)\.\:\-\]]\s*/i, "").trim();
      } else if (isD) {
        optionIdx = 3;
        options[3] = line.replace(/^[\(\[]?(?:D|4|घ|द)[\)\.\:\-\]]\s*/i, "").trim();
      } else if (optionIdx >= 0 && optionIdx <= 3) {
        // Multi-line continuation of current option
        options[optionIdx] = (options[optionIdx] + " " + line).trim();
      } else {
        questionLines.push(line);
      }
    }

    if (questionLines.length > 0) {
      questionText = questionLines.join(" ").trim();
    }

    // If options are still not filled, take last 4 lines as options if text is long enough
    if ((!options[0] || !options[1] || !options[2] || !options[3]) && lines.length >= 5) {
      options[3] = lines[lines.length - 1];
      options[2] = lines[lines.length - 2];
      options[1] = lines[lines.length - 3];
      options[0] = lines[lines.length - 4];
      questionText = lines.slice(0, lines.length - 4).join(" ");
    }
  }

  // 5. Clean up leading Question prefixes from question statement
  questionText = stripQuestionPrefix(questionText);

  // Clean trailing punctuation or brackets in options
  for (let i = 0; i < 4; i++) {
    options[i] = (options[i] || "")
      .replace(/^[\(\[]?[A-D1-4कखगघअबसद][\)\.\:\-\]]\s*/i, "")
      .trim();
  }

  return {
    questionText,
    options,
    correctOptionId,
    explanation,
    rawText,
  };
}
