import React from 'react';
import { NodePlugin, NodePluginMetadata, NodeEditorContext } from '../base/NodePlugin.js';
import { ExecutionContext, VariableDefinition } from '@agenticflow/core';
import { RealNumbersNodeData } from '@agenticflow/types';

export class RealNumbersNodePlugin extends NodePlugin<RealNumbersNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'realNumbersNode',
    name: 'Real Numbers',
    description: 'Create a random real number within specified range',
    version: '1.0.0',
    category: 'utility',
    icon: 'NumberIcon',
    color: 'bg-blue-500',
    tags: ['number', 'random', 'math', 'testing'],
    author: 'AgenticFlow Team',
    documentation: 'https://docs.agenticflow.com/nodes/real-numbers-node',
  };

  createDefaultData(): RealNumbersNodeData {
    return {
      id: '',
      type: 'realNumbersNode' as any,
      label: 'Real Numbers',
      minValue: 0,
      maxValue: 100,
      decimalPlaces: 2,
    };
  }

  getOutputSchema(): VariableDefinition[] {
    return [
      {
        name: 'randomNumber',
        type: 'number',
        description: 'Generated random real number',
        example: 42.58
      },
      {
        name: 'numberString',
        type: 'string',
        description: 'Generated number as formatted string',
        example: '42.58'
      },
      {
        name: 'generatedAt',
        type: 'string',
        description: 'Timestamp when number was generated',
        example: '2024-01-01T12:00:00.000Z'
      }
    ];
  }

  async execute(input: any, data: RealNumbersNodeData, context: ExecutionContext): Promise<any> {
    const { logger } = context.services;
    
    logger?.info('Generating real number...');

    try {
      // Generate random number between min and max
      const randomValue = Math.random() * (data.maxValue - data.minValue) + data.minValue;
      
      // Round to specified decimal places
      const randomNumber = Number(randomValue.toFixed(data.decimalPlaces));
      
      const output = {
        ...input,
        randomNumber,
        numberString: randomNumber.toString(),
        generatedAt: new Date().toISOString(),
        nodeType: 'realNumbersNode',
      };

      logger?.info(`Generated real number: ${randomNumber}`);
      
      return output;

    } catch (error: any) {
      logger?.error(`Real numbers node execution failed: ${error.message}`, error);
      
      // Return error output
      return {
        ...input,
        error: error.message,
        randomNumber: 0,
        numberString: '0',
        generatedAt: new Date().toISOString(),
      };
    }
  }

  renderEditor(data: RealNumbersNodeData, onChange: (data: RealNumbersNodeData) => void, context?: NodeEditorContext): React.ReactNode {
    return React.createElement('div', { className: 'space-y-4' }, [
      // Min Value
      React.createElement('div', { key: 'min-value' }, [
        React.createElement('label', {
          key: 'min-label',
          htmlFor: 'minValue',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Minimum Value'),
        React.createElement('input', {
          key: 'min-input',
          type: 'number',
          id: 'minValue',
          value: data.minValue,
          onChange: (e: any) => onChange({ ...data, minValue: parseFloat(e.target.value) || 0 }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
          step: 'any'
        })
      ]),
      
      // Max Value
      React.createElement('div', { key: 'max-value' }, [
        React.createElement('label', {
          key: 'max-label',
          htmlFor: 'maxValue',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Maximum Value'),
        React.createElement('input', {
          key: 'max-input',
          type: 'number',
          id: 'maxValue',
          value: data.maxValue,
          onChange: (e: any) => onChange({ ...data, maxValue: parseFloat(e.target.value) || 100 }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
          step: 'any'
        })
      ]),
      
      // Decimal Places
      React.createElement('div', { key: 'decimal-places' }, [
        React.createElement('label', {
          key: 'decimal-label',
          htmlFor: 'decimalPlaces',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Decimal Places'),
        React.createElement('input', {
          key: 'decimal-input',
          type: 'number',
          id: 'decimalPlaces',
          value: data.decimalPlaces,
          onChange: (e: any) => onChange({ ...data, decimalPlaces: parseInt(e.target.value) || 0 }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
          min: 0,
          max: 10
        }),
        React.createElement('p', {
          key: 'decimal-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Number of decimal places (0-10)')
      ]),
      
      // Preview
      React.createElement('div', { key: 'preview' }, [
        React.createElement('label', {
          key: 'preview-label',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Range Preview'),
        React.createElement('p', {
          key: 'preview-text',
          className: 'mt-1 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded'
        }, `Will generate numbers between ${data.minValue} and ${data.maxValue} with ${data.decimalPlaces} decimal places`)
      ])
    ]);
  }

  renderNode(data: RealNumbersNodeData): React.ReactNode {
    return React.createElement('div', { className: 'text-xs' },
      React.createElement('p', { className: 'font-medium' }, '🔢 Real Numbers'),
      React.createElement('p', { className: 'text-slate-600' }, 
        `${data.minValue} - ${data.maxValue} (${data.decimalPlaces} decimals)`
      )
    );
  }
} 