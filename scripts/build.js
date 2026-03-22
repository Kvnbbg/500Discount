import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(scriptPath), '..');
const configPath = path.join(rootDir, 'config', 'app-config.json');
const runtimeConfigPath = path.join(rootDir, 'assets', 'js', 'runtime-config.js');
const envPath = path.join(rootDir, '.env');
const LOG_LEVELS = new Set(['debug', 'info', 'warn', 'error']);
const CONFIG_OVERRIDE_MAP = Object.freeze({
  APP_AI_INTERVAL_MS: {
    key: 'aiMessageIntervalMs',
    transform: (value) => toFiniteNumber(value),
  },
  APP_COIN_GAME_STEP_DELAY_MS: {
    key: 'coinGameStepDelayMs',
    transform: (value) => toFiniteNumber(value),
  },
  APP_FIRST_RUN_HELP: {
    key: 'firstRunShowHelp',
    transform: (value) => toBoolean(value),
  },
  APP_LOG_LEVEL: {
    key: 'logLevel',
    transform: (value) => toLogLevel(value),
  },
});

const readJson = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
};

const stripWrappingQuotes = (value) => {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }
  }

  return undefined;
};

const toLogLevel = (value) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  return LOG_LEVELS.has(normalized) ? normalized : undefined;
};

export const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const entries = {};

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const [key, ...rest] = trimmed.split('=');
    if (!key) {
      return;
    }

    entries[key] = stripWrappingQuotes(rest.join('=').trim());
  });

  return entries;
};

export const applyOverrides = (config, env) => {
  const updated = { ...config };

  Object.entries(CONFIG_OVERRIDE_MAP).forEach(([envKey, override]) => {
    if (env[envKey] === undefined) {
      return;
    }

    const nextValue = override.transform(env[envKey]);
    if (nextValue !== undefined) {
      updated[override.key] = nextValue;
    }
  });

  return updated;
};

export const writeRuntimeConfig = (config) => {
  const output = `window.__APP_CONFIG__ = ${JSON.stringify(config, null, 2)};\n`;
  fs.writeFileSync(runtimeConfigPath, output);
};

export const main = () => {
  try {
    const baseConfig = readJson(configPath);
    const envConfig = {
      ...parseEnvFile(envPath),
      ...process.env,
    };

    const finalConfig = applyOverrides(baseConfig, envConfig);
    writeRuntimeConfig(finalConfig);
    process.stdout.write('Runtime config generated at assets/js/runtime-config.js\n');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    process.stderr.write(`Failed to generate runtime config: ${message}\n`);
    process.exitCode = 1;
  }
};

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main();
}
