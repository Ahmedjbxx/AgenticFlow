import React from 'react';
import { NodePlugin, NodePluginMetadata, NodeEditorContext } from '../base/NodePlugin.js';
import { ExecutionContext, VariableDefinition } from '@agenticflow/core';
import { SwitchNodeData } from '@agenticflow/types';

export class SwitchNodePlugin extends NodePlugin<SwitchNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'switchNode',
    name: 'Switch',
    description: 'Route workflow based on multiple conditions or values with dynamic case matching',
    version: '1.1.0',
    category: 'condition',
    icon: 'SwitchIcon',
    color: 'bg-yellow-500',
    tags: ['routing', 'conditions', 'branching', 'switch', 'multi-output'],
    author: 'AgenticFlow Team',
    documentation: 'https://docs.agenticflow.com/nodes/switch-node',
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

  getOutputSchema(): VariableDefinition[] {
    return [
      {
        name: 'switchValue',
        type: 'string',
        description: 'The evaluated value that was used for switching',
        example: 'urgent'
      },
      {
        name: 'switchExpression',
        type: 'string',
        description: 'The original switch expression',
        example: 'input.category'
      },
      {
        name: 'matchedCase',
        type: 'object',
        description: 'Details of the case that was matched',
        example: { value: 'urgent', label: 'Urgent Priority' }
      },
      {
        name: 'matchedCaseIndex',
        type: 'number',
        description: 'Index of the matched case (0-based, -1 if default)',
        example: 0
      },
      {
        name: 'outputPath',
        type: 'string',
        description: 'The routing path that was taken',
        example: 'urgent'
      },
      {
        name: 'isDefaultCase',
        type: 'boolean',
        description: 'Whether the default case was used',
        example: false
      },
      {
        name: 'switchEvaluated',
        type: 'boolean',
        description: 'Whether the switch evaluation was successful',
        example: true
      },
      {
        name: 'availableCases',
        type: 'array',
        description: 'All available cases for this switch',
        example: [{ value: 'urgent', label: 'Urgent' }, { value: 'normal', label: 'Normal' }]
      }
    ];
  }

  async execute(input: any, data: SwitchNodeData, context: ExecutionContext): Promise<any> {
    const { logger, eventBus } = context.services;
    
    logger?.info(`Executing switch on expression: ${data.switchExpression}`);
    eventBus?.emit('node.execution.started', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      input,
    });

    try {
      // Process expression with variable substitution
      const processedExpression = context.replaceVariables(data.switchExpression, input);
      
      // Evaluate the switch expression
      let switchValue: any;
      try {
        const evaluateFunction = new Function('input', 'context', `"use strict"; return (${processedExpression});`);
        switchValue = evaluateFunction(input, context);
      } catch (evalError) {
        throw new Error(`Failed to evaluate switch expression: ${(evalError as Error).message}`);
      }
      
      const switchValueString = String(switchValue);
      
      logger?.info(`Switch value evaluated to: "${switchValueString}" (expression: ${data.switchExpression} → ${processedExpression})`);

      // Find matching case
      let matchedCase: { value: string; label: string } | null = null;
      let matchedCaseIndex = -1;
      
      for (let i = 0; i < data.cases.length; i++) {
        const caseItem = data.cases[i];
        if (!caseItem) continue; // Handle possibly undefined
        
        // Process case value with variable substitution
        const processedCaseValue = context.replaceVariables(caseItem.value, input);
        
        if (processedCaseValue === switchValueString) {
          matchedCase = { value: caseItem.value, label: caseItem.label };
          matchedCaseIndex = i;
          break;
        }
      }

      // Determine output path
      let outputPath: string;
      let isDefaultCase = false;

      if (matchedCase) {
        outputPath = matchedCase.value;
        logger?.info(`Matched case: ${matchedCase.label} (${matchedCase.value})`);
      } else if (data.defaultCase) {
        outputPath = 'default';
        isDefaultCase = true;
        logger?.info(`No match found, using default case`);
      } else {
        throw new Error(`No matching case found for value "${switchValueString}" and no default case configured`);
      }

      const output = {
        ...input,
        switchValue: switchValueString,
        switchExpression: data.switchExpression,
        processedExpression,
        matchedCase,
        matchedCaseIndex,
        outputPath,
        isDefaultCase,
        switchEvaluated: true,
        availableCases: data.cases.map(c => ({ value: c.value, label: c.label })),
        switchStats: {
          evaluatedExpression: processedExpression,
          originalExpression: data.switchExpression,
          resultValue: switchValueString,
          totalCases: data.cases.length,
          hasDefaultCase: data.defaultCase,
          evaluatedAt: new Date().toISOString(),
        },
      };

      logger?.info(`Switch routing to: ${outputPath} (case ${matchedCaseIndex >= 0 ? matchedCaseIndex + 1 : 'default'})`);
      eventBus?.emit('node.execution.completed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        output,
        switchResult: {
          value: switchValueString,
          matchedCase: matchedCase || undefined,
          outputPath,
          isDefaultCase,
        },
      });

      return output;

    } catch (error: any) {
      logger?.error(`Switch execution failed: ${error.message}`, error);
      eventBus?.emit('node.execution.failed', {
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
        switchStats: {
          originalExpression: data.switchExpression,
          totalCases: data.cases.length,
          hasDefaultCase: data.defaultCase,
          error: error.message,
          evaluatedAt: new Date().toISOString(),
        },
      };
      
      return errorOutput;
    }
  }

  renderEditor(data: SwitchNodeData, onChange: (data: SwitchNodeData) => void, context?: NodeEditorContext): React.ReactNode {
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
      const currentCase = newCases[index];
      if (currentCase) {
        newCases[index] = { 
          value: field === 'value' ? value : (currentCase.value || ''),
          label: field === 'label' ? value : (currentCase.label || '')
        };
        onChange({ ...data, cases: newCases });
      }
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
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono',
          placeholder: 'input.category'
        }),
        React.createElement('p', {
          key: 'switchExpression-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'JavaScript expression to evaluate for switching. Supports variable substitution.'),
        
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
            className: 'text-sm bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500'
          }, '+ Add Case')
        ]),
        
        // Render existing cases
        ...data.cases.map((caseItem, index) =>
          React.createElement('div', {
            key: `case-${index}`,
            className: 'border border-slate-200 rounded p-3 space-y-2 bg-slate-50'
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
                className: 'text-xs text-red-600 hover:text-red-800 focus:outline-none'
              }, '✕ Remove')
            ]),
            
            React.createElement('div', { key: 'case-value' }, [
              React.createElement('label', {
                key: 'case-value-label',
                className: 'block text-xs font-medium text-slate-600'
              }, 'Value'),
              React.createElement('input', {
                key: 'case-value-input',
                type: 'text',
                value: caseItem?.value || '',
                onChange: (e: any) => updateCase(index, 'value', e.target.value),
                className: 'mt-1 block w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono',
                placeholder: 'urgent'
              }),
              React.createElement('p', {
                key: 'case-value-help',
                className: 'mt-1 text-xs text-slate-400'
              }, 'Value to match (supports variables)')
            ]),
            
            React.createElement('div', { key: 'case-label' }, [
              React.createElement('label', {
                key: 'case-label-label',
                className: 'block text-xs font-medium text-slate-600'
              }, 'Label'),
              React.createElement('input', {
                key: 'case-label-input',
                type: 'text',
                value: caseItem?.label || '',
                onChange: (e: any) => updateCase(index, 'label', e.target.value),
                className: 'mt-1 block w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500',
                placeholder: 'Urgent Priority'
              }),
              React.createElement('p', {
                key: 'case-label-help',
                className: 'mt-1 text-xs text-slate-400'
              }, 'Descriptive label for this case')
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

      // Examples section
      React.createElement('div', { key: 'examples' }, [
        React.createElement('label', {
          key: 'examples-label',
          className: 'block text-sm font-medium text-slate-700 mb-2'
        }, 'Switch Examples:'),
        React.createElement('div', {
          key: 'examples-list',
          className: 'text-xs text-slate-600 space-y-1'
        }, [
          React.createElement('div', { key: 'ex1' }, '• {input.status} - Route by status field'),
          React.createElement('div', { key: 'ex2' }, '• {httpResponse.data.priority} - Route by API response'),
          React.createElement('div', { key: 'ex3' }, '• {input.value} > 100 ? "high" : "low" - Conditional routing'),
          React.createElement('div', { key: 'ex4' }, '• {input.category}.toLowerCase() - Normalized routing'),
        ])
      ])
    ]);
  }

  renderNode(data: SwitchNodeData): React.ReactNode {
    const expressionPreview = data.switchExpression.length > 15 ? 
      data.switchExpression.substring(0, 15) + '...' : 
      data.switchExpression;
      
    return React.createElement('div', { className: 'text-xs' }, [
      React.createElement('p', { key: 'expression', className: 'font-medium', title: data.switchExpression },
        `🔀 ${expressionPreview}`
      ),
      React.createElement('p', { key: 'cases', className: 'text-slate-600' },
        `${data.cases.length} cases${data.defaultCase ? ' + default' : ''}`
      )
    ]);
  }

  validateData(data: SwitchNodeData): string[] {
    const errors: string[] = [];

    if (!data.switchExpression?.trim()) {
      errors.push('Switch expression is required');
    } else {
      // Basic syntax validation
      try {
        new Function('input', 'context', `"use strict"; return (${data.switchExpression});`);
      } catch (syntaxError) {
        errors.push(`Invalid switch expression syntax: ${(syntaxError as Error).message}`);
      }
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

      // Check for duplicate case values (after trimming)
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

  getRequiredConnections(data?: SwitchNodeData) {
    // Switch nodes can have multiple outputs (one per case + default)
    if (!data) {
      return { inputs: 1, outputs: 1 };
    }
    const outputCount = data.cases.length + (data.defaultCase ? 1 : 0);
    return { inputs: 1, outputs: Math.max(1, outputCount) };
  }

  getHelpText(): string {
    return `
Switch nodes route workflow execution based on the value of an expression.

🔀 Purpose:
• Evaluate JavaScript expressions against input data
• Multiple case routing with descriptive labels
• Optional default case for unmatched values
• String-based case matching with variable support

🔤 Use variables in expressions:
• Switch on: {input.status}, {httpResponse.data.category}
• Case values: {input.urgentFlag} ? "urgent" : "normal"
• Dynamic routing based on data content

📤 Output routing:
• Each case creates a separate output path
• Default case provides fallback routing
• Matched case information passed to output
• Switch statistics included in results

💡 Use cases:
• Status-based workflow routing
• Priority-based processing
• Category-specific handling
• Dynamic multi-path decisions

🔧 Features:
• Variable substitution in expressions and case values
• Comprehensive error handling
• Detailed routing statistics
• Flexible case management
    `.trim();
  }

  getDocumentationUrl(): string {
    return 'https://docs.agenticflow.com/nodes/switch-node';
  }
} 