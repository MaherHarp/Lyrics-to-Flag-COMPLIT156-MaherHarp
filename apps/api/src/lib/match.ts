import type { CountryFlag, FlagLayout } from './countries.js';
import { COUNTRY_FLAGS } from './countries.js';
import type { SentimentHint, SubEmotion } from './sentiment.js';

/**
 * Derived "target profile" from lyric analysis.
 * The matching algorithm scores each country flag against this profile.
 */
export type LyricProfile = {
  // Structure
  lineCount: number;
  uniqueLineCount: number;
  repetitionRatio: number;    // uniqueLineCount / lineCount  (lower = more repetitive)
  strongChorus: boolean;
  // Lexical
  lexicalDiversity: number;   // 0-1
  avgSyllablesPerLine: number;
  // Formal / prosodic
  rhymeScore: number;         // 0-1  (ABAB / AABB end-rhyme density)
  meterRegularity: number;    // 0-1  (1 = perfectly regular syllable counts)
  anaphoraScore: number;      // 0-1  (fraction of lines sharing common opening)
  // Emotional
  sentiment: SentimentHint;
  subEmotion: SubEmotion;
  intensityScore: number;     // 0-1
};

type ScoredFlag = {
  country: CountryFlag;
  score: number;
  reasons: string[];
};

// ── Layout targeting ──────────────────────────────────────────────────────────

/**
 * Determine the ideal layout from the lyric's structural and emotional signals.
 * Uses a priority-ordered rule chain so each signal can contribute.
 */
function idealLayout(p: LyricProfile): FlagLayout {
  // Strong chorus → horizontal stripes (rhythmic, regular repetition)
  if (p.strongChorus) return 'horizontal_stripes';

  // High anaphora (parallel syntax) → vertical stripes (columnar, parallel)
  if (p.anaphoraScore >= 0.4) return 'vertical_stripes';

  // Melancholy / negative sentiment → chevron (dynamic tension, inward movement)
  if (p.sentiment === 'negative' && (p.subEmotion === 'melancholy' || p.subEmotion === 'angry'))
    return 'chevron';

  // High repetition & circular sub-emotion → circle (unity, return)
  if (p.repetitionRatio <= 0.4 && (p.subEmotion === 'longing' || p.subEmotion === 'peaceful'))
    return 'circle_center';

  // Regular meter + strong rhyme → cross (precise geometric structure)
  if (p.meterRegularity >= 0.65 && p.rhymeScore >= 0.35) return 'cross';

  // Very high unique-line ratio → vertical stripes (variety / plurality)
  if (p.repetitionRatio >= 0.8) return 'vertical_stripes';

  // Default: horizontal stripes
  return 'horizontal_stripes';
}

/** Derive ideal stripe count from unique-line count. */
function idealStripeCount(uniqueLineCount: number): number {
  if (uniqueLineCount <= 2) return 2;
  if (uniqueLineCount <= 4) return 3;
  if (uniqueLineCount <= 8) return 5;
  return 13;
}

// ── Per-country scoring ───────────────────────────────────────────────────────

/**
 * Score one country flag against the lyric profile.
 * Ten dimensions are evaluated; each has a stated maximum.
 *
 * Max theoretical score ≈ 100 (calibrated so an excellent match ≈ 85-100).
 */
function scoreCountry(country: CountryFlag, profile: LyricProfile): ScoredFlag {
  const p = country.properties;
  let score = 0;
  const reasons: string[] = [];

  // ── 1. Layout match  (0-22 pts) ─────────────────────────────────────────────
  const targetLayout = idealLayout(profile);
  if (p.layout === targetLayout) {
    score += 22;
    reasons.push(`Layout "${targetLayout}" matches lyric structure.`);
  } else if (
    (targetLayout === 'horizontal_stripes' && p.layout === 'complex') ||
    (targetLayout === 'complex' && p.layout === 'horizontal_stripes') ||
    (targetLayout === 'vertical_stripes' && p.layout === 'horizontal_stripes') ||
    (targetLayout === 'horizontal_stripes' && p.layout === 'vertical_stripes')
  ) {
    score += 8;
  } else if (p.layout === 'complex') {
    score += 3; // complex flags partially match anything
  }

  // ── 2. Stripe count proximity  (0-12 pts) ───────────────────────────────────
  const targetStripes = idealStripeCount(profile.uniqueLineCount);
  const stripeDiff = Math.abs(p.stripe_count - targetStripes);
  if (stripeDiff === 0) {
    score += 12;
    reasons.push(
      `Stripe count (${p.stripe_count}) matches ${profile.uniqueLineCount} unique lines.`,
    );
  } else if (stripeDiff === 1) {
    score += 7;
  } else if (stripeDiff === 2) {
    score += 3;
  }

  // ── 3. Sentiment affinity  (0-18 pts) ───────────────────────────────────────
  if (p.sentiment_affinity === profile.sentiment) {
    score += 18;
    reasons.push(`Sentiment "${profile.sentiment}" matches flag's character.`);
  } else if (p.sentiment_affinity === 'neutral' || profile.sentiment === 'neutral') {
    score += 7;
  }

  // ── 4. Sub-emotion → color warmth  (0-15 pts) ───────────────────────────────
  const warmthTarget: Record<SubEmotion, string> = {
    melancholy: 'dark',
    joyful:     'warm',
    angry:      'dark',
    hopeful:    'warm',
    peaceful:   'cool',
    longing:    'cool',
    defiant:    'warm',
    neutral:    'neutral',
  };
  const targetWarmth = warmthTarget[profile.subEmotion];
  if (p.color_warmth === targetWarmth) {
    score += 15;
    reasons.push(
      `${profile.subEmotion !== 'neutral' ? `Sub-emotion "${profile.subEmotion}"` : 'Neutral register'} aligns with ${p.color_warmth} palette.`,
    );
  } else if (
    (targetWarmth === 'warm' && p.color_warmth === 'neutral') ||
    (targetWarmth === 'cool' && p.color_warmth === 'neutral') ||
    (targetWarmth === 'neutral' && p.color_warmth !== 'dark')
  ) {
    score += 5;
  }

  // Bonus: dominant hue matches sub-emotion
  const hueBonus: Partial<Record<SubEmotion, string>> = {
    angry:     'red',
    joyful:    'yellow',
    melancholy:'black',
    peaceful:  'blue',
    hopeful:   'green',
    defiant:   'red',
    longing:   'blue',
  };
  if (profile.subEmotion !== 'neutral' && p.dominant_hue === hueBonus[profile.subEmotion]) {
    score += 3;
    reasons.push(
      `Dominant hue "${p.dominant_hue}" echoes ${profile.subEmotion} emotional register.`,
    );
  }

  // ── 5. Symbol matching  (0-10 pts) ──────────────────────────────────────────
  // Circles ↔ high repetition (cyclical return)
  const wantCircle = profile.repetitionRatio <= 0.45;
  // Stars ↔ high lexical diversity (richness)
  const wantStars = profile.lexicalDiversity >= 0.5;

  if (wantCircle && p.has_circle) {
    score += 7;
    reasons.push('Central circle reflects high repetition (cyclic unity).');
  }
  if (wantStars && p.has_stars) {
    score += 7;
    reasons.push('Stars reflect high lexical diversity (richness / multiplicity).');
  }
  // Absence matches
  if (!wantCircle && !p.has_circle) score += 2;
  if (!wantStars && !p.has_stars) score += 2;

  // Crescent ↔ longing / peaceful sub-emotion (nighttime imagery)
  if (p.has_crescent && (profile.subEmotion === 'longing' || profile.subEmotion === 'peaceful')) {
    score += 3;
    reasons.push('Crescent motif aligns with a nocturnal / longing lyric register.');
  }

  // ── 6. Rhyme score → flag symmetry  (0-10 pts) ──────────────────────────────
  if (profile.rhymeScore >= 0.4) {
    if (p.is_symmetric) {
      score += 10;
      reasons.push(
        `Strong rhyme scheme (${(profile.rhymeScore * 100).toFixed(0)}%) maps to the flag's visual symmetry.`,
      );
    } else {
      score += 2;
    }
  } else if (profile.rhymeScore < 0.2 && !p.is_symmetric) {
    score += 5; // free verse → asymmetric flag
    reasons.push('Free-verse structure (low rhyme) maps to flag asymmetry.');
  }

  // ── 7. Anaphora → stripe presence  (0-8 pts) ────────────────────────────────
  if (profile.anaphoraScore >= 0.35) {
    const hasStripes =
      p.layout === 'horizontal_stripes' ||
      p.layout === 'vertical_stripes' ||
      p.stripe_count >= 3;
    if (hasStripes) {
      score += 8;
      reasons.push(
        `Anaphora (repeated line openings, score ${(profile.anaphoraScore * 100).toFixed(0)}%) maps to the flag's stripe repetition.`,
      );
    } else {
      score += 2;
    }
  }

  // ── 8. Meter regularity → flag simplicity  (0-8 pts) ────────────────────────
  const meterTarget =
    profile.meterRegularity >= 0.65
      ? 'simple'
      : profile.meterRegularity >= 0.4
        ? 'medium'
        : 'complex';

  if (p.complexity === meterTarget) {
    score += 8;
    reasons.push(
      `Meter regularity (${(profile.meterRegularity * 100).toFixed(0)}%) aligns with flag complexity "${meterTarget}".`,
    );
  } else if (
    (p.complexity === 'medium') ||
    (meterTarget === 'medium')
  ) {
    score += 3;
  }

  // ── 9. Emotional intensity → high-contrast flags  (0-7 pts) ─────────────────
  if (profile.intensityScore >= 0.5) {
    // High intensity → flags with high contrast, many elements
    if (p.has_stars || p.has_circle || p.complexity === 'complex') {
      score += 7;
      reasons.push(
        `High lyric intensity (${(profile.intensityScore * 100).toFixed(0)}%) matches a visually active flag.`,
      );
    }
  } else if (profile.intensityScore < 0.2 && p.complexity === 'simple') {
    score += 4;
    reasons.push('Understated lyric intensity aligns with the flag\'s clean simplicity.');
  }

  // ── 10. Color count / lexical diversity alignment  (0-5 pts) ────────────────
  // Rich vocabulary → many flag colors; sparse → fewer
  const targetColorCount =
    profile.lexicalDiversity >= 0.6 ? 4 :
    profile.lexicalDiversity >= 0.45 ? 3 : 2;
  const colorDiff = Math.abs(p.color_count - targetColorCount);
  if (colorDiff === 0) {
    score += 5;
  } else if (colorDiff === 1) {
    score += 2;
  }

  return { country, score, reasons };
}

// ── Public API ────────────────────────────────────────────────────────────────

export type MatchResult = {
  country: CountryFlag;
  score: number;
  reasons: string[];
  runner_up: { name: string; code: string; score: number } | null;
};

/** Find the best-matching country flag for the given lyric profile. */
export function matchCountryFlag(profile: LyricProfile): MatchResult {
  const scored = COUNTRY_FLAGS.map((c) => scoreCountry(c, profile));
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0]!;
  const second = scored[1];

  return {
    country: best.country,
    score: best.score,
    reasons: best.reasons,
    runner_up: second
      ? { name: second.country.name, code: second.country.code, score: second.score }
      : null,
  };
}
