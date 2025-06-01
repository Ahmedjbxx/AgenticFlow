import React from 'react';
import { ExecutionContext } from '../../core/execution/ExecutionContext';
import { VariableDefinition } from '../../core/variables/VariableRegistry';

export interface NodePluginMetadata {
  type: string;
  name: string;
  description: string;
  version: string;
  category: 'trigger' | 'action' | 'condition' | 'transform' | 'utility';
  icon: string;
  color: string;
}

export interface NodeEditorContext {
  nodeId: string;
  availableVariables: any[];
}

export abstract class NodePlugin<TData = any> {
  abstract readonly metadata: NodePluginMetadata;
  
  // Core functionality
  abstract createDefaultData(): TData;
  abstract execute(input: any, data: TData, context: ExecutionContext): Promise<any>;
  
  // UI components with optional context for variable system
  abstract renderEditor(data: TData, onChange: (data: TData) => void, context?: NodeEditorContext): React.ReactNode;
  abstract renderNode(data: TData): React.ReactNode;
  
  // Variable system - declare what variables this node outputs
  abstract getOutputSchema(): VariableDefinition[];
  
  // Optional lifecycle hooks
  onBeforeExecute?(context: ExecutionContext): Promise<void> {
    // Default implementation - do nothing
  }
  
  onAfterExecute?(output: any, context: ExecutionContext): Promise<void> {
    // Default implementation - do nothing
  }
  
  onError?(error: Error, context: ExecutionContext): Promise<void> {
    // Default implementation - re-throw error
    throw error;
  }
  
  // Validation
  validateData?(data: TData): string[] {
    // Default implementation - no validation errors
    return [];
  }
  
  // Configuration
  getRequiredConnections?(): { inputs: number; outputs: number } {
    return { inputs: 1, outputs: 1 };
  }
  
  // Help text
  getHelpText?(): string {
    return this.metadata.description;
  }
}

export interface NodePluginRegistration {
  plugin: NodePlugin;
  enabled: boolean;
  loadedAt: Date;
} 