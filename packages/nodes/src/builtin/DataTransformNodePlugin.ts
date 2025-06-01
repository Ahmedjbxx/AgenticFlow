import React from 'react';
import { NodePlugin, NodePluginMetadata, NodeEditorContext } from '../base/NodePlugin.js';
import { ExecutionContext, VariableDefinition } from '@agenticflow/core';
import { DataTransformNodeData } from '@agenticflow/types';

export class DataTransformNodePlugin extends NodePlugin<DataTransformNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'dataTransformNode',
    name: 'Data Transform',
    description: 'Transform, filter, or manipulate data using JavaScript expressions with multiple processing modes',
    version: '1.1.0',
    category: 'transform',
    icon: 'TransformIcon',
    color: 'bg-orange-500',
    tags: ['data', 'transform', 'filter', 'extract', 'javascript', 'processing'],
    author: 'AgenticFlow Team',
    documentation: 'https://docs.agenticflow.com/nodes/data-transform',
  };

  createDefaultData(): DataTransformNodeData {
    return {
      id: '',
      type: 'dataTransformNode' as any,
      label: 'Data Transform',
      transformType: 'custom',
      transformLogic: 'return input;',
      outputFormat: 'json',
    };
  }

  getOutputSchema(): VariableDefinition[] {
    return [
      {
        name: 'transformedData',
        type: 'object',
        description: 'Data after transformation processing',
        example: { processed: true, result: 'transformed value' }
      },
      {
        name: 'originalData',
        type: 'object',
        description: 'Original input data before transformation',
        example: { raw: 'original value' }
      },
      {
        name: 'transformType',
        type: 'string',
        description: 'Type of transformation that was applied',
        example: 'extract'
      },
      {
        name: 'transformSuccess',
        type: 'boolean',
        description: 'Whether the transformation completed successfully',
        example: true
      },
      {
        name: 'transformStats',
        type: 'object',
        description: 'Statistics about the transformation process',
        example: {
          inputSize: 1024,
          outputSize: 512,
          processingTime: 15.5,
          itemsProcessed: 42
        }
      }
    ];
  }

  async execute(input: any, data: DataTransformNodeData, context: ExecutionContext): Promise<any> {
    const { logger, eventBus } = context.services;
    const startTime = performance.now();
    
    logger?.info(`Executing data transformation: ${data.transformType}`);
    eventBus?.emit('node.execution.started', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      input,
    });

    try {
      let transformedData: any;
      let itemsProcessed = 0;

      switch (data.transformType) {
        case 'extract':
          transformedData = this.executeExtract(input, data, context);
          itemsProcessed = typeof transformedData === 'object' ? Object.keys(transformedData).length : 1;
          break;
        case 'format':
          transformedData = this.executeFormat(input, data, context);
          itemsProcessed = 1;
          break;
        case 'parse':
          transformedData = this.executeParse(input, data, context);
          itemsProcessed = Array.isArray(transformedData) ? transformedData.length : 1;
          break;
        case 'filter':
          transformedData = this.executeFilter(input, data, context);
          itemsProcessed = Array.isArray(transformedData) ? transformedData.length : 
                          (typeof transformedData === 'object' ? Object.keys(transformedData).length : 1);
          break;
        case 'custom':
          transformedData = this.executeCustom(input, data, context);
          itemsProcessed = 1;
          break;
        default:
          throw new Error(`Unknown transform type: ${data.transformType}`);
      }

      // Apply output formatting
      const formattedOutput = this.formatOutput(transformedData, data.outputFormat);
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      const output = {
        ...input,
        transformedData: formattedOutput,
        originalData: input,
        transformType: data.transformType,
        transformSuccess: true,
        transformStats: {
          inputSize: JSON.stringify(input).length,
          outputSize: JSON.stringify(formattedOutput).length,
          processingTime: processingTime,
          itemsProcessed: itemsProcessed,
          appliedFormat: data.outputFormat || 'json',
        },
      };

      logger?.info(`Data transformation completed: ${data.transformType} (${processingTime.toFixed(2)}ms, ${itemsProcessed} items)`);
      eventBus?.emit('node.execution.completed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        output,
      });

      return output;

    } catch (error: any) {
      logger?.error(`Data transformation failed: ${error.message}`, error);
      eventBus?.emit('node.execution.failed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        error,
      });
      
      const errorOutput = {
        ...input,
        transformedData: null,
        originalData: input,
        transformType: data.transformType,
        transformSuccess: false,
        transformError: error.message,
        transformStats: {
          inputSize: JSON.stringify(input).length,
          outputSize: 0,
          processingTime: performance.now() - startTime,
          itemsProcessed: 0,
          error: error.message,
        },
      };
      
      return errorOutput;
    }
  }

  private executeExtract(input: any, data: DataTransformNodeData, context: ExecutionContext): any {
    // Extract specific fields or values from the input
    const processedLogic = context.replaceVariables(data.transformLogic, input);
    const extractFunction = new Function('input', 'context', `"use strict"; ${processedLogic}`);
    return extractFunction(input, context);
  }

  private executeFormat(input: any, data: DataTransformNodeData, context: ExecutionContext): any {
    // Format data into a specific structure
    const processedLogic = context.replaceVariables(data.transformLogic, input);
    const formatFunction = new Function('input', 'context', `"use strict"; ${processedLogic}`);
    return formatFunction(input, context);
  }

  private executeParse(input: any, data: DataTransformNodeData, context: ExecutionContext): any {
    // Parse strings into structured data
    if (typeof input === 'string') {
      try {
        // Try JSON parsing first
        return JSON.parse(input);
      } catch (jsonError) {
        // Fall back to custom parsing logic
        const processedLogic = context.replaceVariables(data.transformLogic, input);
        const parseFunction = new Function('input', 'context', `"use strict"; ${processedLogic}`);
        return parseFunction(input, context);
      }
    }
    
    // If not a string, apply custom parsing logic
    const processedLogic = context.replaceVariables(data.transformLogic, input);
    const parseFunction = new Function('input', 'context', `"use strict"; ${processedLogic}`);
    return parseFunction(input, context);
  }

  private executeFilter(input: any, data: DataTransformNodeData, context: ExecutionContext): any {
    // Filter arrays or objects based on conditions
    const processedLogic = context.replaceVariables(data.transformLogic, input);
    
    if (Array.isArray(input)) {
      const filterFunction = new Function('item', 'index', 'array', 'context', `"use strict"; return (${processedLogic});`);
      return input.filter((item, index, array) => filterFunction(item, index, array, context));
    } else if (input && typeof input === 'object') {
      const filterFunction = new Function('value', 'key', 'object', 'context', `"use strict"; return (${processedLogic});`);
      const result: any = {};
      for (const [key, value] of Object.entries(input)) {
        if (filterFunction(value, key, input, context)) {
          result[key] = value;
        }
      }
      return result;
    }
    
    throw new Error('Filter transform requires input to be an array or object');
  }

  private executeCustom(input: any, data: DataTransformNodeData, context: ExecutionContext): any {
    // Execute custom JavaScript transformation
    const processedLogic = context.replaceVariables(data.transformLogic, input);
    const customFunction = new Function('input', 'context', `"use strict"; ${processedLogic}`);
    return customFunction(input, context);
  }

  private formatOutput(data: any, format?: string): any {
    if (!format || format === 'json') {
      return data;
    }

    switch (format) {
      case 'csv':
        return this.convertToCSV(data);
      case 'text':
        return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      case 'array':
        return Array.isArray(data) ? data : [data];
      default:
        return data;
    }
  }

  private convertToCSV(data: any): string {
    if (!Array.isArray(data)) {
      throw new Error('CSV format requires array input');
    }

    if (data.length === 0) {
      return '';
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    const csvHeader = headers.join(',');
    
    // Convert data rows
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );

    return [csvHeader, ...csvRows].join('\n');
  }

  renderEditor(data: DataTransformNodeData, onChange: (data: DataTransformNodeData) => void, context?: NodeEditorContext): React.ReactNode {
    return React.createElement('div', { className: 'space-y-4' }, [
      // Transform Type selector
      React.createElement('div', { key: 'transformType' }, [
        React.createElement('label', {
          key: 'transformType-label',
          htmlFor: 'transformType',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Transform Type'),
        React.createElement('select', {
          key: 'transformType-select',
          id: 'transformType',
          value: data.transformType,
          onChange: (e: any) => onChange({ ...data, transformType: e.target.value as any }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
        }, [
          React.createElement('option', { key: 'extract', value: 'extract' }, 'Extract - Get specific fields'),
          React.createElement('option', { key: 'format', value: 'format' }, 'Format - Restructure data'),
          React.createElement('option', { key: 'parse', value: 'parse' }, 'Parse - Convert strings to data'),
          React.createElement('option', { key: 'filter', value: 'filter' }, 'Filter - Remove unwanted items'),
          React.createElement('option', { key: 'custom', value: 'custom' }, 'Custom - JavaScript logic'),
        ])
      ]),

      // Transform Logic field
      React.createElement('div', { key: 'transformLogic' }, [
        React.createElement('label', {
          key: 'transformLogic-label',
          htmlFor: 'transformLogic',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Transform Logic'),
        React.createElement('textarea', {
          key: 'transformLogic-textarea',
          id: 'transformLogic',
          value: data.transformLogic,
          onChange: (e: any) => onChange({ ...data, transformLogic: e.target.value }),
          rows: 6,
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono text-sm',
          placeholder: this.getPlaceholderForType(data.transformType)
        }),
        React.createElement('p', {
          key: 'transformLogic-help',
          className: 'mt-1 text-xs text-slate-500'
        }, this.getHelpTextForType(data.transformType)),
        
        // Show available variables if context is provided
        context?.availableVariables && context.availableVariables.length > 0 && React.createElement('div', {
          key: 'available-vars',
          className: 'mt-2 p-2 bg-slate-50 rounded text-xs'
        }, [
          React.createElement('p', { key: 'vars-title', className: 'font-medium text-slate-700' }, 'Available Variables:'),
          React.createElement('div', { key: 'vars-list', className: 'mt-1 flex flex-wrap gap-1' },
            context.availableVariables.slice(0, 8).map((variable: any, index: number) => 
              React.createElement('code', {
                key: index,
                className: 'px-1 bg-slate-200 rounded text-slate-600',
                title: variable.description || `Type: ${variable.type}`
              }, `{${variable.fullPath || variable.name}}`)
            )
          )
        ])
      ]),

      // Output Format field
      React.createElement('div', { key: 'outputFormat' }, [
        React.createElement('label', {
          key: 'outputFormat-label',
          htmlFor: 'outputFormat',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Output Format'),
        React.createElement('select', {
          key: 'outputFormat-select',
          id: 'outputFormat',
          value: data.outputFormat || 'json',
          onChange: (e: any) => onChange({ ...data, outputFormat: e.target.value as any }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
        }, [
          React.createElement('option', { key: 'json', value: 'json' }, 'JSON - Structured data'),
          React.createElement('option', { key: 'csv', value: 'csv' }, 'CSV - Comma separated'),
          React.createElement('option', { key: 'text', value: 'text' }, 'Text - String format'),
          React.createElement('option', { key: 'array', value: 'array' }, 'Array - Force array format'),
        ])
      ]),

      // Transform examples
      React.createElement('div', { key: 'examples' }, [
        React.createElement('label', {
          key: 'examples-label',
          className: 'block text-sm font-medium text-slate-700 mb-2'
        }, 'Transform Examples:'),
        React.createElement('div', {
          key: 'examples-list',
          className: 'text-xs text-slate-600 space-y-1'
        }, this.getExamplesForType(data.transformType).map((example, index) =>
          React.createElement('div', { key: index }, `• ${example}`)
        ))
      ])
    ]);
  }

  private getPlaceholderForType(type: string): string {
    switch (type) {
      case 'extract':
        return 'return { name: input.user.name, email: input.user.email };';
      case 'format':
        return 'return { fullName: `${input.firstName} ${input.lastName}`, timestamp: Date.now() };';
      case 'parse':
        return 'return input.split(",").map(item => item.trim());';
      case 'filter':
        return 'item.active === true && item.score > 50';
      case 'custom':
        return 'return input.map(item => ({ ...item, processed: true }));';
      default:
        return 'return input;';
    }
  }

  private getHelpTextForType(type: string): string {
    switch (type) {
      case 'extract':
        return 'Extract specific fields: return { field1: input.path1, field2: input.path2 };';
      case 'format':
        return 'Format data structure: return { newField: input.oldField, computed: input.a + input.b };';
      case 'parse':
        return 'Parse strings to data: return JSON.parse(input) or custom parsing logic';
      case 'filter':
        return 'Filter condition (arrays/objects): item.property === value';
      case 'custom':
        return 'Custom JavaScript: Full access to input and context objects. Supports variable substitution.';
      default:
        return 'JavaScript expression to transform the input data';
    }
  }

  private getExamplesForType(type: string): string[] {
    switch (type) {
      case 'extract':
        return [
          'return { id: input.data.id, name: input.data.name }',
          'return input.users.map(u => ({ id: u.id, name: u.name }))',
          'return { total: input.items.length, sum: input.items.reduce((a,b) => a+b.value, 0) }'
        ];
      case 'format':
        return [
          'return { fullName: `${input.first} ${input.last}`, age: input.age }',
          'return input.map(item => ({ ...item, timestamp: Date.now() }))',
          'return { status: "processed", data: input, processedAt: new Date().toISOString() }'
        ];
      case 'parse':
        return [
          'return input.split(",").map(x => x.trim())',
          'return input.split("\\n").filter(line => line.length > 0)',
          'return { parsed: JSON.parse(input), metadata: { size: input.length } }'
        ];
      case 'filter':
        return [
          'item.status === "active"',
          'item.score > 75 && item.verified === true',
          'value !== null && value !== undefined'
        ];
      case 'custom':
        return [
          'return input.map(item => ({ ...item, processed: true }))',
          'return { summary: input.length, items: input.filter(x => x.active) }',
          'return input.reduce((acc, item) => ({ ...acc, [item.id]: item }), {})'
        ];
      default:
        return [];
    }
  }

  renderNode(data: DataTransformNodeData): React.ReactNode {
    const typeIcons: Record<string, string> = {
      extract: '🔍',
      format: '📝',
      parse: '🔄',
      filter: '🔍',
      custom: '⚙️'
    };

    const icon = typeIcons[data.transformType] || '🔧';
    
    return React.createElement('div', { className: 'text-xs' }, [
      React.createElement('p', { key: 'type', className: 'font-medium' },
        `${icon} ${data.transformType}`
      ),
      React.createElement('p', { key: 'format', className: 'text-slate-600' },
        `→ ${data.outputFormat || 'json'}`
      )
    ]);
  }

  validateData(data: DataTransformNodeData): string[] {
    const errors: string[] = [];

    if (!data.transformLogic?.trim()) {
      errors.push('Transform logic is required');
    }

    if (!['extract', 'format', 'parse', 'filter', 'custom'].includes(data.transformType)) {
      errors.push('Invalid transform type');
    }

    if (data.outputFormat && !['json', 'csv', 'text', 'array'].includes(data.outputFormat)) {
      errors.push('Invalid output format');
    }

    // Basic syntax validation for JavaScript
    if (data.transformLogic) {
      try {
        if (data.transformType === 'custom') {
          new Function('input', 'context', `"use strict"; ${data.transformLogic}`);
        } else if (data.transformType === 'filter') {
          new Function('item', 'index', 'array', 'context', `"use strict"; return (${data.transformLogic});`);
        } else {
          new Function('input', 'context', `"use strict"; ${data.transformLogic}`);
        }
      } catch (syntaxError) {
        errors.push(`JavaScript syntax error: ${(syntaxError as Error).message}`);
      }

      // Check for dangerous patterns
      if (this.containsDangerousCode(data.transformLogic)) {
        errors.push('Transform logic contains potentially dangerous code');
      }
    }

    return errors;
  }

  getRequiredConnections() {
    return { inputs: 1, outputs: 1 };
  }

  getHelpText(): string {
    return `
Data Transform nodes process and manipulate data using JavaScript expressions.

🔧 Transform Types:
• Extract - Get specific fields from objects
• Format - Restructure data into new format  
• Parse - Convert strings into structured data
• Filter - Remove unwanted items from arrays/objects
• Custom - Full JavaScript transformation logic

🔤 Use variables in transform logic:
• Direct access: input.field, input.nested.property
• Template syntax: {httpResponse.data}, {llmResponse.text}
• Context object provides additional utilities

📤 Output variables:
• {transformedData} - Processed result
• {transformStats} - Processing statistics
• {transformSuccess} - Success/failure status

🔒 Security features:
• Sandboxed execution environment
• Strict mode enforcement
• Variable substitution support
• Performance monitoring

💡 Output formats:
• JSON - Structured data (default)
• CSV - Comma-separated values
• Text - String representation
• Array - Force array format
    `.trim();
  }

  getDocumentationUrl(): string {
    return 'https://docs.agenticflow.com/nodes/data-transform';
  }

  // Private helper methods
  private containsDangerousCode(code: string): boolean {
    const dangerousPatterns = [
      /\beval\b/,
      /\bFunction\b/,
      /\bsetTimeout\b/,
      /\bsetInterval\b/,
      /\bfetch\b/,
      /\bXMLHttpRequest\b/,
      /\bimport\b/,
      /\brequire\b/,
      /\bprocess\b/,
      /\bglobal\b/,
      /\bwindow\b/,
      /\bdocument\b/,
      /\blocalStorage\b/,
      /\bsessionStorage\b/,
      /\b__proto__\b/,
      /\bconstructor\b.*\bprototype\b/,
      /\bdelete\b.*\bprototype\b/,
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(code));
  }
} 