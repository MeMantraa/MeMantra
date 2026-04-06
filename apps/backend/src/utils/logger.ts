export const logger = {
  error: (message: string, ...args: unknown[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (_message: string, ..._args: unknown[]) => {},
  info: (_message: string, ..._args: unknown[]) => {},
  debug: (_message: string, ..._args: unknown[]) => {},
};
