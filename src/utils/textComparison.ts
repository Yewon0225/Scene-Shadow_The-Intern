export interface WordMatchResult {
  originalWord: string;
  isMatched: boolean;
  cleanWord: string;
}

export interface ComparisonResult {
  words: WordMatchResult[];
  matchedCount: number;
  totalCount: number;
  spokenTranscript: string;
}

/**
 * Strips punctuation and returns lowercased alphanumeric string
 */
export function cleanToken(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9']/g, '').trim();
}

/**
 * Compares target sentence against recognized speech transcript
 */
export function compareTranscriptToSentence(targetSentence: string, recognizedText: string): ComparisonResult {
  const targetWords = targetSentence.trim().split(/\s+/).filter(Boolean);
  const spokenTokens = recognizedText
    .trim()
    .split(/\s+/)
    .map(w => cleanToken(w))
    .filter(Boolean);

  // Keep track of matched spoken token indices so words aren't double-counted
  const spokenMatched = new Set<number>();

  const words: WordMatchResult[] = targetWords.map((original) => {
    const targetClean = cleanToken(original);
    if (!targetClean) {
      return { originalWord: original, isMatched: true, cleanWord: '' };
    }

    // Find first matching token from spoken transcript
    let foundIndex = -1;
    for (let i = 0; i < spokenTokens.length; i++) {
      if (!spokenMatched.has(i)) {
        // Direct match or partial phonetic similarity (e.g. contractions like you're vs your)
        const spoken = spokenTokens[i];
        if (spoken === targetClean || spoken.replace(/'/g, '') === targetClean.replace(/'/g, '')) {
          foundIndex = i;
          break;
        }
      }
    }

    if (foundIndex !== -1) {
      spokenMatched.add(foundIndex);
      return {
        originalWord: original,
        isMatched: true,
        cleanWord: targetClean,
      };
    }

    return {
      originalWord: original,
      isMatched: false,
      cleanWord: targetClean,
    };
  });

  const matchedCount = words.filter(w => w.cleanWord && w.isMatched).length;
  const totalCount = words.filter(w => w.cleanWord).length;

  return {
    words,
    matchedCount,
    totalCount,
    spokenTranscript: recognizedText,
  };
}
