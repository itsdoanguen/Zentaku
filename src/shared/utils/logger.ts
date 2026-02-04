/* eslint-disable no-console */
/**
 * Simple logger utility with different log levels
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

type LogLevelName = keyof typeof LogLevel;

/**
 * Logger class for structured logging
 */
class Logger {
  private level: LogLevel;

  constructor() {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase() as LogLevelName;
    this.level = LogLevel[envLevel] ?? LogLevel.INFO;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${new Date().toISOString()}`, message, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`[INFO] ${new Date().toISOString()}`, message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${new Date().toISOString()}`, message, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${new Date().toISOString()}`, message, ...args);
    }
  }

  setLevel(level: LogLevelName): void {
    this.level = LogLevel[level];
  }

  getLevel(): LogLevelName {
    return LogLevel[this.level] as LogLevelName;
  }
}

export default new Logger();

export { Logger, LogLevel };
export type { LogLevelName };
