export const parseCoinsInput = (input) => {
  if (!input || typeof input !== 'string') {
    return [];
  }

  return input
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value >= 0);
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
