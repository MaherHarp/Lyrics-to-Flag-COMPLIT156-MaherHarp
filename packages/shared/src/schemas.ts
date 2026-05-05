import { z } from 'zod';

export const ModeSchema = z.enum(['strict', 'relaxed']);
export type Mode = z.infer<typeof ModeSchema>;

export const GenerateRequestSchema = z.object({
  lyric: z.string().min(1),
  mode: ModeSchema,
  seed: z.number().int().nullable(),
});
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export const RepeatGroupSchema = z.object({
  line: z.string(),
  count: z.number().int().nonnegative(),
  indices: z.array(z.number().int().nonnegative()),
});
export type RepeatGroup = z.infer<typeof RepeatGroupSchema>;

export const ChorusCandidateSchema = z.object({
  line: z.string(),
  score: z.number(),
});
export type ChorusCandidate = z.infer<typeof ChorusCandidateSchema>;

export const SentimentHintSchema = z.enum(['positive', 'neutral', 'negative']);
export type SentimentHint = z.infer<typeof SentimentHintSchema>;

export const SubEmotionSchema = z.enum([
  'melancholy',
  'joyful',
  'angry',
  'hopeful',
  'peaceful',
  'longing',
  'defiant',
  'neutral',
]);
export type SubEmotion = z.infer<typeof SubEmotionSchema>;

export const InputSummarySchema = z.object({
  line_count: z.number().int().nonnegative(),
  unique_line_count: z.number().int().nonnegative(),
  repeat_groups: z.array(RepeatGroupSchema),
  chorus_candidates: z.array(ChorusCandidateSchema),
  avg_line_length: z.number().nonnegative(),
  lexical_diversity: z.number().min(0).max(1),
  sentiment_hint: SentimentHintSchema,
  sub_emotion: SubEmotionSchema,
  intensity_score: z.number().min(0).max(1),
  rhyme_score: z.number().min(0).max(1),
  meter_regularity: z.number().min(0).max(1),
  anaphora_score: z.number().min(0).max(1),
  avg_syllables_per_line: z.number().nonnegative(),
});
export type InputSummary = z.infer<typeof InputSummarySchema>;

export const ExplanationItemSchema = z.object({
  rule_id: z.string(),
  rule_text: z.string(),
  evidence: z.string(),
  effect_on_flag: z.string(),
});
export type ExplanationItem = z.infer<typeof ExplanationItemSchema>;

export const MatchedCountrySchema = z.object({
  name: z.string(),
  code: z.string(),
  match_score: z.number(),
  reasons: z.array(z.string()),
  runner_up: z
    .object({
      name: z.string(),
      code: z.string(),
      score: z.number(),
    })
    .nullable(),
});
export type MatchedCountry = z.infer<typeof MatchedCountrySchema>;

export const GenerateResponseSchema = z.object({
  input_summary: InputSummarySchema,
  matched_country: MatchedCountrySchema,
  explanation: z.array(ExplanationItemSchema),
  svg: z.string(),
  blazon: z.string(),
});
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;

// ── Flag library schemas (used by /v1/flags) ─────────────────────────────────

export const RegionSchema = z.enum([
  'europe',
  'asia',
  'africa',
  'americas',
  'oceania',
  'middle_east',
]);
export type Region = z.infer<typeof RegionSchema>;

export const HeraldicFamilySchema = z.enum([
  'tricolor_horizontal',
  'tricolor_vertical',
  'bicolor_horizontal',
  'bicolor_vertical',
  'nordic_cross',
  'centered_cross',
  'saltire',
  'pall',
  'canton_with_charge',
  'triangle_hoist',
  'crescent_star',
  'centered_disc',
  'centered_charge',
  'multi_stripe',
  'quartered',
  'serration',
  'other',
]);
export type HeraldicFamily = z.infer<typeof HeraldicFamilySchema>;

export const FlagInfoSchema = z.object({
  name: z.string(),
  code: z.string(),
  region: RegionSchema,
  aspect_ratio: z.number().positive(),
  palette: z.array(z.string()),
  symbolism: z.string(),
  heraldic_family: HeraldicFamilySchema,
  layout: z.string(),
  blazon: z.string(),
  svg: z.string(),
});
export type FlagInfo = z.infer<typeof FlagInfoSchema>;

export const FlagListResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  flags: z.array(FlagInfoSchema),
});
export type FlagListResponse = z.infer<typeof FlagListResponseSchema>;
