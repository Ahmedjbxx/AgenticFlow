import React from 'react';
import { NodePlugin, NodePluginMetadata, NodeEditorContext } from '../base/NodePlugin.js';
import { ExecutionContext, VariableDefinition } from '@agenticflow/core';
import { StringNodeData } from '@agenticflow/types';

export class StringNodePlugin extends NodePlugin<StringNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'stringNode',
    name: 'String',
    description: 'Process and transform string data with prefix',
    version: '1.0.0',
    category: 'utility',
    icon: 'StringIcon',
    color: 'bg-green-500',
    tags: ['string', 'text', 'transform', 'basic'],
    author: 'AgenticFlow Team',
    documentation: 'https://docs.agenticflow.com/nodes/string-node',
  };

  createDefaultData(): StringNodeData {
    return {
      id: '',
      type: 'stringNode' as any,
      label: 'String',
      inputString: 'Hello World',
      outputPrefix: 'Processed: ',
    };
  }

  getOutputSchema(): VariableDefinition[] {
    return [
      {
        name: 'processedString',
        type: 'string',
        description: 'The processed string with prefix',
        example: 'Processed: Hello World'
      },
      {
        name: 'originalString',
        type: 'string',
        description: 'The original input string',
        example: 'Hello World'
      },
      {
        name: 'stringLength',
        type: 'number',
        description: 'Length of the processed string',
        example: 23
      },
      {
        name: 'processedAt',
        type: 'string',
        description: 'Timestamp when string was processed',
        example: '2024-01-01T12:00:00.000Z'
      }
    ];
  }

  async execute(input: any, data: StringNodeData, context: ExecutionContext): Promise<any> {
    const { logger } = context.services;
    
    logger?.info('Processing string...');

    try {
      // Get input string (from previous node or use node's default)
      const inputString = input?.inputString || data.inputString;
      
      // Process the string
      const processedString = `${data.outputPrefix}${inputString}`;
      
      const output = {
        ...input,
        processedString,
        originalString: inputString,
        stringLength: processedString.length,
        processedAt: new Date().toISOString(),
        nodeType: 'stringNode',
      };

      logger?.info(`String processed: "${inputString}" -> "${processedString}"`);
      
      return output;

    } catch (error: any) {
      logger?.error(`String node execution failed: ${error.message}`, error);
      
      return {
        ...input,
        error: error.message,
        processedString: '',
        originalString: '',
        stringLength: 0,
        processedAt: new Date().toISOString(),
      };
    }
  }

  renderEditor(data: StringNodeData, onChange: (data: StringNodeData) => void, context?: NodeEditorContext): React.ReactNode {
    return React.createElement('div', { className: 'space-y-4' }, [
      // Input String
      React.createElement('div', { key: 'input-string' }, [
        React.createElement('label', {
          key: 'input-label',
          htmlFor: 'inputString',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Input String'),
        React.createElement('input', {
          key: 'input-input',
          type: 'text',
          id: 'inputString',
          value: data.inputString,
          onChange: (e: any) => onChange({ ...data, inputString: e.target.value }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
          placeholder: 'Enter string to process'
        }),
        React.createElement('p', {
          key: 'input-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'This will be overridden by input from previous nodes')
      ]),
      
      // Output Prefix
      React.createElement('div', { key: 'output-prefix' }, [
        React.createElement('label', {
          key: 'prefix-label',
          htmlFor: 'outputPrefix',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Output Prefix'),
        React.createElement('input', {
          key: 'prefix-input',
          type: 'text',
          id: 'outputPrefix',
          value: data.outputPrefix,
          onChange: (e: any) => onChange({ ...data, outputPrefix: e.target.value }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
          placeholder: 'Enter prefix to add'
        }),
        React.createElement('p', {
          key: 'prefix-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'This prefix will be added to the beginning of the string')
      ]),
      
      // Preview
      React.createElement('div', { key: 'preview' }, [
        React.createElement('label', {
          key: 'preview-label',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Preview'),
        React.createElement('p', {
          key: 'preview-text',
          className: 'mt-1 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded border'
        }, `Output: "${data.outputPrefix}${data.inputString}"`)
      ])
    ]);
  }

  renderNode(data: StringNodeData): React.ReactNode {
    return React.createElement('div', { className: 'text-xs' },
      React.createElement('p', { className: 'font-medium' }, '📝 String Processor'),
      React.createElement('p', { className: 'text-slate-600' }, 
        `"${data.outputPrefix}..."`
      )
    );
  }
} 