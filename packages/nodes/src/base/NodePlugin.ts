import React from 'react';
import { ExecutionContext } from '@agenticflow/core';
import { VariableDefinition } from '@agenticflow/core';
import { ILogger } from '@agenticflow/core';

export interface NodePluginMetadata {
  type: string;
  name: string;
  description: string;
  version: string;
  category: 'trigger' | 'action' | 'condition' | 'transform' | 'utility';
  icon: string;
  color: string;
  tags?: string[];
  author?: string;
  documentation?: string;
}

export interface NodeEditorContext {
  nodeId: string;
  availableVariables: any[];
  logger?: ILogger;
}

export interface NodeExecutionMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  inputSize?: number;
  outputSize?: number;
  memoryUsage?: number;
}

export interface NodeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export abstract class NodePlugin<TData = any> {
  abstract readonly metadata: NodePluginMetadata;
  
  private logger?: ILogger | undefined;
  private executionMetrics: Map<string, NodeExecutionMetrics> = new Map();
  
  // Core functionality
  abstract createDefaultData(): TData;
  abstract execute(input: any, data: TData, context: ExecutionContext): Promise<any>;
  
  // UI components with optional context for variable system
  abstract renderEditor(data: TData, onChange: (data: TData) => void, context?: NodeEditorContext): React.ReactNode;
  abstract renderNode(data: TData): React.ReactNode;
  
  // Variable system - declare what variables this node outputs
  abstract getOutputSchema(): VariableDefinition[];
  
  /**
   * Initialize the plugin with a logger
   */
  initialize(logger?: ILogger): void {
    this.logger = logger?.child({ nodeId: `plugin-${this.metadata.type}` });
    this.onInitialize?.();
  }
  
  /**
   * Enhanced execution wrapper with metrics and error handling
   */
  async executeWithMetrics(input: any, data: TData, context: ExecutionContext): Promise<any> {
    const executionId = `${context.nodeId}-${Date.now()}`;
    const startTime = performance.now();
    
    this.executionMetrics.set(executionId, {
      startTime,
      inputSize: this.calculateDataSize(input),
    });
    
    this.logger?.debug(`Starting execution of ${this.metadata.type}`, {
      nodeId: context.nodeId,
      executionId,
      inputData: input,
    });
    
    try {
      // Pre-execution hook
      await this.onBeforeExecute?.(context);
      
      // Main execution
      const output = await this.execute(input, data, context);
      
      // Post-execution hook
      await this.onAfterExecute?.(output, context);
      
      const endTime = performance.now();
      const metrics = this.executionMetrics.get(executionId)!;
      metrics.endTime = endTime;
      metrics.duration = endTime - startTime;
      metrics.outputSize = this.calculateDataSize(output);
      
      this.logger?.info(`Execution completed successfully`, {
        nodeId: context.nodeId,
        executionId,
        duration: metrics.duration,
        inputSize: metrics.inputSize,
        outputSize: metrics.outputSize,
      });
      
      return output;
      
    } catch (error) {
      const endTime = performance.now();
      const metrics = this.executionMetrics.get(executionId)!;
      metrics.endTime = endTime;
      metrics.duration = endTime - startTime;
      
      this.logger?.error(`Execution failed`, error as Error, {
        nodeId: context.nodeId,
        executionId,
        duration: metrics.duration,
      });
      
      // Error handling hook
      await this.onError?.(error as Error, context);
      
      throw error;
    } finally {
      // Clean up old metrics (keep last 100)
      if (this.executionMetrics.size > 100) {
        const entries = Array.from(this.executionMetrics.entries());
        entries.slice(0, -100).forEach(([key]) => {
          this.executionMetrics.delete(key);
        });
      }
    }
  }
  
  /**
   * Enhanced validation with warnings and detailed error messages
   */
  validate(data: TData): NodeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Basic data validation
    if (data === null || data === undefined) {
      errors.push('Node data cannot be null or undefined');
    }
    
    // Plugin-specific validation
    const validationErrors = this.validateData?.(data) || [];
    errors.push(...validationErrors);
    
    // Connection validation
    const requiredConnections = this.getRequiredConnections?.();
    if (requiredConnections) {
      // This would be validated by the flow editor
      this.logger?.debug('Required connections', requiredConnections);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
  
  // Optional lifecycle hooks
  onInitialize?(): void;
  onBeforeExecute?(context: ExecutionContext): Promise<void>;
  onAfterExecute?(output: any, context: ExecutionContext): Promise<void>;
  onError?(error: Error, context: ExecutionContext): Promise<void>;
  onDestroy?(): void;
  
  // Validation
  validateData?(data: TData): string[];
  
  // Configuration
  getRequiredConnections?(): { inputs: number; outputs: number } {
    return { inputs: 1, outputs: 1 };
  }
  
  // Help and documentation
  getHelpText?(): string {
    return this.metadata.description;
  }
  
  getDocumentationUrl?(): string | undefined {
    return this.metadata.documentation;
  }
  
  // Performance metrics
  getExecutionMetrics(): NodeExecutionMetrics[] {
    return Array.from(this.executionMetrics.values());
  }
  
  getAverageExecutionTime(): number {
    const metrics = this.getExecutionMetrics();
    if (metrics.length === 0) return 0;
    
    const totalTime = metrics.reduce((sum, metric) => sum + (metric.duration || 0), 0);
    return totalTime / metrics.length;
  }
  
  // Utility methods
  private calculateDataSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
  
  /**
   * Cleanup method
   */
  destroy(): void {
    this.executionMetrics.clear();
    this.onDestroy?.();
    this.logger?.debug(`Plugin ${this.metadata.type} destroyed`);
  }
}

export interface NodePluginRegistration {
  plugin: NodePlugin;
  enabled: boolean;
  loadedAt: Date;
  metadata: NodePluginMetadata;
  version: string;
} 