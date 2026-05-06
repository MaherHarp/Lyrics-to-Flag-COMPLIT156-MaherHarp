import type { ParsedLyric, RepeatGroup } from './lyric.js';

export type ChorusCandidate = { line: string; score: number };

function longestConsecutiveRun(parsed: ParsedLyric, normalizedNeedle: string): number {
  let best = 0;
  let cur = 0;
  for (const norm of parsed.normalizedLines) {
    if (norm === normalizedNeedle) {
      cur += 1;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  return best;
}

export function scoreChorusCandidates(
  parsed: ParsedLyric,
  repeatGroups: RepeatGroup[],
): ChorusCandidate[] {
  const candidates: ChorusCandidate[] = [];

  for (const g of repeatGroups) {
    if (g.count < 2) continue;
    const avgLen = g.line.length;
    const lineLengthWeight = 1 + Math.min(avgLen / 48, 1); // 1..2
    const norm = parsed.normalizedLines[g.indices[0] ?? 0] ?? '';
    const run = norm ? longestConsecutiveRun(parsed, norm) : 1;
    const adjacencyBoost = Math.max(0, run - 1) * 0.75;
    const score = g.count * lineLengthWeight + adjacencyBoost;
    candidates.push({ line: g.line, score: Number(score.toFixed(3)) });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 8);
}

