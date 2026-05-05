import { describe, expect, it } from 'vitest';
import { generateBlazonForCountry } from '../src/lib/blazon.js';
import { COUNTRY_FLAGS } from '../src/lib/countries.js';

describe('blazon for country flags', () => {
  it('returns a proper blazon for Germany', () => {
    const de = COUNTRY_FLAGS.find((c) => c.code === 'DE')!;
    const blazon = generateBlazonForCountry(de);
    expect(blazon).toContain('Tierced per fess');
    expect(blazon).toContain('Sable');
    expect(blazon).toContain('Gules');
    expect(blazon).toContain('Or');
    expect(blazon.endsWith('.')).toBe(true);
  });

  it('returns a proper blazon for France', () => {
    const fr = COUNTRY_FLAGS.find((c) => c.code === 'FR')!;
    const blazon = generateBlazonForCountry(fr);
    expect(blazon).toContain('per pale');
    expect(blazon).toContain('Azure');
    expect(blazon).toContain('Argent');
  });

  it('returns a proper blazon for Japan', () => {
    const jp = COUNTRY_FLAGS.find((c) => c.code === 'JP')!;
    const blazon = generateBlazonForCountry(jp);
    expect(blazon).toContain('roundel');
    expect(blazon).toContain('Gules');
  });

  it('returns a proper blazon for Switzerland', () => {
    const ch = COUNTRY_FLAGS.find((c) => c.code === 'CH')!;
    const blazon = generateBlazonForCountry(ch);
    expect(blazon).toContain('cross');
    expect(blazon).toContain('Argent');
  });

  it('returns a fallback for unknown codes', () => {
    const fake = { name: 'Atlantis', code: 'XX', properties: {} as never, svg: '' };
    const blazon = generateBlazonForCountry(fake);
    expect(blazon).toContain('Atlantis');
  });
});
