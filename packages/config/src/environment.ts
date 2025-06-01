import { AppConfig, ENV_KEYS, DEFAULT_CONFIG, ValidationResult } from './types';

/**
 * Get environment variables (works in both Node.js and browser)
 */
function getEnv(): Record<string, string | undefined> {
  // In browser/Vite context
  if (typeof window !== 'undefined') {
    // Try to access Vite environment variables
    try {
      // @ts-ignore - import.meta.env exists in Vite context
      return (import.meta as any).env || {};
    } catch {
      return {};
    }
  }
  
  // In Node.js context
  if (typeof process !== 'undefined' && process.env) {
    return process.env;
  }
  
  return {};
}

/**
 * Environment configuration loader
 */
export class EnvironmentLoader {
  /**
   * Load configuration from environment variables
   */
  static loadFromEnv(): AppConfig {
    const env = getEnv();
    
    return {
      execution: {
        defaultTimeout: parseInt(env[ENV_KEYS.DEFAULT_TIMEOUT] || String(DEFAULT_CONFIG.execution.defaultTimeout)),
        maxIterations: parseInt(env[ENV_KEYS.MAX_ITERATIONS] || String(DEFAULT_CONFIG.execution.maxIterations)),
        retryAttempts: parseInt(env[ENV_KEYS.RETRY_ATTEMPTS] || String(DEFAULT_CONFIG.execution.retryAttempts)),
      },
      api: {
        geminiApiKey: env[ENV_KEYS.GEMINI_API_KEY] || DEFAULT_CONFIG.api.geminiApiKey,
        defaultModel: env[ENV_KEYS.GEMINI_MODEL] || DEFAULT_CONFIG.api.defaultModel,
      },
      ui: {
        theme: (env[ENV_KEYS.THEME] as 'light' | 'dark') || DEFAULT_CONFIG.ui.theme,
        autoSave: env[ENV_KEYS.AUTO_SAVE] === 'true' || DEFAULT_CONFIG.ui.autoSave,
        debugMode: env[ENV_KEYS.DEBUG_MODE] === 'true' || DEFAULT_CONFIG.ui.debugMode,
      },
      logging: {
        level: (env[ENV_KEYS.LOG_LEVEL] as 'debug' | 'info' | 'warn' | 'error') || DEFAULT_CONFIG.logging.level,
        maxLogs: parseInt(env[ENV_KEYS.LOG_MAX_ENTRIES] || String(DEFAULT_CONFIG.logging.maxLogs)),
        enableConsole: env[ENV_KEYS.LOG_CONSOLE] !== 'false', // Default to true unless explicitly disabled
        enableFileOutput: env[ENV_KEYS.LOG_FILE_OUTPUT] === 'true',
        enableRemoteLogging: env[ENV_KEYS.LOG_REMOTE] === 'true',
        ...(env[ENV_KEYS.LOG_REMOTE_ENDPOINT] && { remoteEndpoint: env[ENV_KEYS.LOG_REMOTE_ENDPOINT] }),
        structuredLogging: env[ENV_KEYS.LOG_STRUCTURED] !== 'false', // Default to true unless explicitly disabled
        includeStackTrace: env[ENV_KEYS.LOG_STACK_TRACE] !== 'false', // Default to true unless explicitly disabled
      },
    };
  }

  /**
   * Validate required environment variables
   */
  static validateEnvironment(): ValidationResult {
    const env = getEnv();
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required variables
    if (!env[ENV_KEYS.GEMINI_API_KEY]?.trim()) {
      errors.push(`Missing required environment variable: ${ENV_KEYS.GEMINI_API_KEY}`);
    }

    // Validation warnings
    const timeout = parseInt(env[ENV_KEYS.DEFAULT_TIMEOUT] || '0');
    if (timeout > 0 && timeout < 1000) {
      warnings.push('Default timeout is less than 1000ms, this may cause issues');
    }

    const iterations = parseInt(env[ENV_KEYS.MAX_ITERATIONS] || '0');
    if (iterations > 0 && iterations > 1000) {
      warnings.push('Max iterations is very high (>1000), this may impact performance');
    }

    const theme = env[ENV_KEYS.THEME];
    if (theme && !['light', 'dark'].includes(theme)) {
      warnings.push(`Invalid theme value: ${theme}. Using default 'light'`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get all environment variables as a safe object (without sensitive data)
   */
  static getSafeEnvInfo(): Record<string, string> {
    const env = getEnv();
    const safeEnv: Record<string, string> = {};

    // Add non-sensitive environment info
    safeEnv[ENV_KEYS.DEFAULT_TIMEOUT] = env[ENV_KEYS.DEFAULT_TIMEOUT] || 'default';
    safeEnv[ENV_KEYS.MAX_ITERATIONS] = env[ENV_KEYS.MAX_ITERATIONS] || 'default';
    safeEnv[ENV_KEYS.RETRY_ATTEMPTS] = env[ENV_KEYS.RETRY_ATTEMPTS] || 'default';
    safeEnv[ENV_KEYS.GEMINI_MODEL] = env[ENV_KEYS.GEMINI_MODEL] || 'default';
    safeEnv[ENV_KEYS.THEME] = env[ENV_KEYS.THEME] || 'default';
    safeEnv[ENV_KEYS.AUTO_SAVE] = env[ENV_KEYS.AUTO_SAVE] || 'default';
    safeEnv[ENV_KEYS.DEBUG_MODE] = env[ENV_KEYS.DEBUG_MODE] || 'default';
    
    // Logging environment info
    safeEnv[ENV_KEYS.LOG_LEVEL] = env[ENV_KEYS.LOG_LEVEL] || 'default';
    safeEnv[ENV_KEYS.LOG_MAX_ENTRIES] = env[ENV_KEYS.LOG_MAX_ENTRIES] || 'default';
    safeEnv[ENV_KEYS.LOG_CONSOLE] = env[ENV_KEYS.LOG_CONSOLE] || 'default';
    safeEnv[ENV_KEYS.LOG_FILE_OUTPUT] = env[ENV_KEYS.LOG_FILE_OUTPUT] || 'default';
    safeEnv[ENV_KEYS.LOG_REMOTE] = env[ENV_KEYS.LOG_REMOTE] || 'default';
    safeEnv[ENV_KEYS.LOG_STRUCTURED] = env[ENV_KEYS.LOG_STRUCTURED] || 'default';
    safeEnv[ENV_KEYS.LOG_STACK_TRACE] = env[ENV_KEYS.LOG_STACK_TRACE] || 'default';
    
    // Hide sensitive data
    safeEnv[ENV_KEYS.GEMINI_API_KEY] = env[ENV_KEYS.GEMINI_API_KEY] ? '***SET***' : 'NOT_SET';
    safeEnv[ENV_KEYS.LOG_REMOTE_ENDPOINT] = env[ENV_KEYS.LOG_REMOTE_ENDPOINT] ? '***SET***' : 'NOT_SET';

    return safeEnv;
  }
} 