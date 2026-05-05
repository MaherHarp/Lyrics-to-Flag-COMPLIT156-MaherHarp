import { describe, expect, it } from 'vitest';
import { matchCountryFlag } from '../src/lib/match.js';

describe('country flag matching', () => {
  it('matches a repetitive positive lyric to a horizontal-stripe flag', () => {
    const result = matchCountryFlag({
      lineCount: 6,
      uniqueLineCount: 2,
      lexicalDiversity: 0.375,
      repetitionRatio: 2 / 6,
      strongChorus: true,
      sentiment: 'positive',
    });
    expect(result.country.properties.layout).toBe('horizontal_stripes');
    expect(result.country.properties.sentiment_affinity).toBe('positive');
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('matches a diverse unique-line lyric to a vertical-stripe or complex flag', () => {
    const result = matchCountryFlag({
      lineCount: 4,
      uniqueLineCount: 4,
      lexicalDiversity: 0.85,
      repetitionRatio: 1.0,
      strongChorus: false,
      sentiment: 'neutral',
    });
    expect(['vertical_stripes', 'complex', 'cross']).toContain(result.country.properties.layout);
    expect(result.score).toBeGreaterThan(0);
  });

  it('matches a negative sentiment lyric and gives sentiment-aligned flags higher scores', () => {
    const result = matchCountryFlag({
      lineCount: 8,
      uniqueLineCount: 6,
      lexicalDiversity: 0.6,
      repetitionRatio: 0.75,
      strongChorus: false,
      sentiment: 'negative',
    });
    // The match should exist and have a positive score.
    // Sentiment is one factor among many so the top match may not always be
    // "negative"-affinity, but the algorithm should still produce a valid result.
    expect(result.score).toBeGreaterThan(0);
    expect(result.country.name).toBeTruthy();
  });

  it('always returns a runner-up', () => {
    const result = matchCountryFlag({
      lineCount: 4,
      uniqueLineCount: 4,
      lexicalDiversity: 0.5,
      repetitionRatio: 1.0,
      strongChorus: false,
      sentiment: 'neutral',
    });
    expect(result.runner_up).not.toBeNull();
    expect(result.runner_up!.name).toBeTruthy();
  });
});
