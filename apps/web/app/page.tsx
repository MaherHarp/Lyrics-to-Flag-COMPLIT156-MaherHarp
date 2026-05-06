'use client';

import type { GenerateResponse, InputSummary, MatchedCountry } from '@complit156/shared';
import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  FieldLabel,
  MetricRow,
  Pill,
  ScoreBar,
  Textarea,
} from '../components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

function parseNonEmptyLines(lyric: string): string[] {
  return lyric
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function safeSvg(svg: string): string | null {
  const s = svg.trim();
  if (!s.includes('<svg') || !s.includes('</svg>')) return null;
  const lower = s.toLowerCase();
  if (
    lower.includes('<script') ||
    lower.includes('onload=') ||
    lower.includes('javascript:')
  )
    return null;
  return s;
}

function labelForIndexMap(resp: GenerateResponse): Map<number, string> {
  const groups = resp.input_summary.repeat_groups.filter((g) => g.count >= 2);
  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const m = new Map<number, string>();
  groups.forEach((g, i) => {
    const label = labels[i] ?? `G${i + 1}`;
    g.indices.forEach((idx) => m.set(idx, label));
  });
  return m;
}

function scoreLabel(score: number): { text: string; variant: 'green' | 'amber' | 'red' } {
  if (score >= 65) return { text: 'Strong', variant: 'green' };
  if (score >= 40) return { text: 'Moderate', variant: 'amber' };
  return { text: 'Weak', variant: 'red' };
}

// ── Plain-language helpers (no em dashes, no colons) ──────────────────────────

function plainEmotionParagraph(summary: InputSummary): string {
  const { sub_emotion, intensity_score } = summary;

  const descriptions: Record<string, string> = {
    melancholy:
      "There is a sadness running through your lyric, quiet but present. The words carry a kind of heaviness, as if something has been lost or left behind.",
    joyful:
      "Your lyric has a brightness that is hard to miss. Warmth and energy run through the lines, the kind that feels celebratory just to read.",
    angry:
      "The lyric carries a sharp edge. Frustration, even fury, sits in the words and a pressure builds toward something.",
    hopeful:
      "Even where there is difficulty in the lyric, it leans forward. There is belief in something better ahead, and the words carry that lightness with them.",
    peaceful:
      "The lyric settles into a calm, unhurried pace. It does not push or pull. It simply rests, like a slow exhale.",
    longing:
      "There is a yearning at the heart of this lyric, a reaching toward something or someone that is not quite there. The absence is felt as much as what is said.",
    defiant:
      "The lyric holds its ground. Something is being pushed back against, and the words do not give way. They stand firm.",
    neutral:
      "The lyric is measured and even-handed. It observes without leaning too far one way or the other, which gives it a steady, composed quality.",
  };

  let base =
    descriptions[sub_emotion] ?? 'The lyric carries a distinctive emotional tone.';

  if (intensity_score > 0.7) {
    base +=
      ' That feeling is not understated. The lyric says it directly, without pulling punches.';
  } else if (intensity_score < 0.25) {
    base += ' It is communicated gently, more a suggestion than a declaration.';
  }

  return base;
}

function plainStructureParagraph(summary: InputSummary): string {
  const {
    line_count,
    unique_line_count,
    repeat_groups,
    chorus_candidates,
    rhyme_score,
    meter_regularity,
    anaphora_score,
  } = summary;

  const parts: string[] = [];
  const repetitionRatio = unique_line_count / Math.max(1, line_count);
  const strongRepeats = repeat_groups.filter((g) => g.count >= 3);
  const topRepeat = repeat_groups[0];

  if (chorus_candidates.length > 0 && strongRepeats.length > 0 && chorus_candidates[0]) {
    const chorusLine = chorus_candidates[0].line;
    parts.push(
      `The lyric has a clear refrain. The line "${chorusLine}" keeps coming back, anchoring everything around it. That repetition gives the whole piece a heartbeat.`,
    );
  } else if (strongRepeats.length > 0 && topRepeat) {
    parts.push(
      `"${topRepeat.line}" appears ${topRepeat.count} times. That kind of repetition creates a pulse, something the ear returns to and expects.`,
    );
  } else if (repetitionRatio < 0.6) {
    parts.push(
      'Several lines echo each other, giving the lyric a circular, song-like shape that folds back on itself.',
    );
  } else {
    parts.push(
      'Each line brings something new. There is very little repetition, which keeps things moving forward rather than circling back.',
    );
  }

  if (rhyme_score > 0.5) {
    parts.push(
      'The lines rhyme with each other, which gives the lyric a sense of closure. Each line feels like it belongs, like puzzle pieces clicking into place.',
    );
  } else if (rhyme_score > 0.2) {
    parts.push(
      'There is some rhyme, though it is not strict. The lyric feels structured without being rigid.',
    );
  } else {
    parts.push(
      'The lines do not rhyme much, which keeps things feeling open and conversational, more like spoken words than a formal song.',
    );
  }

  if (meter_regularity > 0.7) {
    parts.push(
      'The rhythm is consistent. Each line has a similar number of beats, like footsteps keeping steady time.',
    );
  } else if (meter_regularity < 0.3) {
    parts.push(
      'The rhythm shifts and varies, which keeps the lyric unpredictable and alive rather than marching in a straight line.',
    );
  }

  if (anaphora_score > 0.4) {
    parts.push(
      'Many lines begin the same way. That repeated opening builds momentum, almost like a chant or an incantation.',
    );
  }

  return parts.join(' ');
}

function plainMatchReasons(country: MatchedCountry, summary: InputSummary): string[] {
  const {
    sub_emotion,
    rhyme_score,
    repeat_groups,
    chorus_candidates,
    lexical_diversity,
    anaphora_score,
    unique_line_count,
    line_count,
  } = summary;
  const name = country.name;
  const reasons: string[] = [];
  const repetitionRatio = unique_line_count / Math.max(1, line_count);

  const emotionColorMap: Record<string, string> = {
    melancholy: `The flag of ${name} has a darker, quieter palette. These are colors that feel serious and still, mirroring the weight your lyric carries.`,
    joyful: `${name}'s flag is warm and vivid. The colors feel alive and celebratory, a natural companion to the brightness running through your lyric.`,
    angry: `The bold, high-contrast colors of ${name}'s flag match the sharp edge the lyric carries. There is no ambiguity in either.`,
    hopeful: `${name}'s flag has an open, optimistic quality to its colors. Something there resonates with the forward-looking feeling in your lyric.`,
    peaceful: `The cooler, calmer tones of ${name}'s flag reflect the quiet stillness that runs through your lyric. Neither one rushes.`,
    longing: `There is something wistful about ${name}'s flag. Its shapes and colors echo the sense of reaching and absence that the lyric holds.`,
    defiant: `The strong, contrasting colors of ${name}'s flag feel as bold and uncompromising as the lyric itself. Both make a statement.`,
    neutral: `${name}'s flag is balanced and composed. It does not lean too warm or too cool, which is exactly the register your lyric holds.`,
  };
  if (emotionColorMap[sub_emotion]) reasons.push(emotionColorMap[sub_emotion]);

  const hasChorus = chorus_candidates.length > 0;
  if (hasChorus || repetitionRatio <= 0.5) {
    reasons.push(
      `Flags with repeating horizontal bands of color have a built-in rhythm. Each stripe is like another pass through the same chorus, and ${name}'s flag has that kind of regularity, much like your lyric.`,
    );
  } else if (anaphora_score > 0.4) {
    reasons.push(
      `Your lines keep starting the same way, almost like columns of text stacked on top of each other. ${name}'s flag answers that with vertical stripes, a layout that visually rhymes with that parallel structure.`,
    );
  }

  if (rhyme_score > 0.4) {
    reasons.push(
      `Because your lyric rhymes, it has a satisfying symmetry. Each line completes itself before handing off to the next, and ${name}'s flag shares that quality. Its design is balanced, one half answering the other.`,
    );
  }

  if (lexical_diversity > 0.6 && repeat_groups.length === 0) {
    reasons.push(
      `Your lyric uses a wide range of different words rather than circling back to the same ones. It covers a lot of ground. Flags with multiple distinct symbols tend to match lyrics like this. They are visually rich in the same way.`,
    );
  } else if (lexical_diversity < 0.35) {
    reasons.push(
      `Your lyric keeps returning to the same words. It is focused rather than wide-ranging, and ${name}'s flag is similarly direct. A few clear elements, nothing extra.`,
    );
  }

  if (country.match_score >= 70) {
    reasons.push(
      `Of all the country flags in the database, ${name} fit the best, and it was not particularly close. The lyric's mood, its shape, and the way it moves all pointed in this direction.`,
    );
  } else if (country.match_score >= 45) {
    reasons.push(
      `${name} came out on top, though a few others came close. The match is genuine. A lyric like this could reasonably point to more than one place in the world.`,
    );
  } else {
    reasons.push(
      `Even the best match was imperfect here. ${name} came closest, but there is something about this lyric that resists easy categorization, which might be exactly the point.`,
    );
  }

  return reasons;
}

// ── Tab definitions ────────────────────────────────────────────────────────────

type TabId = 'preview' | 'story' | 'explanation' | 'blazon' | 'highlighted';

const TABS: { id: TabId; label: string }[] = [
  { id: 'preview', label: 'Flag Match' },
  { id: 'story', label: 'Why This Flag?' },
  { id: 'explanation', label: 'Algorithm Trace' },
  { id: 'blazon', label: 'Blazon' },
  { id: 'highlighted', label: 'Lyric Analysis' },
];

const HERALDIC_TINCTURES = [
  ['Or', 'gold and yellow'],
  ['Argent', 'silver and white'],
  ['Azure', 'blue'],
  ['Gules', 'red'],
  ['Sable', 'black'],
  ['Vert', 'green'],
  ['Tenné', 'orange'],
] as const;

const HERALDIC_DIVISIONS = [
  ['Per fess', 'divided horizontally'],
  ['Per pale', 'divided vertically'],
  ['Barry', 'many horizontal stripes'],
  ['Paly', 'many vertical stripes'],
  ['Mullet', 'star'],
  ['Roundel', 'circle'],
  ['In canton', 'upper-left corner'],
] as const;

export default function HomePage() {
  const [lyric, setLyric] = useState('');
  const [tab, setTab] = useState<TabId>('preview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  const lines = useMemo(() => parseNonEmptyLines(lyric), [lyric]);
  const wordCount = useMemo(
    () => (lyric.trim() ? lyric.trim().split(/\s+/).length : 0),
    [lyric],
  );
  const canGenerate = lines.length >= 2 && !loading;

  const svgSafe = useMemo(() => (result ? safeSvg(result.svg) : null), [result]);
  const labelMap = useMemo(
    () => (result ? labelForIndexMap(result) : new Map()),
    [result],
  );

  async function onGenerate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lyric, mode: 'relaxed', seed: null }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error (${res.status}). ${text.slice(0, 300)}`);
      }
      const data = (await res.json()) as GenerateResponse;
      setResult(data);
      setTab('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Hero ── */}
      <div className="space-y-2.5">
        <h1 className="text-2xl font-semibold tracking-tight text-white/90">
          Flag-from-Lyric
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-white/38">
          A computational literary experiment. Paste any lyric, and the system extracts
          its formal features (repetition patterns, lexical density, emotional register),
          matches them against a database of real country flags, and explains the
          correspondence in heraldic blazon.
        </p>
      </div>

      {/* ── Input ── */}
      <Card>
        <CardHeader title="Lyric Input" subtitle="Enter at least two non-empty lines." />
        <div className="p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="lyric-input">Lyric text</FieldLabel>
                <Pill variant={lines.length >= 2 ? 'green' : 'default'}>
                  {lines.length} {lines.length === 1 ? 'line' : 'lines'}
                </Pill>
              </div>
              <Textarea
                id="lyric-input"
                value={lyric}
                onChange={(e) => setLyric(e.target.value)}
                placeholder={'Line 1\nLine 2\nLine 3...'}
                rows={10}
              />
            </div>

            <div className="rounded-2xl border border-[#9B2020]/[0.12] bg-[#1A0404]/50 p-4 space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30 pb-2">
                Live metrics
              </div>
              <MetricRow label="Lines" value={String(lines.length)} />
              <MetricRow label="Words" value={String(wordCount)} />
              <MetricRow label="Characters" value={String(lyric.length)} />
              <div className="pt-3 border-t border-[#9B2020]/[0.12] mt-2">
                <MetricRow
                  label="Lines required"
                  value="≥ 2"
                  accent={lines.length < 2 && lyric.trim().length > 0}
                />
              </div>
              <p className="pt-3 text-xs leading-relaxed text-white/25">
                The algorithm analyzes line structure, repetition groups, lexical
                diversity, and emotional register, scoring against every flag in the
                library.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Button
              id="generate-btn"
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate}
              loading={loading}
            >
              {loading ? 'Analyzing…' : 'Generate Flag Match'}
            </Button>
            {lines.length === 1 && (
              <span className="text-xs text-white/35">
                Add one more line to continue.
              </span>
            )}
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm text-red-300">
              <span className="font-semibold">Error.</span> {error}
            </div>
          ) : null}
        </div>
      </Card>

      {/* ── Results ── */}
      <Card>
        <CardHeader
          title="Results"
          subtitle={
            result
              ? `Matched to ${result.matched_country.name} (${result.matched_country.code}), score ${result.matched_country.match_score}.`
              : 'Enter a lyric above and press Generate to see the match.'
          }
        />

        <div className="border-b border-[#9B2020]/[0.12] px-6">
          <div className="flex gap-0 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                disabled={!result}
                className={[
                  'relative -mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-150 whitespace-nowrap',
                  !result
                    ? 'cursor-default border-transparent text-white/18'
                    : tab === t.id
                      ? 'border-amber-500/70 text-white/90'
                      : 'border-transparent text-white/35 hover:border-white/15 hover:text-white/60',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {!result ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="flex h-14 w-20 items-center justify-center rounded-xl border border-dashed border-white/[0.07]">
                <span className="text-3xl text-white/[0.08]">⚑</span>
              </div>
              <p className="max-w-xs text-center text-sm text-white/22">
                Your matched flag will appear here after you enter a lyric and press{' '}
                <span className="text-white/36">Generate Flag Match</span>.
              </p>
            </div>
          ) : tab === 'preview' ? (
            <div className="grid gap-6 lg:grid-cols-5">
              <div className="space-y-4 lg:col-span-3">
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white shadow-2xl shadow-black/50">
                  {svgSafe ? (
                    <div
                      id="svg-preview"
                      className="w-full"
                      role="img"
                      aria-label={`Flag of ${result.matched_country.name}`}
                      dangerouslySetInnerHTML={{ __html: svgSafe }}
                    />
                  ) : (
                    <div className="p-6 text-sm text-black/50">
                      The SVG could not be rendered. Try regenerating.
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-white">
                    {result.matched_country.name}
                  </h2>
                  <Pill>{result.matched_country.code}</Pill>
                  <Pill variant={scoreLabel(result.matched_country.match_score).variant}>
                    {scoreLabel(result.matched_country.match_score).text} match
                  </Pill>
                </div>

                <ScoreBar score={result.matched_country.match_score} max={100} />

                {result.matched_country.runner_up ? (
                  <p className="text-xs text-white/28">
                    Runner-up was{' '}
                    <span className="text-white/40">
                      {result.matched_country.runner_up.name}
                    </span>{' '}
                    ({result.matched_country.runner_up.code}) at score{' '}
                    {result.matched_country.runner_up.score}.
                  </p>
                ) : null}
              </div>

              <div className="space-y-4 lg:col-span-2">
                <div className="rounded-2xl border border-[#9B2020]/[0.12] bg-[#1A0404]/50 p-4 space-y-3">
                  <div className="text-sm font-semibold text-white">Why this flag?</div>
                  <p className="text-sm leading-relaxed text-white/50">
                    The lyric&apos;s formal features were scored against every country
                    flag in the library.{' '}
                    <strong className="text-white/75">{result.matched_country.name}</strong>{' '}
                    scored highest at{' '}
                    <span className="font-mono font-semibold text-white/70">
                      {result.matched_country.match_score}
                    </span>{' '}
                    points across layout, stripe count, sentiment, symbol, and complexity.
                  </p>
                  {result.matched_country.reasons.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {result.matched_country.reasons.map((r, i) => (
                        <div
                          key={i}
                          className="flex gap-2.5 rounded-xl border border-[#9B2020]/[0.10] bg-[#140303]/55 px-3 py-2.5 text-sm text-white/55"
                        >
                          <span className="shrink-0 font-bold text-amber-500">·</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs italic text-white/30">
                      No specific reasons recorded for this combination.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-[#9B2020]/[0.12] bg-[#1A0404]/50 p-4 space-y-1">
                  <div className="text-sm font-semibold text-white mb-3">
                    Input summary
                  </div>
                  <MetricRow
                    label="Lines"
                    value={String(result.input_summary.line_count)}
                  />
                  <MetricRow
                    label="Unique lines"
                    value={String(result.input_summary.unique_line_count)}
                  />
                  <MetricRow
                    label="Avg line length"
                    value={`${result.input_summary.avg_line_length.toFixed(1)} chars`}
                  />
                  <MetricRow
                    label="Lexical diversity"
                    value={result.input_summary.lexical_diversity.toFixed(2)}
                  />
                  <MetricRow label="Sentiment" value={result.input_summary.sentiment_hint} />
                </div>
              </div>
            </div>
          ) : tab === 'story' ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#9B2020]/[0.12] bg-[#1A0404]/50 p-6 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-white/28">
                  What your lyric feels like
                </div>
                <p
                  className="text-[15px] leading-[1.8] text-white/70"
                  style={{ fontFamily: 'var(--font-lora), Georgia, serif' }}
                >
                  {plainEmotionParagraph(result.input_summary)}
                </p>
              </div>

              <div className="rounded-2xl border border-[#9B2020]/[0.12] bg-[#1A0404]/50 p-6 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-white/28">
                  How it is put together
                </div>
                <p
                  className="text-[15px] leading-[1.8] text-white/70"
                  style={{ fontFamily: 'var(--font-lora), Georgia, serif' }}
                >
                  {plainStructureParagraph(result.input_summary)}
                </p>
              </div>

              <div className="rounded-2xl border border-[#9B2020]/[0.12] bg-[#1A0404]/50 p-6 space-y-5">
                <div className="text-xs font-semibold uppercase tracking-widest text-white/28">
                  Why the flag of {result.matched_country.name}
                </div>
                <div className="space-y-4">
                  {plainMatchReasons(result.matched_country, result.input_summary).map(
                    (sentence, i) => (
                      <div key={i} className="flex gap-4">
                        <span
                          className="shrink-0 mt-[3px] text-amber-500/60 select-none"
                          aria-hidden="true"
                        >
                          •
                        </span>
                        <p
                          className="text-[15px] leading-[1.8] text-white/65"
                          style={{ fontFamily: 'var(--font-lora), Georgia, serif' }}
                        >
                          {sentence}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          ) : tab === 'explanation' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#9B2020]/[0.12] bg-[#1A0404]/50 p-5">
                <p className="text-sm leading-relaxed text-white/45">
                  Step-by-step trace of how the algorithm processed your lyric and
                  arrived at the flag of{' '}
                  <strong className="text-white/70">
                    {result.matched_country.name}
                  </strong>
                  . The lyric is normalized, scanned for repetition and chorus
                  patterns, then scored across lexical and sentiment dimensions
                  against every country flag in the database.
                </p>
              </div>

              <div className="space-y-3">
                {result.explanation.map((x, i) => (
                  <div
                    key={`${x.rule_id}-${i}`}
                    className="grid rounded-2xl border border-[#9B2020]/[0.12] bg-[#1A0404]/50 p-4 sm:grid-cols-[2.25rem_1fr] gap-4"
                  >
                    <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-700/25 bg-amber-900/[0.10] text-xs font-bold text-amber-400">
                      {i + 1}
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-white">
                          {x.rule_text}
                        </div>
                        <Pill variant="blue">{x.rule_id}</Pill>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-white/28 mb-1">
                          Evidence
                        </div>
                        <div className="text-sm text-white/60">{x.evidence}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-white/28 mb-1">
                          Effect on flag
                        </div>
                        <div className="text-sm text-white/60">{x.effect_on_flag}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : tab === 'blazon' ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#9B2020]/[0.12] bg-[#1A0404]/50 p-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-semibold text-white">
                    Heraldic Blazon of {result.matched_country.name}
                  </div>
                  <Pill variant="blue">vexillology</Pill>
                </div>
                <div className="rounded-xl border border-[#9B2020]/[0.10] bg-[#140303]/55 p-6">
                  <p
                    className="text-lg leading-relaxed italic text-white/80"
                    style={{ fontFamily: 'var(--font-lora), Georgia, serif' }}
                  >
                    &ldquo;{result.blazon}&rdquo;
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#9B2020]/[0.12] bg-[#1A0404]/50 p-6 space-y-4">
                <div className="text-sm font-semibold text-white">Reading the Blazon</div>
                <p className="text-sm leading-relaxed text-white/45">
                  A <strong className="text-white/65">blazon</strong> is the formal
                  language of heraldry used to describe coats of arms and flags. Any
                  herald trained in the convention can reproduce the design from the
                  text alone, with no image necessary.
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#9B2020]/[0.10] bg-[#140303]/45 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-3">
                      Tinctures (colors)
                    </div>
                    <div className="space-y-2">
                      {HERALDIC_TINCTURES.map(([term, def]) => (
                        <div key={term} className="flex gap-2 text-xs">
                          <strong className="w-16 shrink-0 text-white/60">{term}</strong>
                          <span className="text-white/40">{def}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#9B2020]/[0.10] bg-[#140303]/45 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-3">
                      Divisions and Charges
                    </div>
                    <div className="space-y-2">
                      {HERALDIC_DIVISIONS.map(([term, def]) => (
                        <div key={term} className="flex gap-2 text-xs">
                          <strong className="w-20 shrink-0 text-white/60">{term}</strong>
                          <span className="text-white/40">{def}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-white">
                  Lyric with repeat groups labeled
                </div>
                <div className="space-y-1.5">
                  {lines.map((l, idx) => {
                    const label = labelMap.get(idx);
                    return (
                      <div
                        key={`${idx}-${l}`}
                        className={[
                          'flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                          label
                            ? 'border-rose-800/18 bg-rose-900/[0.05]'
                            : 'border-[#9B2020]/[0.08] bg-[#1A0404]/30',
                        ].join(' ')}
                      >
                        <span className="w-7 shrink-0 pt-0.5 font-mono text-xs text-white/25">
                          {idx + 1}
                        </span>
                        <span className="flex-1 leading-relaxed text-white/75">{l}</span>
                        {label ? (
                          <span className="shrink-0 rounded-full border border-amber-600/22 bg-amber-800/[0.08] px-2 py-0.5 text-xs font-bold text-amber-400">
                            {label}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-sm font-semibold text-white">
                  Repetition and chorus analysis
                </div>

                <div className="rounded-2xl border border-[#9B2020]/[0.12] bg-[#1A0404]/50 p-4 space-y-3">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                    Repeat groups
                  </div>
                  {result.input_summary.repeat_groups.length === 0 ? (
                    <p className="text-sm italic text-white/28">
                      No repeated lines detected.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {result.input_summary.repeat_groups.slice(0, 8).map((g) => (
                        <div key={g.line} className="flex items-center gap-3 text-sm">
                          <span
                            className="flex-1 truncate italic text-white/55"
                            style={{ fontFamily: 'var(--font-lora), Georgia, serif' }}
                          >
                            &ldquo;{g.line}&rdquo;
                          </span>
                          <span className="shrink-0 font-mono text-white/35">
                            {g.count}&times;
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#9B2020]/[0.12] bg-[#1A0404]/50 p-4 space-y-3">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                    Chorus candidates
                  </div>
                  {result.input_summary.chorus_candidates.length === 0 ? (
                    <p className="text-sm italic text-white/28">None detected.</p>
                  ) : (
                    <div className="space-y-2">
                      {result.input_summary.chorus_candidates.slice(0, 6).map((c) => (
                        <div key={c.line} className="flex items-center gap-3 text-sm">
                          <span
                            className="flex-1 truncate italic text-white/55"
                            style={{ fontFamily: 'var(--font-lora), Georgia, serif' }}
                          >
                            &ldquo;{c.line}&rdquo;
                          </span>
                          <span className="shrink-0 font-mono text-white/35">
                            {c.score.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
