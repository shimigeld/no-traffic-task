export type Logger = {
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
};

const formatContext = (context?: Record<string, unknown>) => (context ? ` | context=${JSON.stringify(context)}` : "");

export const defaultLogger: Logger = {
  info: (message, context) => {
    console.info(`[info] ${message}${formatContext(context)}`);
  },
  warn: (message, context) => {
    console.warn(`[warn] ${message}${formatContext(context)}`);
  },
  error: (message, context) => {
    console.error(`[error] ${message}${formatContext(context)}`);
  },
};

export const createLogger = (overrides?: Partial<Logger>): Logger => ({
  info: overrides?.info ?? defaultLogger.info,
  warn: overrides?.warn ?? defaultLogger.warn,
  error: overrides?.error ?? defaultLogger.error,
});
