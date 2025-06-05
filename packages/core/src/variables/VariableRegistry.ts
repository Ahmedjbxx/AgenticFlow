import { FlowData, CustomNode } from '@agenticflow/types';

import type { IEventBus } from '../events/EventBus';

import { VariableDefinition, DynamicVariableDefinition, NestedVariableExtractor } from './NestedVariableExtractor';

// Re-export VariableDefinition for external use
export type { VariableDefinition } from './NestedVariableExtractor';

export interface NodeOutputSchema {
  nodeType: string;
  variables: VariableDefinition[];
}

export interface AvailableVariable {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  variableName: string;
  variableType: string;
  description: string;
  fullPath: string; // e.g., "node_123.llmText" or "node_123.responseData.user.name"
  example?: any;
  isNested?: boolean; // true for runtime-extracted nested variables
  depth?: number; // nesting depth for nested variables
  actualValue?: any; // for runtime variables
  extractedAt?: number; // timestamp for freshness tracking
}

/**
 * Manages variable definitions and flow analysis for data mapping
 */
export class VariableRegistry {
  private nodeOutputSchemas = new Map<string, NodeOutputSchema>();
  private runtimeVariables = new Map<string, DynamicVariableDefinition[]>(); // nodeId -> variables
  private variableExtractor = new NestedVariableExtractor();
  private eventBus: IEventBus;

  constructor(eventBus: IEventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Register output schema for a node type
   */
  registerNodeOutputSchema(nodeType: string, variables: VariableDefinition[]): void {
    this.nodeOutputSchemas.set(nodeType, {
      nodeType,
      variables,
    });

    this.eventBus.emit('variables.schema.registered', {
      nodeType,
      variableCount: variables.length,
    });
  }

  /**
   * Register runtime variables extracted from actual node output
   */
  registerRuntimeVariables(nodeId: string, outputData: any): void {
    if (!outputData || typeof outputData !== 'object') {
      this.runtimeVariables.delete(nodeId);
      return;
    }

    try {
      // Extract nested variables from the actual output data
      const extractedVariables = this.variableExtractor.extractVariables(
        outputData,
        nodeId
      );

      // Store the extracted variables
      this.runtimeVariables.set(nodeId, extractedVariables);

      this.eventBus.emit('variables.runtime.registered', {
        nodeId,
        variableCount: extractedVariables.length,
        extractedAt: Date.now(),
      });

      console.log(`🔄 Registered ${extractedVariables.length} runtime variables for node ${nodeId}`);
    } catch (error) {
      console.warn(`Failed to extract runtime variables for node ${nodeId}:`, error);
      this.runtimeVariables.delete(nodeId);
    }
  }

  /**
   * Get runtime variables for a specific node
   */
  getRuntimeVariables(nodeId: string): DynamicVariableDefinition[] {
    return this.runtimeVariables.get(nodeId) || [];
  }

  /**
   * Remove runtime variables when a node is deleted or disconnected
   */
  invalidateRuntimeVariables(nodeId: string): void {
    const wasPresent = this.runtimeVariables.has(nodeId);
    this.runtimeVariables.delete(nodeId);

    if (wasPresent) {
      this.eventBus.emit('variables.runtime.invalidated', { nodeId });
      console.log(`🗑️ Invalidated runtime variables for node ${nodeId}`);
    }
  }

  /**
   * Clear all runtime variables (useful for flow reset)
   */
  clearAllRuntimeVariables(): void {
    const nodeCount = this.runtimeVariables.size;
    this.runtimeVariables.clear();
    
    if (nodeCount > 0) {
      this.eventBus.emit('variables.runtime.cleared', { clearedNodeCount: nodeCount });
      console.log(`🧹 Cleared runtime variables for ${nodeCount} nodes`);
    }
  }

  /**
   * Get output schema for a node type
   */
  getNodeOutputSchema(nodeType: string): NodeOutputSchema | undefined {
    return this.nodeOutputSchemas.get(nodeType);
  }

  /**
   * Analyze flow to get available variables for a specific node
   * Now includes both static schema variables AND runtime extracted variables
   */
  getAvailableVariablesForNode(
    targetNodeId: string,
    flow: FlowData
  ): AvailableVariable[] {
    const availableVariables: AvailableVariable[] = [];
    
    // Find all nodes that can reach the target node
    const reachableNodes = this.findReachableNodes(targetNodeId, flow);

    for (const node of reachableNodes) {
      // Ensure node has a valid type
      if (!node.type) continue;
      
      // Add static schema variables
      const schema = this.nodeOutputSchemas.get(node.type);
      if (schema) {
        for (const variable of schema.variables) {
          availableVariables.push({
            nodeId: node.id,
            nodeLabel: node.data.label || node.id,
            nodeType: node.type,
            variableName: variable.name,
            variableType: variable.type,
            description: variable.description,
            fullPath: `${node.id}.${variable.name}`,
            example: variable.example,
            isNested: false,
          });
        }
      }

      // Add runtime extracted variables (nested variables)
      const runtimeVars = this.getRuntimeVariables(node.id);
      for (const runtimeVar of runtimeVars) {
        availableVariables.push({
          nodeId: node.id,
          nodeLabel: node.data.label || node.id,
          nodeType: node.type,
          variableName: runtimeVar.path, // Use the full path as variable name for nested
          variableType: runtimeVar.type,
          description: runtimeVar.description,
          fullPath: runtimeVar.fullPath,
          example: runtimeVar.example,
          isNested: true,
          depth: runtimeVar.depth,
          actualValue: runtimeVar.actualValue,
          extractedAt: runtimeVar.extractedAt,
        });
      }
    }

    return availableVariables;
  }

  /**
   * Find all nodes that can reach the target node (are upstream)
   */
  private findReachableNodes(targetNodeId: string, flow: FlowData): CustomNode[] {
    const reachableNodes: CustomNode[] = [];
    const visited = new Set<string>();
    
    const findUpstreamNodes = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      // Find edges that lead to this node
      const incomingEdges = flow.edges.filter(edge => edge.target === nodeId);
      
      for (const edge of incomingEdges) {
        const sourceNode = flow.nodes.find(node => node.id === edge.source);
        if (sourceNode && !reachableNodes.find(n => n.id === sourceNode.id)) {
          reachableNodes.push(sourceNode);
        }
        
        // Recursively find upstream nodes
        findUpstreamNodes(edge.source);
      }
    };

    findUpstreamNodes(targetNodeId);
    return reachableNodes;
  }

  /**
   * Get all registered node types and their schemas
   */
  getAllNodeSchemas(): NodeOutputSchema[] {
    return Array.from(this.nodeOutputSchemas.values());
  }

  /**
   * Enhanced parsing for complex variable references including nested paths
   * Now supports: {nodeId.path}, {nodeId.object.property}, {nodeId.array[0]}, {nodeId["special-key"]}
   */
  parseVariableReferences(text: string): Array<{
    match: string;
    nodeId: string;
    variableName: string;
    fullPath: string;
  }> {
    // Enhanced regex to support complex nested paths
    const variableRegex = /\{([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_".-]+)\}/g;
    const references: Array<{
      match: string;
      nodeId: string;
      variableName: string;
      fullPath: string;
    }> = [];

    let match;
    while ((match = variableRegex.exec(text)) !== null) {
      if (match[1] && match[2]) { // Ensure both groups are captured
        references.push({
          match: match[0],
          nodeId: match[1],
          variableName: match[2], // This now includes the full path after the first dot
          fullPath: `${match[1]}.${match[2]}`,
        });
      }
    }

    return references;
  }

  /**
   * Validate variable references in flow
   */
  validateVariableReferences(
    text: string,
    availableVariables: AvailableVariable[]
  ): Array<{
    reference: string;
    isValid: boolean;
    error?: string | undefined;
  }> {
    const references = this.parseVariableReferences(text);
    const availablePaths = new Set(availableVariables.map(v => v.fullPath));

    return references.map(ref => {
      const isValid = availablePaths.has(ref.fullPath);
      return {
        reference: ref.match,
        isValid,
        error: isValid ? undefined : `Variable "${ref.fullPath}" is not available or has not been executed yet`,
      };
    });
  }

  /**
   * Get variable suggestions for autocomplete with enhanced search
   */
  getVariableSuggestions(
    targetNodeId: string,
    flow: FlowData,
    searchTerm: string = ''
  ): AvailableVariable[] {
    const availableVariables = this.getAvailableVariablesForNode(targetNodeId, flow);
    
    if (!searchTerm) {
      return availableVariables.sort(this.sortVariables);
    }

    const term = searchTerm.toLowerCase();
    return availableVariables
      .filter(variable =>
        variable.variableName.toLowerCase().includes(term) ||
        variable.nodeLabel.toLowerCase().includes(term) ||
        variable.description.toLowerCase().includes(term) ||
        variable.fullPath.toLowerCase().includes(term)
      )
      .sort(this.sortVariables);
  }

  /**
   * Sort variables by relevance: static first, then by depth, then alphabetically
   */
  private sortVariables = (a: AvailableVariable, b: AvailableVariable): number => {
    // Static variables first
    if (!a.isNested && b.isNested) return -1;
    if (a.isNested && !b.isNested) return 1;

    // For nested variables, sort by depth (shallow first)
    if (a.isNested && b.isNested) {
      const depthDiff = (a.depth || 0) - (b.depth || 0);
      if (depthDiff !== 0) return depthDiff;
    }

    // Then alphabetically by full path
    return a.fullPath.localeCompare(b.fullPath);
  };

  /**
   * Get statistics about the variable registry
   */
  getRegistryStats() {
    const schemaCount = this.nodeOutputSchemas.size;
    const runtimeNodeCount = this.runtimeVariables.size;
    const totalRuntimeVariables = Array.from(this.runtimeVariables.values())
      .reduce((sum, vars) => sum + vars.length, 0);

    return {
      registeredSchemas: schemaCount,
      nodesWithRuntimeVariables: runtimeNodeCount,
      totalRuntimeVariables,
      extractorStats: this.variableExtractor.getStats(),
    };
  }

  /**
   * Check if runtime variables for a node are fresh (within time limit)
   */
  areRuntimeVariablesFresh(nodeId: string, maxAgeMs: number = 60000): boolean {
    const runtimeVars = this.getRuntimeVariables(nodeId);
    if (runtimeVars.length === 0) return false;

    const now = Date.now();
    const extractedAt = runtimeVars[0]?.extractedAt || 0;
    return (now - extractedAt) < maxAgeMs;
  }
} 