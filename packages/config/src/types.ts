/**
 * Application configuration interface
 */
export interface AppConfig {
  execution: {
    defaultTimeout: number;
    maxIterations: number;
    retryAttempts: number;
  };
  api: {
    geminiApiKey: string;
    defaultModel: string;
  };
  ui: {
    theme: 'light' | 'dark';
    autoSave: boolean;
    debugMode: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    maxLogs: number;
    enableConsole: boolean;
    enableFileOutput: boolean;
    enableRemoteLogging: boolean;
    remoteEndpoint?: string | undefined;
    structuredLogging: boolean;
    includeStackTrace: boolean;
  };
}

/**
 * Environment variable keys
 */
export const ENV_KEYS = {
  // Execution settings
  DEFAULT_TIMEOUT: 'VITE_DEFAULT_TIMEOUT',
  MAX_ITERATIONS: 'VITE_MAX_ITERATIONS',
  RETRY_ATTEMPTS: 'VITE_RETRY_ATTEMPTS',
  
  // API settings
  GEMINI_API_KEY: 'VITE_GEMINI_API_KEY',
  GEMINI_MODEL: 'VITE_GEMINI_MODEL',
  
  // UI settings
  THEME: 'VITE_THEME',
  AUTO_SAVE: 'VITE_AUTO_SAVE',
  DEBUG_MODE: 'VITE_DEBUG_MODE',
  
  // Logging settings
  LOG_LEVEL: 'VITE_LOG_LEVEL',
  LOG_MAX_ENTRIES: 'VITE_LOG_MAX_ENTRIES',
  LOG_CONSOLE: 'VITE_LOG_CONSOLE',
  LOG_FILE_OUTPUT: 'VITE_LOG_FILE_OUTPUT',
  LOG_REMOTE: 'VITE_LOG_REMOTE',
  LOG_REMOTE_ENDPOINT: 'VITE_LOG_REMOTE_ENDPOINT',
  LOG_STRUCTURED: 'VITE_LOG_STRUCTURED',
  LOG_STACK_TRACE: 'VITE_LOG_STACK_TRACE',
} as const;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: AppConfig = {
  execution: {
    defaultTimeout: 10000,
    maxIterations: 100,
    retryAttempts: 3,
  },
  api: {
    geminiApiKey: '',
    defaultModel: 'gemini-pro',
  },
  ui: {
    theme: 'light',
    autoSave: true,
    debugMode: false,
  },
  logging: {
    level: 'info',
    maxLogs: 1000,
    enableConsole: true,
    enableFileOutput: false,
    enableRemoteLogging: false,
    structuredLogging: true,
    includeStackTrace: true,
  },
};

/**
 * Configuration validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Configuration change listener
 */
export type ConfigChangeListener = (config: AppConfig) => void;

/**
 * Configuration manager interface
 */
export interface IConfigManager {
  getConfig(): AppConfig;
  updateConfig(updates: Partial<AppConfig>): void;
  onChange(listener: ConfigChangeListener): () => void;
  reset(): void;
  validate(config?: AppConfig): ValidationResult;
  export(): string;
  import(jsonConfig: string): void;
} 