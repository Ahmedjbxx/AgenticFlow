import { Node as RFNode, Edge as RFEdge } from 'reactflow';
import { NodeData } from './nodes';

// Override React Flow Node to use our specific data types
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