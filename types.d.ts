import { XYPosition, Node as RFNode, Edge as RFEdge } from 'reactflow';
export type Position = XYPosition;
export declare enum CustomNodeType {
    TRIGGER = "triggerNode",
    LLM_AGENT = "llmAgentNode",
    TOOL_ACTION = "toolActionNode",
    CONDITION = "conditionNode",
    END = "endNode",
    LOOP = "loopNode",
    HTTP_REQUEST = "httpRequestNode",
    DATA_TRANSFORM = "dataTransformNode",
    DELAY = "delayNode",
    SWITCH = "switchNode",
    REAL_NUMBERS = "realNumbersNode",
    STRING = "stringNode",
    MATH = "mathNode"
}
export interface BaseNodeData {
    id: string;
    label: string;
    type: CustomNodeType;
    inputs?: Record<string, any>;
    outputs?: Record<string, any>;
}
export interface TriggerNodeData extends BaseNodeData {
    type: CustomNodeType.TRIGGER;
    triggerType: string;
}
export interface LLMAgentNodeData extends BaseNodeData {
    type: CustomNodeType.LLM_AGENT;
    prompt: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
}
export interface ToolActionNodeData extends BaseNodeData {
    type: CustomNodeType.TOOL_ACTION;
    toolName: string;
    apiEndpoint?: string;
    apiKey?: string;
}
export interface ConditionNodeData extends BaseNodeData {
    type: CustomNodeType.CONDITION;
    conditionLogic: string;
}
export interface EndNodeData extends BaseNodeData {
    type: CustomNodeType.END;
    message: string;
}
export interface LoopNodeData extends BaseNodeData {
    type: CustomNodeType.LOOP;
    iterateOver: string;
    itemVariable: string;
    maxIterations?: number;
}
export interface HttpRequestNodeData extends BaseNodeData {
    type: CustomNodeType.HTTP_REQUEST;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
}
export interface DataTransformNodeData extends BaseNodeData {
    type: CustomNodeType.DATA_TRANSFORM;
    transformType: 'extract' | 'format' | 'parse' | 'filter' | 'custom';
    transformLogic: string;
    outputFormat?: 'json' | 'csv' | 'text' | 'array';
}
export interface DelayNodeData extends BaseNodeData {
    type: CustomNodeType.DELAY;
    delayType: 'fixed' | 'dynamic' | 'until';
    duration?: number;
    durationExpression?: string;
    untilCondition?: string;
}
export interface SwitchNodeData extends BaseNodeData {
    type: CustomNodeType.SWITCH;
    switchExpression: string;
    cases: Array<{
        value: string;
        label: string;
    }>;
    defaultCase?: boolean;
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
    operandAVariable?: string;
    operandBVariable?: string;
    useVariables: boolean;
}
export type NodeData = TriggerNodeData | LLMAgentNodeData | ToolActionNodeData | ConditionNodeData | EndNodeData | LoopNodeData | HttpRequestNodeData | DataTransformNodeData | DelayNodeData | SwitchNodeData | RealNumbersNodeData | StringNodeData | MathNodeData;
export type CustomNode = RFNode<NodeData>;
export type CustomEdge = RFEdge;
export interface FlowData {
    nodes: CustomNode[];
    edges: CustomEdge[];
    viewport?: {
        x: number;
        y: number;
        zoom: number;
    };
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
//# sourceMappingURL=types.d.ts.map