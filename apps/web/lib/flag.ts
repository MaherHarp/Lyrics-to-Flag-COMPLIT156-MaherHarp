import type { Mode } from '@complit156/shared';
import type { SentimentHint } from './sentiment.js';

export type LayoutType =
  | 'horizontal_stripes'
  | 'vertical_stripes'
  | 'cross'
  | 'chevron'
  | 'circle_center';

export type Symmetry = 'none' | 'horizontal' | 'vertical' | 'both';

export type FlagLayout = {
  type: LayoutType;
  symmetry: Symmetry;
  stripe_count: number;
};

export type FlagSymbol = {
  type: 'star' | 'circle' | 'diamond' | 'triangle';
  count: number;
  placement: 'center' | 'canton' | 'stacked';
};

export type FlagConstraints = {
  max_colors: number;
  no_text: boolean;
  simple_shapes_only: boolean;
};

export type FlagSpec = {
  palette: string[];
  layout: FlagLayout;
  symbols: FlagSymbol[];
  constraints: FlagConstraints;
};

export function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function chooseStripeCount(uniqueLineCount: number): number {
  if (uniqueLineCount <= 4) return 3;
  if (uniqueLineCount <= 8) return 5;
  return 7;
}

export function chooseConstraints(mode: Mode): FlagConstraints {
  return {
    max_colors: mode === 'strict' ? 3 : 4,
    no_text: true,
    simple_shapes_only: true,
  };
}

export function choosePalette(sentiment: SentimentHint, mode: Mode): string[] {
  // Deterministic, high-contrast-ish palettes.
  const strict = {
    positive: ['#0B3D91', '#FCD116', '#FFFFFF'], // blue / gold / white
    neutral: ['#003049', '#FFFFFF', '#000000'], // navy / white / black
    negative: ['#111827', '#E5E7EB', '#1D4ED8'], // near-black / light gray / blue
  } as const;

  const relaxedExtra = {
    positive: '#D62828',
    neutral: '#2A9D8F',
    negative: '#DC2626',
  } as const;

  const base = strict[sentiment];
  if (mode === 'strict') return base.slice(0, 3);
  return [...base.slice(0, 3), relaxedExtra[sentiment]];
}

export function chooseLayout(opts: {
  mode: Mode;
  strongChorus: boolean;
  uniqueLineCount: number;
  lineCount: number;
  sentiment: SentimentHint;
  rng: () => number;
}): Pick<FlagLayout, 'type' | 'symmetry'> {
  const uniquenessRatio = opts.lineCount === 0 ? 0 : opts.uniqueLineCount / opts.lineCount;

  if (opts.strongChorus) {
    return { type: 'horizontal_stripes', symmetry: 'horizontal' };
  }

  if (opts.mode === 'relaxed' && opts.sentiment === 'negative' && opts.rng() < 0.6) {
    return { type: 'chevron', symmetry: 'horizontal' };
  }

  if (uniquenessRatio >= 0.8) {
    return { type: 'vertical_stripes', symmetry: 'vertical' };
  }

  // A little variety without getting too fancy.
  if (opts.rng() < 0.2 && opts.mode === 'relaxed') {
    return { type: 'cross', symmetry: 'both' };
  }

  return { type: 'horizontal_stripes', symmetry: 'horizontal' };
}

export function chooseSymbols(opts: {
  lexicalDiversity: number;
  repetitionRatio: number; // unique/total
  rng: () => number;
}): FlagSymbol[] {
  const out: FlagSymbol[] = [];

  const diversityHigh = opts.lexicalDiversity >= 0.48;
  const repetitionHigh = opts.repetitionRatio <= 0.65;

  if (diversityHigh) {
    const count = clampInt(1 + Math.floor(opts.rng() * 3), 1, 3);
    out.push({ type: 'star', count, placement: 'canton' });
  }

  if (repetitionHigh) {
    out.push({ type: 'circle', count: 1, placement: 'center' });
  }

  return out;
}

