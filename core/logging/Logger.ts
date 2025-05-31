import { Logger as ILogger } from '../execution/ExecutionContext';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
  error?: Error;
  context?: {
    flowId?: string;
    nodeId?: string;
    executionId?: string;
  };
}

export class Logger implements ILogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private minLevel: LogLevel = 'debug';

  constructor(minLevel: LogLevel = 'debug', maxLogs: number = 1000) {
    this.minLevel = minLevel;
    this.maxLogs = maxLogs;
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  /**
   * Log an info message
   */
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, data?: any): void {
    this.log('error', message, data, error);
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data,
      error,
    };

    this.logs.push(logEntry);

    // Trim logs if we exceed maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const timestamp = logEntry.timestamp.toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

      switch (level) {
        case 'debug':
          console.debug(prefix, message, data);
          break;
        case 'info':
          console.info(prefix, message, data);
          break;
        case 'warn':
          console.warn(prefix, message, data);
          break;
        case 'error':
          console.error(prefix, message, error || data);
          break;
      }
    }
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const levelIndex = levels.indexOf(level);
    const minLevelIndex = levels.indexOf(this.minLevel);
    return levelIndex >= minLevelIndex;
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs for a specific context
   */
  getLogsByContext(context: { flowId?: string; nodeId?: string; executionId?: string }): LogEntry[] {
    return this.logs.filter(log => {
      if (!log.context) return false;
      
      return (!context.flowId || log.context.flowId === context.flowId) &&
             (!context.nodeId || log.context.nodeId === context.nodeId) &&
             (!context.executionId || log.context.executionId === context.executionId);
    });
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Create a child logger with context
   */
  child(context: { flowId?: string; nodeId?: string; executionId?: string }): Logger {
    const childLogger = new Logger(this.minLevel, this.maxLogs);
    
    // Override log method to add context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = function(level: LogLevel, message: string, data?: any, error?: Error) {
      const logEntry: LogEntry = {
        level,
        message,
        timestamp: new Date(),
        data,
        error,
        context,
      };

      this.logs.push(logEntry);

      // Trim logs if we exceed maxLogs
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }

      // Console output for development
      if (process.env.NODE_ENV === 'development') {
        const timestamp = logEntry.timestamp.toISOString();
        const contextStr = Object.entries(context)
          .filter(([, value]) => value)
          .map(([key, value]) => `${key}:${value}`)
          .join(' ');
        const prefix = `[${timestamp}] [${level.toUpperCase()}] [${contextStr}]`;

        switch (level) {
          case 'debug':
            console.debug(prefix, message, data);
            break;
          case 'info':
            console.info(prefix, message, data);
            break;
          case 'warn':
            console.warn(prefix, message, data);
            break;
          case 'error':
            console.error(prefix, message, error || data);
            break;
        }
      }
    };

    return childLogger;
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get log statistics
   */
  getStats(): Record<LogLevel, number> {
    const stats: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    this.logs.forEach(log => {
      stats[log.level]++;
    });

    return stats;
  }
} 