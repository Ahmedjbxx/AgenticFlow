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
    logger: Logger;
    eventBus: EventBus;
    config: AppConfig;
  };
  // Helper methods
  replaceVariables: (template: string, variables: any) => string;
  evaluateExpression: (expression: string, variables: any) => any;
  getNodeOutput: (nodeId: string) => any;
  setNodeOutput: (nodeId: string, output: any) => void;
}

export interface Logger {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: Error, data?: any): void;
}

export interface EventBus {
  emit<T>(event: string, data: T): void;
  on(event: string, callback: Function): () => void;
  off(event: string, callback: Function): void;
}

export interface AppConfig {
  execution: {
    defaultTimeout: number;
    maxIterations: number;
    retryAttempts: number;
  };
  api: {
    geminiApiKey: string;
    defaultModel: string;
  };
  ui: {
    theme: 'light' | 'dark';
    autoSave: boolean;
    debugMode: boolean;
  };
} 