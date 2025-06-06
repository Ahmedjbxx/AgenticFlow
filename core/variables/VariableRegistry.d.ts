import { FlowData } from '../../types';
import { EventBus } from '../events/EventBus';
import { DynamicVariableDefinition } from './NestedVariableExtractor';
export interface VariableDefinition {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    example?: any;
}
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
    fullPath: string;
    example?: any;
    isNested?: boolean;
    depth?: number;
    actualValue?: any;
    extractedAt?: number;
}
/**
 * Manages variable definitions and flow analysis for data mapping
 */
export declare class VariableRegistry {
    private nodeOutputSchemas;
    private runtimeVariables;
    private variableExtractor;
    private eventBus;
    constructor(eventBus: EventBus);
    /**
     * Register output schema for a node type
     */
    registerNodeOutputSchema(nodeType: string, variables: VariableDefinition[]): void;
    /**
     * Register runtime variables extracted from actual node output
     */
    registerRuntimeVariables(nodeId: string, outputData: any): void;
    /**
     * Get runtime variables for a specific node
     */
    getRuntimeVariables(nodeId: string): DynamicVariableDefinition[];
    /**
     * Remove runtime variables when a node is deleted or disconnected
     */
    invalidateRuntimeVariables(nodeId: string): void;
    /**
     * Clear all runtime variables (useful for flow reset)
     */
    clearAllRuntimeVariables(): void;
    /**
     * Get output schema for a node type
     */
    getNodeOutputSchema(nodeType: string): NodeOutputSchema | undefined;
    /**
     * Analyze flow to get available variables for a specific node
     * Now includes both static schema variables AND runtime extracted variables
     */
    getAvailableVariablesForNode(targetNodeId: string, flow: FlowData): AvailableVariable[];
    /**
     * Find all nodes that can reach the target node (are upstream)
     */
    private findReachableNodes;
    /**
     * Get all registered node types and their schemas
     */
    getAllNodeSchemas(): NodeOutputSchema[];
    /**
     * Enhanced parsing for complex variable references including nested paths
     * Now supports: {nodeId.path}, {nodeId.object.property}, {nodeId.array[0]}, {nodeId["special-key"]}
     */
    parseVariableReferences(text: string): Array<{
        match: string;
        nodeId: string;
        variableName: string;
        fullPath: string;
    }>;
    /**
     * Validate variable references in flow
     */
    validateVariableReferences(text: string, availableVariables: AvailableVariable[]): Array<{
        reference: string;
        isValid: boolean;
        error?: string;
    }>;
    /**
     * Get variable suggestions for autocomplete with enhanced search
     */
    getVariableSuggestions(targetNodeId: string, flow: FlowData, searchTerm?: string): AvailableVariable[];
    /**
     * Sort variables by relevance: static first, then by depth, then alphabetically
     */
    private sortVariables;
    /**
     * Get statistics about the variable registry
     */
    getRegistryStats(): {
        registeredSchemas: number;
        nodesWithRuntimeVariables: number;
        totalRuntimeVariables: number;
        extractorStats: {
            extractedCount: number;
            visitedObjects: number;
            options: Required<import("./NestedVariableExtractor").ExtractionOptions>;
        };
    };
    /**
     * Check if runtime variables for a node are fresh (within time limit)
     */
    areRuntimeVariablesFresh(nodeId: string, maxAgeMs?: number): boolean;
}
//# sourceMappingURL=VariableRegistry.d.ts.map