import React from 'react';
import { NodePlugin, NodePluginMetadata } from '../base/NodePlugin';
import { ExecutionContext } from '../../core/execution/ExecutionContext';
import { TriggerNodeData } from '../../types';
import { VariableDefinition } from '../../core/variables/VariableRegistry';

export class TriggerNodePlugin extends NodePlugin<TriggerNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'triggerNode',
    name: 'Trigger',
    description: 'Start point for workflow execution',
    version: '1.0.0',
    category: 'trigger',
    icon: 'TriggerIcon',
    color: 'bg-sky-500',
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
      }
    ];
  }

  async execute(input: any, data: TriggerNodeData, context: ExecutionContext): Promise<any> {
    const { logger, eventBus } = context.services;
    
    logger.info(`Trigger activated: ${data.triggerType}`);
    eventBus.emit('node.execution.started', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      input,
    });

    // Trigger nodes simply pass through the input and add trigger metadata
    const output = {
      ...input,
      triggerInfo: `Triggered by ${data.triggerType}`,
      triggerTimestamp: new Date().toISOString(),
      triggerType: data.triggerType,
    };

    logger.info(`Trigger "${data.triggerType}" activated successfully`);
    eventBus.emit('node.execution.completed', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      output,
    });

    return output;
  }

  renderEditor(data: TriggerNodeData, onChange: (data: TriggerNodeData) => void, context?: { nodeId: string; availableVariables: any[] }): React.ReactNode {
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
          React.createElement('option', { key: 'manual', value: 'manual' }, 'Manual'),
          React.createElement('option', { key: 'webhook', value: 'webhook' }, 'Webhook'),
          React.createElement('option', { key: 'schedule', value: 'schedule' }, 'Schedule'),
          React.createElement('option', { key: 'email', value: 'email' }, 'New Email'),
          React.createElement('option', { key: 'api', value: 'api' }, 'API Call'),
          React.createElement('option', { key: 'file', value: 'file' }, 'File Change'),
        ]),
        React.createElement('p', {
          key: 'help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Select how this workflow should be triggered')
      ])
    ]);
  }

  renderNode(data: TriggerNodeData): React.ReactNode {
    return React.createElement('div', { className: 'text-xs' },
      `Type: ${data.triggerType}`
    );
  }

  validateData(data: TriggerNodeData): string[] {
    const errors: string[] = [];
    
    if (!data.triggerType?.trim()) {
      errors.push('Trigger type is required');
    }
    
    const validTriggerTypes = ['manual', 'webhook', 'schedule', 'email', 'api', 'file'];
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
Trigger nodes are the starting points for workflows. They define how and when a workflow begins execution.
The trigger provides initial data that flows through the rest of the workflow.
    `.trim();
  }
} 