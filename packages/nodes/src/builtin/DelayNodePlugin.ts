import React from 'react';
import { NodePlugin, NodePluginMetadata, NodeEditorContext } from '../base/NodePlugin.js';
import { ExecutionContext, VariableDefinition } from '@agenticflow/core';
import { DelayNodeData } from '@agenticflow/types';

export class DelayNodePlugin extends NodePlugin<DelayNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'delayNode',
    name: 'Delay',
    description: 'Add time delays or wait for conditions in workflow execution with flexible timing options',
    version: '1.1.0',
    category: 'utility',
    icon: 'ClockIcon',
    color: 'bg-blue-500',
    tags: ['delay', 'wait', 'timing', 'control-flow', 'scheduling'],
    author: 'AgenticFlow Team',
    documentation: 'https://docs.agenticflow.com/nodes/delay-node',
  };

  createDefaultData(): DelayNodeData {
    return {
      id: '',
      type: 'delayNode' as any,
      label: 'Delay',
      delayType: 'fixed',
      duration: 1000,
    };
  }

  getOutputSchema(): VariableDefinition[] {
    return [
      {
        name: 'delayCompleted',
        type: 'boolean',
        description: 'Whether the delay completed successfully',
        example: true
      },
      {
        name: 'delayType',
        type: 'string',
        description: 'Type of delay that was executed',
        example: 'fixed'
      },
      {
        name: 'expectedDelay',
        type: 'number',
        description: 'Expected delay duration in milliseconds',
        example: 5000
      },
      {
        name: 'actualWaitTime',
        type: 'number',
        description: 'Actual time waited in milliseconds',
        example: 5002.5
      },
      {
        name: 'delayStartTime',
        type: 'number',
        description: 'Timestamp when delay started',
        example: 1704067200000
      },
      {
        name: 'delayEndTime',
        type: 'number',
        description: 'Timestamp when delay ended',
        example: 1704067205000
      },
      {
        name: 'delayStats',
        type: 'object',
        description: 'Detailed statistics about the delay execution',
        example: {
          type: 'fixed',
          startTime: '2024-01-01T12:00:00.000Z',
          endTime: '2024-01-01T12:00:05.000Z',
          accuracy: 99.95
        }
      }
    ];
  }

  async execute(input: any, data: DelayNodeData, context: ExecutionContext): Promise<any> {
    const { logger, eventBus } = context.services;
    
    logger?.info(`Executing delay: ${data.delayType}`);
    eventBus?.emit('node.execution.started', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      input,
    });

    const startTime = Date.now();
    const startTimeISO = new Date().toISOString();

    try {
      let expectedDelay: number;
      
      switch (data.delayType) {
        case 'fixed':
          expectedDelay = await this.executeFixedDelay(data, context);
          break;
        case 'dynamic':
          expectedDelay = await this.executeDynamicDelay(input, data, context);
          break;
        case 'until':
          expectedDelay = await this.executeConditionalDelay(input, data, context);
          break;
        default:
          throw new Error(`Unknown delay type: ${data.delayType}`);
      }

      const endTime = Date.now();
      const endTimeISO = new Date().toISOString();
      const actualWaitTime = endTime - startTime;
      const accuracy = expectedDelay > 0 ? ((actualWaitTime / expectedDelay) * 100) : 100;

      const output = {
        ...input,
        delayCompleted: true,
        delayType: data.delayType,
        expectedDelay,
        actualWaitTime,
        delayStartTime: startTime,
        delayEndTime: endTime,
        delayStats: {
          type: data.delayType,
          startTime: startTimeISO,
          endTime: endTimeISO,
          expectedMs: expectedDelay,
          actualMs: actualWaitTime,
          accuracy: parseFloat(accuracy.toFixed(2)),
          successful: true,
        },
      };

      logger?.info(`Delay completed: ${actualWaitTime}ms (expected: ${expectedDelay}ms, accuracy: ${accuracy.toFixed(1)}%)`);
      eventBus?.emit('node.execution.completed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        output,
      });

      return output;

    } catch (error: any) {
      const actualWaitTime = Date.now() - startTime;
      logger?.error(`Delay execution failed: ${error.message}`, error);
      eventBus?.emit('node.execution.failed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        error,
      });
      
      const errorOutput = {
        ...input,
        delayCompleted: false,
        delayType: data.delayType,
        delayError: error.message,
        actualWaitTime,
        delayStats: {
          type: data.delayType,
          startTime: startTimeISO,
          endTime: new Date().toISOString(),
          actualMs: actualWaitTime,
          successful: false,
          error: error.message,
        },
      };
      
      return errorOutput;
    }
  }

  private async executeFixedDelay(data: DelayNodeData, context: ExecutionContext): Promise<number> {
    const delay = data.duration || 1000;
    
    // Validate delay bounds
    if (delay < 0) {
      throw new Error('Delay duration cannot be negative');
    }
    
    const maxDelay = 5 * 60 * 1000; // 5 minutes
    if (delay > maxDelay) {
      throw new Error(`Delay duration cannot exceed ${maxDelay}ms (5 minutes)`);
    }
    
    context.services.logger?.info(`Fixed delay: ${delay}ms`);
    
    await this.sleep(delay);
    return delay;
  }

  private async executeDynamicDelay(input: any, data: DelayNodeData, context: ExecutionContext): Promise<number> {
    if (!data.durationExpression) {
      throw new Error('Duration expression is required for dynamic delay');
    }

    // Process expression with variable substitution
    const processedExpression = context.replaceVariables(data.durationExpression, input);
    
    let dynamicDelay: number;
    try {
      // Create a safe evaluation function
      const evaluateFunction = new Function('input', 'context', `"use strict"; return (${processedExpression});`);
      dynamicDelay = evaluateFunction(input, context);
    } catch (evalError) {
      throw new Error(`Failed to evaluate duration expression: ${(evalError as Error).message}`);
    }
    
    if (typeof dynamicDelay !== 'number' || dynamicDelay < 0) {
      throw new Error(`Invalid dynamic delay value: ${dynamicDelay}. Must be a positive number.`);
    }

    // Cap the delay to prevent extremely long waits
    const maxDelay = 5 * 60 * 1000; // 5 minutes
    const actualDelay = Math.min(dynamicDelay, maxDelay);
    
    if (dynamicDelay > maxDelay) {
      context.services.logger?.warn(`Dynamic delay capped from ${dynamicDelay}ms to ${maxDelay}ms`);
    }

    context.services.logger?.info(`Dynamic delay: ${actualDelay}ms (expression: ${data.durationExpression} → ${processedExpression})`);
    
    await this.sleep(actualDelay);
    return actualDelay;
  }

  private async executeConditionalDelay(input: any, data: DelayNodeData, context: ExecutionContext): Promise<number> {
    if (!data.untilCondition) {
      throw new Error('Until condition is required for conditional delay');
    }

    const startTime = Date.now();
    const maxWaitTime = 10 * 60 * 1000; // 10 minutes maximum
    const checkInterval = 1000; // Check every second
    
    // Process condition with variable substitution
    const processedCondition = context.replaceVariables(data.untilCondition, input);
    
    context.services.logger?.info(`Conditional delay: waiting until ${processedCondition}`);
    
    while (true) {
      const elapsed = Date.now() - startTime;
      
      // Check timeout
      if (elapsed > maxWaitTime) {
        throw new Error(`Conditional delay timed out after ${maxWaitTime}ms`);
      }

      // Evaluate condition
      try {
        const evaluateFunction = new Function('input', 'context', `"use strict"; return !!(${processedCondition});`);
        const conditionMet = evaluateFunction(input, context);
        
        if (conditionMet) {
          context.services.logger?.info(`Condition met after ${elapsed}ms`);
          return elapsed;
        }
      } catch (conditionError) {
        throw new Error(`Error evaluating condition: ${(conditionError as Error).message}`);
      }

      // Emit progress event
      context.services.eventBus?.emit('delay.waiting', {
        nodeId: context.nodeId,
        elapsed,
        condition: processedCondition,
        originalCondition: data.untilCondition,
      });

      // Wait before next check
      await this.sleep(checkInterval);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  renderEditor(data: DelayNodeData, onChange: (data: DelayNodeData) => void, context?: NodeEditorContext): React.ReactNode {
    return React.createElement('div', { className: 'space-y-4' }, [
      // Delay Type selector
      React.createElement('div', { key: 'delayType' }, [
        React.createElement('label', {
          key: 'delayType-label',
          htmlFor: 'delayType',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Delay Type'),
        React.createElement('select', {
          key: 'delayType-select',
          id: 'delayType',
          value: data.delayType,
          onChange: (e: any) => onChange({ ...data, delayType: e.target.value as any }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
        }, [
          React.createElement('option', { key: 'fixed', value: 'fixed' }, 'Fixed - Specific duration'),
          React.createElement('option', { key: 'dynamic', value: 'dynamic' }, 'Dynamic - Variable duration'),
          React.createElement('option', { key: 'until', value: 'until' }, 'Until - Wait for condition'),
        ])
      ]),

      // Fixed Duration field (for fixed delay)
      data.delayType === 'fixed' && React.createElement('div', { key: 'duration' }, [
        React.createElement('label', {
          key: 'duration-label',
          htmlFor: 'duration',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Duration (milliseconds)'),
        React.createElement('input', {
          key: 'duration-input',
          type: 'number',
          id: 'duration',
          value: data.duration || 1000,
          onChange: (e: any) => onChange({ ...data, duration: parseInt(e.target.value) || 1000 }),
          min: 0,
          max: 300000, // 5 minutes max
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
        }),
        React.createElement('p', {
          key: 'duration-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Fixed delay in milliseconds (0-300000). Common values: 1000ms = 1 second, 60000ms = 1 minute')
      ]),

      // Dynamic Duration Expression field (for dynamic delay)
      data.delayType === 'dynamic' && React.createElement('div', { key: 'durationExpression' }, [
        React.createElement('label', {
          key: 'durationExpression-label',
          htmlFor: 'durationExpression',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Duration Expression'),
        React.createElement('input', {
          key: 'durationExpression-input',
          type: 'text',
          id: 'durationExpression',
          value: data.durationExpression || '',
          onChange: (e: any) => onChange({ ...data, durationExpression: e.target.value }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono',
          placeholder: 'input.waitTime * 1000'
        }),
        React.createElement('p', {
          key: 'durationExpression-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'JavaScript expression that evaluates to delay in milliseconds. Supports variable substitution.'),
        
        // Show available variables if context is provided
        context?.availableVariables && context.availableVariables.length > 0 && React.createElement('div', {
          key: 'available-vars',
          className: 'mt-2 p-2 bg-slate-50 rounded text-xs'
        }, [
          React.createElement('p', { key: 'vars-title', className: 'font-medium text-slate-700' }, 'Available Variables:'),
          React.createElement('div', { key: 'vars-list', className: 'mt-1 flex flex-wrap gap-1' },
            context.availableVariables.slice(0, 6).map((variable: any, index: number) => 
              React.createElement('code', {
                key: index,
                className: 'px-1 bg-slate-200 rounded text-slate-600',
                title: variable.description || `Type: ${variable.type}`
              }, `{${variable.fullPath || variable.name}}`)
            )
          )
        ])
      ]),

      // Until Condition field (for conditional delay)
      data.delayType === 'until' && React.createElement('div', { key: 'untilCondition' }, [
        React.createElement('label', {
          key: 'untilCondition-label',
          htmlFor: 'untilCondition',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Until Condition'),
        React.createElement('input', {
          key: 'untilCondition-input',
          type: 'text',
          id: 'untilCondition',
          value: data.untilCondition || '',
          onChange: (e: any) => onChange({ ...data, untilCondition: e.target.value }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono',
          placeholder: 'input.ready === true'
        }),
        React.createElement('p', {
          key: 'untilCondition-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Boolean expression to wait for (checked every second, max 10 minutes). Supports variable substitution.'),
        
        // Show available variables if context is provided
        context?.availableVariables && context.availableVariables.length > 0 && React.createElement('div', {
          key: 'available-vars',
          className: 'mt-2 p-2 bg-slate-50 rounded text-xs'
        }, [
          React.createElement('p', { key: 'vars-title', className: 'font-medium text-slate-700' }, 'Available Variables:'),
          React.createElement('div', { key: 'vars-list', className: 'mt-1 flex flex-wrap gap-1' },
            context.availableVariables.slice(0, 6).map((variable: any, index: number) => 
              React.createElement('code', {
                key: index,
                className: 'px-1 bg-slate-200 rounded text-slate-600',
                title: variable.description || `Type: ${variable.type}`
              }, `{${variable.fullPath || variable.name}}`)
            )
          )
        ])
      ]),

      // Examples section
      React.createElement('div', { key: 'examples' }, [
        React.createElement('label', {
          key: 'examples-label',
          className: 'block text-sm font-medium text-slate-700 mb-2'
        }, 'Examples:'),
        React.createElement('div', {
          key: 'examples-list',
          className: 'text-xs text-slate-600 space-y-1'
        }, this.getExamplesForType(data.delayType).map((example, index) =>
          React.createElement('div', { key: index }, `• ${example}`)
        ))
      ])
    ]);
  }

  private getExamplesForType(type: string): string[] {
    switch (type) {
      case 'fixed':
        return [
          '1000 = 1 second',
          '5000 = 5 seconds',
          '60000 = 1 minute',
          '300000 = 5 minutes (maximum)'
        ];
      case 'dynamic':
        return [
          '{input.delaySeconds} * 1000',
          '{httpResponse.retryAfter} * 1000',
          'Math.min({input.timeout}, 30000)',
          '{input.priority} === "high" ? 1000 : 5000'
        ];
      case 'until':
        return [
          '{input.status} === "ready"',
          '{httpResponse.data.processing} === false',
          '{input.count} >= 10',
          'Date.now() > {input.startTime} + 60000'
        ];
      default:
        return [];
    }
  }

  renderNode(data: DelayNodeData): React.ReactNode {
    const getDisplayText = () => {
      switch (data.delayType) {
        case 'fixed':
          const duration = data.duration || 1000;
          if (duration >= 60000) {
            return `${(duration / 60000).toFixed(1)}m`;
          } else if (duration >= 1000) {
            return `${(duration / 1000).toFixed(1)}s`;
          } else {
            return `${duration}ms`;
          }
        case 'dynamic':
          return data.durationExpression?.substring(0, 15) + (data.durationExpression && data.durationExpression.length > 15 ? '...' : '') || 'Dynamic';
        case 'until':
          return data.untilCondition?.substring(0, 15) + (data.untilCondition && data.untilCondition.length > 15 ? '...' : '') || 'Until...';
        default:
          return 'Delay';
      }
    };

    const typeIcons: Record<string, string> = {
      fixed: '⏱️',
      dynamic: '⚡',
      until: '⏳'
    };

    const icon = typeIcons[data.delayType] || '⏰';

    return React.createElement('div', { className: 'text-xs' }, [
      React.createElement('p', { key: 'type', className: 'font-medium' },
        `${icon} ${data.delayType}`
      ),
      React.createElement('p', { key: 'value', className: 'text-slate-600', title: data.delayType === 'fixed' ? `${data.duration || 1000}ms` : (data.durationExpression || data.untilCondition || '') },
        getDisplayText()
      )
    ]);
  }

  validateData(data: DelayNodeData): string[] {
    const errors: string[] = [];

    if (!['fixed', 'dynamic', 'until'].includes(data.delayType)) {
      errors.push('Invalid delay type');
    }

    if (data.delayType === 'fixed') {
      if (data.duration === undefined || data.duration < 0) {
        errors.push('Fixed delay duration must be a non-negative number');
      }
      if (data.duration && data.duration > 300000) {
        errors.push('Fixed delay duration cannot exceed 300000ms (5 minutes)');
      }
    }

    if (data.delayType === 'dynamic') {
      if (!data.durationExpression?.trim()) {
        errors.push('Duration expression is required for dynamic delay');
      } else {
        // Basic syntax validation
        try {
          new Function('input', 'context', `"use strict"; return (${data.durationExpression});`);
        } catch (syntaxError) {
          errors.push(`Invalid duration expression syntax: ${(syntaxError as Error).message}`);
        }
      }
    }

    if (data.delayType === 'until') {
      if (!data.untilCondition?.trim()) {
        errors.push('Until condition is required for conditional delay');
      } else {
        // Basic syntax validation
        try {
          new Function('input', 'context', `"use strict"; return !!(${data.untilCondition});`);
        } catch (syntaxError) {
          errors.push(`Invalid until condition syntax: ${(syntaxError as Error).message}`);
        }
      }
    }

    return errors;
  }

  getRequiredConnections() {
    return { inputs: 1, outputs: 1 };
  }

  getHelpText(): string {
    return `
Delay nodes pause workflow execution for a specified time or until a condition is met.

⏰ Delay Types:
• Fixed - Wait for a specific number of milliseconds
• Dynamic - Wait for a duration calculated from input data
• Until - Wait until a boolean condition becomes true

🔤 Use variables in expressions:
• Duration: {input.delayTime} * 1000, {httpResponse.retryAfter}
• Conditions: {input.status} === "ready", {data.processed} === true

📤 Output variables:
• {delayCompleted} - Success/failure status
• {actualWaitTime} - Time actually waited
• {delayStats} - Detailed timing statistics

⏱️ Time Limits:
• Fixed: Maximum 5 minutes (300,000ms)
• Dynamic: Automatically capped at 5 minutes
• Until: Maximum 10 minutes timeout

💡 Use cases:
• Rate limiting API calls
• Waiting for external processes
• Scheduled workflow delays
• Polling with conditions
    `.trim();
  }

  getDocumentationUrl(): string {
    return 'https://docs.agenticflow.com/nodes/delay-node';
  }
} 