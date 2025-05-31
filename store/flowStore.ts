import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { CustomNode, CustomEdge, FlowData, ExecutionLogEntry, Position } from '../types';
import { NodeRegistry } from '../core/registry/NodeRegistry';
import { applicationCore } from '../core/ApplicationCore';

// Store state interface
interface FlowState {
  // Flow data
  nodes: CustomNode[];
  edges: CustomEdge[];
  viewport: { x: number; y: number; zoom: number };
  
  // Plugin system
  nodeRegistry: NodeRegistry;
  availableNodeTypes: string[];
  
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
    },

    setEdges: (edges) => {
      set({ edges, hasUnsavedChanges: true });
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
    },

    addEdge: (edge) => {
      set((state) => ({
        edges: [...state.edges, edge],
        hasUnsavedChanges: true,
      }));
    },

    removeEdge: (edgeId) => {
      set((state) => ({
        edges: state.edges.filter(edge => edge.id !== edgeId),
        selectedEdgeId: state.selectedEdgeId === edgeId ? null : state.selectedEdgeId,
        hasUnsavedChanges: true,
      }));
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

    // Execution
    startExecution: () => {
      set({ 
        isExecuting: true, 
        executionLogs: [],
        currentExecutingNode: null 
      });
    },

    stopExecution: () => {
      set({ 
        isExecuting: false, 
        currentExecutingNode: null 
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
      set({ 
        selectedNodeId: nodeId,
        selectedEdgeId: null, // Clear edge selection
        isEditorPanelOpen: nodeId !== null, // Auto-open editor when node selected
      });
    },

    setSelectedEdge: (edgeId) => {
      set({ 
        selectedEdgeId: edgeId,
        selectedNodeId: null, // Clear node selection
        isEditorPanelOpen: false, // Close editor for edge selection
      });
    },

    setEditorPanelOpen: (open) => {
      set({ isEditorPanelOpen: open });
    },

    setLogPanelOpen: (open) => {
      set({ isLogPanelOpen: open });
    },

    // Flow management
    loadFlow: (flowData) => {
      set({
        nodes: flowData.nodes,
        edges: flowData.edges,
        viewport: flowData.viewport || { x: 0, y: 0, zoom: 1 },
        selectedNodeId: null,
        selectedEdgeId: null,
        isEditorPanelOpen: false,
        executionLogs: [],
        currentExecutingNode: null,
        isExecuting: false,
        hasUnsavedChanges: false,
        lastSaved: new Date(),
      });
    },

    exportFlow: () => {
      const { nodes, edges, viewport } = get();
      return {
        nodes,
        edges,
        viewport,
      };
    },

    setFlowName: (name) => {
      set({ flowName: name, hasUnsavedChanges: true });
    },

    markSaved: () => {
      set({ hasUnsavedChanges: false, lastSaved: new Date() });
    },

    markUnsaved: () => {
      set({ hasUnsavedChanges: true });
    },

    resetFlow: () => {
      set({
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeId: null,
        selectedEdgeId: null,
        isEditorPanelOpen: false,
        isLogPanelOpen: false,
        executionLogs: [],
        currentExecutingNode: null,
        isExecuting: false,
        flowName: 'Untitled Flow',
        hasUnsavedChanges: false,
        lastSaved: null,
      });
    },
  }))
);

// Initialize available node types
setTimeout(() => {
  useFlowStore.getState().refreshAvailableNodeTypes();
}, 0);

// Selector hooks for commonly used state
export const useFlowNodes = () => useFlowStore(state => state.nodes);
export const useFlowEdges = () => useFlowStore(state => state.edges);
export const useSelectedNode = () => useFlowStore(state => state.selectedNodeId);
export const useIsExecuting = () => useFlowStore(state => state.isExecuting);
export const useExecutionLogs = () => useFlowStore(state => state.executionLogs);
export const useAvailableNodeTypes = () => useFlowStore(state => state.availableNodeTypes);
export const useFlowActions = () => useFlowStore(state => ({
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  updateNode: state.updateNode,
  updateNodeData: state.updateNodeData,
  addNode: state.addNode,
  removeNode: state.removeNode,
  addEdge: state.addEdge,
  removeEdge: state.removeEdge,
  setSelectedNode: state.setSelectedNode,
  startExecution: state.startExecution,
  stopExecution: state.stopExecution,
  createNodeFromType: state.createNodeFromType,
})); 