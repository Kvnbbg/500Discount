const SAFE_EXPRESSION = /^[0-9+\-*/().%\s]+$/;

export const safeEvaluateExpression = (expression) => {
  if (typeof expression !== 'string' || expression.trim().length === 0) {
    return { ok: false, error: 'Enter a math expression to continue.' };
  }

  if (!SAFE_EXPRESSION.test(expression)) {
    return {
      ok: false,
      error: 'Only numbers and operators (+ - * / % . parentheses) are allowed.',
    };
  }

  try {
    const result = Function(`"use strict"; return (${expression})`)();

    if (typeof result !== 'number' || !Number.isFinite(result)) {
      return { ok: false, error: 'Expression did not resolve to a finite number.' };
    }

    return { ok: true, value: result };
  } catch {
    return { ok: false, error: 'Invalid expression. Check your syntax.' };
  }
};
