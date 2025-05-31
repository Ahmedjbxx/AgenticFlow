import React from 'react';
import { NodePlugin, NodePluginMetadata } from '../base/NodePlugin';
import { ExecutionContext } from '../../core/execution/ExecutionContext';
import { DataTransformNodeData } from '../../types';

export class DataTransformNodePlugin extends NodePlugin<DataTransformNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'dataTransformNode',
    name: 'Data Transform',
    description: 'Transform, filter, or manipulate data using JavaScript expressions',
    version: '1.0.0',
    category: 'transform',
    icon: 'TransformIcon',
    color: 'bg-orange-500',
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

  async execute(input: any, data: DataTransformNodeData, context: ExecutionContext): Promise<any> {
    const { logger, eventBus } = context.services;
    
    logger.info(`Executing data transformation: ${data.transformType}`);
    eventBus.emit('node.execution.started', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      input,
    });

    try {
      let transformedData: any;

      switch (data.transformType) {
        case 'extract':
          transformedData = this.executeExtract(input, data, context);
          break;
        case 'format':
          transformedData = this.executeFormat(input, data, context);
          break;
        case 'parse':
          transformedData = this.executeParse(input, data, context);
          break;
        case 'filter':
          transformedData = this.executeFilter(input, data, context);
          break;
        case 'custom':
          transformedData = this.executeCustom(input, data, context);
          break;
        default:
          throw new Error(`Unknown transform type: ${data.transformType}`);
      }

      // Apply output formatting
      const formattedOutput = this.formatOutput(transformedData, data.outputFormat);

      const output = {
        ...input,
        transformedData: formattedOutput,
        originalData: input,
        transformType: data.transformType,
        transformSuccess: true,
      };

      logger.info(`Data transformation completed: ${data.transformType}`);
      eventBus.emit('node.execution.completed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        output,
      });

      return output;

    } catch (error: any) {
      logger.error(`Data transformation failed: ${error.message}`, error);
      eventBus.emit('node.execution.failed', {
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
      };
      
      return errorOutput;
    }
  }

  private executeExtract(input: any, data: DataTransformNodeData, context: ExecutionContext): any {
    // Extract specific fields or values from the input
    const extractFunction = new Function('input', 'context', data.transformLogic);
    return extractFunction(input, context);
  }

  private executeFormat(input: any, data: DataTransformNodeData, context: ExecutionContext): any {
    // Format data into a specific structure
    const formatFunction = new Function('input', 'context', data.transformLogic);
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
        const parseFunction = new Function('input', 'context', data.transformLogic);
        return parseFunction(input, context);
      }
    }
    
    // If not a string, apply custom parsing logic
    const parseFunction = new Function('input', 'context', data.transformLogic);
    return parseFunction(input, context);
  }

  private executeFilter(input: any, data: DataTransformNodeData, context: ExecutionContext): any {
    // Filter arrays or objects based on conditions
    if (Array.isArray(input)) {
      const filterFunction = new Function('item', 'index', 'array', 'context', `return (${data.transformLogic});`);
      return input.filter((item, index, array) => filterFunction(item, index, array, context));
    } else if (input && typeof input === 'object') {
      const filterFunction = new Function('value', 'key', 'object', 'context', `return (${data.transformLogic});`);
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
    const customFunction = new Function('input', 'context', data.transformLogic);
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

  renderEditor(data: DataTransformNodeData, onChange: (data: DataTransformNodeData) => void): React.ReactNode {
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
        }, this.getHelpTextForType(data.transformType))
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
        return 'Custom JavaScript: Full access to input and context objects';
      default:
        return 'JavaScript expression to transform the input data';
    }
  }

  renderNode(data: DataTransformNodeData): React.ReactNode {
    return React.createElement('div', { className: 'px-3 py-2' }, [
      React.createElement('div', { key: 'title', className: 'font-medium text-sm' }, data.label),
      React.createElement('div', { key: 'details', className: 'text-xs text-slate-600 mt-1' }, [
        React.createElement('div', { key: 'type' }, `Type: ${data.transformType}`),
        React.createElement('div', { key: 'format' }, `Output: ${data.outputFormat || 'json'}`),
      ]),
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
          new Function('input', 'context', data.transformLogic);
        } else if (data.transformType === 'filter') {
          new Function('item', 'index', 'array', 'context', `return (${data.transformLogic});`);
        }
      } catch (syntaxError) {
        errors.push(`JavaScript syntax error: ${(syntaxError as Error).message}`);
      }
    }

    return errors;
  }

  getRequiredConnections() {
    return { inputs: 1, outputs: 1 };
  }

  getHelpText(): string {
    return `
      The Data Transform node processes and manipulates data using JavaScript expressions:
      
      Transform Types:
      - Extract: Get specific fields from objects
      - Format: Restructure data into new format
      - Parse: Convert strings into structured data
      - Filter: Remove unwanted items from arrays/objects
      - Custom: Full JavaScript transformation logic
      
      Available variables: input (incoming data), context (execution context)
      Output formats: JSON, CSV, Text, Array
    `;
  }
} 