export const parseCoinsInput = (input) => {
  if (!input || typeof input !== 'string') {
    return [];
  }

  return input
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value >= 0);
};

export const parseCoinsInputDetailed = (input) => {
  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return {
      ok: false,
      coins: [],
      error: 'Enter at least one valid coin value.',
    };
  }

  const segments = input.split(',').map((value) => value.trim());
  const invalidTokens = [];
  const negativeTokens = [];
  const coins = [];

  segments.forEach((segment) => {
    if (segment.length === 0) {
      return;
    }

    const value = Number(segment);
    if (!Number.isFinite(value)) {
      invalidTokens.push(segment);
      return;
    }

    if (value < 0) {
      negativeTokens.push(segment);
      return;
    }

    coins.push(value);
  });

  if (coins.length === 0) {
    return {
      ok: false,
      coins,
      error: 'No valid coin values found. Use comma-separated numbers like 1, 2, 3.',
    };
  }

  if (invalidTokens.length > 0 || negativeTokens.length > 0) {
    const details = [];

    if (invalidTokens.length > 0) {
      details.push(`Invalid entries: ${invalidTokens.join(', ')}`);
    }

    if (negativeTokens.length > 0) {
      details.push(`Negative values are not allowed: ${negativeTokens.join(', ')}`);
    }

    return {
      ok: true,
      coins,
      warning: details.join('. '),
    };
  }

  return { ok: true, coins };
};

export const parseThreshold = (input) => {
  const value = Number(input);

  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, error: 'Threshold must be a number greater than 0.' };
  }

  return { ok: true, value };
};

export const computeCoinOperations = (coins, threshold) => {
  const working = [...coins];
  const steps = [];
  let operations = 0;

  if (working.length === 0) {
    return { operations, steps, finalCoins: working, success: false };
  }

  while (working.length > 1 && working.some((value) => value < threshold)) {
    working.sort((a, b) => a - b);
    const x = working.shift();
    const y = working.shift();

    if (x === undefined || y === undefined) {
      break;
    }

    const newCoin = Math.min(x, y) * 2 + Math.max(x, y);
    operations += 1;
    steps.push({ x, y, newCoin });
    working.push(newCoin);

    if (operations > 10000) {
      break;
    }
  }

  const success = working.length > 0 && working.every((value) => value >= threshold);

  return { operations, steps, finalCoins: working, success };
};
