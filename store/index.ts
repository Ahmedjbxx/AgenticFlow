// Main store exports
export * from './flowStore';
export * from './persistenceStore';

// Store integration utilities
import { useFlowStore } from './flowStore';
import { usePersistenceStore, useAutoSave } from './persistenceStore';
import { useEffect } from 'react';

/**
 * Integration hook that connects flow store with persistence
 */
export const useStoreIntegration = () => {
  const flowState = useFlowStore();
  const persistenceActions = usePersistenceStore();
  const { triggerAutoSave, autoSaveEnabled, autoSaveInterval } = useAutoSave();

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled || !flowState.hasUnsavedChanges) {
      return;
    }

    const autoSaveTimer = setInterval(() => {
      if (flowState.hasUnsavedChanges && flowState.nodes.length > 0) {
        const flowData = flowState.exportFlow();
        const flowId = `autosave-${Date.now()}`;
        
        triggerAutoSave(flowId, `${flowState.flowName} (Auto-saved)`, flowData);
        flowState.markSaved();
      }
    }, autoSaveInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(autoSaveTimer);
  }, [
    autoSaveEnabled,
    autoSaveInterval,
    flowState.hasUnsavedChanges,
    flowState.nodes.length,
    flowState.flowName,
  ]);

  return {
    // Flow operations with persistence
    saveCurrentFlow: (name?: string, description?: string) => {
      const flowData = flowState.exportFlow();
      const flowId = `flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const flowName = name || flowState.flowName;
      
      persistenceActions.saveFlow(flowId, flowName, flowData, description);
      flowState.setFlowName(flowName);
      flowState.markSaved();
      
      return flowId;
    },

    loadSavedFlow: (flowId: string) => {
      const savedFlow = persistenceActions.loadFlow(flowId);
      if (savedFlow) {
        flowState.loadFlow(savedFlow.data);
        flowState.setFlowName(savedFlow.name);
        return true;
      }
      return false;
    },

    createNewFlow: () => {
      flowState.resetFlow();
      return true;
    },

    duplicateCurrentFlow: (newName: string) => {
      const flowData = flowState.exportFlow();
      const currentFlowId = `temp-${Date.now()}`;
      
      // First save current flow temporarily
      persistenceActions.saveFlow(currentFlowId, flowState.flowName, flowData);
      
      // Then duplicate it
      const newFlowId = persistenceActions.duplicateFlow(currentFlowId, newName);
      
      // Clean up temporary flow
      persistenceActions.deleteFlow(currentFlowId);
      
      return newFlowId;
    },
  };
};

/**
 * Store debug utilities for development
 */
export const useStoreDebug = () => {
  const flowStore = useFlowStore();
  const persistenceStore = usePersistenceStore();

  return {
    logFlowState: () => {
      console.group('🔄 Flow Store State');
      console.log('Nodes:', flowStore.nodes);
      console.log('Edges:', flowStore.edges);
      console.log('Selected Node:', flowStore.selectedNodeId);
      console.log('Is Executing:', flowStore.isExecuting);
      console.log('Execution Logs:', flowStore.executionLogs);
      console.log('Available Node Types:', flowStore.availableNodeTypes);
      console.groupEnd();
    },

    logPersistenceState: () => {
      console.group('💾 Persistence Store State');
      console.log('Saved Flows:', persistenceStore.getAllFlows());
      console.log('Recent Flows:', persistenceStore.recentFlows);
      console.log('Auto-save Enabled:', persistenceStore.autoSaveEnabled);
      console.log('Auto-save Interval:', persistenceStore.autoSaveInterval);
      console.log('Storage Stats:', persistenceStore.getStorageStats());
      console.groupEnd();
    },

    resetAllStores: () => {
      flowStore.resetFlow();
      persistenceStore.clearAllData();
      console.log('🔄 All stores reset');
    },

    exportDebugData: () => {
      return {
        flow: {
          nodes: flowStore.nodes,
          edges: flowStore.edges,
          viewport: flowStore.viewport,
          metadata: {
            name: flowStore.flowName,
            hasUnsavedChanges: flowStore.hasUnsavedChanges,
            lastSaved: flowStore.lastSaved,
          },
        },
        persistence: {
          savedFlows: persistenceStore.getAllFlows(),
          recentFlows: persistenceStore.recentFlows,
          settings: {
            autoSaveEnabled: persistenceStore.autoSaveEnabled,
            autoSaveInterval: persistenceStore.autoSaveInterval,
          },
        },
      };
    },
  };
};

/**
 * Store validation utilities
 */
export const useStoreValidation = () => {
  const flowStore = useFlowStore();

  return {
    validateFlow: () => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check for nodes without connections
      const connectedNodeIds = new Set([
        ...flowStore.edges.map(e => e.source),
        ...flowStore.edges.map(e => e.target),
      ]);

      const isolatedNodes = flowStore.nodes.filter(node => 
        !connectedNodeIds.has(node.id)
      );

      if (isolatedNodes.length > 0) {
        warnings.push(`${isolatedNodes.length} node(s) are not connected to the flow`);
      }

      // Check for trigger nodes
      const triggerNodes = flowStore.nodes.filter(node => 
        node.type === 'triggerNode'
      );

      if (triggerNodes.length === 0) {
        errors.push('Flow must have at least one trigger node');
      }

      // Check for end nodes
      const endNodes = flowStore.nodes.filter(node => 
        node.type === 'endNode'
      );

      if (endNodes.length === 0) {
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

          const outgoingEdges = flowStore.edges.filter(e => e.source === nodeId);
          for (const edge of outgoingEdges) {
            if (hasCycle(edge.target)) {
              return true;
            }
          }

          recursionStack.delete(nodeId);
          return false;
        };

        return flowStore.nodes.some(node => hasCycle(node.id));
      };

      if (hasCircularDependency()) {
        errors.push('Flow contains circular dependencies');
      }

      return { errors, warnings, isValid: errors.length === 0 };
    },
  };
}; 