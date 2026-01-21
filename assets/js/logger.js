const LEVELS = ['debug', 'info', 'warn', 'error'];

const resolveLevelIndex = (level) => {
  const index = LEVELS.indexOf(level);
  return index === -1 ? LEVELS.indexOf('info') : index;
};

export const createLogger = (level = 'info') => {
  const minIndex = resolveLevelIndex(level);

  const log = (levelName, message, context = {}) => {
    if (resolveLevelIndex(levelName) < minIndex) {
      return;
    }

    const payload = {
      level: levelName,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    const output = console[levelName] || console.info;
    output(payload);
  };

  return {
    debug: (message, context) => log('debug', message, context),
    info: (message, context) => log('info', message, context),
    warn: (message, context) => log('warn', message, context),
    error: (message, context) => log('error', message, context),
  };
};
