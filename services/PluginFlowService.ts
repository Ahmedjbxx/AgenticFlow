import { applicationCore } from '../core/ApplicationCore';
import { registerBuiltInPlugins } from '@agenticflow/nodes';
import { PluginBasedFlowExecutor } from '../core/execution/PluginBasedFlowExecutor';
import { FlowData, ExecutionLogEntry } from '../types';
import { generateText } from './geminiService';

/**
 * Service that manages the plugin-based flow system
 */
export class PluginFlowService {
  private static instance: PluginFlowService;
  private executor: PluginBasedFlowExecutor;
  private initialized: boolean = false;

  private constructor() {
    this.executor = new PluginBasedFlowExecutor(applicationCore);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PluginFlowService {
    if (!PluginFlowService.instance) {
      PluginFlowService.instance = new PluginFlowService();
    }
    return PluginFlowService.instance;
  }

  /**
   * Initialize the plugin system
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    applicationCore.logger.info('Initializing plugin flow service');

    try {
      // Register all built-in plugins
      registerBuiltInPlugins(applicationCore.nodeRegistry);
      
      // Validate all registered plugins
      const validationResults = applicationCore.nodeRegistry.validatePlugins();
      if (validationResults.length > 0) {
        applicationCore.logger.warn('Plugin validation issues found:', validationResults);
      }

      // Log registration stats
      const stats = applicationCore.nodeRegistry.getStats();
      applicationCore.logger.info('Plugin registration complete', stats);

      this.initialized = true;
      
      applicationCore.eventBus.emit('plugin.system.initialized', {
        totalPlugins: stats.total,
        enabledPlugins: stats.enabled,
        categories: stats.byCategory,
      });

    } catch (error) {
      applicationCore.logger.error('Failed to initialize plugin system', error);
      throw error;
    }
  }

  /**
   * Execute a flow using the plugin-based system
   */
  public async executeFlow(
    flow: FlowData,
    triggerInput: any,
    onLog: (logEntry: ExecutionLogEntry) => void
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Validate the flow first
    const validation = this.executor.validateFlow(flow);
    if (!validation.isValid) {
      const errorMessage = `Flow validation failed: ${validation.errors.join(', ')}`;
      applicationCore.logger.error(errorMessage);
      
      onLog({
        nodeId: 'System',
        nodeLabel: 'Flow Validation',
        status: 'error',
        message: errorMessage,
        timestamp: new Date(),
      });
      
      throw new Error(errorMessage);
    }

    // Execute the flow
    await this.executor.executeFlow(flow, triggerInput, onLog, generateText);
  }

  /**
   * Get information about available plugins
   */
  public getAvailablePlugins(): {
    type: string;
    name: string;
    description: string;
    category: string;
    version: string;
    enabled: boolean;
  }[] {
    return applicationCore.nodeRegistry.getAllPlugins().map(plugin => ({
      type: plugin.metadata.type,
      name: plugin.metadata.name,
      description: plugin.metadata.description,
      category: plugin.metadata.category,
      version: plugin.metadata.version,
      enabled: true, // All returned plugins are enabled
    }));
  }

  /**
   * Get plugins by category
   */
  public getPluginsByCategory(category: string): typeof this.getAvailablePlugins {
    return this.getAvailablePlugins().filter(plugin => plugin.category === category);
  }

  /**
   * Check if a plugin is available
   */
  public isPluginAvailable(type: string): boolean {
    return applicationCore.nodeRegistry.isRegistered(type);
  }

  /**
   * Get system health status
   */
  public getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    pluginSystem: boolean;
    totalPlugins: number;
    enabledPlugins: number;
    lastInitialized: boolean;
  } {
    const coreHealth = applicationCore.getHealthStatus();
    const registryStats = applicationCore.nodeRegistry.getStats();

    return {
      status: this.initialized ? coreHealth.status : 'unhealthy',
      pluginSystem: this.initialized,
      totalPlugins: registryStats.total,
      enabledPlugins: registryStats.enabled,
      lastInitialized: this.initialized,
    };
  }

  /**
   * Reinitialize the plugin system (useful for development/testing)
   */
  public async reinitialize(): Promise<void> {
    applicationCore.logger.info('Reinitializing plugin system');
    this.initialized = false;
    await this.initialize();
  }

  /**
   * Get the underlying executor (for advanced use cases)
   */
  public getExecutor(): PluginBasedFlowExecutor {
    return this.executor;
  }

  /**
   * Get the application core (for advanced use cases)
   */
  public getCore(): typeof applicationCore {
    return applicationCore;
  }
}

// Export singleton instance for convenience
export const pluginFlowService = PluginFlowService.getInstance(); 