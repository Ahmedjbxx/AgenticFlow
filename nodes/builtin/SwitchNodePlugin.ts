import React from 'react';
import { NodePlugin, NodePluginMetadata } from '../base/NodePlugin';
import { ExecutionContext } from '../../core/execution/ExecutionContext';
import { SwitchNodeData } from '../../types';

export class SwitchNodePlugin extends NodePlugin<SwitchNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'switchNode',
    name: 'Switch',
    description: 'Route workflow based on multiple conditions or values',
    version: '1.0.0',
    category: 'condition',
    icon: 'SwitchIcon',
    color: 'bg-yellow-500',
  };

  createDefaultData(): SwitchNodeData {
    return {
      id: '',
      type: 'switchNode' as any,
      label: 'Switch',
      switchExpression: 'input.category',
      cases: [
        { value: 'urgent', label: 'Urgent' },
        { value: 'normal', label: 'Normal' },
        { value: 'low', label: 'Low Priority' },
      ],
      defaultCase: true,
    };
  }

  async execute(input: any, data: SwitchNodeData, context: ExecutionContext): Promise<any> {
    const { logger, eventBus } = context.services;
    
    logger.info(`Executing switch on expression: ${data.switchExpression}`);
    eventBus.emit('node.execution.started', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      input,
    });

    try {
      // Evaluate the switch expression
      const switchValue = context.evaluateExpression(data.switchExpression, input);
      const switchValueString = String(switchValue);
      
      logger.info(`Switch value evaluated to: "${switchValueString}"`);

      // Find matching case
      let matchedCase: { value: string; label: string } | null = null;
      let matchedCaseIndex = -1;
      
      for (let i = 0; i < data.cases.length; i++) {
        const caseItem = data.cases[i];
        if (caseItem.value === switchValueString) {
          matchedCase = caseItem;
          matchedCaseIndex = i;
          break;
        }
      }

      // Determine output path
      let outputPath: string;
      let isDefaultCase = false;

      if (matchedCase) {
        outputPath = matchedCase.value;
        logger.info(`Matched case: ${matchedCase.label} (${matchedCase.value})`);
      } else if (data.defaultCase) {
        outputPath = 'default';
        isDefaultCase = true;
        logger.info(`No match found, using default case`);
      } else {
        throw new Error(`No matching case found for value "${switchValueString}" and no default case configured`);
      }

      const output = {
        ...input,
        switchValue: switchValueString,
        switchExpression: data.switchExpression,
        matchedCase,
        matchedCaseIndex,
        outputPath,
        isDefaultCase,
        switchEvaluated: true,
        availableCases: data.cases.map(c => ({ value: c.value, label: c.label })),
      };

      logger.info(`Switch routing to: ${outputPath}`);
      eventBus.emit('node.execution.completed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        output,
      });

      return output;

    } catch (error: any) {
      logger.error(`Switch execution failed: ${error.message}`, error);
      eventBus.emit('node.execution.failed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        error,
      });
      
      const errorOutput = {
        ...input,
        switchValue: null,
        switchExpression: data.switchExpression,
        matchedCase: null,
        matchedCaseIndex: -1,
        outputPath: 'error',
        isDefaultCase: false,
        switchEvaluated: false,
        switchError: error.message,
        availableCases: data.cases.map(c => ({ value: c.value, label: c.label })),
      };
      
      return errorOutput;
    }
  }

  renderEditor(data: SwitchNodeData, onChange: (data: SwitchNodeData) => void): React.ReactNode {
    const addCase = () => {
      const newCases = [...data.cases, { value: '', label: '' }];
      onChange({ ...data, cases: newCases });
    };

    const removeCase = (index: number) => {
      const newCases = data.cases.filter((_, i) => i !== index);
      onChange({ ...data, cases: newCases });
    };

    const updateCase = (index: number, field: 'value' | 'label', value: string) => {
      const newCases = [...data.cases];
      newCases[index] = { ...newCases[index], [field]: value };
      onChange({ ...data, cases: newCases });
    };

    return React.createElement('div', { className: 'space-y-4' }, [
      // Switch Expression field
      React.createElement('div', { key: 'switchExpression' }, [
        React.createElement('label', {
          key: 'switchExpression-label',
          htmlFor: 'switchExpression',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Switch Expression'),
        React.createElement('input', {
          key: 'switchExpression-input',
          type: 'text',
          id: 'switchExpression',
          value: data.switchExpression,
          onChange: (e: any) => onChange({ ...data, switchExpression: e.target.value }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
          placeholder: 'input.category'
        }),
        React.createElement('p', {
          key: 'switchExpression-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Expression to evaluate for switching (e.g., input.status, input.priority)')
      ]),

      // Cases section
      React.createElement('div', { key: 'cases' }, [
        React.createElement('div', {
          key: 'cases-header',
          className: 'flex items-center justify-between'
        }, [
          React.createElement('label', {
            key: 'cases-label',
            className: 'block text-sm font-medium text-slate-700'
          }, 'Cases'),
          React.createElement('button', {
            key: 'add-case-btn',
            type: 'button',
            onClick: addCase,
            className: 'text-sm bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700'
          }, 'Add Case')
        ]),
        
        // Render existing cases
        ...data.cases.map((caseItem, index) =>
          React.createElement('div', {
            key: `case-${index}`,
            className: 'border border-slate-200 rounded p-3 space-y-2'
          }, [
            React.createElement('div', {
              key: 'case-header',
              className: 'flex items-center justify-between'
            }, [
              React.createElement('span', {
                key: 'case-title',
                className: 'text-sm font-medium text-slate-600'
              }, `Case ${index + 1}`),
              data.cases.length > 1 && React.createElement('button', {
                key: 'remove-case-btn',
                type: 'button',
                onClick: () => removeCase(index),
                className: 'text-xs text-red-600 hover:text-red-800'
              }, 'Remove')
            ]),
            
            React.createElement('div', { key: 'case-value' }, [
              React.createElement('label', {
                key: 'case-value-label',
                className: 'block text-xs font-medium text-slate-600'
              }, 'Value'),
              React.createElement('input', {
                key: 'case-value-input',
                type: 'text',
                value: caseItem.value,
                onChange: (e: any) => updateCase(index, 'value', e.target.value),
                className: 'mt-1 block w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500',
                placeholder: 'urgent'
              })
            ]),
            
            React.createElement('div', { key: 'case-label' }, [
              React.createElement('label', {
                key: 'case-label-label',
                className: 'block text-xs font-medium text-slate-600'
              }, 'Label'),
              React.createElement('input', {
                key: 'case-label-input',
                type: 'text',
                value: caseItem.label,
                onChange: (e: any) => updateCase(index, 'label', e.target.value),
                className: 'mt-1 block w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500',
                placeholder: 'Urgent Priority'
              })
            ])
          ])
        )
      ]),

      // Default Case option
      React.createElement('div', { key: 'defaultCase' }, [
        React.createElement('label', {
          key: 'defaultCase-label',
          className: 'flex items-center space-x-2'
        }, [
          React.createElement('input', {
            key: 'defaultCase-checkbox',
            type: 'checkbox',
            checked: data.defaultCase || false,
            onChange: (e: any) => onChange({ ...data, defaultCase: e.target.checked }),
            className: 'h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded'
          }),
          React.createElement('span', {
            key: 'defaultCase-text',
            className: 'text-sm text-slate-700'
          }, 'Include default case for unmatched values')
        ]),
        React.createElement('p', {
          key: 'defaultCase-help',
          className: 'mt-1 text-xs text-slate-500 ml-6'
        }, 'If enabled, unmatched values will route to a default output')
      ]),
    ]);
  }

  renderNode(data: SwitchNodeData): React.ReactNode {
    return React.createElement('div', { className: 'px-3 py-2' }, [
      React.createElement('div', { key: 'title', className: 'font-medium text-sm' }, data.label),
      React.createElement('div', { key: 'details', className: 'text-xs text-slate-600 mt-1' }, [
        React.createElement('div', { key: 'expression' }, `On: ${data.switchExpression}`),
        React.createElement('div', { key: 'cases' }, `Cases: ${data.cases.length}${data.defaultCase ? ' + default' : ''}`),
      ]),
    ]);
  }

  validateData(data: SwitchNodeData): string[] {
    const errors: string[] = [];

    if (!data.switchExpression?.trim()) {
      errors.push('Switch expression is required');
    }

    if (!data.cases || data.cases.length === 0) {
      errors.push('At least one case is required');
    }

    if (data.cases) {
      // Check for empty case values
      const emptyCases = data.cases.filter(c => !c.value?.trim());
      if (emptyCases.length > 0) {
        errors.push('All cases must have a value');
      }

      // Check for duplicate case values
      const values = data.cases.map(c => c.value?.trim()).filter(Boolean);
      const uniqueValues = new Set(values);
      if (values.length !== uniqueValues.size) {
        errors.push('Case values must be unique');
      }

      // Check for empty labels
      const emptyLabels = data.cases.filter(c => !c.label?.trim());
      if (emptyLabels.length > 0) {
        errors.push('All cases must have a label');
      }
    }

    return errors;
  }

  getRequiredConnections() {
    // Switch nodes can have multiple outputs (one per case + default)
    const outputCount = data.cases.length + (data.defaultCase ? 1 : 0);
    return { inputs: 1, outputs: Math.max(1, outputCount) };
  }

  getHelpText(): string {
    return `
      The Switch node routes workflow execution based on the value of an expression:
      
      Features:
      - Evaluate any JavaScript expression against input data
      - Multiple case values with descriptive labels
      - Optional default case for unmatched values
      - String comparison for all case matching
      
      Output Routing:
      - Each case creates a separate output path
      - Default case (if enabled) provides fallback routing
      - Matched case information is passed to output
      
      Use cases: Status-based routing, priority handling, category switching
    `;
  }
} 