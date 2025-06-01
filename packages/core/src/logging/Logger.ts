export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
  error?: Error | undefined;
  context?: {
    flowId?: string;
    nodeId?: string;
    executionId?: string;
  };
}

export interface ILogger {
  setLevel(_level: LogLevel): void;
  addContext(_context: any): void;

  debug(_message: string, _data?: any): void;
  info(_message: string, _data?: any): void;
  warn(_message: string, _data?: any): void;
  error(_message: string, _error?: Error, _data?: any): void;

  withContext(_context: any): ILogger;

  getLogs(): LogEntry[];
  clear(): void;
  child(context: { flowId?: string; nodeId?: string; executionId?: string }): ILogger;
}

// Import logging config types
interface LoggingConfig {
  level: LogLevel;
  maxLogs: number;
  enableConsole: boolean;
  enableFileOutput: boolean;
  enableRemoteLogging: boolean;
  remoteEndpoint?: string | undefined;
  structuredLogging: boolean;
  includeStackTrace: boolean;
}

export class Logger implements ILogger {
  protected logs: LogEntry[] = [];
  protected maxLogs: number = 1000;
  protected minLevel: LogLevel = 'debug';

  constructor(minLevel: LogLevel = 'debug', maxLogs: number = 1000) {
    this.minLevel = minLevel;
    this.maxLogs = maxLogs;
  }

  /**
   * Log a debug message
   */
  debug(_message: string, _data?: any): void {
    this.log('debug', _message, _data);
  }

  /**
   * Log an info message
   */
  info(_message: string, _data?: any): void {
    this.log('info', _message, _data);
  }

  /**
   * Log a warning message
   */
  warn(_message: string, _data?: any): void {
    this.log('warn', _message, _data);
  }

  /**
   * Log an error message
   */
  error(_message: string, _error?: Error, _data?: any): void {
    this.log('error', _message, _data, _error);
  }

  /**
   * Internal logging method
   */
  protected log(level: LogLevel, message: string, data?: any, error?: Error): void {
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
  protected shouldLog(level: LogLevel): boolean {
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

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  addContext(_context: any): void {
    // For base Logger, this is a no-op
    // Context is handled in child loggers
  }

  withContext(context: any): ILogger {
    return this.child(context);
  }
}

/**
 * Enhanced logger that integrates with the configuration system
 */
export class ConfigurableLogger extends Logger {
  private config: LoggingConfig;
  private configChangeUnsubscribe?: (() => void) | undefined;

  constructor(config: LoggingConfig, onConfigChange?: (callback: (config: LoggingConfig) => void) => () => void) {
    super(config.level, config.maxLogs);
    this.config = config;

    // Subscribe to configuration changes if callback provided
    if (onConfigChange) {
      this.configChangeUnsubscribe = onConfigChange((newConfig: LoggingConfig) => {
        this.updateConfig(newConfig);
      });
    }
  }

  /**
   * Update logger configuration
   */
  updateConfig(newConfig: LoggingConfig): void {
    this.config = newConfig;
    this.setMinLevel(newConfig.level);
    this.maxLogs = newConfig.maxLogs;

    // Log the configuration change
    this.info('Logger configuration updated', {
      level: newConfig.level,
      maxLogs: newConfig.maxLogs,
      enableConsole: newConfig.enableConsole,
      structuredLogging: newConfig.structuredLogging,
    });
  }

  /**
   * Enhanced logging with configuration-based output
   */
  protected log(level: LogLevel, message: string, data?: any, error?: Error): void {
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

    // Add stack trace if enabled and it's an error
    if (this.config.includeStackTrace && error) {
      logEntry.error = error;
    }

    this.logs.push(logEntry);

    // Trim logs if we exceed maxLogs
    if (this.logs.length > this.config.maxLogs) {
      this.logs = this.logs.slice(-this.config.maxLogs);
    }

    // Console output based on configuration
    if (this.config.enableConsole) {
      this.outputToConsole(logEntry);
    }

    // File output if enabled
    if (this.config.enableFileOutput) {
      this.outputToFile(logEntry);
    }

    // Remote logging if enabled
    if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
      this.outputToRemote(logEntry);
    }
  }

  /**
   * Output to console with structured or simple formatting
   */
  private outputToConsole(logEntry: LogEntry): void {
    const timestamp = logEntry.timestamp.toISOString();

    if (this.config.structuredLogging) {
      // Structured JSON output
      const structuredLog = {
        timestamp,
        level: logEntry.level,
        message: logEntry.message,
        ...(logEntry.data && { data: logEntry.data }),
        ...(logEntry.error && { error: { message: logEntry.error.message, stack: logEntry.error.stack } }),
        ...(logEntry.context && { context: logEntry.context }),
      };

      console.log(JSON.stringify(structuredLog));
    } else {
      // Simple formatted output
      const prefix = `[${timestamp}] [${logEntry.level.toUpperCase()}]`;
      
      switch (logEntry.level) {
        case 'debug':
          console.debug(prefix, logEntry.message, logEntry.data);
          break;
        case 'info':
          console.info(prefix, logEntry.message, logEntry.data);
          break;
        case 'warn':
          console.warn(prefix, logEntry.message, logEntry.data);
          break;
        case 'error':
          console.error(prefix, logEntry.message, logEntry.error || logEntry.data);
          break;
      }
    }
  }

  /**
   * Output to file (placeholder for future implementation)
   */
  private outputToFile(logEntry: LogEntry): void {
    // TODO: Implement file logging
    // This would require a file system abstraction that works in both Node.js and browser
    console.debug('File logging not yet implemented', logEntry);
  }

  /**
   * Output to remote endpoint
   */
  private async outputToRemote(logEntry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      const payload = {
        timestamp: logEntry.timestamp.toISOString(),
        level: logEntry.level,
        message: logEntry.message,
        data: logEntry.data,
        error: logEntry.error ? {
          message: logEntry.error.message,
          stack: logEntry.error.stack,
        } : undefined,
        context: logEntry.context,
      };

      // Fire and forget - don't wait for response to avoid blocking
      fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch(error => {
        // Only log to console if remote logging fails to avoid infinite loops
        console.error('Failed to send log to remote endpoint:', error);
      });
    } catch (error) {
      console.error('Error in remote logging:', error);
    }
  }

  /**
   * Create a child logger with the same configuration
   */
  child(context: { flowId?: string; nodeId?: string; executionId?: string }): ConfigurableLogger {
    const childLogger = new ConfigurableLogger(this.config);
    
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
      if (this.logs.length > this.config.maxLogs) {
        this.logs = this.logs.slice(-this.config.maxLogs);
      }

      // Apply all configured outputs
      if (this.config.enableConsole) {
        this.outputToConsole(logEntry);
      }

      if (this.config.enableFileOutput) {
        this.outputToFile(logEntry);
      }

      if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
        this.outputToRemote(logEntry);
      }
    };

    return childLogger;
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggingConfig {
    return { ...this.config };
  }

  /**
   * Cleanup method to unsubscribe from configuration changes
   */
  destroy(): void {
    if (this.configChangeUnsubscribe) {
      this.configChangeUnsubscribe();
      this.configChangeUnsubscribe = undefined;
    }
  }
}

/**
 * Factory for creating loggers based on configuration
 */
export class LoggerFactory {
  private static instance: LoggerFactory;
  private config: LoggingConfig | null = null;
  private loggers: Map<string, ConfigurableLogger> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): LoggerFactory {
    if (!LoggerFactory.instance) {
      LoggerFactory.instance = new LoggerFactory();
    }
    return LoggerFactory.instance;
  }

  /**
   * Initialize the factory with configuration
   */
  initialize(config: LoggingConfig, onConfigChange?: (callback: (config: LoggingConfig) => void) => () => void): void {
    this.config = config;

    // Update all existing loggers with new configuration
    this.loggers.forEach(logger => {
      logger.updateConfig(config);
    });

    // Subscribe to configuration changes if provided
    if (onConfigChange) {
      onConfigChange((newConfig: LoggingConfig) => {
        this.config = newConfig;
        this.loggers.forEach(logger => {
          logger.updateConfig(newConfig);
        });
      });
    }
  }

  /**
   * Create a new logger instance
   */
  createLogger(name: string): ILogger {
    if (!this.config) {
      // Fallback to basic logger if not initialized
      console.warn('LoggerFactory not initialized, using basic Logger');
      return new Logger();
    }

    const logger = new ConfigurableLogger(this.config);
    this.loggers.set(name, logger);
    
    // Add logger name to context
    return logger.child({ nodeId: name });
  }

  /**
   * Get existing logger or create new one
   */
  getLogger(name: string): ILogger {
    const existingLogger = this.loggers.get(name);
    if (existingLogger) {
      return existingLogger;
    }
    return this.createLogger(name);
  }

  /**
   * Clean up all loggers
   */
  destroy(): void {
    this.loggers.forEach(logger => {
      logger.destroy();
    });
    this.loggers.clear();
    this.config = null;
  }

  /**
   * Get statistics for all managed loggers
   */
  getGlobalStats(): {
    totalLoggers: number;
    totalLogs: number;
    logsByLevel: Record<LogLevel, number>;
  } {
    let totalLogs = 0;
    const logsByLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    this.loggers.forEach(logger => {
      const stats = logger.getStats();
      Object.keys(stats).forEach(level => {
        const logLevel = level as LogLevel;
        logsByLevel[logLevel] += stats[logLevel];
        totalLogs += stats[logLevel];
      });
    });

    return {
      totalLoggers: this.loggers.size,
      totalLogs,
      logsByLevel,
    };
  }
} 