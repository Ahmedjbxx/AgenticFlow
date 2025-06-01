import React from 'react';
import { NodePlugin, NodePluginMetadata } from '../base/NodePlugin';
import { ExecutionContext } from '../../core/execution/ExecutionContext';
import { ConditionNodeData } from '../../types';
import { VariableDefinition } from '../../core/variables/VariableRegistry';

export class ConditionNodePlugin extends NodePlugin<ConditionNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'conditionNode',
    name: 'Condition',
    description: 'Conditional branching based on data evaluation',
    version: '1.0.0',
    category: 'condition',
    icon: 'ConditionIcon',
    color: 'bg-yellow-500',
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
      }
    ];
  }

  async execute(input: any, data: ConditionNodeData, context: ExecutionContext): Promise<any> {
    const { logger, eventBus } = context.services;
    
    logger.info('Executing Condition node');
    eventBus.emit('node.execution.started', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      input,
    });

    try {
      // Evaluate the condition logic
      const conditionMet = this.evaluateCondition(data.conditionLogic, input, context);
      
      const output = {
        ...input,
        conditionResult: conditionMet,
        conditionLogic: data.conditionLogic,
        evaluatedAt: new Date().toISOString(),
      };

      logger.info(`Condition "${data.conditionLogic}" evaluated to: ${conditionMet}`);
      eventBus.emit('node.execution.completed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        output,
        conditionResult: conditionMet,
      });

      return output;

    } catch (error: any) {
      logger.error(`Condition evaluation failed: ${error.message}`, error);
      eventBus.emit('node.execution.failed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        error,
      });

      // Create error output
      const errorOutput = {
        ...input,
        conditionResult: false,
        conditionError: error.message,
        evaluatedAt: new Date().toISOString(),
      };

      return errorOutput;
    }
  }

  renderEditor(data: ConditionNodeData, onChange: (data: ConditionNodeData) => void, context?: { nodeId: string; availableVariables: any[] }): React.ReactNode {
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
          placeholder: 'input.status === "approved"'
        }),
        React.createElement('p', {
          key: 'help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'JavaScript expression that returns true/false. Use "input" to access incoming data.')
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
        ])
      ])
    ]);
  }

  renderNode(data: ConditionNodeData): React.ReactNode {
    const logicPreview = data.conditionLogic.length > 30 ? 
      data.conditionLogic.substring(0, 30) + '...' : 
      data.conditionLogic;
      
    return React.createElement('div', { className: 'text-xs' },
      React.createElement('p', { 
        className: 'truncate', 
        title: data.conditionLogic 
      }, `Logic: ${logicPreview}`)
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
    }
    
    return errors;
  }

  getRequiredConnections() {
    return { inputs: 1, outputs: 2 }; // One input, two outputs (true/false)
  }

  getHelpText(): string {
    return `
Condition nodes evaluate JavaScript expressions to create branching logic in workflows.
The expression should return true or false. Use "input" to access data from previous nodes.
Outputs: True path and False path for different workflow branches.
    `.trim();
  }

  // Private helper methods
  private evaluateCondition(conditionLogic: string, input: any, context: ExecutionContext): boolean {
    const { logger } = context.services;
    
    try {
      // Create a safe evaluation function
      const evaluateFunction = new Function(
        'input', 
        `
        try { 
          return !!(${conditionLogic}); 
        } catch(e) { 
          console.error("Condition evaluation error:", e); 
          return false; 
        }
        `
      );
      
      const result = evaluateFunction(input);
      logger.debug(`Condition evaluation result: ${result}`, {
        logic: conditionLogic,
        input: input,
      });
      
      return !!result; // Ensure boolean
      
    } catch (error) {
      logger.error(`Condition evaluation failed: ${(error as Error).message}`, error);
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
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(code));
  }
} 