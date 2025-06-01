import { useEffect } from 'react';
import { useAppStore, useFlowState, useFlowActions, usePersistenceActions } from '../store.js';

/**
 * Integration hook that connects flow store with persistence and auto-save
 */
export const useStoreIntegration = () => {
  const flowState = useFlowState();
  const flowActions = useFlowActions();
  const persistenceActions = usePersistenceActions();
  const { autoSaveEnabled, autoSaveInterval } = useAppStore((state) => ({
    autoSaveEnabled: state.autoSaveEnabled,
    autoSaveInterval: state.autoSaveInterval,
  }));

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled || !flowState.hasUnsavedChanges) {
      return;
    }

    const autoSaveTimer = setInterval(() => {
      if (flowState.hasUnsavedChanges && flowState.nodes.length > 0) {
        const flowData = flowActions.exportFlowData();
        const flowId = `autosave-${Date.now()}`;
        
        persistenceActions.saveFlow(flowId, `${flowState.flowName} (Auto-saved)`, flowData);
        flowActions.markSaved();
        persistenceActions.updateLastAutoSave();
      }
    }, autoSaveInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(autoSaveTimer);
  }, [
    autoSaveEnabled,
    autoSaveInterval,
    flowState.hasUnsavedChanges,
    flowState.nodes.length,
    flowState.flowName,
    flowActions,
    persistenceActions,
  ]);

  return {
    // Flow operations with persistence
    saveCurrentFlow: (name?: string, description?: string) => {
      const flowData = flowActions.exportFlowData();
      const flowId = `flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const flowName = name || flowState.flowName;
      
      persistenceActions.saveFlow(flowId, flowName, flowData, description);
      flowActions.setFlowName(flowName);
      flowActions.markSaved();
      
      return flowId;
    },

    loadSavedFlow: (flowId: string) => {
      const savedFlow = persistenceActions.loadSavedFlow(flowId);
      if (savedFlow) {
        flowActions.loadFlow(savedFlow.data);
        flowActions.setFlowName(savedFlow.name);
        return true;
      }
      return false;
    },

    createNewFlow: () => {
      flowActions.resetFlow();
      return true;
    },

    duplicateCurrentFlow: (newName: string) => {
      const flowData = flowActions.exportFlowData();
      const currentFlowId = `temp-${Date.now()}`;
      
      // First save current flow temporarily
      persistenceActions.saveFlow(currentFlowId, flowState.flowName, flowData);
      
      // Then duplicate it
      const newFlowId = persistenceActions.duplicateFlow(currentFlowId, newName);
      
      // Clean up temporary flow
      persistenceActions.deleteFlow(currentFlowId);
      
      return newFlowId;
    },

    // Quick save/load functions
    quickSave: () => {
      const flowData = flowActions.exportFlowData();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const flowId = `quicksave-${timestamp}`;
      
      persistenceActions.saveFlow(flowId, `Quick Save - ${timestamp}`, flowData);
      flowActions.markSaved();
      
      return flowId;
    },

    loadMostRecent: () => {
      const recentFlows = persistenceActions.getAllFlows()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      
      if (recentFlows.length > 0) {
        const mostRecent = recentFlows[0];
        if (mostRecent) {
          flowActions.loadFlow(mostRecent.data);
          flowActions.setFlowName(mostRecent.name);
          return mostRecent.id;
        }
      }
      
      return null;
    },
  };
}; 