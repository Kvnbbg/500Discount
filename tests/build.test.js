import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyOverrides, parseEnvFile } from '../scripts/build.js';

describe('build config helpers', () => {
  it('applies only valid env overrides through the shared override map', () => {
    const result = applyOverrides(
      {
        aiMessageIntervalMs: 3000,
        coinGameStepDelayMs: 700,
        firstRunShowHelp: true,
        logLevel: 'info',
      },
      {
        APP_AI_INTERVAL_MS: '4500',
        APP_COIN_GAME_STEP_DELAY_MS: 'fast',
        APP_FIRST_RUN_HELP: 'false',
        APP_LOG_LEVEL: 'WARN',
      },
    );

    expect(result).toEqual({
      aiMessageIntervalMs: 4500,
      coinGameStepDelayMs: 700,
      firstRunShowHelp: false,
      logLevel: 'warn',
    });
  });

  it('parses env files and strips wrapping quotes safely', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-env-test-'));
    const envFile = path.join(tempDir, '.env');

    fs.writeFileSync(
      envFile,
      [
        '# comment',
        'APP_AI_INTERVAL_MS=5500',
        'APP_LOG_LEVEL="error"',
        "APP_FIRST_RUN_HELP='true'",
      ].join('\n'),
    );

    expect(parseEnvFile(envFile)).toEqual({
      APP_AI_INTERVAL_MS: '5500',
      APP_LOG_LEVEL: 'error',
      APP_FIRST_RUN_HELP: 'true',
    });
  });
});
