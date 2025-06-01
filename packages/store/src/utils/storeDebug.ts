import { useAppStore } from '../store.js';

/**
 * Store debug utilities for development
 */
export const useStoreDebug = () => {
  const store = useAppStore();

  return {
    logFlowState: () => {
      console.group('🔄 Flow Store State');
      console.log('Nodes:', store.nodes);
      console.log('Edges:', store.edges);
      console.log('Selected Node:', store.selectedNodeId);
      console.log('Is Executing:', store.isExecuting);
      console.log('Execution Logs:', store.executionLogs);
      console.log('Available Node Types:', store.availableNodeTypes);
      console.log('Available Variables:', store.availableVariables);
      console.groupEnd();
    },

    logUIState: () => {
      console.group('🎨 UI Store State');
      console.log('Selected Node:', store.selectedNodeId);
      console.log('Selected Edge:', store.selectedEdgeId);
      console.log('Editor Panel Open:', store.isEditorPanelOpen);
      console.log('Log Panel Open:', store.isLogPanelOpen);
      console.log('Variable Panel Open:', store.isVariablePanelOpen);
      console.log('Node Library Open:', store.isNodeLibraryOpen);
      console.log('Theme:', store.theme);
      console.log('Notifications:', store.notifications);
      console.groupEnd();
    },

    logPersistenceState: () => {
      console.group('💾 Persistence Store State');
      console.log('Saved Flows:', store.getAllFlows());
      console.log('Recent Flows:', store.recentFlows);
      console.log('Auto-save Enabled:', store.autoSaveEnabled);
      console.log('Auto-save Interval:', store.autoSaveInterval);
      console.log('Last Auto-save:', store.lastAutoSave);
      console.log('Storage Stats:', store.getStorageStats());
      console.groupEnd();
    },

    logFullState: () => {
      console.group('🏪 Complete Store State');
      console.log('Flow State:', {
        nodes: store.nodes,
        edges: store.edges,
        viewport: store.viewport,
        isExecuting: store.isExecuting,
        flowName: store.flowName,
        hasUnsavedChanges: store.hasUnsavedChanges,
      });
      console.log('UI State:', {
        selectedNodeId: store.selectedNodeId,
        selectedEdgeId: store.selectedEdgeId,
        panels: {
          editor: store.isEditorPanelOpen,
          log: store.isLogPanelOpen,
          variable: store.isVariablePanelOpen,
          nodeLibrary: store.isNodeLibraryOpen,
        },
        theme: store.theme,
        notifications: store.notifications.length,
      });
      console.log('Persistence State:', {
        totalFlows: Object.keys(store.savedFlows).length,
        recentFlows: store.recentFlows.length,
        autoSave: {
          enabled: store.autoSaveEnabled,
          interval: store.autoSaveInterval,
          lastSave: store.lastAutoSave,
        },
      });
      console.groupEnd();
    },

    resetAllStores: () => {
      store.resetFlow();
      store.clearAllData();
      store.clearNotifications();
      store.resetLayout();
      console.log('🔄 All stores reset');
    },

    exportDebugData: () => {
      return {
        timestamp: new Date().toISOString(),
        flow: {
          nodes: store.nodes,
          edges: store.edges,
          viewport: store.viewport,
          metadata: {
            name: store.flowName,
            hasUnsavedChanges: store.hasUnsavedChanges,
            lastSaved: store.lastSaved,
          },
        },
        ui: {
          selection: {
            nodeId: store.selectedNodeId,
            edgeId: store.selectedEdgeId,
          },
          panels: {
            editor: store.isEditorPanelOpen,
            log: store.isLogPanelOpen,
            variable: store.isVariablePanelOpen,
            nodeLibrary: store.isNodeLibraryOpen,
          },
          preferences: {
            theme: store.theme,
            showMinimap: store.showMinimap,
            showGrid: store.showGrid,
            snapToGrid: store.snapToGrid,
            gridSize: store.gridSize,
          },
          layout: {
            sidebarWidth: store.sidebarWidth,
            panelHeight: store.panelHeight,
          },
          notifications: store.notifications,
        },
        persistence: {
          savedFlows: store.getAllFlows().map(flow => ({
            id: flow.id,
            name: flow.name,
            createdAt: flow.createdAt,
            updatedAt: flow.updatedAt,
            nodeCount: flow.data.nodes.length,
            edgeCount: flow.data.edges.length,
          })),
          recentFlows: store.recentFlows,
          settings: {
            autoSaveEnabled: store.autoSaveEnabled,
            autoSaveInterval: store.autoSaveInterval,
            lastAutoSave: store.lastAutoSave,
          },
          stats: store.getStorageStats(),
        },
        performance: {
          variableCacheSize: store.availableVariables.size,
          nodeTypeCount: store.availableNodeTypes.length,
          executionLogCount: store.executionLogs.length,
        },
      };
    },

    validateStoreIntegrity: () => {
      const issues: string[] = [];
      
      // Check for orphaned edges
      const nodeIds = new Set(store.nodes.map(n => n.id));
      const orphanedEdges = store.edges.filter(edge => 
        !nodeIds.has(edge.source) || !nodeIds.has(edge.target)
      );
      
      if (orphanedEdges.length > 0) {
        issues.push(`${orphanedEdges.length} orphaned edge(s) found`);
      }
      
      // Check for invalid selection
      if (store.selectedNodeId && !nodeIds.has(store.selectedNodeId)) {
        issues.push('Selected node ID does not exist');
      }
      
      const edgeIds = new Set(store.edges.map(e => e.id));
      if (store.selectedEdgeId && !edgeIds.has(store.selectedEdgeId)) {
        issues.push('Selected edge ID does not exist');
      }
      
      // Check for variable cache consistency
      const nodeIdsWithVariables = Array.from(store.availableVariables.keys());
      const missingVariables = nodeIdsWithVariables.filter(id => !nodeIds.has(id));
      
      if (missingVariables.length > 0) {
        issues.push(`${missingVariables.length} variable cache entries for non-existent nodes`);
      }
      
      if (issues.length === 0) {
        console.log('✅ Store integrity check passed');
        return true;
      } else {
        console.warn('⚠️ Store integrity issues found:', issues);
        return false;
      }
    },

    measurePerformance: () => {
      const start = performance.now();
      
      // Simulate common operations
      const nodeCount = store.nodes.length;
      const edgeCount = store.edges.length;
      const variableCount = Array.from(store.availableVariables.values())
        .reduce((total, vars) => total + vars.length, 0);
      
      const end = performance.now();
      
      const metrics = {
        renderTime: end - start,
        nodeCount,
        edgeCount,
        variableCount,
        memoryUsage: (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit,
        } : null,
      };
      
      console.log('📊 Performance Metrics:', metrics);
      return metrics;
    },
  };
}; 