import { useState, useCallback } from 'react';
import { FlowEditorState, EditorNode, EditorEdge, editorEdgeToCustomEdge, customEdgeToEditorEdge } from '../types.js';
import { FlowData, CustomNodeType } from '@agenticflow/types';

export interface UseFlowEditorReturn {
  state: FlowEditorState;
  actions: {
    addNode: (type: string, position?: { x: number; y: number }) => void;
    removeNode: (nodeId: string) => void;
    updateNode: (nodeId: string, updates: Partial<EditorNode>) => void;
    selectNode: (nodeId: string | null) => void;
    addEdge: (edge: EditorEdge) => void;
    removeEdge: (edgeId: string) => void;
    clearFlow: () => void;
    importFlow: (data: FlowData) => void;
    exportFlow: () => FlowData;
  };
}

export const useFlowEditor = (
  initialNodes: EditorNode[] = [],
  initialEdges: EditorEdge[] = []
): UseFlowEditorReturn => {
  const [state, setState] = useState<FlowEditorState>({
    nodes: initialNodes,
    edges: initialEdges,
    selectedNodeId: null,
    isExecuting: false,
    reactFlowInstance: null,
  });

  const addNode = useCallback((type: string, position = { x: 250, y: 100 }) => {
    const nodeId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNode: EditorNode = {
      id: nodeId,
      type: type as CustomNodeType,
      position,
      data: {
        id: nodeId,
        type: type as CustomNodeType,
        label: `${type} Node`,
        ...getDefaultDataForNodeType(type),
      },
    };

    setState(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      edges: prev.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
      selectedNodeId: prev.selectedNodeId === nodeId ? null : prev.selectedNodeId
    }));
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<EditorNode>) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));
  }, []);

  const selectNode = useCallback((nodeId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedNodeId: nodeId
    }));
  }, []);

  const addEdge = useCallback((edge: EditorEdge) => {
    setState(prev => ({
      ...prev,
      edges: [...prev.edges, edge]
    }));
  }, []);

  const removeEdge = useCallback((edgeId: string) => {
    setState(prev => ({
      ...prev,
      edges: prev.edges.filter(edge => edge.id !== edgeId)
    }));
  }, []);

  const clearFlow = useCallback(() => {
    setState(prev => ({
      ...prev,
      nodes: [],
      edges: [],
      selectedNodeId: null
    }));
  }, []);

  const importFlow = useCallback((data: FlowData) => {
    setState(prev => ({
      ...prev,
      nodes: data.nodes || [],
      edges: data.edges ? data.edges.map(customEdgeToEditorEdge) : [],
      selectedNodeId: null
    }));
  }, []);

  const exportFlow = useCallback((): FlowData => {
    return {
      nodes: state.nodes,
      edges: state.edges.map(editorEdgeToCustomEdge),
      viewport: state.reactFlowInstance?.getViewport() || { x: 0, y: 0, zoom: 1 }
    };
  }, [state.nodes, state.edges, state.reactFlowInstance]);

  return {
    state,
    actions: {
      addNode,
      removeNode,
      updateNode,
      selectNode,
      addEdge,
      removeEdge,
      clearFlow,
      importFlow,
      exportFlow,
    }
  };
};

// Helper function to get default data for different node types
function getDefaultDataForNodeType(type: string): any {
  switch (type) {
    case 'triggerNode':
      return {};
    case 'httpRequestNode':
      return { url: '', method: 'GET', headers: {}, body: '' };
    case 'llmAgentNode':
      return { prompt: '', model: 'gemini-pro', temperature: 0.7 };
    case 'conditionNode':
      return { condition: '', trueLabel: 'True', falseLabel: 'False' };
    case 'switchNode':
      return { switchExpression: '', cases: [], defaultCase: false };
    case 'loopNode':
      return { arrayExpression: '', itemVariable: 'item', maxIterations: 100 };
    case 'dataTransformNode':
      return { transformExpression: '' };
    case 'delayNode':
      return { delayMs: 1000 };
    case 'endNode':
      return {};
    default:
      return {};
  }
} 