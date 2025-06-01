import React from 'react';
import { NodePlugin, NodePluginMetadata, NodeEditorContext } from '../base/NodePlugin.js';
import { ExecutionContext, VariableDefinition } from '@agenticflow/core';
import { TriggerNodeData } from '@agenticflow/types';

export class TriggerNodePlugin extends NodePlugin<TriggerNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'triggerNode',
    name: 'Trigger',
    description: 'Start point for workflow execution with configurable trigger types',
    version: '1.1.0',
    category: 'trigger',
    icon: 'TriggerIcon',
    color: 'bg-sky-500',
    tags: ['workflow', 'start', 'trigger', 'automation'],
    author: 'AgenticFlow Team',
    documentation: 'https://docs.agenticflow.com/nodes/trigger-node',
  };

  createDefaultData(): TriggerNodeData {
    return {
      id: '',
      type: 'triggerNode' as any,
      label: 'Trigger',
      triggerType: 'manual',
    };
  }

  getOutputSchema(): VariableDefinition[] {
    return [
      {
        name: 'triggerInfo',
        type: 'string',
        description: 'Information about how the workflow was triggered',
        example: 'Triggered by manual'
      },
      {
        name: 'triggerTimestamp',
        type: 'string',
        description: 'ISO timestamp of when the workflow was triggered',
        example: '2024-01-01T12:00:00.000Z'
      },
      {
        name: 'triggerType',
        type: 'string',
        description: 'Type of trigger that started the workflow',
        example: 'manual'
      },
      {
        name: 'workflowId',
        type: 'string',
        description: 'Unique identifier for this workflow execution',
        example: 'wf_abc123def456'
      },
      {
        name: 'executionId',
        type: 'string',
        description: 'Unique identifier for this specific execution',
        example: 'exec_xyz789uvw012'
      }
    ];
  }

  async execute(input: any, data: TriggerNodeData, context: ExecutionContext): Promise<any> {
    const { logger, eventBus } = context.services;
    
    logger?.info(`Trigger activated: ${data.triggerType}`);
    eventBus?.emit('node.execution.started', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      input,
    });

    try {
      // Emit workflow started event
      eventBus?.emit('flow.execution.started', {
        flowId: context.flowId,
        executionId: context.executionId,
        triggerType: data.triggerType,
        startedAt: new Date().toISOString(),
      });

      // Trigger nodes simply pass through the input and add trigger metadata
      const output = {
        ...input,
        triggerInfo: `Triggered by ${data.triggerType}`,
        triggerTimestamp: new Date().toISOString(),
        triggerType: data.triggerType,
        workflowId: context.flowId,
        executionId: context.executionId,
        startedAt: new Date().toISOString(),
      };

      logger?.info(`Trigger "${data.triggerType}" activated successfully`);
      eventBus?.emit('node.execution.completed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        output,
      });

      return output;

    } catch (error: any) {
      logger?.error(`Trigger execution failed: ${error.message}`, error);
      eventBus?.emit('node.execution.failed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        error,
      });

      // Create minimal error output
      const errorOutput = {
        ...input,
        triggerInfo: `Trigger ${data.triggerType} failed: ${error.message}`,
        triggerTimestamp: new Date().toISOString(),
        triggerType: data.triggerType,
        error: error.message,
      };

      return errorOutput;
    }
  }

  renderEditor(data: TriggerNodeData, onChange: (data: TriggerNodeData) => void, context?: NodeEditorContext): React.ReactNode {
    return React.createElement('div', { className: 'space-y-4' }, [
      React.createElement('div', { key: 'triggerType' }, [
        React.createElement('label', {
          key: 'label',
          htmlFor: 'triggerType',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Trigger Type'),
        React.createElement('select', {
          key: 'select',
          id: 'triggerType',
          value: data.triggerType,
          onChange: (e: any) => onChange({ ...data, triggerType: e.target.value }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
        }, [
          React.createElement('option', { key: 'manual', value: 'manual' }, 'Manual - Start workflow manually'),
          React.createElement('option', { key: 'webhook', value: 'webhook' }, 'Webhook - HTTP endpoint trigger'),
          React.createElement('option', { key: 'schedule', value: 'schedule' }, 'Schedule - Time-based trigger'),
          React.createElement('option', { key: 'email', value: 'email' }, 'Email - New email trigger'),
          React.createElement('option', { key: 'api', value: 'api' }, 'API - External API call'),
          React.createElement('option', { key: 'file', value: 'file' }, 'File - File system changes'),
          React.createElement('option', { key: 'database', value: 'database' }, 'Database - Data changes'),
        ]),
        React.createElement('p', {
          key: 'help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Select how this workflow should be triggered. This determines the initial data available to the workflow.')
      ]),

      // Trigger type description
      React.createElement('div', { key: 'description' }, [
        React.createElement('label', {
          key: 'desc-label',
          className: 'block text-sm font-medium text-slate-700 mb-2'
        }, 'Trigger Description:'),
        React.createElement('div', {
          key: 'desc-content',
          className: 'text-xs text-slate-600 p-3 bg-slate-50 rounded'
        }, this.getTriggerDescription(data.triggerType))
      ]),

      // Trigger outputs info
      React.createElement('div', { key: 'outputs' }, [
        React.createElement('label', {
          key: 'outputs-label',
          className: 'block text-sm font-medium text-slate-700 mb-2'
        }, 'Available Output Variables:'),
        React.createElement('div', {
          key: 'outputs-list',
          className: 'text-xs text-slate-600 space-y-1'
        }, [
          React.createElement('div', { key: 'var1' }, '• {triggerType} - Type of trigger'),
          React.createElement('div', { key: 'var2' }, '• {triggerTimestamp} - When triggered'),
          React.createElement('div', { key: 'var3' }, '• {workflowId} - Workflow identifier'),
          React.createElement('div', { key: 'var4' }, '• {executionId} - Execution identifier'),
        ])
      ])
    ]);
  }

  renderNode(data: TriggerNodeData): React.ReactNode {
    const triggerIcons: Record<string, string> = {
      manual: '👆',
      webhook: '🌐',
      schedule: '⏰',
      email: '📧',
      api: '🔌',
      file: '📁',
      database: '🗄️'
    };

    const icon = triggerIcons[data.triggerType] || '🚀';
    
    return React.createElement('div', { className: 'text-xs' },
      `${icon} ${data.triggerType}`
    );
  }

  validateData(data: TriggerNodeData): string[] {
    const errors: string[] = [];
    
    if (!data.triggerType?.trim()) {
      errors.push('Trigger type is required');
    }
    
    const validTriggerTypes = ['manual', 'webhook', 'schedule', 'email', 'api', 'file', 'database'];
    if (data.triggerType && !validTriggerTypes.includes(data.triggerType)) {
      errors.push('Invalid trigger type');
    }
    
    return errors;
  }

  getRequiredConnections() {
    return { inputs: 0, outputs: 1 }; // Triggers have no inputs, only outputs
  }

  getHelpText(): string {
    return `
Trigger nodes are the starting points for workflows.

🚀 Purpose:
• Define how and when workflows begin
• Provide initial context and data
• Set workflow execution metadata
• Support multiple trigger types

🔧 Trigger Types:
• Manual - Start workflow by user action
• Webhook - HTTP endpoint activation
• Schedule - Time-based automation
• Email - New email notifications
• API - External system integration
• File - File system monitoring
• Database - Data change detection

📤 Output variables:
• {triggerType} - How the workflow was triggered
• {triggerTimestamp} - When the workflow started
• {workflowId} - Unique workflow identifier
• {executionId} - Unique execution identifier

💡 Best practices:
• Use meaningful trigger types
• Consider automation opportunities
• Design for scalability
    `.trim();
  }

  getDocumentationUrl(): string {
    return 'https://docs.agenticflow.com/nodes/trigger-node';
  }

  private getTriggerDescription(triggerType: string): string {
    const descriptions: Record<string, string> = {
      manual: 'User manually starts the workflow by clicking a button or interface element.',
      webhook: 'External systems can trigger the workflow by making HTTP requests to a dedicated endpoint.',
      schedule: 'Workflow runs automatically at specified times or intervals (e.g., daily, weekly).',
      email: 'Workflow triggers when new emails are received or match specific criteria.',
      api: 'External APIs or services can start the workflow through API calls.',
      file: 'Workflow activates when files are created, modified, or deleted in monitored directories.',
      database: 'Database changes (inserts, updates, deletes) can automatically trigger workflow execution.'
    };

    return descriptions[triggerType] || 'Unknown trigger type selected.';
  }
} 