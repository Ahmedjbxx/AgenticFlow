import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  Connection,
  Node,
  Edge,
  MarkerType,
  Panel,
  ReactFlowInstance,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { CustomNode, FlowData, PredefinedTemplate, Position } from '@agenticflow/types';
import { applicationCore } from '@agenticflow/core';
import { FlowEditorProps, EditorNode, EditorEdge, editorEdgeToCustomEdge, customEdgeToEditorEdge } from '../types.js';
import { NodeEditorPanel } from './NodeEditorPanel.js';
import { ExecutionLogView } from './ExecutionLogView.js';
import { CustomNodes } from './CustomNodes.js';

// Import store hooks (these will need to be migrated later or kept as external dependencies)
// For now, we'll import them from the main app - this will be refactored in T022
// import { 
//   useFlowStore,
//   useAvailableNodeTypes,
//   useSelectedNode,
//   useIsExecuting,
//   useExecutionLogs,
//   usePersistenceStore,
// } from '../../../store';

// For now, we'll use a simplified local state approach
// This will be replaced with proper store integration in T022
interface LocalFlowState {
  nodes: EditorNode[];
  edges: EditorEdge[];
  selectedNodeId: string | null;
  isExecuting: boolean;
  executionLogs: any[];
  availableNodeTypes: string[];
}

// Temporary icons until we move them to a proper icons package
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SaveIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const LoadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
  </svg>
);

const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M13 16h-1.586a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 008 13H7m0 0V9h2m-2 4h2m8-4v.01M19 16v.01" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

let idCounter = 0;

export const FlowEditor: React.FC<FlowEditorProps> = ({
  initialNodes = [],
  initialEdges = [],
  initialViewport,
  readonly = false,
  showMiniMap = true,
  showControls = true,
  showBackground = true,
  onFlowChange,
  onNodeSelect,
  onExecutionStart,
  onExecutionComplete,
  onExecutionError,
  className,
  style,
}) => {
  // Local state - will be replaced with Zustand store in T022
  const [flowState, setFlowState] = useState<LocalFlowState>({
    nodes: initialNodes,
    edges: initialEdges,
    selectedNodeId: null,
    isExecuting: false,
    executionLogs: [],
    availableNodeTypes: [],
  });
  
  // Local UI state
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [showLoadOptions, setShowLoadOptions] = useState(false);
  const flowWrapperRef = useRef<HTMLDivElement>(null);

  // Get custom node types from CustomNodes component
  const nodeTypes = useMemo(() => {
    return CustomNodes.getNodeTypes();
  }, []);

  // Get selected node object
  const selectedNode = flowState.nodes.find(node => node.id === flowState.selectedNodeId) || null;

  // Initialize available node types on mount
  useEffect(() => {
    const refreshAvailableNodeTypes = async () => {
      try {
        // Get node types from the node registry
        const types = applicationCore.nodeRegistry.getAllTypes();
        setFlowState(prev => ({
          ...prev,
          availableNodeTypes: types
        }));
      } catch (error) {
        console.error('Failed to load available node types:', error);
      }
    };

    refreshAvailableNodeTypes();
  }, []);

  // Notify parent of flow changes
  useEffect(() => {
    if (onFlowChange) {
      onFlowChange(flowState.nodes, flowState.edges);
    }
  }, [flowState.nodes, flowState.edges, onFlowChange]);

  // Notify parent of node selection changes
  useEffect(() => {
    if (onNodeSelect) {
      onNodeSelect(selectedNode);
    }
  }, [selectedNode, onNodeSelect]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || readonly) return;
      
      const newEdge: EditorEdge = { 
        ...params, 
        id: `edge-${params.source}-${params.sourceHandle || 'default'}-${params.target}-${params.targetHandle || 'default'}`,
        source: params.source,
        target: params.target,
        type: 'smoothstep', 
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
        style: { strokeWidth: 2, stroke: '#6b7280' }
      };
      
      setFlowState(prev => ({
        ...prev,
        edges: [...prev.edges, newEdge]
      }));
    },
    [readonly]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: CustomNode) => {
    if (readonly) return;
    
    setFlowState(prev => ({
      ...prev,
      selectedNodeId: node.id
    }));
  }, [readonly]);

  const onPaneClick = useCallback(() => {
    if (readonly) return;
    
    setFlowState(prev => ({
      ...prev,
      selectedNodeId: null
    }));
  }, [readonly]);

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    if (readonly) return;
    
    setFlowState(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...newData } } 
          : node
      )
    }));
  }, [readonly]);

  const addNode = useCallback((type: string) => {
    if (readonly) return;
    
    console.log('🎯 Adding node of type:', type);
    
    const position: Position = reactFlowInstance?.screenToFlowPosition({
      x: flowWrapperRef.current ? flowWrapperRef.current.clientWidth / 2 - 100 : 250,
      y: flowWrapperRef.current ? flowWrapperRef.current.clientHeight / 3 : 100,
    }) || { x: 250, y: 100 };

    // Create node using the node registry
    const plugin = applicationCore.nodeRegistry.get(type);
    if (!plugin) {
      console.error(`❌ No plugin found for type: ${type}`);
      return;
    }

    const nodeId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNode: EditorNode = {
      id: nodeId,
      type: type,
      position,
      data: {
        ...plugin.createDefaultData(),
        id: nodeId,
        type: type,
        label: plugin.metadata.name,
      },
    };

    console.log('🏗️ Node created:', newNode);
    
    setFlowState(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
  }, [readonly, reactFlowInstance]);

  // Get plugin metadata for UI
  const getPluginMetadata = useCallback((type: string) => {
    const plugin = applicationCore.nodeRegistry.get(type);
    const defaultMetadata = {
      name: type,
      color: getNodeTypeColor(type),
      description: 'Unknown plugin'
    };
    
    if (plugin?.metadata) {
      return {
        ...plugin.metadata,
        color: getNodeTypeColor(type) // Add color property for UI
      };
    }
    
    return defaultMetadata;
  }, []);

  // Helper function to get colors for different node types
  const getNodeTypeColor = (type: string): string => {
    switch (type) {
      case 'triggerNode': return 'bg-green-500';
      case 'httpRequestNode': return 'bg-blue-500';
      case 'llmAgentNode': return 'bg-purple-500';
      case 'conditionNode': return 'bg-yellow-500';
      case 'switchNode': return 'bg-orange-500';
      case 'loopNode': return 'bg-indigo-500';
      case 'dataTransformNode': return 'bg-pink-500';
      case 'delayNode': return 'bg-gray-500';
      case 'endNode': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const exportFlow = useCallback((): FlowData => {
    return {
      nodes: flowState.nodes,
      edges: flowState.edges.map(editorEdgeToCustomEdge),
      viewport: reactFlowInstance?.getViewport() || { x: 0, y: 0, zoom: 1 }
    };
  }, [flowState.nodes, flowState.edges, reactFlowInstance]);

  const saveFlow = useCallback(() => {
    if (!reactFlowInstance) return;
    
    const flow = exportFlow();
    const flowJson = JSON.stringify(flow, null, 2);
    
    // Copy to clipboard and notify
    navigator.clipboard.writeText(flowJson).then(() => {
      alert('Flow exported to clipboard!');
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
      console.log('Flow Export:', flowJson);
      alert('Flow exported to console (clipboard failed)');
    });
  }, [exportFlow, reactFlowInstance]);

  const loadFlow = useCallback((flowData?: FlowData) => {
    if (readonly) return;
    
    if (!flowData) {
      // Prompt user for JSON input
      const flowJson = prompt("Paste your flow JSON here:");
      if (!flowJson) return;
      
      try {
        flowData = JSON.parse(flowJson);
      } catch (error) {
        alert("Invalid JSON format. Please check your input.");
        return;
      }
    }
    
    if (flowData) {
      setFlowState(prev => ({
        ...prev,
        nodes: flowData.nodes || [],
        edges: flowData.edges ? flowData.edges.map(customEdgeToEditorEdge) : [],
        selectedNodeId: null
      }));
      
      if (flowData.viewport && reactFlowInstance) {
        reactFlowInstance.setViewport(flowData.viewport);
      }
      
      idCounter = Math.max(...(flowData.nodes?.map(n => parseInt(n.id.split('-').pop() || '0')) || [0])) + 1;
    }
  }, [readonly, reactFlowInstance]);

  const runFlow = useCallback(async () => {
    if (readonly || flowState.isExecuting) return;
    
    setFlowState(prev => ({ ...prev, isExecuting: true, executionLogs: [] }));
    
    if (onExecutionStart) {
      onExecutionStart();
    }
    
    try {
      console.log('🚀 Starting flow execution...');
      
      // Find trigger nodes to start execution
      const triggerNodes = flowState.nodes.filter(node => node.type === 'triggerNode');
      
      if (triggerNodes.length === 0) {
        throw new Error('No trigger node found. Add a trigger node to start the flow.');
      }
      
      // Simple execution simulation for now
      // Real execution will be implemented when services are migrated
      const result = {
        success: true,
        executedNodes: flowState.nodes.length,
        message: 'Flow execution simulated (services migration pending)',
        timestamp: new Date(),
      };
      
      setFlowState(prev => ({
        ...prev,
        executionLogs: [
          ...prev.executionLogs,
          {
            level: 'info',
            message: 'Flow execution completed successfully',
            timestamp: new Date(),
            data: result,
          }
        ]
      }));
      
      if (onExecutionComplete) {
        onExecutionComplete(result);
      }
      
    } catch (error: any) {
      console.error('❌ Flow execution failed:', error);
      
      setFlowState(prev => ({
        ...prev,
        executionLogs: [
          ...prev.executionLogs,
          {
            level: 'error',
            message: `Flow execution failed: ${error.message}`,
            timestamp: new Date(),
            error,
          }
        ]
      }));
      
      if (onExecutionError) {
        onExecutionError(error);
      }
    } finally {
      setFlowState(prev => ({ ...prev, isExecuting: false }));
    }
  }, [readonly, flowState.isExecuting, flowState.nodes, onExecutionStart, onExecutionComplete, onExecutionError]);

  const clearFlow = useCallback(() => {
    if (readonly) return;
    
    if (window.confirm("Are you sure you want to clear the entire flow? This cannot be undone.")) {
      setFlowState(prev => ({
        ...prev,
        nodes: [],
        edges: [],
        selectedNodeId: null,
        executionLogs: []
      }));
      idCounter = 0;
    }
  }, [readonly]);

  return (
    <div className={`h-full w-full flex ${className || ''}`} style={style} ref={flowWrapperRef}>
      {/* Left Toolbar for Adding Nodes */}
      {!readonly && (
        <div className="w-60 bg-slate-200 p-4 space-y-3 border-r border-slate-300 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Add Nodes</h3>
          {flowState.availableNodeTypes.map((type) => {
            const metadata = getPluginMetadata(type);
            return (
              <button
                key={type}
                onClick={() => addNode(type)}
                className={`w-full flex items-center space-x-2 p-2 rounded-md text-white transition-colors duration-150 ${metadata.color} hover:opacity-90`}
                title={metadata.description}
              >
                <PlusIcon className="w-5 h-5" />
                <span>{metadata.name}</span>
              </button>
            );
          })}
          <div className="pt-4 mt-auto space-y-3">
            <button
              onClick={saveFlow}
              className="w-full flex items-center justify-center space-x-2 p-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-150"
              title="Export Flow"
            >
              <SaveIcon className="w-5 h-5" />
              <span>Export</span>
            </button>
            <button
              onClick={clearFlow}
              className="w-full flex items-center justify-center space-x-2 p-2 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors duration-150"
              title="Clear Flow"
            >
              <TrashIcon className="w-5 h-5" />
              <span>Clear Flow</span>
            </button>
          </div>
        </div>
      )}

      {/* Center React Flow Canvas */}
      <div className="flex-grow h-full relative bg-gradient-to-br from-slate-50 to-slate-200">
        <ReactFlow
          nodes={flowState.nodes}
          edges={flowState.edges}
          onNodesChange={(changes) => {
            if (readonly) return;
            
            changes.forEach(change => {
              if (change.type === 'position' && change.position && change.id) {
                // Update node position
                setFlowState(prev => ({
                  ...prev,
                  nodes: prev.nodes.map(node =>
                    node.id === change.id
                      ? { ...node, position: change.position! }
                      : node
                  )
                }));
              } else if (change.type === 'remove' && change.id) {
                // Remove node
                setFlowState(prev => ({
                  ...prev,
                  nodes: prev.nodes.filter(node => node.id !== change.id),
                  selectedNodeId: prev.selectedNodeId === change.id ? null : prev.selectedNodeId
                }));
              }
            });
          }}
          onEdgesChange={(changes) => {
            if (readonly) return;
            
            changes.forEach(change => {
              if (change.type === 'remove' && change.id) {
                setFlowState(prev => ({
                  ...prev,
                  edges: prev.edges.filter(edge => edge.id !== change.id)
                }));
              }
            });
          }}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          onInit={setReactFlowInstance}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className="bg-transparent"
          deleteKeyCode={readonly ? [] : ['Backspace', 'Delete']}
        >
          {showBackground && (
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
          )}
          {showControls && (
            <Controls className="react-flow__controls_custom !bg-white !shadow-lg !border !border-slate-300" />
          )}
          {showMiniMap && (
            <MiniMap 
              nodeColor={(node: Node) => {
                const metadata = getPluginMetadata(node.type || 'unknown');
                return metadata.color.replace('bg-', '#') || '#e2e8f0';
              }} 
              nodeStrokeWidth={3} 
              className="!border !border-slate-300" 
            />
          )}
          
          {!readonly && (
            <Panel position="top-left" className="!m-0 !p-0">
              <div className="p-2 space-x-2 bg-slate-800 rounded-br-lg shadow-lg">
                <button
                  onClick={saveFlow}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-150"
                  title="Save Flow"
                >
                  <SaveIcon className="w-5 h-5" />
                </button>
                <div className="inline-block relative">
                  <button
                    onClick={() => setShowLoadOptions(prev => !prev)}
                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-150"
                    title="Load Flow / Templates"
                  >
                    <LoadIcon className="w-5 h-5" />
                    {showLoadOptions ? <ChevronUpIcon className="w-4 h-4 inline ml-1" /> : <ChevronDownIcon className="w-4 h-4 inline ml-1" />}
                  </button>
                  {showLoadOptions && (
                    <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <a 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); loadFlow(); }} 
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900" 
                          role="menuitem"
                        >
                          Load from JSON...
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={runFlow}
                  disabled={flowState.isExecuting}
                  className={`p-2 rounded-md text-white transition-colors duration-150 ${
                    flowState.isExecuting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                  title="Run Flow"
                >
                  <PlayIcon className="w-5 h-5" />
                </button>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Right Node Editor Panel */}
      {selectedNode && !readonly && (
        <NodeEditorPanel
          node={selectedNode}
          onUpdateNodeData={updateNodeData}
          onClose={() => setFlowState(prev => ({ ...prev, selectedNodeId: null }))}
        />
      )}

      {/* Bottom Execution Log */}
      <ExecutionLogView log={flowState.executionLogs} />
    </div>
  );
}; 