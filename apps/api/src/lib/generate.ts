import type {
  ExplanationItem,
  GenerateRequest,
  GenerateResponse,
  InputSummary,
} from '@complit156/shared';
import {
  parseLyric,
  groupRepetitions,
  averageLineLength,
  lexicalDiversity,
  rhymeScore,
  anaphoraScore,
  meterRegularity,
  avgSyllablesPerLine,
} from './lyric.js';
import { scoreChorusCandidates } from './chorus.js';
import { sentimentHint, subEmotion, intensityScore } from './sentiment.js';
import { matchCountryFlag } from './match.js';
import { generateBlazonForCountry } from './blazon.js';

export function generateFromLyric(req: GenerateRequest): GenerateResponse {
  const parsed = parseLyric(req.lyric);
  const lines = parsed.lines;
  const lineCount = lines.length;

  // ── Feature extraction ─────────────────────────────────────────────────────

  const repeatGroups = groupRepetitions(parsed);
  const uniqueLineCount = repeatGroups.length;
  const chorusCandidates = scoreChorusCandidates(parsed, repeatGroups);
  const avgLen = averageLineLength(lines);
  const lexDiv = lexicalDiversity(lines.join(' '));

  const fullText = lines.join(' ');
  const sentiment = sentimentHint(fullText);
  const sub = subEmotion(fullText);
  const intensity = intensityScore(req.lyric);
  const rhyme = rhymeScore(lines);
  const meter = meterRegularity(lines);
  const anaphora = anaphoraScore(lines);
  const avgSyll = avgSyllablesPerLine(lines);

  const strongestChorus = chorusCandidates[0]?.score ?? 0;
  const strongChorus = strongestChorus >= 4.5;
  const repetitionRatio = lineCount === 0 ? 1 : uniqueLineCount / lineCount;

  // ── Flag matching ──────────────────────────────────────────────────────────

  const match = matchCountryFlag({
    lineCount,
    uniqueLineCount,
    lexicalDiversity: lexDiv,
    repetitionRatio,
    strongChorus,
    sentiment,
    subEmotion: sub,
    intensityScore: intensity,
    rhymeScore: rhyme,
    meterRegularity: meter,
    anaphoraScore: anaphora,
    avgSyllablesPerLine: avgSyll,
  });

  // ── Input summary ──────────────────────────────────────────────────────────

  const inputSummary: InputSummary = {
    line_count: lineCount,
    unique_line_count: uniqueLineCount,
    repeat_groups: repeatGroups.map((g) => ({
      line: g.line,
      count: g.count,
      indices: g.indices,
    })),
    chorus_candidates: chorusCandidates,
    avg_line_length: Number(avgLen.toFixed(3)),
    lexical_diversity: Number(lexDiv.toFixed(3)),
    sentiment_hint: sentiment,
    sub_emotion: sub,
    intensity_score: Number(intensity.toFixed(3)),
    rhyme_score: Number(rhyme.toFixed(3)),
    meter_regularity: Number(meter.toFixed(3)),
    anaphora_score: Number(anaphora.toFixed(3)),
    avg_syllables_per_line: Number(avgSyll.toFixed(2)),
  };

  // ── Explanation trace ──────────────────────────────────────────────────────

  const explanation: ExplanationItem[] = [];

  explanation.push({
    rule_id: 'normalize_and_count',
    rule_text: 'Normalize the lyric into non-empty lines, then measure structure and repetition.',
    evidence: `${lineCount} lines total, ${uniqueLineCount} unique after normalization. Repetition ratio ${repetitionRatio.toFixed(2)} (lower means more repetitive).`,
    effect_on_flag: 'Structural repetition drives layout preference. High repetition leans toward circles or stripes. High uniqueness leans toward vertical stripes.',
  });

  explanation.push({
    rule_id: 'chorus_detection',
    rule_text: 'Score repeated lines for chorus candidacy using frequency, line length, and adjacency.',
    evidence: chorusCandidates[0]
      ? `Top candidate "${chorusCandidates[0].line}" with score ${chorusCandidates[0].score.toFixed(2)}. Strong chorus is ${strongChorus ? 'yes' : 'no'}.`
      : 'No repeated-line chorus detected.',
    effect_on_flag: strongChorus
      ? 'A strong chorus pushes the result toward horizontal-stripe flags whose visual rhythm mirrors the lyric.'
      : 'With no dominant chorus, other structural signals take priority.',
  });

  explanation.push({
    rule_id: 'rhyme_scheme',
    rule_text: 'Detect end-rhyme density across adjacent and alternating line pairs.',
    evidence: `Rhyme score ${(rhyme * 100).toFixed(0)} percent of eligible pairs rhyme.`,
    effect_on_flag:
      rhyme >= 0.4
        ? 'A strong rhyme scheme leans toward visually symmetric flags, where ABAB or AABB structure mirrors visual symmetry.'
        : rhyme < 0.2
          ? 'Free verse with low rhyme leans toward asymmetric, complex flag designs.'
          : 'Moderate rhyme allows flexibility in layout.',
  });

  explanation.push({
    rule_id: 'meter_regularity',
    rule_text: 'Estimate syllables per line and compute the coefficient of variation to gauge metrical regularity.',
    evidence: `Average syllables per line ${avgSyll.toFixed(1)}. Regularity ${(meter * 100).toFixed(0)} percent (100 percent means perfectly uniform).`,
    effect_on_flag:
      meter >= 0.65
        ? 'A regular meter favors simple, geometric flag designs.'
        : meter < 0.35
          ? 'Irregular meter favors complex, multi-element flag designs.'
          : 'Moderate meter suggests medium complexity.',
  });

  explanation.push({
    rule_id: 'anaphora',
    rule_text: 'Detect anaphora as the fraction of lines that share a common one or two word opening.',
    evidence:
      anaphora >= 0.35
        ? `Strong anaphora detected. ${(anaphora * 100).toFixed(0)} percent of lines share the same opening phrase.`
        : `Anaphora score ${(anaphora * 100).toFixed(0)} percent, no dominant repeated opening.`,
    effect_on_flag:
      anaphora >= 0.35
        ? 'Anaphoric parallelism leans toward striped flags whose bands echo the lyric\'s repeated syntactic unit.'
        : 'No strong anaphora, so the stripe pattern is not the primary structural signal.',
  });

  explanation.push({
    rule_id: 'lexical_diversity',
    rule_text: 'Compute lexical diversity as a proxy for vocabulary richness.',
    evidence: `Lexical diversity ${lexDiv.toFixed(2)} (0 means all words repeated, 1 means all unique).`,
    effect_on_flag:
      lexDiv >= 0.5
        ? 'High diversity leans toward flags with stars or many colors, signifying multiplicity.'
        : 'Low diversity leans toward simpler, cleaner designs.',
  });

  explanation.push({
    rule_id: 'sentiment_and_emotion',
    rule_text: 'Evaluate emotional tone using an expanded lexicon with negation handling and intensity modifiers.',
    evidence: `Polarity ${sentiment}. Sub-emotion ${sub}. Intensity ${(intensity * 100).toFixed(0)} percent.`,
    effect_on_flag: `${capitalize(sentiment)} polarity and the ${sub} register steer the match toward flags with matching color warmth and dominant hue.`,
  });

  // Country match. One entry per reason, deduped.
  const seenReasons = new Set<string>();
  for (const reason of match.reasons) {
    if (seenReasons.has(reason)) continue;
    seenReasons.add(reason);
    explanation.push({
      rule_id: 'flag_match',
      rule_text: `Matched to ${match.country.name} (${match.country.code}) at score ${match.score}.`,
      evidence: reason,
      effect_on_flag: `The flag of ${match.country.name} is displayed.`,
    });
  }

  const blazon = generateBlazonForCountry(match.country);
  explanation.push({
    rule_id: 'blazon',
    rule_text: 'Describe the matched flag in formal heraldic blazon.',
    evidence: `Flag of ${match.country.name} (${match.country.code}).`,
    effect_on_flag: `Blazon. "${blazon}"`,
  });

  return {
    input_summary: inputSummary,
    matched_country: {
      name: match.country.name,
      code: match.country.code,
      match_score: match.score,
      reasons: match.reasons,
      runner_up: match.runner_up,
    },
    explanation,
    svg: match.country.svg,
    blazon,
  };
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}
