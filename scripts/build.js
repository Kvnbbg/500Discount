import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(rootDir, 'config', 'app-config.json');
const runtimeConfigPath = path.join(rootDir, 'assets', 'js', 'runtime-config.js');
const envPath = path.join(rootDir, '.env');

const readJson = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
};

const parseEnvFile = (filePath) => {
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

    entries[key] = rest.join('=').trim();
  });

  return entries;
};

const applyOverrides = (config, env) => {
  const updated = { ...config };

  if (env.APP_AI_INTERVAL_MS) {
    const value = Number(env.APP_AI_INTERVAL_MS);
    if (Number.isFinite(value)) {
      updated.aiMessageIntervalMs = value;
    }
  }

  if (env.APP_COIN_GAME_STEP_DELAY_MS) {
    const value = Number(env.APP_COIN_GAME_STEP_DELAY_MS);
    if (Number.isFinite(value)) {
      updated.coinGameStepDelayMs = value;
    }
  }

  if (env.APP_FIRST_RUN_HELP) {
    updated.firstRunShowHelp = env.APP_FIRST_RUN_HELP.toLowerCase() === 'true';
  }

  if (env.APP_LOG_LEVEL) {
    updated.logLevel = env.APP_LOG_LEVEL;
  }

  return updated;
};

const writeRuntimeConfig = (config) => {
  const output = `window.__APP_CONFIG__ = ${JSON.stringify(config, null, 2)};\n`;
  fs.writeFileSync(runtimeConfigPath, output);
};

const main = () => {
  const baseConfig = readJson(configPath);
  const envConfig = {
    ...parseEnvFile(envPath),
    ...process.env,
  };

  const finalConfig = applyOverrides(baseConfig, envConfig);
  writeRuntimeConfig(finalConfig);

  console.log('Runtime config generated at assets/js/runtime-config.js');
};

main();
