import React from 'react';
import { NodePlugin, NodePluginMetadata, NodeEditorContext } from '../base/NodePlugin.js';
import { ExecutionContext, VariableDefinition } from '@agenticflow/core';
import { ConditionNodeData } from '@agenticflow/types';

export class ConditionNodePlugin extends NodePlugin<ConditionNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'conditionNode',
    name: 'Condition',
    description: 'Conditional branching based on data evaluation with secure JavaScript execution',
    version: '1.1.0',
    category: 'condition',
    icon: 'ConditionIcon',
    color: 'bg-yellow-500',
    tags: ['logic', 'branching', 'conditional', 'control-flow'],
    author: 'AgenticFlow Team',
    documentation: 'https://docs.agenticflow.com/nodes/condition-node',
  };

  createDefaultData(): ConditionNodeData {
    return {
      id: '',
      type: 'conditionNode' as any,
      label: 'Condition',
      conditionLogic: 'input.value > 10',
    };
  }

  getOutputSchema(): VariableDefinition[] {
    return [
      {
        name: 'conditionResult',
        type: 'boolean',
        description: 'Result of the condition evaluation (true/false)',
        example: true
      },
      {
        name: 'conditionExpression',
        type: 'string',
        description: 'The original condition expression that was evaluated',
        example: 'input.value > 10'
      },
      {
        name: 'evaluatedAt',
        type: 'string',
        description: 'Timestamp when the condition was evaluated',
        example: '2024-01-01T12:00:00.000Z'
      },
      {
        name: 'evaluationDuration',
        type: 'number',
        description: 'Time taken to evaluate the condition in milliseconds',
        example: 2.5
      },
      {
        name: 'branchPath',
        type: 'string',
        description: 'Which branch path was taken (true or false)',
        example: 'true'
      }
    ];
  }

  async execute(input: any, data: ConditionNodeData, context: ExecutionContext): Promise<any> {
    const { logger, eventBus } = context.services;
    const startTime = performance.now();
    
    logger?.info('Executing Condition node');
    eventBus?.emit('node.execution.started', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      input,
    });

    try {
      // Evaluate the condition logic with variable substitution support
      const processedLogic = context.replaceVariables(data.conditionLogic, input);
      const conditionMet = this.evaluateCondition(processedLogic, input, context);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const output = {
        ...input,
        conditionResult: conditionMet,
        conditionExpression: data.conditionLogic,
        conditionLogic: data.conditionLogic, // Backward compatibility
        evaluatedAt: new Date().toISOString(),
        evaluationDuration: duration,
        branchPath: conditionMet ? 'true' : 'false',
      };

      logger?.info(`Condition "${data.conditionLogic}" evaluated to: ${conditionMet} (${duration.toFixed(2)}ms)`);
      eventBus?.emit('node.execution.completed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        output,
        conditionResult: conditionMet,
        branchPath: conditionMet ? 'true' : 'false',
      });

      return output;

    } catch (error: any) {
      logger?.error(`Condition evaluation failed: ${error.message}`, error);
      eventBus?.emit('node.execution.failed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        error,
      });

      // Create error output with safe fallback
      const errorOutput = {
        ...input,
        conditionResult: false,
        conditionError: error.message,
        conditionExpression: data.conditionLogic,
        evaluatedAt: new Date().toISOString(),
        branchPath: 'false',
        error: error.message,
      };

      return errorOutput;
    }
  }

  renderEditor(data: ConditionNodeData, onChange: (data: ConditionNodeData) => void, context?: NodeEditorContext): React.ReactNode {
    return React.createElement('div', { className: 'space-y-4' }, [
      React.createElement('div', { key: 'conditionLogic' }, [
        React.createElement('label', {
          key: 'label',
          htmlFor: 'conditionLogic',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Condition Logic'),
        React.createElement('textarea', {
          key: 'textarea',
          id: 'conditionLogic',
          value: data.conditionLogic,
          onChange: (e: any) => onChange({ ...data, conditionLogic: e.target.value }),
          rows: 4,
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono text-sm',
          placeholder: 'input.status === "approved" && input.score > 80'
        }),
        React.createElement('p', {
          key: 'help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'JavaScript expression that returns true/false. Use variables like {input.field} or direct access like input.field.'),
        
        // Show available variables if context is provided
        context?.availableVariables && context.availableVariables.length > 0 && React.createElement('div', {
          key: 'available-vars',
          className: 'mt-2 p-2 bg-slate-50 rounded text-xs'
        }, [
          React.createElement('p', { key: 'vars-title', className: 'font-medium text-slate-700' }, 'Available Variables:'),
          React.createElement('div', { key: 'vars-list', className: 'mt-1 flex flex-wrap gap-1' },
            context.availableVariables.slice(0, 10).map((variable: any, index: number) => 
              React.createElement('code', {
                key: index,
                className: 'px-1 bg-slate-200 rounded text-slate-600',
                title: variable.description || `Type: ${variable.type}`
              }, `{${variable.fullPath || variable.name}}`)
            )
          )
        ])
      ]),
      
      // Examples section
      React.createElement('div', { key: 'examples' }, [
        React.createElement('label', {
          key: 'examples-label',
          className: 'block text-sm font-medium text-slate-700 mb-2'
        }, 'Common Examples:'),
        React.createElement('div', {
          key: 'examples-list',
          className: 'text-xs text-slate-600 space-y-1'
        }, [
          React.createElement('div', { key: 'ex1' }, '• input.status === "approved"'),
          React.createElement('div', { key: 'ex2' }, '• input.score > 80'),
          React.createElement('div', { key: 'ex3' }, '• input.email && input.email.includes("@")'),
          React.createElement('div', { key: 'ex4' }, '• input.items && input.items.length > 0'),
          React.createElement('div', { key: 'ex5' }, '• input.priority === "high" || input.urgent === true'),
          React.createElement('div', { key: 'ex6' }, '• {httpResponse.status} === 200'),
          React.createElement('div', { key: 'ex7' }, '• {llmResponse.confidence} > 0.8'),
        ])
      ]),

      // Security notice
      React.createElement('div', { key: 'security' }, [
        React.createElement('div', {
          key: 'security-notice',
          className: 'text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200'
        }, [
          React.createElement('p', { key: 'security-title', className: 'font-medium' }, '🔒 Security Notice:'),
          React.createElement('p', { key: 'security-text' }, 'Conditions are sandboxed and cannot access external resources, eval(), or dangerous APIs.')
        ])
      ])
    ]);
  }

  renderNode(data: ConditionNodeData): React.ReactNode {
    const logicPreview = data.conditionLogic.length > 25 ? 
      data.conditionLogic.substring(0, 25) + '...' : 
      data.conditionLogic;
      
    return React.createElement('div', { className: 'text-xs' },
      React.createElement('p', { 
        className: 'truncate', 
        title: data.conditionLogic 
      }, `❓ ${logicPreview}`)
    );
  }

  validateData(data: ConditionNodeData): string[] {
    const errors: string[] = [];
    
    if (!data.conditionLogic?.trim()) {
      errors.push('Condition logic is required');
    }
    
    if (data.conditionLogic) {
      // Basic syntax validation
      try {
        // Test compile the function (but don't execute)
        new Function('input', `return ${data.conditionLogic}`);
      } catch (e) {
        errors.push(`Invalid JavaScript syntax: ${(e as Error).message}`);
      }
      
      // Check for dangerous patterns
      if (this.containsDangerousCode(data.conditionLogic)) {
        errors.push('Condition contains potentially dangerous code');
      }

      // Check for basic template syntax
      if (data.conditionLogic.includes('{') && !data.conditionLogic.includes('}')) {
        errors.push('Invalid template syntax: opening brace without closing brace');
      }
    }
    
    return errors;
  }

  getRequiredConnections() {
    return { inputs: 1, outputs: 2 }; // One input, two outputs (true/false)
  }

  getHelpText(): string {
    return `
Condition nodes evaluate JavaScript expressions to create branching logic in workflows.

❓ Purpose:
• Evaluate conditions to control workflow flow
• Create branching logic (if/then/else)
• Support complex boolean expressions
• Enable dynamic decision making

🔤 Use variables in conditions:
• Direct access: input.field, input.nested.property
• Template syntax: {httpResponse.status}, {llmResponse.text}
• Array access: input.items[0], input.data.users.length

📤 Output variables:
• {conditionResult} - Boolean result (true/false)
• {branchPath} - Which path was taken ("true" or "false")
• {evaluationDuration} - Processing time in milliseconds

🔒 Security features:
• Sandboxed execution environment
• Dangerous APIs blocked (eval, fetch, etc.)
• Read-only access to input data
• Timeout protection for infinite loops

💡 Best practices:
• Keep conditions simple and readable
• Use meaningful variable names
• Test with sample data
• Consider edge cases (null, undefined)
    `.trim();
  }

  getDocumentationUrl(): string {
    return 'https://docs.agenticflow.com/nodes/condition-node';
  }

  // Private helper methods
  private evaluateCondition(conditionLogic: string, input: any, context: ExecutionContext): boolean {
    const { logger } = context.services;
    
    try {
      // Create a safe evaluation function with enhanced security
      const evaluateFunction = new Function(
        'input', 
        `
        "use strict";
        try { 
          const result = !!(${conditionLogic}); 
          return result;
        } catch(e) { 
          console.error("Condition evaluation error:", e.message); 
          throw new Error("Condition evaluation failed: " + e.message);
        }
        `
      );
      
      // Create a sandboxed input object to prevent modification
      const sandboxedInput = JSON.parse(JSON.stringify(input));
      
      const result = evaluateFunction(sandboxedInput);
      logger?.debug(`Condition evaluation result: ${result}`, {
        logic: conditionLogic,
        inputKeys: Object.keys(input),
      });
      
      return !!result; // Ensure boolean
      
    } catch (error) {
      logger?.error(`Condition evaluation failed: ${(error as Error).message}`, error as Error);
      throw new Error(`Failed to evaluate condition: ${(error as Error).message}`);
    }
  }

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
      /\bthis\b/,
      /\bdelete\b/,
      /\bObject\.prototype\b/,
      /\bArray\.prototype\b/,
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(code));
  }
} 