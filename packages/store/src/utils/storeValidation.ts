import { useAppStore } from '../store.js';

/**
 * Store validation utilities
 */
export const useStoreValidation = () => {
  const store = useAppStore();

  return {
    validateFlow: () => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check for nodes without connections
      const connectedNodeIds = new Set([
        ...store.edges.map(e => e.source),
        ...store.edges.map(e => e.target),
      ]);

      const isolatedNodes = store.nodes.filter(node => 
        !connectedNodeIds.has(node.id) && store.nodes.length > 1
      );

      if (isolatedNodes.length > 0) {
        warnings.push(`${isolatedNodes.length} node(s) are not connected to the flow`);
      }

      // Check for trigger nodes
      const triggerNodes = store.nodes.filter(node => 
        node.type === 'triggerNode'
      );

      if (triggerNodes.length === 0 && store.nodes.length > 0) {
        errors.push('Flow must have at least one trigger node');
      }

      // Check for end nodes
      const endNodes = store.nodes.filter(node => 
        node.type === 'endNode'
      );

      if (endNodes.length === 0 && store.nodes.length > 1) {
        warnings.push('Flow should have at least one end node');
      }

      // Check for circular dependencies (basic check)
      const hasCircularDependency = () => {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const hasCycle = (nodeId: string): boolean => {
          if (recursionStack.has(nodeId)) return true;
          if (visited.has(nodeId)) return false;

          visited.add(nodeId);
          recursionStack.add(nodeId);

          // Get outgoing edges from this node
          const outgoingEdges = store.edges.filter(edge => edge.source === nodeId);
          
          for (const edge of outgoingEdges) {
            if (hasCycle(edge.target)) {
              return true;
            }
          }

          recursionStack.delete(nodeId);
          return false;
        };

        // Check each node as a potential starting point
        for (const node of store.nodes) {
          if (!visited.has(node.id)) {
            if (hasCycle(node.id)) {
              return true;
            }
          }
        }

        return false;
      };

      if (hasCircularDependency()) {
        errors.push('Flow contains circular dependencies');
      }

      // Check for missing required node data
      const nodesWithMissingData = store.nodes.filter(node => {
        if (node.type === 'httpRequestNode') {
          const data = node.data as any;
          return !data.url || data.url.trim() === '';
        }
        if (node.type === 'llmAgentNode') {
          const data = node.data as any;
          return !data.prompt || data.prompt.trim() === '';
        }
        // Add more node-specific validation as needed
        return false;
      });

      if (nodesWithMissingData.length > 0) {
        errors.push(`${nodesWithMissingData.length} node(s) have missing required configuration`);
      }

      // Check for duplicate node names
      const nodeNames = store.nodes.map(node => {
        const data = node.data as any;
        return data.name || data.label || node.id;
      });
      const duplicateNames = nodeNames.filter((name, index) => 
        nodeNames.indexOf(name) !== index
      );

      if (duplicateNames.length > 0) {
        warnings.push(`Duplicate node names found: ${duplicateNames.join(', ')}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        summary: {
          nodeCount: store.nodes.length,
          edgeCount: store.edges.length,
          isolatedNodes: isolatedNodes.length,
          triggerNodes: triggerNodes.length,
          endNodes: endNodes.length,
        },
      };
    },

    validateNodeConfiguration: (nodeId: string) => {
      const node = store.nodes.find(n => n.id === nodeId);
      if (!node) {
        return { isValid: false, errors: ['Node not found'] };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Basic validation
      const data = node.data as any;
      if (!data.name && !data.label) {
        warnings.push('Node name is empty');
      }

      // Type-specific validation
      switch (node.type) {
        case 'httpRequestNode':
          if (!data.url || data.url.trim() === '') {
            errors.push('HTTP Request node requires a URL');
          }
          if (data.url && !isValidUrl(data.url)) {
            errors.push('Invalid URL format');
          }
          break;

        case 'llmAgentNode':
          if (!data.prompt || data.prompt.trim() === '') {
            errors.push('LLM Agent node requires a prompt');
          }
          break;

        case 'conditionNode':
          if (!data.condition && !data.conditionLogic) {
            errors.push('Condition node requires a condition');
          }
          break;

        // Add more node types as needed
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    },

    validateExecution: () => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check if flow is ready for execution
      const flowValidation = useStoreValidation().validateFlow();
      
      if (!flowValidation.isValid) {
        errors.push(...flowValidation.errors);
      }

      warnings.push(...flowValidation.warnings);

      // Check for execution prerequisites
      if (store.isExecuting) {
        warnings.push('Flow is already executing');
      }

      // Check for required environment variables or configurations
      // This would depend on the specific nodes in the flow
      const httpNodes = store.nodes.filter(node => node.type === 'httpRequestNode');
      const llmNodes = store.nodes.filter(node => node.type === 'llmAgentNode');

      if (llmNodes.length > 0) {
        // Check if LLM API key is configured (this would typically be in environment)
        // For now, just add a warning if not checked
        warnings.push('Ensure LLM API keys are properly configured');
      }

      if (httpNodes.length > 0) {
        // Check for potential CORS issues or network configuration
        warnings.push('Ensure network access is available for HTTP requests');
      }

      return {
        isValid: errors.length === 0,
        canExecute: errors.length === 0,
        errors,
        warnings,
      };
    },

    validateUIState: () => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check for invalid selections
      if (store.selectedNodeId && !store.nodes.find(n => n.id === store.selectedNodeId)) {
        errors.push('Selected node does not exist');
      }

      if (store.selectedEdgeId && !store.edges.find(e => e.id === store.selectedEdgeId)) {
        errors.push('Selected edge does not exist');
      }

      // Check for reasonable UI state
      if (store.notifications.length > 10) {
        warnings.push('Large number of notifications may impact performance');
      }

      // Check layout constraints
      if (store.sidebarWidth < 200 || store.sidebarWidth > 600) {
        warnings.push('Sidebar width is outside recommended range (200-600px)');
      }

      if (store.panelHeight < 150 || store.panelHeight > 500) {
        warnings.push('Panel height is outside recommended range (150-500px)');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    },

    validatePersistence: () => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check storage size
      const stats = store.getStorageStats();
      
      if (stats.storageSize > 5 * 1024 * 1024) { // 5MB
        warnings.push('Storage size is approaching browser limits');
      }

      if (stats.totalFlows > 100) {
        warnings.push('Large number of saved flows may impact performance');
      }

      // Check auto-save configuration
      if (store.autoSaveEnabled && store.autoSaveInterval < 1) {
        errors.push('Auto-save interval must be at least 1 minute');
      }

      // Check for recent flows without actual flow data
      const orphanedRecentFlows = store.recentFlows.filter(flowId => 
        !store.savedFlows[flowId]
      );

      if (orphanedRecentFlows.length > 0) {
        warnings.push(`${orphanedRecentFlows.length} recent flow reference(s) point to non-existent flows`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        stats,
      };
    },
  };
};

// Helper function for URL validation
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
} 