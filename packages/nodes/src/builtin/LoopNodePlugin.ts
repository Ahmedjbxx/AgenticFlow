import React from 'react';
import { NodePlugin, NodePluginMetadata, NodeEditorContext } from '../base/NodePlugin.js';
import { ExecutionContext, VariableDefinition } from '@agenticflow/core';
import { LoopNodeData } from '@agenticflow/types';

export class LoopNodePlugin extends NodePlugin<LoopNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'loopNode',
    name: 'Loop',
    description: 'Iterate over arrays or lists of data with comprehensive loop controls and variable support',
    version: '1.1.0',
    category: 'utility',
    icon: 'LoopIcon',
    color: 'bg-purple-500',
    tags: ['iteration', 'arrays', 'loop', 'batch-processing', 'collections'],
    author: 'AgenticFlow Team',
    documentation: 'https://docs.agenticflow.com/nodes/loop-node',
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

  getOutputSchema(): VariableDefinition[] {
    return [
      {
        name: 'loopResults',
        type: 'array',
        description: 'Array containing all iteration results',
        example: [
          { index: 0, item: 'first', iterationInput: {} },
          { index: 1, item: 'second', iterationInput: {} }
        ]
      },
      {
        name: 'loopIterations',
        type: 'number',
        description: 'Total number of completed iterations',
        example: 3
      },
      {
        name: 'loopCompleted',
        type: 'boolean',
        description: 'Whether the loop completed successfully',
        example: true
      },
      {
        name: 'lastIteration',
        type: 'object',
        description: 'Data from the final iteration',
        example: { index: 2, item: 'last', iterationInput: {} }
      },
      {
        name: 'loopStats',
        type: 'object',
        description: 'Detailed statistics about the loop execution',
        example: {
          totalItems: 5,
          processedItems: 5,
          skippedItems: 0,
          startTime: '2024-01-01T12:00:00.000Z',
          endTime: '2024-01-01T12:00:05.000Z',
          averageIterationTime: 1000
        }
      },
      {
        name: 'originalArray',
        type: 'array',
        description: 'The original array that was iterated over',
        example: ['item1', 'item2', 'item3']
      }
    ];
  }

  async execute(input: any, data: LoopNodeData, context: ExecutionContext): Promise<any> {
    const { logger, eventBus } = context.services;
    
    logger?.info(`Executing loop iteration over ${data.iterateOver}`);
    eventBus?.emit('node.execution.started', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      input,
    });

    const startTime = Date.now();
    const startTimeISO = new Date().toISOString();

    try {
      // Process expression with variable substitution
      const processedExpression = context.replaceVariables(data.iterateOver, input);
      
      // Get the array to iterate over
      let arrayToIterate: any;
      try {
        const evaluateFunction = new Function('input', 'context', `"use strict"; return (${processedExpression});`);
        arrayToIterate = evaluateFunction(input, context);
      } catch (evalError) {
        throw new Error(`Failed to evaluate iterate expression: ${(evalError as Error).message}`);
      }
      
      if (!Array.isArray(arrayToIterate)) {
        throw new Error(`Loop target "${data.iterateOver}" is not an array. Got: ${typeof arrayToIterate} with value: ${JSON.stringify(arrayToIterate).substring(0, 100)}`);
      }

      // Apply max iterations limit
      const maxIterations = data.maxIterations || 100;
      const originalLength = arrayToIterate.length;
      const actualArray = arrayToIterate.slice(0, maxIterations);
      
      if (originalLength > maxIterations) {
        logger?.warn(`Loop truncated from ${originalLength} to ${maxIterations} iterations for safety`);
      }

      logger?.info(`Starting loop with ${actualArray.length} iterations (expression: ${data.iterateOver} → ${processedExpression})`);

      // Execute loop iterations
      const results: any[] = [];
      const iterationTimes: number[] = [];
      
      for (let index = 0; index < actualArray.length; index++) {
        const iterationStartTime = Date.now();
        const currentItem = actualArray[index];
        
        logger?.info(`Loop iteration ${index + 1}/${actualArray.length}: processing item`);
        
        // Create iteration context with current item and metadata
        const iterationInput = {
          ...input,
          [data.itemVariable]: currentItem,
          loopIndex: index,
          loopTotal: actualArray.length,
          loopProgress: (index + 1) / actualArray.length,
          isFirstIteration: index === 0,
          isLastIteration: index === actualArray.length - 1,
          currentLoopItem: currentItem, // Alternative access
          iterationNumber: index + 1, // 1-based numbering
        };

        // Emit iteration event
        eventBus?.emit('loop.iteration.started', {
          nodeId: context.nodeId,
          iteration: index + 1,
          total: actualArray.length,
          item: currentItem,
          progress: (index + 1) / actualArray.length,
        });

        // Add iteration result with comprehensive data
        const iterationResult = {
          index,
          iterationNumber: index + 1,
          item: currentItem,
          iterationInput,
          isFirst: index === 0,
          isLast: index === actualArray.length - 1,
          progress: (index + 1) / actualArray.length,
          processedAt: new Date().toISOString(),
        };

        results.push(iterationResult);

        const iterationEndTime = Date.now();
        const iterationDuration = iterationEndTime - iterationStartTime;
        iterationTimes.push(iterationDuration);

        eventBus?.emit('loop.iteration.completed', {
          nodeId: context.nodeId,
          iteration: index + 1,
          total: actualArray.length,
          duration: iterationDuration,
        });
      }

      const endTime = Date.now();
      const endTimeISO = new Date().toISOString();
      const totalDuration = endTime - startTime;
      const averageIterationTime = iterationTimes.length > 0 ? 
        iterationTimes.reduce((sum, time) => sum + time, 0) / iterationTimes.length : 0;

      const output = {
        ...input,
        loopResults: results,
        loopIterations: results.length,
        loopCompleted: true,
        lastIteration: results[results.length - 1] || null,
        firstIteration: results[0] || null,
        originalArray: arrayToIterate,
        processedArray: actualArray,
        loopStats: {
          totalItems: originalLength,
          processedItems: results.length,
          skippedItems: Math.max(0, originalLength - maxIterations),
          truncated: originalLength > maxIterations,
          startTime: startTimeISO,
          endTime: endTimeISO,
          totalDurationMs: totalDuration,
          averageIterationTime: Math.round(averageIterationTime * 100) / 100,
          itemVariable: data.itemVariable,
          expression: data.iterateOver,
          processedExpression,
          maxIterationsLimit: maxIterations,
        },
      };

      logger?.info(`Loop completed: ${results.length} iterations in ${totalDuration}ms (avg: ${averageIterationTime.toFixed(1)}ms/iteration)`);
      eventBus?.emit('node.execution.completed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        output,
        loopStats: output.loopStats,
      });

      return output;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger?.error(`Loop execution failed after ${duration}ms: ${error.message}`, error);
      eventBus?.emit('node.execution.failed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        error,
        duration,
      });
      
      const errorOutput = {
        ...input,
        loopResults: [],
        loopIterations: 0,
        loopCompleted: false,
        loopError: error.message,
        lastIteration: null,
        firstIteration: null,
        originalArray: null,
        processedArray: null,
        loopStats: {
          totalItems: 0,
          processedItems: 0,
          skippedItems: 0,
          truncated: false,
          startTime: startTimeISO,
          endTime: new Date().toISOString(),
          totalDurationMs: duration,
          error: error.message,
          itemVariable: data.itemVariable,
          expression: data.iterateOver,
          maxIterationsLimit: data.maxIterations || 100,
        },
      };
      
      return errorOutput;
    }
  }

  renderEditor(data: LoopNodeData, onChange: (data: LoopNodeData) => void, context?: NodeEditorContext): React.ReactNode {
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
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono',
          placeholder: 'input.items'
        }),
        React.createElement('p', {
          key: 'iterateOver-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'JavaScript expression that evaluates to an array. Supports variable substitution.'),
        
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
        }, 'Variable name for the current item in each iteration (must be valid JavaScript identifier)')
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
        }, 'Maximum number of iterations to prevent infinite loops (1-1000). Arrays longer than this will be truncated.')
      ]),

      // Loop Variables info section
      React.createElement('div', { key: 'loopVariables' }, [
        React.createElement('label', {
          key: 'loopVariables-label',
          className: 'block text-sm font-medium text-slate-700 mb-2'
        }, 'Available Loop Variables:'),
        React.createElement('div', {
          key: 'loopVariables-list',
          className: 'text-xs text-slate-600 space-y-1 bg-slate-50 p-2 rounded'
        }, [
          React.createElement('div', { key: 'var1' }, `• {${data.itemVariable || 'item'}} - Current item`),
          React.createElement('div', { key: 'var2' }, '• {loopIndex} - Current index (0-based)'),
          React.createElement('div', { key: 'var3' }, '• {iterationNumber} - Current iteration (1-based)'),
          React.createElement('div', { key: 'var4' }, '• {loopTotal} - Total number of items'),
          React.createElement('div', { key: 'var5' }, '• {loopProgress} - Progress (0.0 to 1.0)'),
          React.createElement('div', { key: 'var6' }, '• {isFirstIteration} - True for first item'),
          React.createElement('div', { key: 'var7' }, '• {isLastIteration} - True for last item'),
        ])
      ]),

      // Examples section
      React.createElement('div', { key: 'examples' }, [
        React.createElement('label', {
          key: 'examples-label',
          className: 'block text-sm font-medium text-slate-700 mb-2'
        }, 'Iteration Examples:'),
        React.createElement('div', {
          key: 'examples-list',
          className: 'text-xs text-slate-600 space-y-1'
        }, [
          React.createElement('div', { key: 'ex1' }, '• {input.users} - Iterate over user array'),
          React.createElement('div', { key: 'ex2' }, '• {httpResponse.data.items} - Process API response'),
          React.createElement('div', { key: 'ex3' }, '• {input.files}.filter(f => f.size > 1000) - Filtered iteration'),
          React.createElement('div', { key: 'ex4' }, '• Object.values({input.categories}) - Iterate object values'),
        ])
      ])
    ]);
  }

  renderNode(data: LoopNodeData): React.ReactNode {
    const iterateOverPreview = data.iterateOver.length > 12 ? 
      data.iterateOver.substring(0, 12) + '...' : 
      data.iterateOver;
      
    return React.createElement('div', { className: 'text-xs' }, [
      React.createElement('p', { key: 'iterateOver', className: 'font-medium', title: data.iterateOver },
        `🔄 ${iterateOverPreview}`
      ),
      React.createElement('p', { key: 'details', className: 'text-slate-600' },
        `as {${data.itemVariable}} (max: ${data.maxIterations || 100})`
      )
    ]);
  }

  validateData(data: LoopNodeData): string[] {
    const errors: string[] = [];

    if (!data.iterateOver?.trim()) {
      errors.push('Iterate Over expression is required');
    } else {
      // Basic syntax validation
      try {
        new Function('input', 'context', `"use strict"; return (${data.iterateOver});`);
      } catch (syntaxError) {
        errors.push(`Invalid iterate expression syntax: ${(syntaxError as Error).message}`);
      }
    }

    if (!data.itemVariable?.trim()) {
      errors.push('Item variable name is required');
    } else if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(data.itemVariable)) {
      errors.push('Item variable name must be a valid JavaScript identifier (letters, numbers, _, $ only, cannot start with number)');
    } else if (['input', 'output', 'context', 'loopIndex', 'loopTotal', 'isFirstIteration', 'isLastIteration'].includes(data.itemVariable)) {
      errors.push('Item variable name conflicts with reserved loop variables');
    }

    if (data.maxIterations !== undefined) {
      if (data.maxIterations < 1 || data.maxIterations > 1000) {
        errors.push('Max iterations must be between 1 and 1000');
      }
    }

    return errors;
  }

  getRequiredConnections() {
    return { inputs: 1, outputs: 1 };
  }

  getHelpText(): string {
    return `
Loop nodes iterate over arrays or lists of data with comprehensive controls.

🔄 Purpose:
• Process arrays or collections item by item
• Create comprehensive iteration context
• Track loop progress and statistics
• Handle large datasets safely

🔤 Use variables in expressions:
• Iterate over: {input.items}, {httpResponse.data.results}
• Dynamic arrays: {input.files}.filter(f => f.active)
• Object values: Object.values({input.categories})

📤 Each iteration provides:
• {item} - Current item (your variable name)
• {loopIndex} - Current position (0-based)
• {iterationNumber} - Current iteration (1-based)
• {loopTotal} - Total items count
• {loopProgress} - Progress percentage (0.0-1.0)
• {isFirstIteration} - True for first item
• {isLastIteration} - True for last item

📊 Output includes:
• {loopResults} - All iteration data
• {loopStats} - Performance statistics
• {loopIterations} - Total completed
• {originalArray} - Source data

🔧 Safety features:
• Maximum iteration limits (1-1000)
• Performance monitoring
• Comprehensive error handling
• Memory-efficient processing

💡 Use cases:
• Batch processing data
• File processing workflows
• API result iteration
• Multi-step transformations
    `.trim();
  }

  getDocumentationUrl(): string {
    return 'https://docs.agenticflow.com/nodes/loop-node';
  }
} 