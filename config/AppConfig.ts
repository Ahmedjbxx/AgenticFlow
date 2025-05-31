import { AppConfig } from '../core/execution/ExecutionContext';

/**
 * Create application configuration from environment variables
 */
export const createConfig = (): AppConfig => {
  return {
    execution: {
      defaultTimeout: parseInt(import.meta.env.VITE_DEFAULT_TIMEOUT || '10000'),
      maxIterations: parseInt(import.meta.env.VITE_MAX_ITERATIONS || '100'),
      retryAttempts: parseInt(import.meta.env.VITE_RETRY_ATTEMPTS || '3'),
    },
    api: {
      geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
      defaultModel: import.meta.env.VITE_GEMINI_MODEL || 'gemini-pro',
    },
    ui: {
      theme: (import.meta.env.VITE_THEME as 'light' | 'dark') || 'light',
      autoSave: import.meta.env.VITE_AUTO_SAVE === 'true',
      debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
    },
  };
};

/**
 * Validate configuration values
 */
export const validateConfig = (config: AppConfig): string[] => {
  const errors: string[] = [];

  // Execution validation
  if (config.execution.defaultTimeout < 1000) {
    errors.push('Default timeout must be at least 1000ms');
  }

  if (config.execution.maxIterations < 1) {
    errors.push('Max iterations must be at least 1');
  }

  if (config.execution.retryAttempts < 0) {
    errors.push('Retry attempts cannot be negative');
  }

  // API validation
  if (!config.api.geminiApiKey.trim()) {
    errors.push('Gemini API key is required');
  }

  if (!config.api.defaultModel.trim()) {
    errors.push('Default model name is required');
  }

  // UI validation
  if (!['light', 'dark'].includes(config.ui.theme)) {
    errors.push('Theme must be either "light" or "dark"');
  }

  return errors;
};

/**
 * Configuration manager with runtime updates
 */
export class ConfigManager {
  private config: AppConfig;
  private listeners: ((config: AppConfig) => void)[] = [];

  constructor(initialConfig: AppConfig) {
    this.config = { ...initialConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AppConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      execution: { ...this.config.execution, ...updates.execution },
      api: { ...this.config.api, ...updates.api },
      ui: { ...this.config.ui, ...updates.ui },
    };

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.config);
      } catch (error) {
        console.error('Error in config listener:', error);
      }
    });
  }

  /**
   * Subscribe to configuration changes
   */
  onChange(listener: (config: AppConfig) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get a specific configuration value
   */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  /**
   * Set a specific configuration value
   */
  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.updateConfig({ [key]: value } as Partial<AppConfig>);
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = createConfig();
    this.listeners.forEach(listener => listener(this.config));
  }

  /**
   * Export configuration as JSON
   */
  export(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  import(jsonConfig: string): void {
    try {
      const parsedConfig = JSON.parse(jsonConfig) as AppConfig;
      const errors = validateConfig(parsedConfig);
      
      if (errors.length > 0) {
        throw new Error(`Invalid configuration: ${errors.join(', ')}`);
      }

      this.config = parsedConfig;
      this.listeners.forEach(listener => listener(this.config));
    } catch (error) {
      throw new Error(`Failed to import configuration: ${(error as Error).message}`);
    }
  }
}

// Create singleton config manager
export const configManager = new ConfigManager(createConfig()); 