/**
 * Sanitize a value for safe inclusion in log output.
 * Strips carriage return and newline characters to prevent log injection.
 */
export function sanitizeForLog(value: unknown): string {
  return String(value).replace(/[\r\n]/g, '');
}
