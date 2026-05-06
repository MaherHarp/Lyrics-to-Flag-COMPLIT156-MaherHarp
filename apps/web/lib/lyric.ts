export type ParsedLyric = {
  lines: string[]; // non-empty trimmed lines, original for display
  normalizedLines: string[]; // line-normalized for grouping / scoring
};

export function parseLyric(lyric: string): ParsedLyric {
  const raw = lyric.replace(/\r\n/g, '\n').split('\n');
  const lines = raw.map((l) => l.trim()).filter((l) => l.length > 0);
  const normalizedLines = lines.map(normalizeLineForMatch);
  return { lines, normalizedLines };
}

export function normalizeLineForMatch(line: string): string {
  return line
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9\s']/g, '') // strip punctuation (keep apostrophes)
    .replace(/\s+/g, ' ')
    .trim();
}

export type RepeatGroup = {
  line: string; // original representative line
  count: number;
  indices: number[]; // indices into parsed.lines
};

export function groupRepetitions(parsed: ParsedLyric): RepeatGroup[] {
  const map = new Map<
    string,
    { count: number; indices: number[]; repr: string; firstIndex: number }
  >();
  parsed.normalizedLines.forEach((norm, idx) => {
    const existing = map.get(norm);
    if (existing) {
      existing.count += 1;
      existing.indices.push(idx);
    } else {
      map.set(norm, {
        count: 1,
        indices: [idx],
        repr: parsed.lines[idx] ?? '',
        firstIndex: idx,
      });
    }
  });

  const groups: RepeatGroup[] = Array.from(map.entries())
    .filter(([k]) => k.length > 0)
    .map(([, v]) => ({ line: v.repr, count: v.count, indices: v.indices }));

  groups.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return (a.indices[0] ?? 0) - (b.indices[0] ?? 0);
  });
  return groups;
}

export function averageLineLength(lines: string[]): number {
  if (lines.length === 0) return 0;
  const sum = lines.reduce((acc, l) => acc + l.length, 0);
  return sum / lines.length;
}

export function lexicalDiversity(text: string): number {
  const tokens = (text.toLowerCase().match(/\b[\p{L}\p{N}]+'?[\p{L}\p{N}]*\b/gu) ?? []).filter(
    (t) => t.length > 0,
  );
  if (tokens.length === 0) return 0;
  const uniq = new Set(tokens);
  return uniq.size / tokens.length;
}

// ── Rhyme detection ───────────────────────────────────────────────────────────

function stripToAlpha(word: string): string {
  return word.toLowerCase().replace(/[^a-z]/g, '');
}

function getLastWord(line: string): string {
  const words = line.trim().split(/\s+/);
  return stripToAlpha(words[words.length - 1] ?? '');
}

/**
 * Two words rhyme if they share the same ending from the last vowel onwards,
 * provided the shared suffix is at least 2 characters. Identical words don't count.
 */
function wordsRhyme(a: string, b: string): boolean {
  if (a.length < 2 || b.length < 2 || a === b) return false;
  // Find last vowel position in each
  const lastVowel = (s: string) => {
    for (let i = s.length - 1; i >= 0; i--) {
      if ('aeiouy'.includes(s[i]!)) return i;
    }
    return s.length - 2;
  };
  const suffixA = a.slice(lastVowel(a));
  const suffixB = b.slice(lastVowel(b));
  return suffixA.length >= 2 && suffixA === suffixB;
}

/**
 * 0-1 score: proportion of adjacent + alternating line-end pairs that rhyme.
 * Checks offsets 1 (AABB) and 2 (ABAB).
 */
export function rhymeScore(lines: string[]): number {
  if (lines.length < 2) return 0;
  const endWords = lines.map(getLastWord);
  let rhymingPairs = 0;
  let totalPairs = 0;

  for (let i = 0; i < endWords.length; i++) {
    for (const offset of [1, 2]) {
      if (i + offset < endWords.length) {
        totalPairs++;
        if (wordsRhyme(endWords[i]!, endWords[i + offset]!)) {
          rhymingPairs += offset === 1 ? 1.2 : 1.0; // adjacent rhymes weight slightly more
        }
      }
    }
  }
  return totalPairs > 0 ? Math.min(1, rhymingPairs / totalPairs) : 0;
}

// ── Anaphora detection ────────────────────────────────────────────────────────

/**
 * 0-1 score for anaphora: fraction of lines that share the most common 2-word opening.
 * E.g. "I am…", "I want…", "I feel…" all count if "I" dominates even at 1-word level.
 */
export function anaphoraScore(lines: string[]): number {
  if (lines.length < 3) return 0;

  const getOpening = (line: string, n: number): string => {
    const words = line
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    return words.slice(0, n).join(' ');
  };

  const score2 = (() => {
    const freq = new Map<string, number>();
    for (const line of lines) {
      const op = getOpening(line, 2);
      if (op.length > 2) freq.set(op, (freq.get(op) ?? 0) + 1);
    }
    const max = freq.size > 0 ? Math.max(...freq.values()) : 0;
    return max / lines.length;
  })();

  const score1 = (() => {
    const freq = new Map<string, number>();
    for (const line of lines) {
      const op = getOpening(line, 1);
      if (op.length > 1) freq.set(op, (freq.get(op) ?? 0) + 1);
    }
    const max = freq.size > 0 ? Math.max(...freq.values()) : 0;
    return max / lines.length;
  })();

  // Take the higher of 2-word and 1-word anaphora, weighted
  return Math.min(1, Math.max(score2, score1 * 0.7));
}

// ── Meter / syllable regularity ───────────────────────────────────────────────

function estimateSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length === 0) return 0;
  if (w.length <= 3) return 1;
  const vowelGroups = w.match(/[aeiouy]+/g) ?? [];
  let count = vowelGroups.length;
  // Silent trailing 'e'
  if (w.endsWith('e') && count > 1) count--;
  // 'le' at end adds a syllable if preceded by consonant
  if (w.endsWith('le') && w.length > 2 && !'aeiouy'.includes(w[w.length - 3]!)) count++;
  return Math.max(1, count);
}

export function lineSyllableCount(line: string): number {
  return line
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .reduce((sum, w) => sum + estimateSyllables(w), 0);
}

/**
 * 0-1 score: 1 = perfectly regular meter, 0 = wildly variable line lengths.
 * Uses coefficient of variation (std dev / mean) of syllable counts per line.
 */
export function meterRegularity(lines: string[]): number {
  if (lines.length < 2) return 0;
  const syllCounts = lines.map(lineSyllableCount);
  const mean = syllCounts.reduce((a, b) => a + b, 0) / syllCounts.length;
  if (mean === 0) return 0;
  const variance =
    syllCounts.reduce((sum, s) => sum + (s - mean) ** 2, 0) / syllCounts.length;
  const cv = Math.sqrt(variance) / mean; // coefficient of variation
  return Math.max(0, 1 - Math.min(1, cv * 1.8));
}

/** Average syllables per line. */
export function avgSyllablesPerLine(lines: string[]): number {
  if (lines.length === 0) return 0;
  return lines.reduce((sum, l) => sum + lineSyllableCount(l), 0) / lines.length;
}
