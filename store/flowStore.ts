import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { CustomNode, CustomEdge, FlowData, ExecutionLogEntry, Position } from '../types';
import { NodeRegistry } from '../core/registry/NodeRegistry';
import { applicationCore } from '../core/ApplicationCore';
import { AvailableVariable } from '../core/variables/VariableRegistry';

// Store state interface
interface FlowState {
  // Flow data
  nodes: CustomNode[];
  edges: CustomEdge[];
  viewport: { x: number; y: number; zoom: number };
  
  // Plugin system
  nodeRegistry: NodeRegistry;
  availableNodeTypes: string[];
  
  // Variable system
  availableVariables: Map<string, AvailableVariable[]>; // nodeId -> available variables
  
  // Execution state
  isExecuting: boolean;
  executionLogs: ExecutionLogEntry[];
  currentExecutingNode: string | null;
  
  // UI state
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isEditorPanelOpen: boolean;
  isLogPanelOpen: boolean;
  
  // Flow metadata
  flowName: string;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

// Store actions interface
interface FlowActions {
  // Flow operations
  setNodes: (nodes: CustomNode[]) => void;
  setEdges: (edges: CustomEdge[]) => void;
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  updateNode: (nodeId: string, updates: Partial<CustomNode>) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  addNode: (node: CustomNode) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: CustomEdge) => void;
  removeEdge: (edgeId: string) => void;
  
  // Plugin system
  refreshAvailableNodeTypes: () => void;
  createNodeFromType: (type: string, position: Position) => CustomNode | null;
  
  // Variable system
  getAvailableVariablesForNode: (nodeId: string) => AvailableVariable[];
  refreshAvailableVariables: () => void;
  
  // Execution
  startExecution: () => void;
  stopExecution: () => void;
  setCurrentExecutingNode: (nodeId: string | null) => void;
  addExecutionLog: (log: ExecutionLogEntry) => void;
  clearExecutionLogs: () => void;
  
  // UI state
  setSelectedNode: (nodeId: string | null) => void;
  setSelectedEdge: (edgeId: string | null) => void;
  setEditorPanelOpen: (open: boolean) => void;
  setLogPanelOpen: (open: boolean) => void;
  
  // Flow management
  loadFlow: (flowData: FlowData) => void;
  exportFlow: () => FlowData;
  setFlowName: (name: string) => void;
  markSaved: () => void;
  markUnsaved: () => void;
  resetFlow: () => void;
}

// Combined store type
type FlowStore = FlowState & FlowActions;

// Create the store
export const useFlowStore = create<FlowStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    
    nodeRegistry: applicationCore.nodeRegistry,
    availableNodeTypes: [],
    
    availableVariables: new Map(),
    
    isExecuting: false,
    executionLogs: [],
    currentExecutingNode: null,
    
    selectedNodeId: null,
    selectedEdgeId: null,
    isEditorPanelOpen: false,
    isLogPanelOpen: false,
    
    flowName: 'Untitled Flow',
    lastSaved: null,
    hasUnsavedChanges: false,

    // Flow operations
    setNodes: (nodes) => {
      set({ nodes, hasUnsavedChanges: true });
      // Refresh available variables when nodes change
      setTimeout(() => get().refreshAvailableVariables(), 0);
    },

    setEdges: (edges) => {
      set({ edges, hasUnsavedChanges: true });
      // Refresh available variables when edges change (affects flow structure)
      setTimeout(() => get().refreshAvailableVariables(), 0);
    },

    setViewport: (viewport) => {
      set({ viewport });
    },

    updateNode: (nodeId, updates) => {
      set((state) => ({
        nodes: state.nodes.map(node => 
          node.id === nodeId ? { ...node, ...updates } : node
        ),
        hasUnsavedChanges: true,
      }));
      // Refresh available variables when nodes are updated
      setTimeout(() => get().refreshAvailableVariables(), 0);
    },

    updateNodeData: (nodeId, data) => {
      set((state) => ({
        nodes: state.nodes.map(node => 
          node.id === nodeId ? { ...node, data } : node
        ),
        hasUnsavedChanges: true,
      }));
    },

    addNode: (node) => {
      set((state) => ({
        nodes: [...state.nodes, node],
        hasUnsavedChanges: true,
      }));
      // Refresh available variables when nodes are added
      setTimeout(() => get().refreshAvailableVariables(), 0);
    },

    removeNode: (nodeId) => {
      set((state) => ({
        nodes: state.nodes.filter(node => node.id !== nodeId),
        edges: state.edges.filter(edge => 
          edge.source !== nodeId && edge.target !== nodeId
        ),
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        hasUnsavedChanges: true,
      }));
      // Refresh available variables when nodes are removed
      setTimeout(() => get().refreshAvailableVariables(), 0);
    },

    addEdge: (edge) => {
      set((state) => ({
        edges: [...state.edges, edge],
        hasUnsavedChanges: true,
      }));
      // Refresh available variables when edges are added
      setTimeout(() => get().refreshAvailableVariables(), 0);
    },

    removeEdge: (edgeId) => {
      set((state) => ({
        edges: state.edges.filter(edge => edge.id !== edgeId),
        selectedEdgeId: state.selectedEdgeId === edgeId ? null : state.selectedEdgeId,
        hasUnsavedChanges: true,
      }));
      // Refresh available variables when edges are removed
      setTimeout(() => get().refreshAvailableVariables(), 0);
    },

    // Plugin system
    refreshAvailableNodeTypes: () => {
      const { nodeRegistry } = get();
      const types = nodeRegistry.getAllTypes();
      set({ availableNodeTypes: types });
    },

    createNodeFromType: (type, position) => {
      const { nodeRegistry } = get();
      const plugin = nodeRegistry.get(type);
      
      if (!plugin) {
        console.error(`Plugin not found for type: ${type}`);
        return null;
      }

      const nodeId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const defaultData = plugin.createDefaultData();
      
      const newNode: CustomNode = {
        id: nodeId,
        type: type,
        position,
        data: {
          ...defaultData,
          id: nodeId,
        },
      };

      return newNode;
    },

    // Variable system
    getAvailableVariablesForNode: (nodeId) => {
      const { availableVariables } = get();
      return availableVariables.get(nodeId) || [];
    },

    refreshAvailableVariables: () => {
      const { nodes, edges } = get();
      const { variableRegistry } = applicationCore;
      const newAvailableVariables = new Map<string, AvailableVariable[]>();

      const currentFlow: FlowData = { nodes, edges, viewport: get().viewport };

      // Calculate available variables for each node
      for (const node of nodes) {
        const availableVars = variableRegistry.getAvailableVariablesForNode(node.id, currentFlow);
        newAvailableVariables.set(node.id, availableVars);
      }

      set({ availableVariables: newAvailableVariables });
    },

    // Execution
    startExecution: () => {
      set({ 
        isExecuting: true, 
        currentExecutingNode: null,
        executionLogs: [],
      });
    },

    stopExecution: () => {
      set({ 
        isExecuting: false, 
        currentExecutingNode: null,
      });
    },

    setCurrentExecutingNode: (nodeId) => {
      set({ currentExecutingNode: nodeId });
    },

    addExecutionLog: (log) => {
      set((state) => ({
        executionLogs: [...state.executionLogs, log],
      }));
    },

    clearExecutionLogs: () => {
      set({ executionLogs: [] });
    },

    // UI state
    setSelectedNode: (nodeId) => {
      set({ selectedNodeId: nodeId });
    },

    setSelectedEdge: (edgeId) => {
      set({ selectedEdgeId: edgeId });
    },

    setEditorPanelOpen: (open) => {
      set({ isEditorPanelOpen: open });
    },

    setLogPanelOpen: (open) => {
      set({ isLogPanelOpen: open });
    },

    // Flow management
    loadFlow: (flowData) => {
      // Calculate unique ID counter based on existing nodes
      let maxCounter = 0;
      flowData.nodes.forEach(node => {
        const match = node.id.match(/-(\d+)-/);
        if (match) {
          const counter = parseInt(match[1], 10);
          if (counter > maxCounter) {
            maxCounter = counter;
          }
        }
      });

      set({
        nodes: flowData.nodes,
        edges: flowData.edges,
        viewport: flowData.viewport || { x: 0, y: 0, zoom: 1 },
        hasUnsavedChanges: false,
        selectedNodeId: null,
        selectedEdgeId: null,
      });

      // Refresh available variables after loading
      setTimeout(() => get().refreshAvailableVariables(), 0);
    },

    exportFlow: () => {
      const { nodes, edges, viewport } = get();
      return { nodes, edges, viewport };
    },

    setFlowName: (name) => {
      set({ flowName: name });
    },

    markSaved: () => {
      set({ lastSaved: new Date(), hasUnsavedChanges: false });
    },

    markUnsaved: () => {
      set({ hasUnsavedChanges: true });
    },

    resetFlow: () => {
      set({
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        availableVariables: new Map(),
        selectedNodeId: null,
        selectedEdgeId: null,
        hasUnsavedChanges: false,
        executionLogs: [],
        currentExecutingNode: null,
        isExecuting: false,
      });
    },
  }))
);

// Selector hooks for better performance
export const useFlowNodes = () => useFlowStore(state => state.nodes);
export const useFlowEdges = () => useFlowStore(state => state.edges);
export const useSelectedNode = () => useFlowStore(state => state.selectedNodeId);
export const useIsExecuting = () => useFlowStore(state => state.isExecuting);
export const useExecutionLogs = () => useFlowStore(state => state.executionLogs);
export const useAvailableNodeTypes = () => useFlowStore(state => state.availableNodeTypes);
export const useFlowActions = () => useFlowStore(state => ({
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  addNode: state.addNode,
  removeNode: state.removeNode,
  updateNode: state.updateNode,
  updateNodeData: state.updateNodeData,
  addEdge: state.addEdge,
  removeEdge: state.removeEdge,
  setSelectedNode: state.setSelectedNode,
  startExecution: state.startExecution,
  stopExecution: state.stopExecution,
  refreshAvailableNodeTypes: state.refreshAvailableNodeTypes,
  createNodeFromType: state.createNodeFromType,
  getAvailableVariablesForNode: state.getAvailableVariablesForNode,
  refreshAvailableVariables: state.refreshAvailableVariables,
})); 

// Setup event listeners for automatic variable refresh
(() => {
  const { eventBus } = applicationCore;
  
  // Refresh variables when runtime variables are registered
  eventBus.on('variables.runtime.registered', () => {
    console.log('🔄 Runtime variables registered, refreshing UI...');
    useFlowStore.getState().refreshAvailableVariables();
  });

  // Refresh variables when runtime variables are invalidated
  eventBus.on('variables.runtime.invalidated', () => {
    console.log('🗑️ Runtime variables invalidated, refreshing UI...');
    useFlowStore.getState().refreshAvailableVariables();
  });

  // Refresh variables when node output is processed
  eventBus.on('node.output.processed', () => {
    console.log('📦 Node output processed, refreshing UI...');
    useFlowStore.getState().refreshAvailableVariables();
  });

  // Refresh variables when runtime variables are cleared
  eventBus.on('variables.runtime.cleared', () => {
    console.log('🧹 Runtime variables cleared, refreshing UI...');
    useFlowStore.getState().refreshAvailableVariables();
  });

  console.log('✅ Flow store event listeners initialized');
})(); 