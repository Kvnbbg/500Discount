const SAFE_EXPRESSION = /^[0-9+\-*/().%\s]+$/;
const MAX_EXPRESSION_LENGTH = 500;

const createParser = (expression) => {
  let index = 0;

  const peek = () => expression[index];

  const consume = () => expression[index++];

  const skipWhitespace = () => {
    while (index < expression.length && /\s/.test(expression[index])) {
      index += 1;
    }
  };

  const parseNumber = () => {
    skipWhitespace();

    const start = index;
    let dotCount = 0;

    while (index < expression.length) {
      const char = expression[index];

      if (char === '.') {
        dotCount += 1;
        if (dotCount > 1) {
          break;
        }
        index += 1;
        continue;
      }

      if (!/\d/.test(char)) {
        break;
      }

      index += 1;
    }

    if (start === index || (expression[start] === '.' && index - start === 1)) {
      throw new Error('Expected a number.');
    }

    const value = Number(expression.slice(start, index));

    if (!Number.isFinite(value)) {
      throw new Error('Number is not finite.');
    }

    return value;
  };

  const parsePrimary = () => {
    skipWhitespace();
    const char = peek();

    if (char === '(') {
      consume();
      const value = parseExpression();
      skipWhitespace();

      if (consume() !== ')') {
        throw new Error('Missing closing parenthesis.');
      }

      return value;
    }

    return parseNumber();
  };

  const parseUnary = () => {
    skipWhitespace();
    const char = peek();

    if (char === '+') {
      consume();
      return parseUnary();
    }

    if (char === '-') {
      consume();
      return -parseUnary();
    }

    return parsePrimary();
  };

  const parseTerm = () => {
    let value = parseUnary();

    while (true) {
      skipWhitespace();
      const char = peek();

      if (char !== '*' && char !== '/' && char !== '%') {
        break;
      }

      consume();
      const rhs = parseUnary();

      if (char === '*') {
        value *= rhs;
      } else if (char === '/') {
        value /= rhs;
      } else {
        value %= rhs;
      }
    }

    return value;
  };

  const parseExpression = () => {
    let value = parseTerm();

    while (true) {
      skipWhitespace();
      const char = peek();

      if (char !== '+' && char !== '-') {
        break;
      }

      consume();
      const rhs = parseTerm();
      value = char === '+' ? value + rhs : value - rhs;
    }

    return value;
  };

  const parse = () => {
    const value = parseExpression();
    skipWhitespace();

    if (index !== expression.length) {
      throw new Error('Unexpected token.');
    }

    return value;
  };

  return { parse };
};

export const safeEvaluateExpression = (expression) => {
  if (typeof expression !== 'string' || expression.trim().length === 0) {
    return { ok: false, error: 'Enter a math expression to continue.' };
  }

  if (expression.length > MAX_EXPRESSION_LENGTH) {
    return {
      ok: false,
      error: `Expression is too long. Limit is ${MAX_EXPRESSION_LENGTH} characters.`,
    };
  }

  if (!SAFE_EXPRESSION.test(expression)) {
    return {
      ok: false,
      error: 'Only numbers and operators (+ - * / % . parentheses) are allowed.',
    };
  }

  try {
    const parser = createParser(expression);
    const result = parser.parse();

    if (typeof result !== 'number' || !Number.isFinite(result)) {
      return { ok: false, error: 'Expression did not resolve to a finite number.' };
    }

    return { ok: true, value: result };
  } catch {
    return { ok: false, error: 'Invalid expression. Check your syntax.' };
  }
};
