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

import { CustomNode, FlowData, PredefinedTemplate, Position } from '../../types';
import NodeEditorPanel from './NodeEditorPanel';
import ExecutionLogView from './ExecutionLogView';
import { generateText } from '../../services/geminiService';
// Import the plugin-based flow service instead of old executor
import { PluginFlowService } from '../../services/PluginFlowService';

// Import original beautiful custom nodes
import {
  TriggerNode,
  LLMAgentNode,
  ToolActionNode,
  ConditionNode,
  EndNode,
  LoopNode,
  HttpRequestNode,
  DataTransformNode,
  DelayNode,
  SwitchNode,
} from './CustomNodes';

// Import new store and plugin system
import { 
  useFlowStore,
  useAvailableNodeTypes,
  useSelectedNode,
  useIsExecuting,
  useExecutionLogs,
  usePersistenceStore,
} from '../../store';
import { applicationCore } from '../../core/ApplicationCore';

import { PlusIcon, SaveIcon, LoadIcon, PlayIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from '../icons/EditorIcons';
import { loadLeadQualificationTemplate, loadEmailAssistantTemplate } from '../../utils/templates';

// Import Phase 4 Polish components
import { ErrorBoundary } from '../ErrorBoundary';
import { PerformanceMonitor, usePerformanceTracking } from '../performance/PerformanceMonitor';

let idCounter = 0;

const FlowBuilder: React.FC = () => {
  // Performance tracking disabled to prevent infinite logging
  // usePerformanceTracking('FlowBuilder');

  // Use Zustand store instead of local state
  const store = useFlowStore();
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    addNode: addNodeToStore,
    createNodeFromType,
    refreshAvailableNodeTypes,
    startExecution,
    stopExecution,
    setSelectedNode,
    clearExecutionLogs,
    loadFlow: loadFlowToStore,
    resetFlow,
    addExecutionLog,
  } = store;
  
  const selectedNodeId = useSelectedNode();
  const isExecuting = useIsExecuting();
  const executionLogs = useExecutionLogs();
  const availableNodeTypes = useAvailableNodeTypes();
  
  // Local UI state
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [showLoadOptions, setShowLoadOptions] = useState(false);
  const flowWrapperRef = useRef<HTMLDivElement>(null);

  // Use original beautiful node types with plugin system data - memoized to prevent React Flow warnings
  const nodeTypes = useMemo(() => {
    return {
      // Map plugin types to original beautiful node components
      'triggerNode': TriggerNode,
      'llmAgentNode': LLMAgentNode,
      'toolActionNode': ToolActionNode,
      'conditionNode': ConditionNode,
      'endNode': EndNode,
      'loopNode': LoopNode,
      'httpRequestNode': HttpRequestNode,
      'dataTransformNode': DataTransformNode,
      'delayNode': DelayNode,
      'switchNode': SwitchNode,
    };
  }, []);

  // Get selected node object
  const selectedNode = nodes.find(node => node.id === selectedNodeId) || null;

  // Debug logging - only when nodes change to avoid infinite loop
  useEffect(() => {
    console.log('🔍 FlowBuilder Debug:', {
      availableNodeTypes: availableNodeTypes.length,
      nodesCount: nodes.length,
      nodes,
      nodeTypesKeys: Object.keys(nodeTypes).length,
      selectedNodeId
    });
  }, [nodes.length, selectedNodeId]); // Only depend on nodes.length and selectedNodeId

  // Initialize available node types on mount
  useEffect(() => {
    refreshAvailableNodeTypes();
  }, [refreshAvailableNodeTypes]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      
      const newEdge: Edge = { 
        ...params, 
        id: `edge-${params.source}-${params.sourceHandle || 'default'}-${params.target}-${params.targetHandle || 'default'}`,
        source: params.source,
        target: params.target,
        type: 'smoothstep', 
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
        style: { strokeWidth: 2, stroke: '#6b7280' }
      };
      setEdges([...edges, newEdge]);
    },
    [edges, setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: CustomNode) => {
    setSelectedNode(node.id);
  }, [setSelectedNode]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes(nodes.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...newData } } 
        : node
    ));
  }, [nodes, setNodes]);

  const addNode = (type: string) => {
    console.log('🎯 Adding node of type:', type);
    
    const position: Position = reactFlowInstance?.screenToFlowPosition({
      x: flowWrapperRef.current ? flowWrapperRef.current.clientWidth / 2 - 100 : 250,
      y: flowWrapperRef.current ? flowWrapperRef.current.clientHeight / 3 : 100,
    }) || { x: 250, y: 100 };

    console.log('📍 Position calculated:', position);

    const newNode = createNodeFromType(type, position);
    console.log('🏗️ Node created:', newNode);
    
    if (newNode) {
      console.log('📥 Adding to store, current nodes count:', nodes.length);
      addNodeToStore(newNode);
      console.log('✅ Node added to store, new count should be:', nodes.length + 1);
      
      // Also log what ReactFlow will receive
      setTimeout(() => {
        console.log('⏱️ After timeout - nodes in store:', nodes.length);
        console.log('⏱️ ReactFlow nodes prop:', nodes);
      }, 100);
    } else {
      console.error(`❌ Failed to create node of type: ${type}`);
    }
  };

  const saveFlow = () => {
    if (reactFlowInstance) {
      const flow: FlowData = {
        nodes,
        edges,
        viewport: reactFlowInstance.getViewport()
      };
      const flowJson = JSON.stringify(flow, null, 2);
      // For demo, log to console and alert. In a real app, this would be sent to a backend or downloaded.
      console.log('Flow Saved:', flowJson);
      alert('Flow JSON copied to console! (Simulated Save)');
      navigator.clipboard.writeText(flowJson).catch(err => console.error('Failed to copy flow: ', err));
    }
  };

  const loadFlow = (flowData?: FlowData) => {
    let flowToLoad: FlowData | null = null;
    if (flowData) {
      flowToLoad = flowData;
    } else {
      const jsonInput = prompt('Paste flow JSON here:');
      if (jsonInput) {
        try {
          flowToLoad = JSON.parse(jsonInput) as FlowData;
        } catch (error) {
          alert('Invalid JSON format!');
          console.error('Error parsing flow JSON:', error);
          return;
        }
      }
    }
    
    if (flowToLoad && reactFlowInstance) {
      loadFlowToStore(flowToLoad);
      if (flowToLoad.viewport) {
        reactFlowInstance.setViewport(flowToLoad.viewport);
      }
      // Reset idCounter based on loaded nodes
      let maxId = 0;
      flowToLoad.nodes.forEach(node => {
        const match = node.id.match(/_(\d+)$/);
        if (match && parseInt(match[1]) > maxId) {
          maxId = parseInt(match[1]);
        }
      });
      idCounter = maxId + 1;
    }
    setShowLoadOptions(false);
  };

  const runFlow = async () => {
    startExecution();
    clearExecutionLogs();
    const currentFlow: FlowData = { nodes, edges, viewport: reactFlowInstance?.getViewport() };
    
    // For MVP, provide a mock trigger input. In a real app, this would come from the trigger.
    const triggerInput = { data: "Sample trigger data for the flow." }; 
    
    try {
      // Use the plugin-based flow service
      const pluginFlowService = PluginFlowService.getInstance();
      await pluginFlowService.executeFlow(currentFlow, triggerInput, (logEntry) => {
        // Add log entry to store
        addExecutionLog(logEntry);
        console.log('Execution log:', logEntry);
      });
    } catch (error) {
      console.error('Flow execution failed:', error);
      addExecutionLog({
        nodeId: 'System',
        nodeLabel: 'Flow Execution',
        status: 'error',
        message: `Flow execution failed: ${(error as Error).message}`,
        timestamp: new Date(),
      });
    }
    
    stopExecution();
  };
  
  const clearFlow = () => {
    if (window.confirm("Are you sure you want to clear the entire flow? This cannot be undone.")) {
      resetFlow();
      idCounter = 0;
    }
  };

  // Export flow functionality using store's exportFlow method
  const handleExportFlow = () => {
    const flowData = store.exportFlow();
    const flowJson = JSON.stringify(flowData, null, 2);
    navigator.clipboard.writeText(flowJson).then(() => {
      alert('Flow exported to clipboard!');
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
      // Fallback: log to console
      console.log('Flow Export:', flowJson);
      alert('Flow exported to console (clipboard failed)');
    });
  };

  const loadTemplate = (templateLoader: () => PredefinedTemplate) => {
    const template = templateLoader();
    if (window.confirm(`Load template "${template.name}"? This will clear the current flow.`)) {
      loadFlow(template.flow);
    }
    setShowLoadOptions(false);
  };

  // Get plugin metadata for UI
  const getPluginMetadata = (type: string) => {
    const plugin = applicationCore.nodeRegistry.get(type);
    return plugin?.metadata || {
      name: type,
      color: 'bg-slate-500',
      description: 'Unknown plugin'
    };
  };

  return (
    <ErrorBoundary>
      <div className="h-full w-full flex" ref={flowWrapperRef}>
        {/* Left Toolbar for Adding Nodes */}
        <div className="w-60 bg-slate-200 p-4 space-y-3 border-r border-slate-300 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Add Nodes</h3>
          {availableNodeTypes.map((type) => {
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
              onClick={handleExportFlow}
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

        {/* Center React Flow Canvas */}
        <div className="flex-grow h-full relative bg-gradient-to-br from-slate-50 to-slate-200">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={(changes) => {
              // Let ReactFlow handle internal changes, but sync important ones to store
              changes.forEach(change => {
                if (change.type === 'position' && change.position && change.id) {
                  // Update node position in store
                  const node = nodes.find(n => n.id === change.id);
                  if (node) {
                    // Use store's updateNode method instead of replacing entire array
                    store.updateNode(change.id, { position: change.position });
                  }
                } else if (change.type === 'remove' && change.id) {
                  // Remove node from store
                  store.removeNode(change.id);
                }
              });
            }}
            onEdgesChange={(changes) => {
              // Handle edge changes
              changes.forEach(change => {
                if (change.type === 'remove' && change.id) {
                  store.removeEdge(change.id);
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
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
            <Controls className="react-flow__controls_custom !bg-white !shadow-lg !border !border-slate-300" />
            <MiniMap 
              nodeColor={(node: Node) => {
                const metadata = getPluginMetadata(node.type || 'unknown');
                return metadata.color.replace('bg-', '#') || '#e2e8f0';
              }} 
              nodeStrokeWidth={3} 
              className="!border !border-slate-300" 
            />
            
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
                          <a href="#" onClick={(e) => { e.preventDefault(); loadFlow(); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900" role="menuitem">Load from JSON...</a>
                          <div className="border-t border-slate-200 my-1"></div>
                          <p className="px-4 py-2 text-xs text-slate-500">Templates:</p>
                          <a href="#" onClick={(e) => { e.preventDefault(); loadTemplate(loadLeadQualificationTemplate); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900" role="menuitem">Lead Qualification</a>
                          <a href="#" onClick={(e) => { e.preventDefault(); loadTemplate(loadEmailAssistantTemplate); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900" role="menuitem">Email Assistant</a>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={runFlow}
                    disabled={isExecuting}
                    className={`p-2 rounded-md text-white transition-colors duration-150 ${isExecuting ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                    title="Run Flow"
                  >
                    <PlayIcon className="w-5 h-5" />
                  </button>
                </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Right Node Editor Panel */}
        {selectedNode && (
          <NodeEditorPanel
            node={selectedNode}
            onUpdateNodeData={updateNodeData}
            onClose={() => setSelectedNode(null)}
          />
        )}

        {/* Bottom Execution Log */}
        <ExecutionLogView log={executionLogs} />

        {/* Performance Monitor (Phase 4 addition) - DISABLED to prevent infinite logging */}
        {/* <PerformanceMonitor enabled={process.env.NODE_ENV === 'development'} /> */}
      </div>
    </ErrorBoundary>
  );
};

export default FlowBuilder;
