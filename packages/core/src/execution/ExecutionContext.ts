import type { IEventBus } from '../events/EventBus';
import type { ILogger } from '../logging/Logger';
import type { AppConfig } from '@agenticflow/config';

export interface ExecutionContext {
  flowId: string;
  nodeId: string;
  executionId: string;
  input: any;
  metadata: {
    timestamp: Date;
    retryCount: number;
    totalNodes: number;
    currentNodeIndex: number;
  };
  services: {
    logger: ILogger;
    eventBus: IEventBus;
    config: AppConfig;
  };
  // Helper methods
  replaceVariables: (template: string, variables: any) => string;
  evaluateExpression: (expression: string, variables: any) => any;
  getNodeOutput: (nodeId: string) => any;
  setNodeOutput: (nodeId: string, output: any) => void;
}

// Re-export AppConfig for convenience
export type { AppConfig } from '@agenticflow/config'; 