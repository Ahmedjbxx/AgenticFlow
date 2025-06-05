import { XYPosition } from 'reactflow';

// Re-export XYPosition for use throughout the application
export type Position = XYPosition;

export enum CustomNodeType {
  TRIGGER = 'triggerNode',
  LLM_AGENT = 'llmAgentNode',
  TOOL_ACTION = 'toolActionNode',
  CONDITION = 'conditionNode',
  END = 'endNode',
  LOOP = 'loopNode',
  HTTP_REQUEST = 'httpRequestNode',
  DATA_TRANSFORM = 'dataTransformNode',
  DELAY = 'delayNode',
  SWITCH = 'switchNode',
  REAL_NUMBERS = 'realNumbersNode',
  STRING = 'stringNode',
  MATH = 'mathNode',
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
  temperature?: number; // AI creativity/randomness (0-1)
  maxTokens?: number; // Maximum response length
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

export interface LoopNodeData extends BaseNodeData {
  type: CustomNodeType.LOOP;
  iterateOver: string; // e.g., "input.items" - what array to loop over
  itemVariable: string; // e.g., "item" - variable name for current item
  maxIterations?: number; // Optional limit to prevent infinite loops
}

export interface HttpRequestNodeData extends BaseNodeData {
  type: CustomNodeType.HTTP_REQUEST;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string; // Can include variables like {input.endpoint}
  headers?: Record<string, string>;
  body?: string; // JSON string or template
  timeout?: number; // Request timeout in milliseconds
}

export interface DataTransformNodeData extends BaseNodeData {
  type: CustomNodeType.DATA_TRANSFORM;
  transformType: 'extract' | 'format' | 'parse' | 'filter' | 'custom';
  transformLogic: string; // JavaScript transformation logic
  outputFormat?: 'json' | 'csv' | 'text' | 'array';
}

export interface DelayNodeData extends BaseNodeData {
  type: CustomNodeType.DELAY;
  delayType: 'fixed' | 'dynamic' | 'until';
  duration?: number; // milliseconds for fixed delay
  durationExpression?: string; // e.g., "input.waitTime" for dynamic
  untilCondition?: string; // e.g., "input.ready === true" for conditional wait
}

export interface SwitchNodeData extends BaseNodeData {
  type: CustomNodeType.SWITCH;
  switchExpression: string; // e.g., "input.category"
  cases: Array<{
    value: string; // e.g., "urgent", "normal", "low"
    label: string; // Display label for the case
  }>;
  defaultCase?: boolean; // Whether to include a default case
}

export interface RealNumbersNodeData extends BaseNodeData {
  type: CustomNodeType.REAL_NUMBERS;
  minValue: number;
  maxValue: number;
  decimalPlaces: number;
}

export interface StringNodeData extends BaseNodeData {
  type: CustomNodeType.STRING;
  inputString: string;
  outputPrefix: string;
}

export interface MathNodeData extends BaseNodeData {
  type: CustomNodeType.MATH;
  operation: '+' | '-' | '*' | '/';
  operandA: number;
  operandB: number;
  operandAVariable?: string; // Optional variable reference
  operandBVariable?: string; // Optional variable reference
  useVariables: boolean; // Whether to use variables instead of fixed values
}

export type NodeData = TriggerNodeData | LLMAgentNodeData | ToolActionNodeData | ConditionNodeData | EndNodeData | LoopNodeData | HttpRequestNodeData | DataTransformNodeData | DelayNodeData | SwitchNodeData | RealNumbersNodeData | StringNodeData | MathNodeData; 