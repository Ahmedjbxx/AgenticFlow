import React from 'react';
import { NodePlugin, NodePluginMetadata } from '../base/NodePlugin';
import { ExecutionContext } from '../../core/execution/ExecutionContext';
import { LLMAgentNodeData } from '../../types';
import { generateText } from '../../services/geminiService';

export class LLMAgentNodePlugin extends NodePlugin<LLMAgentNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'llmAgentNode',
    name: 'LLM Agent',
    description: 'Process data using AI/LLM capabilities with Gemini',
    version: '1.0.0',
    category: 'action',
    icon: 'LLMIcon',
    color: 'bg-purple-500',
  };

  createDefaultData(): LLMAgentNodeData {
    return {
      id: '',
      type: 'llmAgentNode' as any,
      label: 'LLM Agent',
      prompt: 'Analyze the following data and provide insights: {input}',
      model: 'gemini-pro',
      temperature: 0.7,
      maxTokens: 1000,
    };
  }

  async execute(input: any, data: LLMAgentNodeData, context: ExecutionContext): Promise<any> {
    const { logger, eventBus, config } = context.services;
    
    logger.info('Executing LLM Agent node');
    eventBus.emit('node.execution.started', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      input,
    });

    try {
      // Process prompt with variable substitution
      const processedPrompt = context.replaceVariables(data.prompt, input);
      
      logger.info(`Sending prompt to LLM (${processedPrompt.length} chars)`, {
        model: data.model || config.api.defaultModel,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
      });

      // Call the LLM service
      const llmResponse = await generateText(processedPrompt, {
        model: data.model || config.api.defaultModel,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
      });

      // Try to parse response as JSON, otherwise treat as text
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(llmResponse);
      } catch (e) {
        parsedResponse = { text: llmResponse, raw: llmResponse };
      }

      const output = {
        ...input,
        llmResponse: parsedResponse,
        llmText: llmResponse,
        llmMetadata: {
          model: data.model || config.api.defaultModel,
          promptLength: processedPrompt.length,
          responseLength: llmResponse.length,
          processedAt: new Date().toISOString(),
        },
      };

      logger.info(`LLM response received (${llmResponse.length} chars)`);
      eventBus.emit('node.execution.completed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        output,
      });

      return output;

    } catch (error: any) {
      logger.error(`LLM Agent execution failed: ${error.message}`, error);
      eventBus.emit('node.execution.failed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        error,
      });

      // Create error output
      const errorOutput = {
        ...input,
        llmResponse: {
          error: true,
          errorMessage: error.message,
        },
        llmText: '',
        llmMetadata: {
          model: data.model || context.services.config.api.defaultModel,
          error: error.message,
          failedAt: new Date().toISOString(),
        },
      };

      return errorOutput;
    }
  }

  renderEditor(data: LLMAgentNodeData, onChange: (data: LLMAgentNodeData) => void): React.ReactNode {
    return React.createElement('div', { className: 'space-y-4' }, [
      // Prompt field
      React.createElement('div', { key: 'prompt' }, [
        React.createElement('label', {
          key: 'prompt-label',
          htmlFor: 'prompt',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Prompt'),
        React.createElement('textarea', {
          key: 'prompt-textarea',
          id: 'prompt',
          value: data.prompt,
          onChange: (e: any) => onChange({ ...data, prompt: e.target.value }),
          rows: 6,
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
          placeholder: 'Enter your prompt here. Use {input.fieldName} for variables.'
        }),
        React.createElement('p', {
          key: 'prompt-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Use variables like {input.data} or {input.user.name} to include dynamic content')
      ]),
      
      // Model selection
      React.createElement('div', { key: 'model' }, [
        React.createElement('label', {
          key: 'model-label',
          htmlFor: 'model',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Model'),
        React.createElement('select', {
          key: 'model-select',
          id: 'model',
          value: data.model || 'gemini-pro',
          onChange: (e: any) => onChange({ ...data, model: e.target.value }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
        }, [
          React.createElement('option', { key: 'gemini-pro', value: 'gemini-pro' }, 'Gemini Pro'),
          React.createElement('option', { key: 'gemini-pro-vision', value: 'gemini-pro-vision' }, 'Gemini Pro Vision'),
        ])
      ]),
      
      // Temperature slider
      React.createElement('div', { key: 'temperature' }, [
        React.createElement('label', {
          key: 'temperature-label',
          htmlFor: 'temperature',
          className: 'block text-sm font-medium text-slate-700'
        }, `Temperature: ${data.temperature || 0.7}`),
        React.createElement('input', {
          key: 'temperature-slider',
          type: 'range',
          id: 'temperature',
          min: 0,
          max: 1,
          step: 0.1,
          value: data.temperature || 0.7,
          onChange: (e: any) => onChange({ ...data, temperature: parseFloat(e.target.value) }),
          className: 'mt-1 block w-full'
        }),
        React.createElement('p', {
          key: 'temperature-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Higher values make output more creative, lower values more focused')
      ]),
      
      // Max tokens
      React.createElement('div', { key: 'maxTokens' }, [
        React.createElement('label', {
          key: 'maxTokens-label',
          htmlFor: 'maxTokens',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Max Tokens'),
        React.createElement('input', {
          key: 'maxTokens-input',
          type: 'number',
          id: 'maxTokens',
          value: data.maxTokens || 1000,
          onChange: (e: any) => onChange({ ...data, maxTokens: parseInt(e.target.value) }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
          min: 1,
          max: 4000
        }),
        React.createElement('p', {
          key: 'maxTokens-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Maximum length of the response (1-4000 tokens)')
      ])
    ]);
  }

  renderNode(data: LLMAgentNodeData): React.ReactNode {
    const promptPreview = data.prompt.length > 30 ? 
      data.prompt.substring(0, 30) + '...' : 
      data.prompt;
      
    return React.createElement('div', { className: 'text-xs' }, [
      React.createElement('p', { key: 'prompt', className: 'truncate', title: data.prompt },
        `Prompt: ${promptPreview}`
      ),
      React.createElement('p', { key: 'model', className: 'text-slate-600' },
        `Model: ${data.model || 'gemini-pro'}`
      )
    ]);
  }

  validateData(data: LLMAgentNodeData): string[] {
    const errors: string[] = [];
    
    if (!data.prompt?.trim()) {
      errors.push('Prompt is required');
    }
    
    if (data.prompt && data.prompt.length > 10000) {
      errors.push('Prompt is too long (max 10000 characters)');
    }
    
    if (data.temperature !== undefined && (data.temperature < 0 || data.temperature > 1)) {
      errors.push('Temperature must be between 0 and 1');
    }
    
    if (data.maxTokens !== undefined && (data.maxTokens < 1 || data.maxTokens > 4000)) {
      errors.push('Max tokens must be between 1 and 4000');
    }
    
    return errors;
  }

  getRequiredConnections() {
    return { inputs: 1, outputs: 1 };
  }

  getHelpText(): string {
    return `
LLM Agent nodes process data using AI capabilities. Use variables in your prompt to include dynamic content from previous nodes.
The response is available as {llmResponse} for parsed JSON or {llmText} for raw text.
    `.trim();
  }
} 