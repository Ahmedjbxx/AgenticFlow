import { ILogger, EventBus } from '@agenticflow/core';
import { 
  NodePlugin, 
  NodePluginRegistration, 
  NodePluginMetadata,
  NodeValidationResult 
} from '../base/NodePlugin.js';

export interface PluginLoadResult {
  success: boolean;
  plugin?: NodePlugin | undefined;
  error?: string | undefined;
  metadata?: NodePluginMetadata | undefined;
}

export interface PluginManagerStats {
  totalPlugins: number;
  enabledPlugins: number;
  disabledPlugins: number;
  byCategory: Record<string, number>;
  averageExecutionTime: Record<string, number>;
}

/**
 * Manages the lifecycle and registration of node plugins
 */
export class NodePluginManager {
  private plugins: Map<string, NodePluginRegistration> = new Map();
  private logger?: ILogger | undefined;
  private eventBus?: EventBus | undefined;

  constructor(logger?: ILogger, eventBus?: EventBus) {
    this.logger = logger?.child({ nodeId: 'plugin-manager' });
    this.eventBus = eventBus;
  }

  /**
   * Register a node plugin
   */
  registerPlugin(plugin: NodePlugin): boolean {
    try {
      const metadata = plugin.metadata;
      
      // Validate plugin metadata
      const validation = this.validatePluginMetadata(metadata);
      if (!validation.isValid) {
        this.logger?.error(`Plugin registration failed: ${metadata.type}`, undefined, {
          errors: validation.errors,
          warnings: validation.warnings,
        });
        return false;
      }

      // Check for conflicts
      if (this.plugins.has(metadata.type)) {
        this.logger?.warn(`Plugin ${metadata.type} is already registered, overriding`);
      }

      // Initialize plugin with logger
      plugin.initialize(this.logger);

      // Register the plugin
      const registration: NodePluginRegistration = {
        plugin,
        enabled: true,
        loadedAt: new Date(),
        metadata,
        version: metadata.version,
      };

      this.plugins.set(metadata.type, registration);

      this.logger?.info(`Plugin registered successfully: ${metadata.type}`, {
        name: metadata.name,
        version: metadata.version,
        category: metadata.category,
      });

      this.eventBus?.emit('node.plugin.registered', {
        type: metadata.type,
        metadata,
        timestamp: Date.now(),
      });

      return true;
    } catch (error) {
      this.logger?.error(`Failed to register plugin: ${plugin.metadata?.type || 'unknown'}`, error as Error);
      return false;
    }
  }

  /**
   * Unregister a node plugin
   */
  unregisterPlugin(type: string): boolean {
    const registration = this.plugins.get(type);
    if (!registration) {
      this.logger?.warn(`Cannot unregister plugin ${type}: not found`);
      return false;
    }

    try {
      // Cleanup plugin
      registration.plugin.destroy();
      
      // Remove from registry
      this.plugins.delete(type);

      this.logger?.info(`Plugin unregistered: ${type}`);

      this.eventBus?.emit('node.plugin.unregistered', {
        type,
        timestamp: Date.now(),
      });

      return true;
    } catch (error) {
      this.logger?.error(`Failed to unregister plugin: ${type}`, error as Error);
      return false;
    }
  }

  /**
   * Enable/disable a plugin
   */
  togglePlugin(type: string, enabled: boolean): boolean {
    const registration = this.plugins.get(type);
    if (!registration) {
      this.logger?.warn(`Cannot toggle plugin ${type}: not found`);
      return false;
    }

    registration.enabled = enabled;

    this.logger?.info(`Plugin ${type} ${enabled ? 'enabled' : 'disabled'}`);

    this.eventBus?.emit('node.plugin.toggled', {
      type,
      enabled,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Get a plugin by type
   */
  getPlugin(type: string): NodePlugin | undefined {
    const registration = this.plugins.get(type);
    return registration?.enabled ? registration.plugin : undefined;
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): NodePluginRegistration[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): NodePluginRegistration[] {
    return Array.from(this.plugins.values()).filter(reg => reg.enabled);
  }

  /**
   * Get plugins by category
   */
  getPluginsByCategory(category: string): NodePluginRegistration[] {
    return Array.from(this.plugins.values()).filter(
      reg => reg.metadata.category === category && reg.enabled
    );
  }

  /**
   * Search plugins by name or description
   */
  searchPlugins(query: string): NodePluginRegistration[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.plugins.values()).filter(reg => {
      if (!reg.enabled) return false;
      
      const metadata = reg.metadata;
      return (
        metadata.name.toLowerCase().includes(lowerQuery) ||
        metadata.description.toLowerCase().includes(lowerQuery) ||
        metadata.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        metadata.type.toLowerCase().includes(lowerQuery)
      );
    });
  }

  /**
   * Get plugin registry statistics
   */
  getStats(): PluginManagerStats {
    const plugins = Array.from(this.plugins.values());
    const enabled = plugins.filter(p => p.enabled);
    
    const byCategory: Record<string, number> = {};
    const averageExecutionTime: Record<string, number> = {};

    for (const registration of enabled) {
      const category = registration.metadata.category;
      byCategory[category] = (byCategory[category] || 0) + 1;
      
      // Get average execution time for this plugin
      const avgTime = registration.plugin.getAverageExecutionTime();
      if (avgTime > 0) {
        averageExecutionTime[registration.metadata.type] = avgTime;
      }
    }

    return {
      totalPlugins: plugins.length,
      enabledPlugins: enabled.length,
      disabledPlugins: plugins.length - enabled.length,
      byCategory,
      averageExecutionTime,
    };
  }

  /**
   * Validate plugin metadata
   */
  private validatePluginMetadata(metadata: NodePluginMetadata): NodeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!metadata.type?.trim()) {
      errors.push('Plugin type is required');
    }
    if (!metadata.name?.trim()) {
      errors.push('Plugin name is required');
    }
    if (!metadata.description?.trim()) {
      errors.push('Plugin description is required');
    }
    if (!metadata.version?.trim()) {
      errors.push('Plugin version is required');
    }

    // Category validation
    const validCategories = ['trigger', 'action', 'condition', 'transform', 'utility'];
    if (!validCategories.includes(metadata.category)) {
      errors.push(`Invalid category: ${metadata.category}. Must be one of: ${validCategories.join(', ')}`);
    }

    // Version format check
    if (metadata.version && !/^\d+\.\d+\.\d+/.test(metadata.version)) {
      warnings.push('Version should follow semantic versioning format (x.y.z)');
    }

    // Icon and color validation
    if (!metadata.icon?.trim()) {
      warnings.push('Plugin icon is recommended for better UX');
    }
    if (!metadata.color?.trim()) {
      warnings.push('Plugin color is recommended for better UX');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Bulk register plugins from a collection
   */
  registerPlugins(plugins: NodePlugin[]): PluginLoadResult[] {
    const results: PluginLoadResult[] = [];

    for (const plugin of plugins) {
      try {
        const success = this.registerPlugin(plugin);
        if (success) {
          results.push({
            success: true,
            plugin,
            metadata: plugin.metadata,
          });
        } else {
          results.push({
            success: false,
            metadata: plugin.metadata,
            error: 'Registration failed',
          });
        }
      } catch (error) {
        results.push({
          success: false,
          error: (error as Error).message,
          metadata: plugin.metadata,
        });
      }
    }

    this.logger?.info(`Bulk registration completed`, {
      total: plugins.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    });

    return results;
  }

  /**
   * Validate all registered plugins
   */
  validateAllPlugins(): Record<string, NodeValidationResult> {
    const results: Record<string, NodeValidationResult> = {};

    for (const [type, registration] of this.plugins) {
      try {
        // Create default data to test validation
        const defaultData = registration.plugin.createDefaultData();
        results[type] = registration.plugin.validate(defaultData);
      } catch (error) {
        results[type] = {
          isValid: false,
          errors: [`Validation failed: ${(error as Error).message}`],
          warnings: [],
        };
      }
    }

    return results;
  }

  /**
   * Get plugin information for debugging
   */
  getPluginInfo(type: string): any {
    const registration = this.plugins.get(type);
    if (!registration) return null;

    return {
      metadata: registration.metadata,
      enabled: registration.enabled,
      loadedAt: registration.loadedAt,
      executionMetrics: registration.plugin.getExecutionMetrics(),
      averageExecutionTime: registration.plugin.getAverageExecutionTime(),
    };
  }

  /**
   * Cleanup all plugins
   */
  destroy(): void {
    this.logger?.info('Destroying plugin manager');

    for (const [type, registration] of this.plugins) {
      try {
        registration.plugin.destroy();
      } catch (error) {
        this.logger?.error(`Error destroying plugin ${type}`, error as Error);
      }
    }

    this.plugins.clear();
    this.logger?.info('Plugin manager destroyed');
  }
} 