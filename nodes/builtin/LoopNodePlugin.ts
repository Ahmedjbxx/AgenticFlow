import React from 'react';
import { NodePlugin, NodePluginMetadata } from '../base/NodePlugin';
import { ExecutionContext } from '../../core/execution/ExecutionContext';
import { LoopNodeData } from '../../types';

export class LoopNodePlugin extends NodePlugin<LoopNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'loopNode',
    name: 'Loop',
    description: 'Iterate over arrays or lists of data',
    version: '1.0.0',
    category: 'utility',
    icon: 'LoopIcon',
    color: 'bg-purple-500',
  };

  createDefaultData(): LoopNodeData {
    return {
      id: '',
      type: 'loopNode' as any,
      label: 'Loop',
      iterateOver: 'input.items',
      itemVariable: 'item',
      maxIterations: 100,
    };
  }

  async execute(input: any, data: LoopNodeData, context: ExecutionContext): Promise<any> {
    const { logger, eventBus } = context.services;
    
    logger.info(`Executing loop iteration over ${data.iterateOver}`);
    eventBus.emit('node.execution.started', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      input,
    });

    try {
      // Get the array to iterate over
      const arrayToIterate = context.evaluateExpression(data.iterateOver, input);
      
      if (!Array.isArray(arrayToIterate)) {
        throw new Error(`Loop target "${data.iterateOver}" is not an array. Got: ${typeof arrayToIterate}`);
      }

      // Apply max iterations limit
      const maxIterations = data.maxIterations || 100;
      const actualArray = arrayToIterate.slice(0, maxIterations);
      
      if (arrayToIterate.length > maxIterations) {
        logger.warn(`Loop truncated from ${arrayToIterate.length} to ${maxIterations} iterations`);
      }

      // Execute loop iterations
      const results: any[] = [];
      
      for (let index = 0; index < actualArray.length; index++) {
        const currentItem = actualArray[index];
        
        logger.info(`Loop iteration ${index + 1}/${actualArray.length}`);
        
        // Create iteration context with current item
        const iterationInput = {
          ...input,
          [data.itemVariable]: currentItem,
          loopIndex: index,
          loopTotal: actualArray.length,
          isFirstIteration: index === 0,
          isLastIteration: index === actualArray.length - 1,
        };

        // Emit iteration event
        eventBus.emit('loop.iteration.started', {
          nodeId: context.nodeId,
          iteration: index + 1,
          total: actualArray.length,
          item: currentItem,
        });

        // Add iteration result
        results.push({
          index,
          item: currentItem,
          iterationInput,
        });

        eventBus.emit('loop.iteration.completed', {
          nodeId: context.nodeId,
          iteration: index + 1,
          total: actualArray.length,
        });
      }

      const output = {
        ...input,
        loopResults: results,
        loopIterations: results.length,
        loopCompleted: true,
        // Also provide the last iteration data for convenience
        lastIteration: results[results.length - 1] || null,
      };

      logger.info(`Loop completed: ${results.length} iterations`);
      eventBus.emit('node.execution.completed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        output,
      });

      return output;

    } catch (error: any) {
      logger.error(`Loop execution failed: ${error.message}`, error);
      eventBus.emit('node.execution.failed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        error,
      });
      
      const errorOutput = {
        ...input,
        loopResults: [],
        loopIterations: 0,
        loopCompleted: false,
        loopError: error.message,
      };
      
      return errorOutput;
    }
  }

  renderEditor(data: LoopNodeData, onChange: (data: LoopNodeData) => void): React.ReactNode {
    return React.createElement('div', { className: 'space-y-4' }, [
      // Iterate Over field
      React.createElement('div', { key: 'iterateOver' }, [
        React.createElement('label', {
          key: 'iterateOver-label',
          htmlFor: 'iterateOver',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Iterate Over'),
        React.createElement('input', {
          key: 'iterateOver-input',
          type: 'text',
          id: 'iterateOver',
          value: data.iterateOver,
          onChange: (e: any) => onChange({ ...data, iterateOver: e.target.value }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
          placeholder: 'input.items'
        }),
        React.createElement('p', {
          key: 'iterateOver-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Array or list to iterate over (e.g., input.items, input.data.records)')
      ]),

      // Item Variable field
      React.createElement('div', { key: 'itemVariable' }, [
        React.createElement('label', {
          key: 'itemVariable-label',
          htmlFor: 'itemVariable',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Item Variable Name'),
        React.createElement('input', {
          key: 'itemVariable-input',
          type: 'text',
          id: 'itemVariable',
          value: data.itemVariable,
          onChange: (e: any) => onChange({ ...data, itemVariable: e.target.value }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
          placeholder: 'item'
        }),
        React.createElement('p', {
          key: 'itemVariable-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Variable name for the current item in each iteration')
      ]),

      // Max Iterations field
      React.createElement('div', { key: 'maxIterations' }, [
        React.createElement('label', {
          key: 'maxIterations-label',
          htmlFor: 'maxIterations',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Max Iterations'),
        React.createElement('input', {
          key: 'maxIterations-input',
          type: 'number',
          id: 'maxIterations',
          value: data.maxIterations || 100,
          onChange: (e: any) => onChange({ ...data, maxIterations: parseInt(e.target.value) || 100 }),
          min: 1,
          max: 1000,
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
        }),
        React.createElement('p', {
          key: 'maxIterations-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Maximum number of iterations to prevent infinite loops (1-1000)')
      ]),
    ]);
  }

  renderNode(data: LoopNodeData): React.ReactNode {
    return React.createElement('div', { className: 'px-3 py-2' }, [
      React.createElement('div', { key: 'title', className: 'font-medium text-sm' }, data.label),
      React.createElement('div', { key: 'details', className: 'text-xs text-slate-600 mt-1' }, [
        React.createElement('div', { key: 'iterateOver' }, `Over: ${data.iterateOver}`),
        React.createElement('div', { key: 'itemVariable' }, `As: ${data.itemVariable}`),
        React.createElement('div', { key: 'maxIterations' }, `Max: ${data.maxIterations || 100}`),
      ]),
    ]);
  }

  validateData(data: LoopNodeData): string[] {
    const errors: string[] = [];

    if (!data.iterateOver?.trim()) {
      errors.push('Iterate Over expression is required');
    }

    if (!data.itemVariable?.trim()) {
      errors.push('Item variable name is required');
    }

    if (data.itemVariable && !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(data.itemVariable)) {
      errors.push('Item variable name must be a valid JavaScript identifier');
    }

    if (data.maxIterations && (data.maxIterations < 1 || data.maxIterations > 1000)) {
      errors.push('Max iterations must be between 1 and 1000');
    }

    return errors;
  }

  getRequiredConnections() {
    return { inputs: 1, outputs: 1 };
  }

  getHelpText(): string {
    return `
      The Loop node iterates over arrays or lists of data. Each iteration creates a new context with:
      - The current item available as the specified variable name
      - Loop metadata (index, total, isFirst, isLast)
      
      Example: If iterating over ["a", "b", "c"] with item variable "item":
      - Iteration 1: item="a", loopIndex=0, isFirstIteration=true
      - Iteration 2: item="b", loopIndex=1
      - Iteration 3: item="c", loopIndex=2, isLastIteration=true
    `;
  }
} 