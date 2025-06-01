import { AppConfig, ValidationResult, ConfigChangeListener, IConfigManager } from './types';
import { EnvironmentLoader } from './environment';

/**
 * Enhanced configuration manager with runtime updates and validation
 */
export class ConfigManager implements IConfigManager {
  private config: AppConfig;
  private listeners: ConfigChangeListener[] = [];

  constructor(initialConfig?: AppConfig) {
    this.config = initialConfig || EnvironmentLoader.loadFromEnv();
  }

  /**
   * Get current configuration (deep copy for immutability)
   */
  getConfig(): AppConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Update configuration with validation
   */
  updateConfig(updates: Partial<AppConfig>): void {
    const newConfig: AppConfig = {
      ...this.config,
      execution: { ...this.config.execution, ...updates.execution },
      api: { ...this.config.api, ...updates.api },
      ui: { ...this.config.ui, ...updates.ui },
      logging: { ...this.config.logging, ...updates.logging },
    };

    // Validate the new configuration
    const validation = this.validate(newConfig);
    if (!validation.isValid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn('Configuration warnings:', validation.warnings);
    }

    this.config = newConfig;

    // Notify all listeners
    this.notifyListeners();
  }

  /**
   * Subscribe to configuration changes
   */
  onChange(listener: ConfigChangeListener): () => void {
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
   * Reset to environment-based configuration
   */
  reset(): void {
    this.config = EnvironmentLoader.loadFromEnv();
    this.notifyListeners();
  }

  /**
   * Validate configuration
   */
  validate(config?: AppConfig): ValidationResult {
    const configToValidate = config || this.config;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Execution validation
    if (configToValidate.execution.defaultTimeout < 1000) {
      errors.push('Default timeout must be at least 1000ms');
    }
    if (configToValidate.execution.defaultTimeout > 300000) {
      warnings.push('Default timeout is very high (>5 minutes)');
    }

    if (configToValidate.execution.maxIterations < 1) {
      errors.push('Max iterations must be at least 1');
    }
    if (configToValidate.execution.maxIterations > 1000) {
      warnings.push('Max iterations is very high (>1000)');
    }

    if (configToValidate.execution.retryAttempts < 0) {
      errors.push('Retry attempts cannot be negative');
    }
    if (configToValidate.execution.retryAttempts > 10) {
      warnings.push('Retry attempts is very high (>10)');
    }

    // API validation
    if (!configToValidate.api.geminiApiKey.trim()) {
      errors.push('Gemini API key is required');
    }
    if (configToValidate.api.geminiApiKey.length < 10) {
      warnings.push('Gemini API key seems too short');
    }

    if (!configToValidate.api.defaultModel.trim()) {
      errors.push('Default model name is required');
    }

    // UI validation
    if (!['light', 'dark'].includes(configToValidate.ui.theme)) {
      errors.push('Theme must be either "light" or "dark"');
    }

    // Logging validation
    if (!['debug', 'info', 'warn', 'error'].includes(configToValidate.logging.level)) {
      errors.push('Log level must be one of: debug, info, warn, error');
    }

    if (configToValidate.logging.maxLogs < 10) {
      errors.push('Max logs must be at least 10');
    }
    if (configToValidate.logging.maxLogs > 100000) {
      warnings.push('Max logs is very high (>100,000)');
    }

    if (configToValidate.logging.enableRemoteLogging && !configToValidate.logging.remoteEndpoint) {
      errors.push('Remote endpoint is required when remote logging is enabled');
    }

    if (configToValidate.logging.remoteEndpoint && !configToValidate.logging.remoteEndpoint.startsWith('http')) {
      warnings.push('Remote endpoint should use HTTP/HTTPS protocol');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Export configuration as JSON
   */
  export(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON with validation
   */
  import(jsonConfig: string): void {
    try {
      const parsedConfig = JSON.parse(jsonConfig) as AppConfig;
      const validation = this.validate(parsedConfig);
      
      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        console.warn('Configuration import warnings:', validation.warnings);
      }

      this.config = parsedConfig;
      this.notifyListeners();
    } catch (error) {
      throw new Error(`Failed to import configuration: ${(error as Error).message}`);
    }
  }

  /**
   * Get a specific configuration section
   */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return JSON.parse(JSON.stringify(this.config[key]));
  }

  /**
   * Set a specific configuration section
   */
  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.updateConfig({ [key]: value } as Partial<AppConfig>);
  }

  /**
   * Get configuration info for debugging (safe, no sensitive data)
   */
  getDebugInfo(): {
    hasApiKey: boolean;
    environment: Record<string, string>;
    validation: ValidationResult;
  } {
    return {
      hasApiKey: !!this.config.api.geminiApiKey,
      environment: EnvironmentLoader.getSafeEnvInfo(),
      validation: this.validate(),
    };
  }

  /**
   * Notify all configuration change listeners
   */
  private notifyListeners(): void {
    const configCopy = this.getConfig();
    this.listeners.forEach(listener => {
      try {
        listener(configCopy);
      } catch (error) {
        console.error('Error in config change listener:', error);
      }
    });
  }
} 