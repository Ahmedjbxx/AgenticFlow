import { NodePlugin, NodePluginRegistration, NodePluginMetadata } from '../../nodes/base/NodePlugin';
import { EventBus } from '../execution/ExecutionContext';
import { VariableRegistry } from '../variables/VariableRegistry';

export class NodeRegistry {
  private plugins = new Map<string, NodePluginRegistration>();
  private eventBus: EventBus;
  private variableRegistry?: VariableRegistry;

  constructor(eventBus: EventBus, variableRegistry?: VariableRegistry) {
    this.eventBus = eventBus;
    this.variableRegistry = variableRegistry;
  }

  /**
   * Set the variable registry (for dependency injection)
   */
  setVariableRegistry(variableRegistry: VariableRegistry): void {
    this.variableRegistry = variableRegistry;
  }

  /**
   * Register a new node plugin
   */
  register(plugin: NodePlugin): void {
    const { type } = plugin.metadata;
    
    if (this.plugins.has(type)) {
      throw new Error(`Node plugin with type '${type}' is already registered`);
    }

    const registration: NodePluginRegistration = {
      plugin,
      enabled: true,
      loadedAt: new Date(),
    };

    this.plugins.set(type, registration);
    
    // Register output schema with variable registry
    if (this.variableRegistry && typeof plugin.getOutputSchema === 'function') {
      try {
        const outputSchema = plugin.getOutputSchema();
        this.variableRegistry.registerNodeOutputSchema(type, outputSchema);
      } catch (error) {
        console.warn(`Failed to register output schema for plugin ${type}:`, error);
      }
    }
    
    this.eventBus.emit('node.plugin.registered', {
      type,
      metadata: plugin.metadata,
    });
  }

  /**
   * Unregister a node plugin
   */
  unregister(type: string): boolean {
    const removed = this.plugins.delete(type);
    
    if (removed) {
      this.eventBus.emit('node.plugin.unregistered', { type });
    }
    
    return removed;
  }

  /**
   * Get a specific node plugin
   */
  get(type: string): NodePlugin | undefined {
    const registration = this.plugins.get(type);
    return registration?.enabled ? registration.plugin : undefined;
  }

  /**
   * Get all registered node types
   */
  getAllTypes(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Get all enabled node plugins
   */
  getAllPlugins(): NodePlugin[] {
    return Array.from(this.plugins.values())
      .filter(reg => reg.enabled)
      .map(reg => reg.plugin);
  }

  /**
   * Get plugins by category
   */
  getPluginsByCategory(category: NodePluginMetadata['category']): NodePlugin[] {
    return this.getAllPlugins().filter(plugin => plugin.metadata.category === category);
  }

  /**
   * Enable/disable a plugin
   */
  setPluginEnabled(type: string, enabled: boolean): boolean {
    const registration = this.plugins.get(type);
    
    if (!registration) {
      return false;
    }

    registration.enabled = enabled;
    
    this.eventBus.emit('node.plugin.toggled', {
      type,
      enabled,
    });
    
    return true;
  }

  /**
   * Check if a plugin is registered
   */
  isRegistered(type: string): boolean {
    return this.plugins.has(type);
  }

  /**
   * Get plugin metadata without instantiating
   */
  getMetadata(type: string): NodePluginMetadata | undefined {
    const registration = this.plugins.get(type);
    return registration?.plugin.metadata;
  }

  /**
   * Validate all registered plugins
   */
  validatePlugins(): { type: string; errors: string[] }[] {
    const validationResults: { type: string; errors: string[] }[] = [];

    for (const [type, registration] of this.plugins) {
      const errors: string[] = [];
      const { plugin } = registration;

      // Check required metadata
      if (!plugin.metadata.name?.trim()) {
        errors.push('Plugin name is required');
      }
      
      if (!plugin.metadata.version?.trim()) {
        errors.push('Plugin version is required');
      }

      // Check required methods
      if (typeof plugin.createDefaultData !== 'function') {
        errors.push('createDefaultData method is required');
      }
      
      if (typeof plugin.execute !== 'function') {
        errors.push('execute method is required');
      }
      
      if (typeof plugin.renderEditor !== 'function') {
        errors.push('renderEditor method is required');
      }
      
      if (typeof plugin.renderNode !== 'function') {
        errors.push('renderNode method is required');
      }

      // Check variable system method
      if (typeof plugin.getOutputSchema !== 'function') {
        errors.push('getOutputSchema method is required');
      }

      if (errors.length > 0) {
        validationResults.push({ type, errors });
      }
    }

    return validationResults;
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    total: number;
    enabled: number;
    disabled: number;
    byCategory: Record<string, number>;
  } {
    const total = this.plugins.size;
    const enabled = Array.from(this.plugins.values()).filter(reg => reg.enabled).length;
    const disabled = total - enabled;

    const byCategory: Record<string, number> = {};
    for (const registration of this.plugins.values()) {
      const category = registration.plugin.metadata.category;
      byCategory[category] = (byCategory[category] || 0) + 1;
    }

    return {
      total,
      enabled,
      disabled,
      byCategory,
    };
  }
} 