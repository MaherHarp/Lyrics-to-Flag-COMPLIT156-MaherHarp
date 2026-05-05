import { describe, expect, it } from 'vitest';
import { chooseStripeCount } from '../src/lib/flag.js';

describe('stripe_count decision', () => {
  it('clamps via unique_line_count buckets', () => {
    expect(chooseStripeCount(1)).toBe(3);
    expect(chooseStripeCount(4)).toBe(3);
    expect(chooseStripeCount(5)).toBe(5);
    expect(chooseStripeCount(8)).toBe(5);
    expect(chooseStripeCount(9)).toBe(7);
    expect(chooseStripeCount(50)).toBe(7);
  });
});

