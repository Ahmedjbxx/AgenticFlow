// Core ApplicationCore
export { ApplicationCore } from './ApplicationCore';

// Event system
export { EventBus, type IEventBus } from './events/EventBus';

// Logging system
export { Logger, type ILogger, type LogLevel, type LogEntry } from './logging/Logger';

// Execution context
export { type ExecutionContext, type AppConfig } from './execution/ExecutionContext';

// Variable system
export { 
  VariableRegistry, 
  type VariableDefinition, 
  type NodeOutputSchema, 
  type AvailableVariable 
} from './variables/VariableRegistry';

export { 
  NestedVariableExtractor, 
  type DynamicVariableDefinition, 
  type ExtractionOptions 
} from './variables/NestedVariableExtractor';

// Node registry
export { 
  NodeRegistry, 
  type NodePlugin, 
  type NodePluginMetadata, 
  type NodePluginRegistration 
} from './registry/NodeRegistry'; 