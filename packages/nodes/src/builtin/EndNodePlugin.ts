import React from 'react';
import { NodePlugin, NodePluginMetadata, NodeEditorContext } from '../base/NodePlugin.js';
import { ExecutionContext, VariableDefinition } from '@agenticflow/core';
import { EndNodeData } from '@agenticflow/types';

export class EndNodePlugin extends NodePlugin<EndNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'endNode',
    name: 'End',
    description: 'Terminate workflow execution with final results and completion message',
    version: '1.1.0',
    category: 'utility',
    icon: 'EndIcon',
    color: 'bg-red-500',
    tags: ['workflow', 'termination', 'completion', 'end'],
    author: 'AgenticFlow Team',
    documentation: 'https://docs.agenticflow.com/nodes/end-node',
  };

  createDefaultData(): EndNodeData {
    return {
      id: '',
      type: 'endNode' as any,
      label: 'End',
      message: 'Workflow completed successfully',
    };
  }

  getOutputSchema(): VariableDefinition[] {
    return [
      {
        name: 'workflowResult',
        type: 'object',
        description: 'Final result of the workflow execution',
        example: { status: 'completed', message: 'Workflow completed successfully' }
      },
      {
        name: 'completedAt',
        type: 'string',
        description: 'Timestamp when the workflow completed',
        example: '2024-01-01T12:00:00.000Z'
      },
      {
        name: 'finalMessage',
        type: 'string',
        description: 'Final message from the workflow',
        example: 'Workflow completed successfully'
      },
      {
        name: 'endMessage',
        type: 'string',
        description: 'Processed end message with variable substitution',
        example: 'Workflow completed successfully. Processed 42 items.'
      }
    ];
  }

  async execute(input: any, data: EndNodeData, context: ExecutionContext): Promise<any> {
    const { logger, eventBus } = context.services;
    
    logger?.info('Executing End node');
    eventBus?.emit('node.execution.started', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      input,
    });

    try {
      // Process the end message with variable substitution
      const finalMessage = context.replaceVariables(data.message, input);

      const output = {
        ...input,
        endMessage: finalMessage,
        endedAt: new Date().toISOString(),
        workflowComplete: true,
        finalStatus: 'completed',
        workflowResult: {
          status: 'completed',
          message: finalMessage,
          completedAt: new Date().toISOString(),
          finalOutput: input
        },
        completedAt: new Date().toISOString(),
        finalMessage: finalMessage,
      };

      logger?.info(`Workflow ended: ${finalMessage}`);
      eventBus?.emit('node.execution.completed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        output,
      });
      
      // Emit workflow completion event
      eventBus?.emit('flow.execution.completed', {
        flowId: context.flowId,
        executionId: context.executionId,
        endMessage: finalMessage,
        finalOutput: output,
        completedAt: new Date().toISOString(),
      });

      return output;

    } catch (error: any) {
      logger?.error(`End node execution failed: ${error.message}`, error);
      eventBus?.emit('node.execution.failed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        error,
      });

      // Even if there's an error, we still want to end the workflow
      const output = {
        ...input,
        endMessage: 'Workflow ended with errors',
        endedAt: new Date().toISOString(),
        workflowComplete: true,
        finalStatus: 'error',
        error: error.message,
      };

      return output;
    }
  }

  renderEditor(data: EndNodeData, onChange: (data: EndNodeData) => void, context?: NodeEditorContext): React.ReactNode {
    return React.createElement('div', { className: 'space-y-4' }, [
      React.createElement('div', { key: 'message' }, [
        React.createElement('label', {
          key: 'label',
          htmlFor: 'message',
          className: 'block text-sm font-medium text-slate-700'
        }, 'End Message'),
        React.createElement('textarea', {
          key: 'textarea',
          id: 'message',
          value: data.message,
          onChange: (e: any) => onChange({ ...data, message: e.target.value }),
          rows: 3,
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono',
          placeholder: 'Workflow completed successfully. Processed {input.totalItems} items.'
        }),
        React.createElement('p', {
          key: 'help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Message to display when workflow completes. Use variables like {input.result} to include dynamic content.'),
        
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
      
      // Message examples
      React.createElement('div', { key: 'examples' }, [
        React.createElement('label', {
          key: 'examples-label',
          className: 'block text-sm font-medium text-slate-700 mb-2'
        }, 'Message Examples:'),
        React.createElement('div', {
          key: 'examples-list',
          className: 'text-xs text-slate-600 space-y-1'
        }, [
          React.createElement('div', { key: 'ex1' }, '• "Workflow completed successfully"'),
          React.createElement('div', { key: 'ex2' }, '• "Processed {httpResponse.data.length} items"'),
          React.createElement('div', { key: 'ex3' }, '• "Email sent to {input.email}"'),
          React.createElement('div', { key: 'ex4' }, '• "Analysis complete. Score: {llmResponse.score}"'),
          React.createElement('div', { key: 'ex5' }, '• "Results saved: {input.filename}"'),
        ])
      ])
    ]);
  }

  renderNode(data: EndNodeData): React.ReactNode {
    const messagePreview = data.message.length > 25 ? 
      data.message.substring(0, 25) + '...' : 
      data.message;
      
    return React.createElement('div', { className: 'text-xs' },
      React.createElement('p', { 
        className: 'truncate', 
        title: data.message 
      }, `🏁 ${messagePreview}`)
    );
  }

  validateData(data: EndNodeData): string[] {
    const errors: string[] = [];
    
    if (!data.message?.trim()) {
      errors.push('End message is required');
    }
    
    if (data.message && data.message.length > 1000) {
      errors.push('End message is too long (max 1000 characters)');
    }

    // Check for basic template syntax
    if (data.message && data.message.includes('{') && !data.message.includes('}')) {
      errors.push('Invalid template syntax: opening brace without closing brace');
    }
    
    return errors;
  }

  getRequiredConnections() {
    return { inputs: 1, outputs: 0 }; // End nodes have input but no outputs
  }

  getHelpText(): string {
    return `
End nodes mark the completion of a workflow execution.

🏁 Purpose:
• Terminates workflow execution
• Displays a final completion message
• Emits workflow completion events
• Stores final results and metadata

🔤 Use variables in the message to include dynamic content:
• {input} - All workflow data
• {httpResponse.data} - Data from HTTP requests
• {llmResponse.text} - AI-generated content
• {variableName.property} - Nested object properties

📤 Output variables:
• {workflowResult} - Complete workflow result object
• {endMessage} - Processed completion message
• {completedAt} - Completion timestamp

💡 Best practices:
• Include meaningful completion messages
• Reference key results in the message
• Use for workflow success notifications
    `.trim();
  }

  getDocumentationUrl(): string {
    return 'https://docs.agenticflow.com/nodes/end-node';
  }
} 