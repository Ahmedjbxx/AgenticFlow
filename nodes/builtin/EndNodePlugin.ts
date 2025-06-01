import React from 'react';
import { NodePlugin, NodePluginMetadata } from '../base/NodePlugin';
import { ExecutionContext } from '../../core/execution/ExecutionContext';
import { EndNodeData } from '../../types';
import { VariableDefinition } from '../../core/variables/VariableRegistry';

export class EndNodePlugin extends NodePlugin<EndNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'endNode',
    name: 'End',
    description: 'Terminate workflow execution with final results',
    version: '1.0.0',
    category: 'utility',
    icon: 'EndIcon',
    color: 'bg-red-500',
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
      }
    ];
  }

  async execute(input: any, data: EndNodeData, context: ExecutionContext): Promise<any> {
    const { logger, eventBus } = context.services;
    
    logger.info('Executing End node');
    eventBus.emit('node.execution.started', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      input,
    });

    // Process the end message with variable substitution
    const finalMessage = context.replaceVariables(data.message, input);

    const output = {
      ...input,
      endMessage: finalMessage,
      endedAt: new Date().toISOString(),
      workflowComplete: true,
      finalStatus: 'completed',
    };

    logger.info(`Workflow ended: ${finalMessage}`);
    eventBus.emit('node.execution.completed', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      output,
    });
    
    // Emit workflow completion event
    eventBus.emit('flow.execution.completed', {
      flowId: context.flowId,
      executionId: context.executionId,
      endMessage: finalMessage,
      finalOutput: output,
      completedAt: new Date().toISOString(),
    });

    return output;
  }

  renderEditor(data: EndNodeData, onChange: (data: EndNodeData) => void, context?: { nodeId: string; availableVariables: any[] }): React.ReactNode {
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
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
          placeholder: 'Workflow completed successfully. Processed {input.totalItems} items.'
        }),
        React.createElement('p', {
          key: 'help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Message to display when workflow completes. Use variables like {input.result} to include dynamic content.')
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
          React.createElement('div', { key: 'ex2' }, '• "Processed {input.totalItems} items"'),
          React.createElement('div', { key: 'ex3' }, '• "Email sent to {input.email}"'),
          React.createElement('div', { key: 'ex4' }, '• "Analysis complete. Score: {input.score}"'),
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
      }, `Message: ${messagePreview}`)
    );
  }

  validateData(data: EndNodeData): string[] {
    const errors: string[] = [];
    
    if (!data.message?.trim()) {
      errors.push('End message is required');
    }
    
    if (data.message && data.message.length > 500) {
      errors.push('End message is too long (max 500 characters)');
    }
    
    return errors;
  }

  getRequiredConnections() {
    return { inputs: 1, outputs: 0 }; // End nodes have input but no outputs
  }

  getHelpText(): string {
    return `
End nodes mark the completion of a workflow. They can display a final message and emit completion events.
Use variables in the message to include dynamic content from the workflow execution.
    `.trim();
  }
} 