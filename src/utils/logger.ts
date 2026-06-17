type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const currentLevel: Level = (process.env.LOG_LEVEL as Level) || 'info';

function format(level: Level, scope: string, message: string) {
  const ts = new Date().toISOString();
  return `[${ts}] [${level.toUpperCase()}] [${scope}] ${message}`;
}

function shouldLog(level: Level) {
  return LEVELS[level] >= LEVELS[currentLevel];
}

export function createLogger(scope: string) {
  return {
    debug: (msg: string, meta?: unknown) => {
      if (shouldLog('debug')) console.debug(format('debug', scope, msg), meta ?? '');
    },
    info: (msg: string, meta?: unknown) => {
      if (shouldLog('info')) console.log(format('info', scope, msg), meta ?? '');
    },
    warn: (msg: string, meta?: unknown) => {
      if (shouldLog('warn')) console.warn(format('warn', scope, msg), meta ?? '');
    },
    error: (msg: string, meta?: unknown) => {
      if (shouldLog('error')) console.error(format('error', scope, msg), meta ?? '');
    },
  };
}

export type Logger = ReturnType<typeof createLogger>;
