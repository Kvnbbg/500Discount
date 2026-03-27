import {
  computeCoinOperations,
  parseCoinsInput,
  parseCoinsInputDetailed,
  parseThreshold,
} from '../assets/js/utils/coin-game.js';
import { describe, expect, it } from 'vitest';

describe('coin game utils', () => {
  it('parses valid coin input values', () => {
    const coins = parseCoinsInput('2, 11, -3, foo, 5');
    expect(coins).toEqual([2, 11, 5]);
  });

  it('returns detailed parsing feedback for mixed coin inputs', () => {
    expect(parseCoinsInputDetailed('2, foo, -3, 5')).toEqual({
      ok: true,
      coins: [2, 5],
      warning: 'Invalid entries: foo. Negative values are not allowed: -3',
    });
  });

  it('fails detailed parsing when no valid coins are provided', () => {
    expect(parseCoinsInputDetailed('foo, -3')).toEqual({
      ok: false,
      coins: [],
      error: 'No valid coin values found. Use comma-separated numbers like 1, 2, 3.',
    });
  });

  it('validates threshold values', () => {
    expect(parseThreshold('10')).toEqual({ ok: true, value: 10 });
    expect(parseThreshold('0')).toEqual({
      ok: false,
      error: 'Threshold must be a number greater than 0.',
    });
  });

  it('computes minimum operations when threshold is reachable', () => {
    const result = computeCoinOperations([1, 2, 3, 9, 10, 12], 7);
    expect(result.success).toBe(true);
    expect(result.operations).toBe(2);
  });

  it('detects when threshold cannot be reached', () => {
    const result = computeCoinOperations([1, 1], 10);
    expect(result.success).toBe(false);
    expect(result.operations).toBe(1);
  });
});
