import { NestedVariableExtractor } from './NestedVariableExtractor';
/**
 * Manages variable definitions and flow analysis for data mapping
 */
export class VariableRegistry {
    nodeOutputSchemas = new Map();
    runtimeVariables = new Map(); // nodeId -> variables
    variableExtractor = new NestedVariableExtractor();
    eventBus;
    constructor(eventBus) {
        this.eventBus = eventBus;
    }
    /**
     * Register output schema for a node type
     */
    registerNodeOutputSchema(nodeType, variables) {
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
    registerRuntimeVariables(nodeId, outputData) {
        if (!outputData || typeof outputData !== 'object') {
            this.runtimeVariables.delete(nodeId);
            return;
        }
        try {
            // Extract nested variables from the actual output data
            const extractedVariables = this.variableExtractor.extractVariables(outputData, nodeId);
            // Store the extracted variables
            this.runtimeVariables.set(nodeId, extractedVariables);
            this.eventBus.emit('variables.runtime.registered', {
                nodeId,
                variableCount: extractedVariables.length,
                extractedAt: Date.now(),
            });
            console.log(`🔄 Registered ${extractedVariables.length} runtime variables for node ${nodeId}`);
        }
        catch (error) {
            console.warn(`Failed to extract runtime variables for node ${nodeId}:`, error);
            this.runtimeVariables.delete(nodeId);
        }
    }
    /**
     * Get runtime variables for a specific node
     */
    getRuntimeVariables(nodeId) {
        return this.runtimeVariables.get(nodeId) || [];
    }
    /**
     * Remove runtime variables when a node is deleted or disconnected
     */
    invalidateRuntimeVariables(nodeId) {
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
    clearAllRuntimeVariables() {
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
    getNodeOutputSchema(nodeType) {
        return this.nodeOutputSchemas.get(nodeType);
    }
    /**
     * Analyze flow to get available variables for a specific node
     * Now includes both static schema variables AND runtime extracted variables
     */
    getAvailableVariablesForNode(targetNodeId, flow) {
        const availableVariables = [];
        // Find all nodes that can reach the target node
        const reachableNodes = this.findReachableNodes(targetNodeId, flow);
        for (const node of reachableNodes) {
            // Skip nodes without a type
            if (!node.type)
                continue;
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
    findReachableNodes(targetNodeId, flow) {
        const reachableNodes = [];
        const visited = new Set();
        const findUpstreamNodes = (nodeId) => {
            if (visited.has(nodeId))
                return;
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
    getAllNodeSchemas() {
        return Array.from(this.nodeOutputSchemas.values());
    }
    /**
     * Enhanced parsing for complex variable references including nested paths
     * Now supports: {nodeId.path}, {nodeId.object.property}, {nodeId.array[0]}, {nodeId["special-key"]}
     */
    parseVariableReferences(text) {
        // Enhanced regex to support complex nested paths
        const variableRegex = /\{([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_\[\]".-]+)\}/g;
        const references = [];
        let match;
        while ((match = variableRegex.exec(text)) !== null) {
            references.push({
                match: match[0],
                nodeId: match[1],
                variableName: match[2], // This now includes the full path after the first dot
                fullPath: `${match[1]}.${match[2]}`,
            });
        }
        return references;
    }
    /**
     * Validate variable references in flow
     */
    validateVariableReferences(text, availableVariables) {
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
    getVariableSuggestions(targetNodeId, flow, searchTerm = '') {
        const availableVariables = this.getAvailableVariablesForNode(targetNodeId, flow);
        if (!searchTerm) {
            return availableVariables.sort(this.sortVariables);
        }
        const term = searchTerm.toLowerCase();
        return availableVariables
            .filter(variable => variable.variableName.toLowerCase().includes(term) ||
            variable.nodeLabel.toLowerCase().includes(term) ||
            variable.description.toLowerCase().includes(term) ||
            variable.fullPath.toLowerCase().includes(term))
            .sort(this.sortVariables);
    }
    /**
     * Sort variables by relevance: static first, then by depth, then alphabetically
     */
    sortVariables = (a, b) => {
        // Static variables first
        if (!a.isNested && b.isNested)
            return -1;
        if (a.isNested && !b.isNested)
            return 1;
        // For nested variables, sort by depth (shallow first)
        if (a.isNested && b.isNested) {
            const depthDiff = (a.depth || 0) - (b.depth || 0);
            if (depthDiff !== 0)
                return depthDiff;
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
    areRuntimeVariablesFresh(nodeId, maxAgeMs = 60000) {
        const runtimeVars = this.getRuntimeVariables(nodeId);
        if (runtimeVars.length === 0)
            return false;
        const now = Date.now();
        const extractedAt = runtimeVars[0]?.extractedAt || 0;
        return (now - extractedAt) < maxAgeMs;
    }
}
//# sourceMappingURL=VariableRegistry.js.map