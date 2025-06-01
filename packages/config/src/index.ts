import { ConfigManager } from './ConfigManager';
import type { AppConfig, ValidationResult, ConfigChangeListener, IConfigManager } from './types';

// Re-export types
export type {
  AppConfig,
  ValidationResult,
  ConfigChangeListener,
  IConfigManager,
} from './types';

export {
  ENV_KEYS,
  DEFAULT_CONFIG,
} from './types';

// Export classes
export { ConfigManager } from './ConfigManager';
export { EnvironmentLoader } from './environment';

// Create and export singleton config manager
export const configManager = new ConfigManager();

// Convenience functions
export const getConfig = () => configManager.getConfig();
export const updateConfig = (updates: Partial<AppConfig>) => configManager.updateConfig(updates);
export const onConfigChange = (listener: ConfigChangeListener) => configManager.onChange(listener);
export const validateConfig = (config?: AppConfig) => configManager.validate(config);

// Development and debugging helpers
export const getConfigDebugInfo = () => configManager.getDebugInfo();
export const resetConfig = () => configManager.reset(); 