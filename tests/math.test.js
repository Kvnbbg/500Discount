import { describe, expect, it } from 'vitest';
import { safeEvaluateExpression } from '../assets/js/utils/math.js';

describe('safeEvaluateExpression', () => {
  it('evaluates valid expressions', () => {
    const result = safeEvaluateExpression('2 + 3 * 4');
    expect(result.ok).toBe(true);
    expect(result.value).toBe(14);
  });

  it('supports unary operators and parentheses', () => {
    const result = safeEvaluateExpression('-(2 + 3) * 4');
    expect(result.ok).toBe(true);
    expect(result.value).toBe(-20);
  });

  it('rejects unsafe expressions', () => {
    const result = safeEvaluateExpression('alert(1)');
    expect(result.ok).toBe(false);
  });

  it('rejects empty input', () => {
    const result = safeEvaluateExpression('');
    expect(result.ok).toBe(false);
  });

  it('rejects malformed syntax', () => {
    const result = safeEvaluateExpression('2 + * 3');
    expect(result.ok).toBe(false);
  });

  it('rejects expressions above length limit', () => {
    const expression = '1+'.repeat(251);
    const result = safeEvaluateExpression(expression);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('too long');
  });

  it('rejects division by zero with explicit guidance', () => {
    const result = safeEvaluateExpression('1 / 0');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Division or modulo by zero is not allowed.');
  });

  it('rejects modulo by zero with explicit guidance', () => {
    const result = safeEvaluateExpression('5 % 0');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Division or modulo by zero is not allowed.');
  });
});
