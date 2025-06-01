import { create } from 'zustand';
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createFlowSlice, type FlowSlice } from './slices/flowSlice.js';
import { createUISlice, type UISlice } from './slices/uiSlice.js';
import { createPersistenceSlice, type PersistenceSlice } from './slices/persistenceSlice.js';
import { applicationCore } from '@agenticflow/core';

// Combined store type
export type AppStore = FlowSlice & UISlice & PersistenceSlice;

// Create the combined store with middleware
export const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    persist(
      immer<AppStore>((set, get, api) => ({
        ...createFlowSlice(set as any, get as any, api as any),
        ...createUISlice(set as any, get as any, api as any),
        ...createPersistenceSlice(set as any, get as any, api as any),
      })),
      {
        name: 'agenticflow-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist UI preferences
          theme: state.theme,
          showMinimap: state.showMinimap,
          showGrid: state.showGrid,
          snapToGrid: state.snapToGrid,
          gridSize: state.gridSize,
          sidebarWidth: state.sidebarWidth,
          panelHeight: state.panelHeight,
          
          // Persist persistence settings and flows
          savedFlows: state.savedFlows,
          recentFlows: state.recentFlows,
          autoSaveEnabled: state.autoSaveEnabled,
          autoSaveInterval: state.autoSaveInterval,
          maxRecentFlows: state.maxRecentFlows,
          lastAutoSave: state.lastAutoSave,
          lastBackup: state.lastBackup,
          
          // Don't persist flow data, UI modal states, or notifications
        }),
        version: 1,
        migrate: (persistedState: any, version: number) => {
          // Handle store migrations if needed
          if (version === 0) {
            // Migration from version 0 to 1
            return {
              ...persistedState,
              // Add any migration logic here
            };
          }
          return persistedState;
        },
      }
    )
  )
);

// Setup event listeners for automatic variable refresh and store integration
const setupStoreEventListeners = () => {
  const { eventBus } = applicationCore;
  
  // Refresh variables when runtime variables are registered
  eventBus.on('variables.runtime.registered', () => {
    console.log('🔄 Runtime variables registered, refreshing UI...');
    useAppStore.getState().refreshAvailableVariables();
  });

  // Refresh variables when runtime variables are invalidated
  eventBus.on('variables.runtime.invalidated', () => {
    console.log('🗑️ Runtime variables invalidated, refreshing UI...');
    useAppStore.getState().refreshAvailableVariables();
  });

  // Refresh variables when node output is processed
  eventBus.on('node.output.processed', () => {
    console.log('📦 Node output processed, refreshing UI...');
    useAppStore.getState().refreshAvailableVariables();
  });

  // Refresh variables when runtime variables are cleared
  eventBus.on('variables.runtime.cleared', () => {
    console.log('🧹 Runtime variables cleared, refreshing UI...');
    useAppStore.getState().refreshAvailableVariables();
  });

  console.log('✅ App store event listeners initialized');
};

// Initialize event listeners
setupStoreEventListeners();

// Export individual slice selectors for better performance
export const useFlowState = () => useAppStore((state) => ({
  nodes: state.nodes,
  edges: state.edges,
  viewport: state.viewport,
  isExecuting: state.isExecuting,
  executionLogs: state.executionLogs,
  currentExecutingNode: state.currentExecutingNode,
  availableNodeTypes: state.availableNodeTypes,
  availableVariables: state.availableVariables,
  flowName: state.flowName,
  hasUnsavedChanges: state.hasUnsavedChanges,
  lastSaved: state.lastSaved,
}));

export const useFlowActions = () => useAppStore((state) => ({
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  setViewport: state.setViewport,
  updateNode: state.updateNode,
  updateNodeData: state.updateNodeData,
  addNode: state.addNode,
  removeNode: state.removeNode,
  addEdge: state.addEdge,
  removeEdge: state.removeEdge,
  refreshAvailableNodeTypes: state.refreshAvailableNodeTypes,
  createNodeFromType: state.createNodeFromType,
  getAvailableVariablesForNode: state.getAvailableVariablesForNode,
  refreshAvailableVariables: state.refreshAvailableVariables,
  startExecution: state.startExecution,
  stopExecution: state.stopExecution,
  setCurrentExecutingNode: state.setCurrentExecutingNode,
  addExecutionLog: state.addExecutionLog,
  clearExecutionLogs: state.clearExecutionLogs,
  loadFlow: state.loadFlow,
  exportFlowData: state.exportFlowData,
  setFlowName: state.setFlowName,
  markSaved: state.markSaved,
  markUnsaved: state.markUnsaved,
  resetFlow: state.resetFlow,
}));

export const useUIState = () => useAppStore((state) => ({
  selectedNodeId: state.selectedNodeId,
  selectedEdgeId: state.selectedEdgeId,
  isEditorPanelOpen: state.isEditorPanelOpen,
  isLogPanelOpen: state.isLogPanelOpen,
  isVariablePanelOpen: state.isVariablePanelOpen,
  isNodeLibraryOpen: state.isNodeLibraryOpen,
  theme: state.theme,
  showMinimap: state.showMinimap,
  showGrid: state.showGrid,
  snapToGrid: state.snapToGrid,
  gridSize: state.gridSize,
  notifications: state.notifications,
  sidebarWidth: state.sidebarWidth,
  panelHeight: state.panelHeight,
}));

export const useUIActions = () => useAppStore((state) => ({
  setSelectedNode: state.setSelectedNode,
  setSelectedEdge: state.setSelectedEdge,
  clearSelection: state.clearSelection,
  setEditorPanelOpen: state.setEditorPanelOpen,
  setLogPanelOpen: state.setLogPanelOpen,
  setVariablePanelOpen: state.setVariablePanelOpen,
  setNodeLibraryOpen: state.setNodeLibraryOpen,
  toggleEditorPanel: state.toggleEditorPanel,
  toggleLogPanel: state.toggleLogPanel,
  toggleVariablePanel: state.toggleVariablePanel,
  toggleNodeLibrary: state.toggleNodeLibrary,
  setTheme: state.setTheme,
  setShowMinimap: state.setShowMinimap,
  setShowGrid: state.setShowGrid,
  setSnapToGrid: state.setSnapToGrid,
  setGridSize: state.setGridSize,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  clearNotifications: state.clearNotifications,
  setSidebarWidth: state.setSidebarWidth,
  setPanelHeight: state.setPanelHeight,
  resetLayout: state.resetLayout,
}));

export const usePersistenceState = () => useAppStore((state) => ({
  savedFlows: state.savedFlows,
  recentFlows: state.recentFlows,
  autoSaveEnabled: state.autoSaveEnabled,
  autoSaveInterval: state.autoSaveInterval,
  lastAutoSave: state.lastAutoSave,
  isImporting: state.isImporting,
  isExporting: state.isExporting,
  lastBackup: state.lastBackup,
}));

export const usePersistenceActions = () => useAppStore((state) => ({
  saveFlow: state.saveFlow,
  loadSavedFlow: state.loadSavedFlow,
  deleteFlow: state.deleteFlow,
  duplicateFlow: state.duplicateFlow,
  addToRecentFlows: state.addToRecentFlows,
  removeFromRecentFlows: state.removeFromRecentFlows,
  clearRecentFlows: state.clearRecentFlows,
  setAutoSaveEnabled: state.setAutoSaveEnabled,
  setAutoSaveInterval: state.setAutoSaveInterval,
  updateLastAutoSave: state.updateLastAutoSave,
  getAllFlows: state.getAllFlows,
  getFlowsByTag: state.getFlowsByTag,
  searchFlows: state.searchFlows,
  updateFlowMetadata: state.updateFlowMetadata,
  exportFlowToJson: state.exportFlowToJson,
  importFlow: state.importFlow,
  exportAllFlows: state.exportAllFlows,
  importFlows: state.importFlows,
  getStorageStats: state.getStorageStats,
  clearAllData: state.clearAllData,
  createBackup: state.createBackup,
  restoreFromBackup: state.restoreFromBackup,
}));

// Convenience hooks for common use cases
export const useSelectedNode = () => useAppStore((state) => {
  if (!state.selectedNodeId) return null;
  return state.nodes.find(node => node.id === state.selectedNodeId) || null;
});

export const useSelectedEdge = () => useAppStore((state) => {
  if (!state.selectedEdgeId) return null;
  return state.edges.find(edge => edge.id === state.selectedEdgeId) || null;
});

export const useIsExecuting = () => useAppStore((state) => state.isExecuting);

export const useHasUnsavedChanges = () => useAppStore((state) => state.hasUnsavedChanges);

export const useAvailableVariablesForSelectedNode = () => useAppStore((state) => {
  if (!state.selectedNodeId) return [];
  return state.getAvailableVariablesForNode(state.selectedNodeId);
});

export const useRecentFlows = () => useAppStore((state) => {
  return state.recentFlows
    .map(flowId => state.savedFlows[flowId])
    .filter(Boolean); // Filter out any flows that might have been deleted
}); 