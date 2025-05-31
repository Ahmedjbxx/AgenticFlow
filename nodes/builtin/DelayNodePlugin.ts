import React from 'react';
import { NodePlugin, NodePluginMetadata } from '../base/NodePlugin';
import { ExecutionContext } from '../../core/execution/ExecutionContext';
import { DelayNodeData } from '../../types';

export class DelayNodePlugin extends NodePlugin<DelayNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'delayNode',
    name: 'Delay',
    description: 'Add time delays or wait for conditions in workflow execution',
    version: '1.0.0',
    category: 'utility',
    icon: 'ClockIcon',
    color: 'bg-blue-500',
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

  async execute(input: any, data: DelayNodeData, context: ExecutionContext): Promise<any> {
    const { logger, eventBus } = context.services;
    
    logger.info(`Executing delay: ${data.delayType}`);
    eventBus.emit('node.execution.started', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      input,
    });

    const startTime = Date.now();

    try {
      let actualDelay: number;
      
      switch (data.delayType) {
        case 'fixed':
          actualDelay = await this.executeFixedDelay(data, context);
          break;
        case 'dynamic':
          actualDelay = await this.executeDynamicDelay(input, data, context);
          break;
        case 'until':
          actualDelay = await this.executeConditionalDelay(input, data, context);
          break;
        default:
          throw new Error(`Unknown delay type: ${data.delayType}`);
      }

      const endTime = Date.now();
      const actualWaitTime = endTime - startTime;

      const output = {
        ...input,
        delayCompleted: true,
        delayType: data.delayType,
        expectedDelay: actualDelay,
        actualWaitTime,
        delayStartTime: startTime,
        delayEndTime: endTime,
      };

      logger.info(`Delay completed: ${actualWaitTime}ms`);
      eventBus.emit('node.execution.completed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        output,
      });

      return output;

    } catch (error: any) {
      logger.error(`Delay execution failed: ${error.message}`, error);
      eventBus.emit('node.execution.failed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        error,
      });
      
      const errorOutput = {
        ...input,
        delayCompleted: false,
        delayType: data.delayType,
        delayError: error.message,
        actualWaitTime: Date.now() - startTime,
      };
      
      return errorOutput;
    }
  }

  private async executeFixedDelay(data: DelayNodeData, context: ExecutionContext): Promise<number> {
    const delay = data.duration || 1000;
    
    context.services.logger.info(`Fixed delay: ${delay}ms`);
    
    await this.sleep(delay);
    return delay;
  }

  private async executeDynamicDelay(input: any, data: DelayNodeData, context: ExecutionContext): Promise<number> {
    if (!data.durationExpression) {
      throw new Error('Duration expression is required for dynamic delay');
    }

    const dynamicDelay = context.evaluateExpression(data.durationExpression, input);
    
    if (typeof dynamicDelay !== 'number' || dynamicDelay < 0) {
      throw new Error(`Invalid dynamic delay value: ${dynamicDelay}. Must be a positive number.`);
    }

    // Cap the delay to prevent extremely long waits
    const maxDelay = 5 * 60 * 1000; // 5 minutes
    const actualDelay = Math.min(dynamicDelay, maxDelay);
    
    if (dynamicDelay > maxDelay) {
      context.services.logger.warn(`Dynamic delay capped from ${dynamicDelay}ms to ${maxDelay}ms`);
    }

    context.services.logger.info(`Dynamic delay: ${actualDelay}ms (expression: ${data.durationExpression})`);
    
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
    
    context.services.logger.info(`Conditional delay: waiting until ${data.untilCondition}`);
    
    while (true) {
      const elapsed = Date.now() - startTime;
      
      // Check timeout
      if (elapsed > maxWaitTime) {
        throw new Error(`Conditional delay timed out after ${maxWaitTime}ms`);
      }

      // Evaluate condition
      try {
        const conditionMet = context.evaluateExpression(data.untilCondition, input);
        
        if (conditionMet) {
          context.services.logger.info(`Condition met after ${elapsed}ms`);
          return elapsed;
        }
      } catch (conditionError) {
        throw new Error(`Error evaluating condition: ${(conditionError as Error).message}`);
      }

      // Emit progress event
      context.services.eventBus.emit('delay.waiting', {
        nodeId: context.nodeId,
        elapsed,
        condition: data.untilCondition,
      });

      // Wait before next check
      await this.sleep(checkInterval);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  renderEditor(data: DelayNodeData, onChange: (data: DelayNodeData) => void): React.ReactNode {
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
        }, 'Fixed delay in milliseconds (0-300000)')
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
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
          placeholder: 'input.waitTime * 1000'
        }),
        React.createElement('p', {
          key: 'durationExpression-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Expression that evaluates to delay in milliseconds (e.g., input.delay, input.seconds * 1000)')
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
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
          placeholder: 'input.ready === true'
        }),
        React.createElement('p', {
          key: 'untilCondition-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Boolean expression to wait for (checked every second, max 10 minutes)')
      ]),
    ]);
  }

  renderNode(data: DelayNodeData): React.ReactNode {
    const getDisplayText = () => {
      switch (data.delayType) {
        case 'fixed':
          return `${data.duration || 1000}ms`;
        case 'dynamic':
          return data.durationExpression || 'Dynamic';
        case 'until':
          return data.untilCondition || 'Until condition';
        default:
          return 'Delay';
      }
    };

    return React.createElement('div', { className: 'px-3 py-2' }, [
      React.createElement('div', { key: 'title', className: 'font-medium text-sm' }, data.label),
      React.createElement('div', { key: 'details', className: 'text-xs text-slate-600 mt-1' }, [
        React.createElement('div', { key: 'type' }, `Type: ${data.delayType}`),
        React.createElement('div', { key: 'value' }, getDisplayText()),
      ]),
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

    if (data.delayType === 'dynamic' && !data.durationExpression?.trim()) {
      errors.push('Duration expression is required for dynamic delay');
    }

    if (data.delayType === 'until' && !data.untilCondition?.trim()) {
      errors.push('Until condition is required for conditional delay');
    }

    return errors;
  }

  getRequiredConnections() {
    return { inputs: 1, outputs: 1 };
  }

  getHelpText(): string {
    return `
      The Delay node pauses workflow execution for a specified time or until a condition is met:
      
      Delay Types:
      - Fixed: Wait for a specific number of milliseconds
      - Dynamic: Wait for a duration calculated from input data
      - Until: Wait until a boolean condition becomes true
      
      Time Limits:
      - Fixed: Maximum 5 minutes (300,000ms)
      - Dynamic: Automatically capped at 5 minutes
      - Until: Maximum 10 minutes timeout
      
      Use cases: Rate limiting, waiting for external processes, scheduled delays
    `;
  }
} 