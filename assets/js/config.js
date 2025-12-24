/**
 * @typedef {Object} AppConfig
 * @property {number} aiMessageIntervalMs
 * @property {number} coinGameStepDelayMs
 * @property {boolean} firstRunShowHelp
 * @property {'debug' | 'info' | 'warn' | 'error'} logLevel
 */

const DEFAULT_CONFIG = Object.freeze({
  aiMessageIntervalMs: 3000,
  coinGameStepDelayMs: 700,
  firstRunShowHelp: true,
  logLevel: 'info',
});

const isFiniteNumber = (value) =>
  typeof value === 'number' && Number.isFinite(value);

const coerceBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return undefined;
};

/**
 * @param {Partial<AppConfig> | undefined} rawConfig
 * @returns {{ config: AppConfig, errors: string[] }}
 */
export const validateConfig = (rawConfig = {}) => {
  const errors = [];

  const config = {
    ...DEFAULT_CONFIG,
  };

  if (isFiniteNumber(rawConfig.aiMessageIntervalMs)) {
    config.aiMessageIntervalMs = Math.max(1000, rawConfig.aiMessageIntervalMs);
  } else if (rawConfig.aiMessageIntervalMs !== undefined) {
    errors.push('aiMessageIntervalMs must be a finite number.');
  }

  if (isFiniteNumber(rawConfig.coinGameStepDelayMs)) {
    config.coinGameStepDelayMs = Math.max(100, rawConfig.coinGameStepDelayMs);
  } else if (rawConfig.coinGameStepDelayMs !== undefined) {
    errors.push('coinGameStepDelayMs must be a finite number.');
  }

  const firstRunValue = coerceBoolean(rawConfig.firstRunShowHelp);
  if (typeof firstRunValue === 'boolean') {
    config.firstRunShowHelp = firstRunValue;
  } else if (rawConfig.firstRunShowHelp !== undefined) {
    errors.push('firstRunShowHelp must be a boolean.');
  }

  if (
    typeof rawConfig.logLevel === 'string' &&
    ['debug', 'info', 'warn', 'error'].includes(rawConfig.logLevel)
  ) {
    config.logLevel = rawConfig.logLevel;
  } else if (rawConfig.logLevel !== undefined) {
    errors.push('logLevel must be one of debug, info, warn, error.');
  }

  return { config, errors };
};

/**
 * @returns {AppConfig}
 */
export const getAppConfig = () => {
  const rawConfig = window.__APP_CONFIG__ || {};
  const { config, errors } = validateConfig(rawConfig);

  if (errors.length > 0) {
    console.warn('Invalid app config detected. Using safe defaults.', errors);
  }

  return config;
};
