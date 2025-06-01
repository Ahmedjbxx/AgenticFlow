import { ILogger } from '@agenticflow/core';
import { 
  NodePlugin, 
  NodePluginMetadata,
  NodePluginManager,
  PluginLoadResult 
} from '../index.js';

export interface NodeDiscoveryConfig {
  enableBuiltinNodes: boolean;
  enableCustomNodes: boolean;
  customNodePaths?: string[];
  nodeFilters?: NodeFilter[];
}

export interface NodeFilter {
  type: 'category' | 'author' | 'version' | 'tag';
  value: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'regex';
}

export interface DiscoveredNode {
  metadata: NodePluginMetadata;
  plugin: NodePlugin;
  source: 'builtin' | 'custom' | 'external';
  loadPath?: string;
}

export interface NodeDiscoveryResult {
  discovered: DiscoveredNode[];
  loaded: PluginLoadResult[];
  errors: Array<{
    source: string;
    error: string;
    details?: any;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    byCategory: Record<string, number>;
    bySource: Record<string, number>;
  };
}

/**
 * Handles dynamic discovery and loading of node plugins
 */
export class NodeDiscovery {
  private logger?: ILogger | undefined;
  private pluginManager: NodePluginManager;
  private config: NodeDiscoveryConfig;

  constructor(
    pluginManager: NodePluginManager,
    config: NodeDiscoveryConfig = { enableBuiltinNodes: true, enableCustomNodes: true },
    logger?: ILogger
  ) {
    this.pluginManager = pluginManager;
    this.config = config;
    this.logger = logger ? logger.child({ nodeId: 'node-discovery' }) : undefined;
  }

  /**
   * Discover and load all available nodes
   */
  async discoverAndLoadNodes(): Promise<NodeDiscoveryResult> {
    this.logger?.info('Starting node discovery and loading process', this.config);

    const result: NodeDiscoveryResult = {
      discovered: [],
      loaded: [],
      errors: [],
      summary: {
        total: 0,
        successful: 0,
        failed: 0,
        byCategory: {},
        bySource: {},
      },
    };

    try {
      // Discover builtin nodes
      if (this.config.enableBuiltinNodes) {
        await this.discoverBuiltinNodes(result);
      }

      // Discover custom nodes
      if (this.config.enableCustomNodes) {
        await this.discoverCustomNodes(result);
      }

      // Apply filters
      result.discovered = this.applyFilters(result.discovered);

      // Load discovered nodes into plugin manager
      result.loaded = this.loadDiscoveredNodes(result.discovered);

      // Generate summary
      this.generateSummary(result);

      this.logger?.info(`Node discovery completed`, {
        total: result.summary.total,
        successful: result.summary.successful,
        failed: result.summary.failed,
        byCategory: result.summary.byCategory,
      });

      return result;

    } catch (error) {
      this.logger?.error('Node discovery failed', error as Error);
      result.errors.push({
        source: 'discovery',
        error: `Discovery process failed: ${(error as Error).message}`,
        details: error,
      });
      return result;
    }
  }

  /**
   * Discover builtin nodes
   */
  private async discoverBuiltinNodes(result: NodeDiscoveryResult): Promise<void> {
    this.logger?.debug('Discovering builtin nodes');

    try {
      // Import builtin nodes dynamically with proper index.js path
      const builtinModule = await import('../builtin/index.js');
      
      for (const [exportName, NodeClass] of Object.entries(builtinModule)) {
        if (exportName.endsWith('Plugin') && typeof NodeClass === 'function') {
          try {
            const plugin = new (NodeClass as any)() as NodePlugin;
            
            if (plugin.metadata) {
              const discovered: DiscoveredNode = {
                metadata: plugin.metadata,
                plugin,
                source: 'builtin',
                loadPath: `builtin/${exportName}`,
              };

              result.discovered.push(discovered);
              this.logger?.debug(`Discovered builtin node: ${plugin.metadata.type}`, plugin.metadata);
            }
          } catch (error) {
            result.errors.push({
              source: `builtin/${exportName}`,
              error: `Failed to instantiate builtin node: ${(error as Error).message}`,
              details: error,
            });
          }
        }
      }

    } catch (error) {
      result.errors.push({
        source: 'builtin',
        error: `Failed to load builtin nodes: ${(error as Error).message}`,
        details: error,
      });
    }
  }

  /**
   * Discover custom nodes from specified paths
   */
  private async discoverCustomNodes(result: NodeDiscoveryResult): Promise<void> {
    this.logger?.debug('Discovering custom nodes', { paths: this.config.customNodePaths });

    if (!this.config.customNodePaths || this.config.customNodePaths.length === 0) {
      this.logger?.debug('No custom node paths specified, skipping');
      return;
    }

    // TODO: Implement custom node discovery from file system
    // This would involve:
    // 1. Scanning specified directories for node files
    // 2. Dynamically importing node modules
    // 3. Validating node plugin structure
    // 4. Creating plugin instances

    this.logger?.warn('Custom node discovery not yet implemented');
  }

  /**
   * Apply configured filters to discovered nodes
   */
  private applyFilters(discovered: DiscoveredNode[]): DiscoveredNode[] {
    if (!this.config.nodeFilters || this.config.nodeFilters.length === 0) {
      return discovered;
    }

    this.logger?.debug('Applying node filters', { filters: this.config.nodeFilters });

    return discovered.filter(node => {
      return this.config.nodeFilters!.every(filter => this.matchesFilter(node, filter));
    });
  }

  /**
   * Check if a node matches a specific filter
   */
  private matchesFilter(node: DiscoveredNode, filter: NodeFilter): boolean {
    let value: string;

    switch (filter.type) {
      case 'category':
        value = node.metadata.category;
        break;
      case 'author':
        value = node.metadata.author || '';
        break;
      case 'version':
        value = node.metadata.version;
        break;
      case 'tag':
        value = (node.metadata.tags || []).join(' ');
        break;
      default:
        return true;
    }

    switch (filter.operator) {
      case 'equals':
        return value === filter.value;
      case 'contains':
        return value.toLowerCase().includes(filter.value.toLowerCase());
      case 'startsWith':
        return value.toLowerCase().startsWith(filter.value.toLowerCase());
      case 'regex':
        try {
          return new RegExp(filter.value, 'i').test(value);
        } catch {
          return false;
        }
      default:
        return true;
    }
  }

  /**
   * Load discovered nodes into the plugin manager
   */
  private loadDiscoveredNodes(discovered: DiscoveredNode[]): PluginLoadResult[] {
    this.logger?.debug(`Loading ${discovered.length} discovered nodes`);

    const plugins = discovered.map(d => d.plugin);
    return this.pluginManager.registerPlugins(plugins);
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(result: NodeDiscoveryResult): void {
    result.summary.total = result.discovered.length;
    result.summary.successful = result.loaded.filter(r => r.success).length;
    result.summary.failed = result.loaded.filter(r => !r.success).length + result.errors.length;

    // Count by category
    result.discovered.forEach(node => {
      const category = node.metadata.category;
      result.summary.byCategory[category] = (result.summary.byCategory[category] || 0) + 1;
    });

    // Count by source
    result.discovered.forEach(node => {
      const source = node.source;
      result.summary.bySource[source] = (result.summary.bySource[source] || 0) + 1;
    });
  }

  /**
   * Get current discovery configuration
   */
  getConfig(): NodeDiscoveryConfig {
    return { ...this.config };
  }

  /**
   * Update discovery configuration
   */
  updateConfig(config: Partial<NodeDiscoveryConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger?.debug('Discovery configuration updated', this.config);
  }

  /**
   * Rediscover and reload nodes with current configuration
   */
  async refresh(): Promise<NodeDiscoveryResult> {
    this.logger?.info('Refreshing node discovery');
    return this.discoverAndLoadNodes();
  }

  /**
   * Get metadata for all discovered nodes without loading them
   */
  async getAvailableNodes(): Promise<NodePluginMetadata[]> {
    this.logger?.debug('Getting available node metadata');

    const tempResult: NodeDiscoveryResult = {
      discovered: [],
      loaded: [],
      errors: [],
      summary: { total: 0, successful: 0, failed: 0, byCategory: {}, bySource: {} },
    };

    // Discover without loading
    if (this.config.enableBuiltinNodes) {
      await this.discoverBuiltinNodes(tempResult);
    }

    if (this.config.enableCustomNodes) {
      await this.discoverCustomNodes(tempResult);
    }

    const filtered = this.applyFilters(tempResult.discovered);
    return filtered.map(node => node.metadata);
  }
} 