import { Node, Edge, ReactFlowInstance, MarkerType } from 'reactflow';
import { CustomNode, FlowData, CustomNodeType, CustomEdge } from '@agenticflow/types';

export interface EditorNode extends CustomNode {
  // Editor-specific node properties
  selected?: boolean;
  dragging?: boolean;
}

// Instead of extending Edge directly (which has issues), create a type that includes all Edge properties
export interface EditorEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  animated?: boolean;
  hidden?: boolean;
  style?: React.CSSProperties;
  className?: string;
  data?: any;
  label?: string | React.ReactNode;
  labelStyle?: React.CSSProperties;
  labelShowBg?: boolean;
  labelBgStyle?: React.CSSProperties;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  markerStart?: { type: MarkerType; color?: string; } | string;
  markerEnd?: { type: MarkerType; color?: string; } | string;
  // Editor-specific properties
  highlighted?: boolean;
}

export interface FlowEditorProps {
  // Initial flow data
  initialNodes?: EditorNode[];
  initialEdges?: EditorEdge[];
  initialViewport?: { x: number; y: number; zoom: number };
  
  // Editor configuration
  readonly?: boolean;
  showMiniMap?: boolean;
  showControls?: boolean;
  showBackground?: boolean;
  
  // Event handlers
  onFlowChange?: (nodes: EditorNode[], edges: EditorEdge[]) => void;
  onNodeSelect?: (node: EditorNode | null) => void;
  onExecutionStart?: () => void;
  onExecutionComplete?: (result: any) => void;
  onExecutionError?: (error: Error) => void;
  
  // Custom styling
  className?: string;
  style?: React.CSSProperties;
}

export interface FlowEditorState {
  nodes: EditorNode[];
  edges: EditorEdge[];
  selectedNodeId: string | null;
  isExecuting: boolean;
  reactFlowInstance: ReactFlowInstance | null;
}

export interface EditorContext {
  state: FlowEditorState;
  addNode: (type: string, position?: { x: number; y: number }) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<EditorNode>) => void;
  selectNode: (nodeId: string | null) => void;
  executeFlow: () => Promise<void>;
  clearFlow: () => void;
  exportFlow: () => FlowData;
  importFlow: (data: FlowData) => void;
}

// Helper function to convert EditorEdge to CustomEdge for compatibility
export function editorEdgeToCustomEdge(editorEdge: EditorEdge): CustomEdge {
  const result: CustomEdge = {
    id: editorEdge.id,
    source: editorEdge.source,
    target: editorEdge.target,
    sourceHandle: editorEdge.sourceHandle ?? null,
    targetHandle: editorEdge.targetHandle ?? null,
    type: editorEdge.type ?? 'default',
    animated: editorEdge.animated ?? false,
    data: editorEdge.data,
  };
  
  // Only include style if it's defined
  if (editorEdge.style) {
    result.style = editorEdge.style;
  }
  
  return result;
}

// Helper function to convert CustomEdge to EditorEdge
export function customEdgeToEditorEdge(customEdge: CustomEdge): EditorEdge {
  const result: EditorEdge = {
    id: customEdge.id,
    source: customEdge.source,
    target: customEdge.target,
    sourceHandle: customEdge.sourceHandle ?? null,
    targetHandle: customEdge.targetHandle ?? null,
    type: customEdge.type ?? 'default',
    animated: customEdge.animated ?? false,
    data: customEdge.data,
  };
  
  // Only include style if it's defined
  if (customEdge.style) {
    result.style = customEdge.style;
  }
  
  return result;
} 