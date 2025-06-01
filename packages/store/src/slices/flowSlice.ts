import { StateCreator } from 'zustand';
import { CustomNode, CustomEdge, FlowData, ExecutionLogEntry, Position } from '@agenticflow/types';
import { NodeRegistry, AvailableVariable, applicationCore } from '@agenticflow/core';

// Forward reference for the combined store type
type CombinedStore = FlowSlice & { [key: string]: any };

// Flow slice state interface
export interface FlowSliceState {
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
  
  // Flow metadata
  flowName: string;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

// Flow slice actions interface
export interface FlowSliceActions {
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
  
  // Flow management - NOTE: Different from persistence slice
  loadFlow: (flowData: FlowData) => void;
  exportFlowData: () => FlowData; // Renamed to avoid conflict
  setFlowName: (name: string) => void;
  markSaved: () => void;
  markUnsaved: () => void;
  resetFlow: () => void;
}

// Combined flow slice type
export type FlowSlice = FlowSliceState & FlowSliceActions;

// Flow slice creator with proper typing
export const createFlowSlice: StateCreator<
  FlowSlice,
  [],
  [],
  FlowSlice
> = (set, get, api) => ({
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
    set((state: FlowSlice) => ({
      nodes: state.nodes.map((node: CustomNode) => 
        node.id === nodeId ? { ...node, ...updates } : node
      ),
      hasUnsavedChanges: true,
    }));
    // Refresh available variables when nodes are updated
    setTimeout(() => get().refreshAvailableVariables(), 0);
  },

  updateNodeData: (nodeId, data) => {
    set((state: FlowSlice) => ({
      nodes: state.nodes.map((node: CustomNode) => 
        node.id === nodeId ? { ...node, data } : node
      ),
      hasUnsavedChanges: true,
    }));
  },

  addNode: (node) => {
    set((state: FlowSlice) => ({
      nodes: [...state.nodes, node],
      hasUnsavedChanges: true,
    }));
    // Refresh available variables when nodes are added
    setTimeout(() => get().refreshAvailableVariables(), 0);
  },

  removeNode: (nodeId) => {
    set((state: FlowSlice) => ({
      nodes: state.nodes.filter((node: CustomNode) => node.id !== nodeId),
      edges: state.edges.filter((edge: CustomEdge) => 
        edge.source !== nodeId && edge.target !== nodeId
      ),
      hasUnsavedChanges: true,
    }));
    // Refresh available variables when nodes are removed
    setTimeout(() => get().refreshAvailableVariables(), 0);
  },

  addEdge: (edge) => {
    set((state: FlowSlice) => ({
      edges: [...state.edges, edge],
      hasUnsavedChanges: true,
    }));
    // Refresh available variables when edges are added
    setTimeout(() => get().refreshAvailableVariables(), 0);
  },

  removeEdge: (edgeId) => {
    set((state: FlowSlice) => ({
      edges: state.edges.filter((edge: CustomEdge) => edge.id !== edgeId),
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
    set((state: FlowSlice) => ({
      executionLogs: [...state.executionLogs, log],
    }));
  },

  clearExecutionLogs: () => {
    set({ executionLogs: [] });
  },

  // Flow management
  loadFlow: (flowData) => {
    set({
      nodes: flowData.nodes,
      edges: flowData.edges,
      viewport: flowData.viewport || { x: 0, y: 0, zoom: 1 },
      hasUnsavedChanges: false,
    });

    // Refresh available variables after loading
    setTimeout(() => get().refreshAvailableVariables(), 0);
  },

  exportFlowData: () => {
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
      hasUnsavedChanges: false,
      executionLogs: [],
      currentExecutingNode: null,
      isExecuting: false,
      flowName: 'Untitled Flow',
      lastSaved: null,
    });
  },
}); 