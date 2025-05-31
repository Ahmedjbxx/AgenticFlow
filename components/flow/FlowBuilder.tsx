
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Node,
  Edge,
  MarkerType,
  Panel,
  ReactFlowInstance,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { CustomNodeType, NodeData, CustomNode, CustomEdge, FlowData, ExecutionLogEntry, PredefinedTemplate, TriggerNodeData, LLMAgentNodeData, ToolActionNodeData, ConditionNodeData, EndNodeData } from '../../types';
import { GEMINI_MODEL_NAME, NODE_TYPE_META, INITIAL_PROMPT_SUGGESTION } from '../../constants';
import NodeEditorPanel from './NodeEditorPanel';
import ExecutionLogView from './ExecutionLogView';
import { generateText } from '../../services/geminiService';
import { executeFlow } from '../../services/mockFlowExecutor';
import {
  TriggerNode,
  LLMAgentNode,
  ToolActionNode,
  ConditionNode,
  EndNode,
} from './CustomNodes';

import { PlusIcon, SaveIcon, LoadIcon, PlayIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from '../icons/EditorIcons';
import { loadLeadQualificationTemplate, loadEmailAssistantTemplate } from '../../utils/templates';


const nodeTypes = {
  [CustomNodeType.TRIGGER]: TriggerNode,
  [CustomNodeType.LLM_AGENT]: LLMAgentNode,
  [CustomNodeType.TOOL_ACTION]: ToolActionNode,
  [CustomNodeType.CONDITION]: ConditionNode,
  [CustomNodeType.END]: EndNode,
};

let idCounter = 0;
const getUniqueNodeId = (type: string) => `${type}_${idCounter++}`;

const FlowBuilder: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<CustomNode | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [executionLog, setExecutionLog] = useState<ExecutionLogEntry[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showLoadOptions, setShowLoadOptions] = useState(false);
  const flowWrapperRef = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = { 
        ...params, 
        id: `edge-${params.source}-${params.sourceHandle}-${params.target}-${params.targetHandle}`,
        type: 'smoothstep', 
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' },
        style: { strokeWidth: 2, stroke: '#6b7280' }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: CustomNode) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeData = useCallback((nodeId: string, newData: Partial<NodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } as NodeData } : node
      )
    );
    // Update selectedNode if it's the one being changed
    setSelectedNode(prev => prev && prev.id === nodeId ? {...prev, data: {...prev.data, ...newData} as NodeData} : prev);
  }, [setNodes]);

  const addNode = (type: CustomNodeType, specificData?: Partial<NodeData>) => {
    const nodeId = getUniqueNodeId(type);
    const position = reactFlowInstance?.screenToFlowPosition({
      x: flowWrapperRef.current ? flowWrapperRef.current.clientWidth / 2 - 100 : 250,
      y: flowWrapperRef.current ? flowWrapperRef.current.clientHeight / 3 : 100,
    }) || { x: 250, y: 100 };

    let newNodeData: NodeData;
    switch (type) {
      case CustomNodeType.TRIGGER:
        newNodeData = { 
          id: nodeId, 
          type, 
          label: 'New Trigger', 
          triggerType: 'Manual', 
          ...(specificData as Partial<TriggerNodeData>) 
        } as TriggerNodeData;
        break;
      case CustomNodeType.LLM_AGENT:
        newNodeData = { 
          id: nodeId, 
          type, 
          label: 'LLM Agent', 
          prompt: INITIAL_PROMPT_SUGGESTION, 
          model: GEMINI_MODEL_NAME, 
          ...(specificData as Partial<LLMAgentNodeData>) 
        } as LLMAgentNodeData;
        break;
      case CustomNodeType.TOOL_ACTION:
        newNodeData = { 
          id: nodeId, 
          type, 
          label: 'Tool Action', 
          toolName: 'Send Email', 
          ...(specificData as Partial<ToolActionNodeData>) 
        } as ToolActionNodeData;
        break;
      case CustomNodeType.CONDITION:
        newNodeData = { 
          id: nodeId, 
          type, 
          label: 'Condition', 
          conditionLogic: 'input.value > 10', 
          ...(specificData as Partial<ConditionNodeData>) 
        } as ConditionNodeData;
        break;
      case CustomNodeType.END:
        newNodeData = { 
          id: nodeId, 
          type, 
          label: 'End Flow', 
          message: 'Flow_Completed', 
          ...(specificData as Partial<EndNodeData>) 
        } as EndNodeData;
        break;
      default:
        // This should be unreachable if CustomNodeType is exhaustive
        const exhaustiveCheck: never = type; 
        throw new Error(`Unknown node type: ${exhaustiveCheck}`);
    }

    const newNode: CustomNode = {
      id: nodeId,
      type, // This should be CustomNodeType, which is correct
      position,
      data: newNodeData, // newNodeData is now correctly typed
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const saveFlow = () => {
    if (reactFlowInstance) {
      const flow: FlowData = reactFlowInstance.toObject() as FlowData; // Cast is needed as toObject type is generic
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
      const { nodes: loadedNodes, edges: loadedEdges, viewport } = flowToLoad;
      setNodes(loadedNodes || []);
      setEdges(loadedEdges || []);
      if (viewport) {
        reactFlowInstance.setViewport(viewport);
      }
      // Reset idCounter based on loaded nodes
      let maxId = 0;
      loadedNodes.forEach(node => {
        const match = node.id.match(/_(\d+)$/);
        if (match && parseInt(match[1]) > maxId) {
          maxId = parseInt(match[1]);
        }
      });
      idCounter = maxId + 1;
      setSelectedNode(null); // Deselect any node
      setExecutionLog([]); // Clear log
    }
    setShowLoadOptions(false);
  };

  const runFlow = async () => {
    setIsExecuting(true);
    setExecutionLog([]);
    const currentFlow: FlowData = { nodes, edges, viewport: reactFlowInstance?.getViewport() };
    
    // For MVP, provide a mock trigger input. In a real app, this would come from the trigger.
    const triggerInput = { data: "Sample trigger data for the flow." }; 
    
    await executeFlow(currentFlow, triggerInput, async (logEntry) => {
      setExecutionLog((prevLog) => [...prevLog, logEntry]);
    }, generateText); // Pass the actual Gemini service function
    
    setIsExecuting(false);
  };
  
  const clearFlow = () => {
    if (window.confirm("Are you sure you want to clear the entire flow? This cannot be undone.")) {
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
      setExecutionLog([]);
      idCounter = 0;
    }
  };

  useEffect(() => {
    // Deselect node if it's deleted
    if (selectedNode && !nodes.find(n => n.id === selectedNode.id)) {
      setSelectedNode(null);
    }
  }, [nodes, selectedNode]);

  const loadTemplate = (templateLoader: () => PredefinedTemplate) => {
    const template = templateLoader();
    if (window.confirm(`Load template "${template.name}"? This will clear the current flow.`)) {
      loadFlow(template.flow);
    }
    setShowLoadOptions(false);
  };

  return (
    <div className="h-full w-full flex" ref={flowWrapperRef}>
      {/* Left Toolbar for Adding Nodes */}
      <div className="w-60 bg-slate-200 p-4 space-y-3 border-r border-slate-300 flex flex-col">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Add Nodes</h3>
        {Object.values(CustomNodeType).map((type) => (
          <button
            key={type}
            onClick={() => addNode(type)}
            className={`w-full flex items-center space-x-2 p-2 rounded-md text-white transition-colors duration-150 ${NODE_TYPE_META[type].color} hover:opacity-90`}
          >
            <PlusIcon className="w-5 h-5" />
            <span>{NODE_TYPE_META[type].name}</span>
          </button>
        ))}
        <div className="pt-4 mt-auto space-y-3">
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
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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
          <MiniMap nodeColor={(node: Node<NodeData>) => NODE_TYPE_META[node.data.type as CustomNodeType]?.color || '#e2e8f0'} nodeStrokeWidth={3} className="!border !border-slate-300" />
          
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
      <ExecutionLogView log={executionLog} />
    </div>
  );
};

export default FlowBuilder;
