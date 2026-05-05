import { describe, expect, it } from 'vitest';
import { parseLyric, groupRepetitions } from '../src/lib/lyric.js';
import { scoreChorusCandidates } from '../src/lib/chorus.js';

describe('repetition grouping', () => {
  it('groups identical lines (normalized) with indices', () => {
    const lyric = `Hold on
Hold on
We will be fine
Hold on
We will be fine
Hold on`;
    const parsed = parseLyric(lyric);
    const groups = groupRepetitions(parsed);

    expect(parsed.lines).toHaveLength(6);
    expect(groups[0]).toMatchObject({ line: 'Hold on', count: 4, indices: [0, 1, 3, 5] });
    expect(groups[1]).toMatchObject({ line: 'We will be fine', count: 2, indices: [2, 4] });
  });
});

describe('chorus scoring', () => {
  it('scores repeated lines and ranks likely chorus first', () => {
    const lyric = `Hold on
Hold on
We will be fine
Hold on
We will be fine
Hold on`;
    const parsed = parseLyric(lyric);
    const groups = groupRepetitions(parsed);
    const chorus = scoreChorusCandidates(parsed, groups);
    expect(chorus.length).toBeGreaterThan(0);
    expect(chorus[0]?.line).toBe('Hold on');
    expect((chorus[0]?.score ?? 0)).toBeGreaterThan((chorus[1]?.score ?? 0));
  });
});

