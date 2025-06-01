import { NodeRegistry } from './registry/NodeRegistry';
import { EventBus } from './events/EventBus';
import { Logger } from './logging/Logger';
import { configManager } from '../config/AppConfig';
import { ExecutionContext } from './execution/ExecutionContext';
import { registerBuiltInPlugins } from '../nodes/builtin';
import { VariableRegistry } from './variables/VariableRegistry';

/**
 * Main application core that orchestrates all services
 */
export class ApplicationCore {
  private static instance: ApplicationCore;
  
  public readonly eventBus: EventBus;
  public readonly logger: Logger;
  public readonly nodeRegistry: NodeRegistry;
  public readonly variableRegistry: VariableRegistry;
  
  private constructor() {
    // Initialize core services
    this.eventBus = new EventBus();
    this.logger = new Logger('debug', 1000);
    this.variableRegistry = new VariableRegistry(this.eventBus);
    this.nodeRegistry = new NodeRegistry(this.eventBus, this.variableRegistry);
    
    this.setupEventListeners();
    this.initializePlugins();
    this.logger.info('Application core initialized');
  }

  /**
   * Initialize built-in plugins
   */
  private initializePlugins(): void {
    try {
      this.logger.info('Registering built-in plugins...');
      registerBuiltInPlugins(this.nodeRegistry);
      
      const stats = this.nodeRegistry.getStats();
      this.logger.info(`Built-in plugins registered successfully`, stats);
      
      this.eventBus.emit('plugins.initialized', {
        totalPlugins: stats.total,
        enabledPlugins: stats.enabled,
        categories: stats.byCategory,
      });
    } catch (error) {
      this.logger.error('Failed to register built-in plugins', error as Error);
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ApplicationCore {
    if (!ApplicationCore.instance) {
      ApplicationCore.instance = new ApplicationCore();
    }
    return ApplicationCore.instance;
  }

  /**
   * Setup global event listeners
   */
  private setupEventListeners(): void {
    // Log all node plugin events
    this.eventBus.on('node.plugin.registered', (data: any) => {
      this.logger.info(`Node plugin registered: ${data.type}`, data.metadata);
    });

    this.eventBus.on('node.plugin.unregistered', (data: any) => {
      this.logger.info(`Node plugin unregistered: ${data.type}`);
    });

    this.eventBus.on('node.plugin.toggled', (data: any) => {
      this.logger.info(`Node plugin ${data.enabled ? 'enabled' : 'disabled'}: ${data.type}`);
    });

    // Log execution events
    this.eventBus.on('flow.execution.started', (data: any) => {
      this.logger.info(`Flow execution started: ${data.flowId}`, data);
    });

    this.eventBus.on('flow.execution.completed', (data: any) => {
      this.logger.info(`Flow execution completed: ${data.flowId}`, data);
    });

    this.eventBus.on('flow.execution.failed', (data: any) => {
      this.logger.error(`Flow execution failed: ${data.flowId}`, data.error, data);
    });

    this.eventBus.on('node.execution.started', (data: any) => {
      this.logger.debug(`Node execution started: ${data.nodeId}`, data);
    });

    this.eventBus.on('node.execution.completed', (data: any) => {
      this.logger.debug(`Node execution completed: ${data.nodeId}`, data);
    });

    this.eventBus.on('node.execution.failed', (data: any) => {
      this.logger.error(`Node execution failed: ${data.nodeId}`, data.error, data);
    });

    // Log UI errors
    this.eventBus.on('node.ui.error', (data: any) => {
      this.logger.error(`Node UI error: ${data.nodeId}`, data.error, data);
    });

    // Configuration changes
    configManager.onChange((config) => {
      this.logger.info('Configuration updated', config);
      
      // Update logger level based on debug mode
      if (config.ui.debugMode) {
        this.logger.setMinLevel('debug');
      } else {
        this.logger.setMinLevel('info');
      }
    });
  }

  /**
   * Create execution context for node execution
   */
  public createExecutionContext(params: {
    flowId: string;
    nodeId: string;
    executionId: string;
    input: any;
    metadata: {
      retryCount: number;
      totalNodes: number;
      currentNodeIndex: number;
    };
  }): ExecutionContext {
    const nodeOutputs = new Map<string, any>();

    return {
      flowId: params.flowId,
      nodeId: params.nodeId,
      executionId: params.executionId,
      input: params.input,
      metadata: {
        timestamp: new Date(),
        ...params.metadata,
      },
      services: {
        logger: this.logger.child({
          flowId: params.flowId,
          nodeId: params.nodeId,
          executionId: params.executionId,
        }),
        eventBus: this.eventBus,
        config: configManager.getConfig(),
      },
      replaceVariables: (template: string, variables: any) => {
        return this.replaceVariables(template, variables);
      },
      evaluateExpression: (expression: string, data: any) => {
        // Simple expression evaluation - in production, use a safer eval alternative
        try {
          // Create a safe context with the input data
          const contextKeys = Object.keys(data);
          const contextValues = Object.values(data);
          const func = new Function(...contextKeys, `return ${expression}`);
          return func(...contextValues);
        } catch (error) {
          this.logger.error(`Expression evaluation failed: ${expression}`, error as Error);
          return undefined;
        }
      },
      getNodeOutput: (nodeId: string) => {
        return nodeOutputs.get(nodeId);
      },
      setNodeOutput: (nodeId: string, output: any) => {
        nodeOutputs.set(nodeId, output);
        
        // ✨ PHASE 4: Auto-extract runtime variables from node output
        if (output && typeof output === 'object') {
          this.variableRegistry.registerRuntimeVariables(nodeId, output);
          
          this.eventBus.emit('node.output.processed', {
            nodeId,
            hasOutput: !!output,
            outputType: typeof output,
            timestamp: Date.now(),
          });
        } else {
          // Clear runtime variables if output is not an object
          this.variableRegistry.invalidateRuntimeVariables(nodeId);
        }
      },
    };
  }

  /**
   * Enhanced variable replacement that supports node output references
   */
  private replaceVariables(template: string, variables: any): string {
    if (!variables || typeof variables !== 'object') {
      return template;
    }

    return template.replace(/\{([^}]+)\}/g, (match, path) => {
      // Handle node output references (e.g., {node_123.llmText})
      if (path.includes('.')) {
        const [nodeId, variableName] = path.split('.', 2);
        
        // Check if this is a node output reference
        if (variables.nodeOutputs && variables.nodeOutputs[nodeId]) {
          const nodeOutput = variables.nodeOutputs[nodeId];
          if (nodeOutput && typeof nodeOutput === 'object' && variableName in nodeOutput) {
            return String(nodeOutput[variableName]);
          }
        }
      }

      // ✨ Enhanced nested path resolution for flat input structures
      const keys = path.split('.');
      let value = variables;
      
      // ✨ CRITICAL FIX: Handle node ID prefixed paths
      // If first key looks like a node ID and doesn't exist, try without the node ID prefix
      if (keys.length > 1 && keys[0].includes('-') && !(keys[0] in variables)) {
        // Try resolving the path without the node ID prefix
        const pathWithoutNodeId = keys.slice(1);
        let valueWithoutPrefix = variables;
        
        for (let i = 0; i < pathWithoutNodeId.length; i++) {
          const key = pathWithoutNodeId[i];
          
          if (valueWithoutPrefix && typeof valueWithoutPrefix === 'object') {
            if (key in valueWithoutPrefix) {
              valueWithoutPrefix = valueWithoutPrefix[key];
            } else {
              break; // Exit early, will fall back to original path
            }
          } else {
            break; // Not an object, can't traverse further
          }
        }
        
        // If we successfully resolved the path without node ID, return it
        if (pathWithoutNodeId.length > 0 && valueWithoutPrefix !== variables) {
          return String(valueWithoutPrefix);
        }
      }
      
      // Original path resolution logic (fallback)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        
        if (value && typeof value === 'object') {
          // Handle array access with [index] notation
          if (key.includes('[') && key.includes(']')) {
            const arrayMatch = key.match(/^([^[]+)\[(\d+)\]$/);
            if (arrayMatch) {
              const [, arrayKey, indexStr] = arrayMatch;
              const index = parseInt(indexStr, 10);
              if (arrayKey in value && Array.isArray(value[arrayKey]) && index < value[arrayKey].length) {
                value = value[arrayKey][index];
                continue;
              } else {
                return match; // Array access failed
              }
            }
          }
          
          // Handle special keys with bracket notation like ["special-key"]
          if (key.startsWith('"') && key.endsWith('"')) {
            const specialKey = key.slice(1, -1); // Remove quotes
            if (specialKey in value) {
              value = value[specialKey];
              continue;
            } else {
              return match; // Special key not found
            }
          }
          
          // Regular object property access
          if (key in value) {
            value = value[key];
          } else {
            return match; // Key not found, keep original
          }
        } else {
          return match; // Not an object, can't traverse further
        }
      }
      
      return String(value);
    });
  }

  /**
   * Shutdown the application core
   */
  public shutdown(): void {
    this.logger.info('Application core shutting down');
    this.eventBus.removeAllListeners();
  }

  /**
   * Get system health status
   */
  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      eventBus: boolean;
      logger: boolean;
      nodeRegistry: boolean;
      config: boolean;
    };
    stats: {
      registeredNodes: number;
      eventListeners: number;
      logEntries: number;
    };
  } {
    const registryStats = this.nodeRegistry.getStats();
    const logStats = this.logger.getStats();
    
    return {
      status: 'healthy', // TODO: Implement actual health checks
      services: {
        eventBus: true,
        logger: true,
        nodeRegistry: true,
        config: true,
      },
      stats: {
        registeredNodes: registryStats.total,
        eventListeners: this.eventBus.eventNames().length,
        logEntries: Object.values(logStats).reduce((a, b) => a + b, 0),
      },
    };
  }
}

// Export singleton instance for convenience
export const applicationCore = ApplicationCore.getInstance(); 