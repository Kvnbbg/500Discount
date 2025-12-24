import { describe, expect, it } from 'vitest';
import { safeEvaluateExpression } from '../assets/js/utils/math.js';

describe('safeEvaluateExpression', () => {
  it('evaluates valid expressions', () => {
    const result = safeEvaluateExpression('2 + 3 * 4');
    expect(result.ok).toBe(true);
    expect(result.value).toBe(14);
  });

  it('rejects unsafe expressions', () => {
    const result = safeEvaluateExpression('alert(1)');
    expect(result.ok).toBe(false);
  });

  it('rejects empty input', () => {
    const result = safeEvaluateExpression('');
    expect(result.ok).toBe(false);
  });

  it('rejects non-finite results', () => {
    const result = safeEvaluateExpression('1 / 0');
    expect(result.ok).toBe(false);
  });
});
