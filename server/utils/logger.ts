/**
 * Minimal structured logger — one JSON object per line to stdout/stderr so
 * log lines are greppable and machine-parseable even without a real log
 * aggregator (ELK/Loki/CloudWatch) in front of them. Deliberately not a
 * dependency (pino/winston): this app has one process and no log volume
 * that would justify one.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogFields {
  module: string;
  event: string;
  [key: string]: unknown;
}

function write(level: LogLevel, fields: LogFields) {
  const line = JSON.stringify({
    level,
    ts: new Date().toISOString(),
    ...fields
  });
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (fields: LogFields) => write('info', fields),
  warn: (fields: LogFields) => write('warn', fields),
  error: (fields: LogFields) => write('error', fields)
};

/** Formats an unknown caught value into a plain string for a log field —
 * `err.message` on a real Error, otherwise a best-effort String() so a
 * thrown non-Error value never becomes "[object Object]" with no detail. */
export function errorDetail(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return String(err);
  } catch {
    return 'unknown error';
  }
}
