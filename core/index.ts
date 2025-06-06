// Core application exports - re-export from new packages to maintain compatibility
export { ApplicationCore, applicationCore } from '../packages/core/src/ApplicationCore';

// Execution context and interfaces
export type { ExecutionContext, AppConfig } from './execution/ExecutionContext';

// Registry system - re-export from packages for compatibility
export { NodeRegistry } from '../packages/core/src/registry/NodeRegistry';

// Event system - re-export from packages to avoid duplicates
export { EventBus, type IEventBus } from '../packages/core/src/events/EventBus';

// Logging system - re-export from packages to avoid duplicates  
export { Logger, ConfigurableLogger, LoggerFactory, type ILogger, type LogLevel, type LogEntry } from '../packages/core/src/logging/Logger';

// Base node plugin system
export { NodePlugin, NodePluginMetadata, NodePluginRegistration } from '@agenticflow/nodes';

// Configuration system
export { ConfigManager, configManager, createConfig, validateConfig } from '../config/AppConfig'; 