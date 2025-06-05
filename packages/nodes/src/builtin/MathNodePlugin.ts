import React from 'react';
import { NodePlugin, NodePluginMetadata, NodeEditorContext } from '../base/NodePlugin.js';
import { ExecutionContext, VariableDefinition } from '@agenticflow/core';
import { MathNodeData } from '@agenticflow/types';

export class MathNodePlugin extends NodePlugin<MathNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'mathNode',
    name: 'Math Node',
    description: 'Perform basic arithmetic operations (+, -, *, /) on two numbers',
    version: '1.0.0',
    category: 'utility',
    icon: 'CalculatorIcon',
    color: 'bg-green-500',
    tags: ['math', 'arithmetic', 'calculation', 'numbers'],
    author: 'AgenticFlow Team',
    documentation: 'https://docs.agenticflow.com/nodes/math-node',
  };

  createDefaultData(): MathNodeData {
    return {
      id: '',
      type: 'mathNode' as any,
      label: 'Math Node',
      operation: '+',
      operandA: 10,
      operandB: 5,
      operandAVariable: '',
      operandBVariable: '',
      useVariables: false,
    };
  }

  getOutputSchema(): VariableDefinition[] {
    return [
      {
        name: 'result',
        type: 'number',
        description: 'Result of the mathematical operation',
        example: 15
      },
      {
        name: 'operation',
        type: 'string',
        description: 'The operation that was performed',
        example: '+'
      },
      {
        name: 'operandA',
        type: 'number',
        description: 'First operand used in calculation',
        example: 10
      },
      {
        name: 'operandB',
        type: 'number',
        description: 'Second operand used in calculation',
        example: 5
      },
      {
        name: 'expression',
        type: 'string',
        description: 'The complete mathematical expression',
        example: '10 + 5 = 15'
      }
    ];
  }

  private getOperandValue(
    operandName: 'operandA' | 'operandB',
    data: MathNodeData,
    input: any,
    context: ExecutionContext
  ): number {
    if (data.useVariables) {
      const variableName = operandName === 'operandA' ? data.operandAVariable : data.operandBVariable;
      if (variableName && input && typeof input === 'object') {
        // Try to get the value from input data
        const value = this.getNestedValue(input, variableName);
        if (typeof value === 'number') {
          return value;
        } else if (typeof value === 'string' && !isNaN(Number(value))) {
          return Number(value);
        }
      }
    }
    
    // Fall back to fixed value
    return operandName === 'operandA' ? data.operandA : data.operandB;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  async execute(input: any, data: MathNodeData, context: ExecutionContext): Promise<any> {
    const { logger } = context.services;
    
    logger?.info(`Executing math operation: ${data.operation}`);

    try {
      // Get operand values (either from variables or fixed values)
      const operandA = this.getOperandValue('operandA', data, input, context);
      const operandB = this.getOperandValue('operandB', data, input, context);

      let result: number;
      
      // Perform the operation
      switch (data.operation) {
        case '+':
          result = operandA + operandB;
          break;
        case '-':
          result = operandA - operandB;
          break;
        case '*':
          result = operandA * operandB;
          break;
        case '/':
          if (operandB === 0) {
            throw new Error('Division by zero is not allowed');
          }
          result = operandA / operandB;
          break;
        default:
          throw new Error(`Unsupported operation: ${data.operation}`);
      }

      const expression = `${operandA} ${data.operation} ${operandB} = ${result}`;
      
      const output = {
        ...input,
        result,
        operation: data.operation,
        operandA,
        operandB,
        expression,
        nodeType: 'mathNode',
      };

      logger?.info(`Math operation completed: ${expression}`);
      
      return output;

    } catch (error: any) {
      logger?.error(`Math node execution failed: ${error.message}`, error);
      
      // Return error output
      return {
        ...input,
        error: error.message,
        result: 0,
        operation: data.operation,
        operandA: 0,
        operandB: 0,
        expression: `Error: ${error.message}`,
      };
    }
  }

  renderEditor(data: MathNodeData, onChange: (data: MathNodeData) => void, context?: NodeEditorContext): React.ReactNode {
    return React.createElement('div', { className: 'space-y-4' }, [
      // Operation Selection
      React.createElement('div', { key: 'operation' }, [
        React.createElement('label', {
          key: 'operation-label',
          htmlFor: 'operation',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Operation'),
        React.createElement('select', {
          key: 'operation-select',
          id: 'operation',
          value: data.operation,
          onChange: (e: any) => onChange({ ...data, operation: e.target.value }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
        }, [
          React.createElement('option', { key: 'add', value: '+' }, 'Addition (+)'),
          React.createElement('option', { key: 'subtract', value: '-' }, 'Subtraction (-)'),
          React.createElement('option', { key: 'multiply', value: '*' }, 'Multiplication (*)'),
          React.createElement('option', { key: 'divide', value: '/' }, 'Division (/)')
        ])
      ]),

      // Use Variables Toggle
      React.createElement('div', { key: 'use-variables' }, [
        React.createElement('label', {
          key: 'variables-label',
          className: 'flex items-center'
        }, [
          React.createElement('input', {
            key: 'variables-checkbox',
            type: 'checkbox',
            checked: data.useVariables,
            onChange: (e: any) => onChange({ ...data, useVariables: e.target.checked }),
            className: 'h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded'
          }),
          React.createElement('span', {
            key: 'variables-text',
            className: 'ml-2 text-sm text-slate-700'
          }, 'Use variables from previous nodes')
        ])
      ]),

      // Operand A
      React.createElement('div', { key: 'operand-a' }, [
        React.createElement('label', {
          key: 'operand-a-label',
          htmlFor: 'operandA',
          className: 'block text-sm font-medium text-slate-700'
        }, 'First Number (A)'),
        data.useVariables ? 
          React.createElement('input', {
            key: 'operand-a-variable',
            type: 'text',
            id: 'operandAVariable',
            value: data.operandAVariable || '',
            onChange: (e: any) => onChange({ ...data, operandAVariable: e.target.value }),
            placeholder: 'e.g., input.number or result',
            className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
          }) :
          React.createElement('input', {
            key: 'operand-a-number',
            type: 'number',
            id: 'operandA',
            value: data.operandA,
            onChange: (e: any) => onChange({ ...data, operandA: parseFloat(e.target.value) || 0 }),
            className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
            step: 'any'
          })
      ]),

      // Operand B
      React.createElement('div', { key: 'operand-b' }, [
        React.createElement('label', {
          key: 'operand-b-label',
          htmlFor: 'operandB',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Second Number (B)'),
        data.useVariables ? 
          React.createElement('input', {
            key: 'operand-b-variable',
            type: 'text',
            id: 'operandBVariable',
            value: data.operandBVariable || '',
            onChange: (e: any) => onChange({ ...data, operandBVariable: e.target.value }),
            placeholder: 'e.g., input.number or result',
            className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
          }) :
          React.createElement('input', {
            key: 'operand-b-number',
            type: 'number',
            id: 'operandB',
            value: data.operandB,
            onChange: (e: any) => onChange({ ...data, operandB: parseFloat(e.target.value) || 0 }),
            className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
            step: 'any'
          })
      ]),

      // Preview
      React.createElement('div', { key: 'preview' }, [
        React.createElement('label', {
          key: 'preview-label',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Preview'),
        React.createElement('p', {
          key: 'preview-text',
          className: 'mt-1 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded'
        }, data.useVariables 
          ? `${data.operandAVariable || 'A'} ${data.operation} ${data.operandBVariable || 'B'} = ?`
          : `${data.operandA} ${data.operation} ${data.operandB} = ${this.calculatePreview(data)}`
        )
      ])
    ]);
  }

  private calculatePreview(data: MathNodeData): number | string {
    try {
      const { operandA, operandB, operation } = data;
      switch (operation) {
        case '+': return operandA + operandB;
        case '-': return operandA - operandB;
        case '*': return operandA * operandB;
        case '/': return operandB === 0 ? 'Error: Division by zero' : operandA / operandB;
        default: return 'Unknown operation';
      }
    } catch {
      return 'Error';
    }
  }

  renderNode(data: MathNodeData): React.ReactNode {
    const getOperationSymbol = (op: string) => {
      switch (op) {
        case '+': return '➕';
        case '-': return '➖';
        case '*': return '✖️';
        case '/': return '➗';
        default: return '🔢';
      }
    };

    return React.createElement('div', { className: 'text-xs' },
      React.createElement('p', { className: 'font-medium' }, 
        `${getOperationSymbol(data.operation)} Math ${data.operation}`
      ),
      React.createElement('p', { className: 'text-slate-600' }, 
        data.useVariables 
          ? `Variables: ${data.operandAVariable || 'A'} ${data.operation} ${data.operandBVariable || 'B'}`
          : `${data.operandA} ${data.operation} ${data.operandB}`
      )
    );
  }
} 