
import { XYPosition, Node as RFNode, Edge as RFEdge } from 'reactflow';

export enum CustomNodeType {
  TRIGGER = 'triggerNode',
  LLM_AGENT = 'llmAgentNode',
  TOOL_ACTION = 'toolActionNode',
  CONDITION = 'conditionNode',
  END = 'endNode',
}

export interface BaseNodeData {
  id: string;
  label: string;
  type: CustomNodeType;
  inputs?: Record<string, any>; // Data coming into the node
  outputs?: Record<string, any>; // Data going out of the node
}

export interface TriggerNodeData extends BaseNodeData {
  type: CustomNodeType.TRIGGER;
  triggerType: string; // e.g., "New Email", "New Lead"
}

export interface LLMAgentNodeData extends BaseNodeData {
  type: CustomNodeType.LLM_AGENT;
  prompt: string;
  model: string; // e.g., 'gemini-2.5-flash-preview-04-17'
}

export interface ToolActionNodeData extends BaseNodeData {
  type: CustomNodeType.TOOL_ACTION;
  toolName: string; // e.g., "Send Email", "Update Notion"
  apiEndpoint?: string; // Optional: for custom API calls
  apiKey?: string; // Placeholder for tool-specific API key
}

export interface ConditionNodeData extends BaseNodeData {
  type: CustomNodeType.CONDITION;
  conditionLogic: string; // e.g., "input.isQualified === true"
}

export interface EndNodeData extends BaseNodeData {
  type: CustomNodeType.END;
  message: string;
}

export type NodeData = TriggerNodeData | LLMAgentNodeData | ToolActionNodeData | ConditionNodeData | EndNodeData;

// Override React Flow Node to use our specific data types
export type CustomNode = RFNode<NodeData>;
export type CustomEdge = RFEdge;

export interface FlowData {
  nodes: CustomNode[];
  edges: CustomEdge[];
  viewport?: any;
}

export interface ExecutionLogEntry {
  nodeId: string;
  nodeLabel: string;
  status: 'processing' | 'success' | 'error' | 'skipped';
  message: string;
  timestamp: Date;
  input?: any;
  output?: any;
}

export interface PredefinedTemplate {
  name: string;
  description: string;
  flow: FlowData;
}
    