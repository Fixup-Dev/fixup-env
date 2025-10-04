import { isatty } from 'tty';

/**
 * Check if output is a TTY
 */
export function isTTY(): boolean {
  return isatty(1);
}

/**
 * Logger with TTY detection
 */
export class Logger {
  private isTTY: boolean;

  constructor() {
    this.isTTY = isTTY();
  }

  /**
   * Log info message
   */
  info(message: string): void {
    if (this.isTTY) {
      console.log(message);
    }
  }

  /**
   * Log error message
   */
  error(message: string): void {
    console.error(message);
  }

  /**
   * Log warning message
   */
  warn(message: string): void {
    if (this.isTTY) {
      console.warn(message);
    }
  }

  /**
   * Log debug message (only in TTY)
   */
  debug(message: string): void {
    if (this.isTTY && process.env.DEBUG) {
      console.debug(message);
    }
  }
}
