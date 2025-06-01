import React from 'react';
import { NodePlugin, NodePluginMetadata, NodeEditorContext } from '../base/NodePlugin.js';
import { ExecutionContext, VariableDefinition } from '@agenticflow/core';
import { LLMAgentNodeData } from '@agenticflow/types';

// Simple Gemini service interface for the node plugin
interface GeminiServiceOptions {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Simple Gemini API client for LLM Agent node
 * This is a temporary implementation until services are properly migrated
 */
async function generateTextWithGemini(prompt: string, options: GeminiServiceOptions): Promise<string> {
  try {
    // TODO: Implement proper Gemini API integration
    // For now, return a placeholder to get the build working
    // This will be replaced with proper implementation when services are migrated
    
    if (!options.apiKey) {
      throw new Error('Gemini API key is required');
    }
    
    // Placeholder implementation - will be replaced
    return `[LLM Response for: "${prompt.substring(0, 50)}..."] - This is a placeholder. The actual Gemini API integration will be implemented when the services are migrated to the monorepo.`;
    
  } catch (error) {
    throw new Error(`Gemini API error: ${(error as Error).message}`);
  }
}

export class LLMAgentNodePlugin extends NodePlugin<LLMAgentNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'llmAgentNode',
    name: 'LLM Agent',
    description: 'Process data using AI/LLM capabilities with Gemini AI',
    version: '1.1.0',
    category: 'action',
    icon: 'LLMIcon',
    color: 'bg-purple-500',
    tags: ['ai', 'llm', 'gemini', 'text-generation', 'analysis'],
    author: 'AgenticFlow Team',
    documentation: 'https://docs.agenticflow.com/nodes/llm-agent',
  };

  createDefaultData(): LLMAgentNodeData {
    return {
      id: '',
      type: 'llmAgentNode' as any, // Use string literal instead of enum
      label: 'LLM Agent',
      prompt: 'Analyze the following data and provide insights: {input}',
      model: 'gemini-pro',
      temperature: 0.7,
      maxTokens: 1000,
    };
  }

  getOutputSchema(): VariableDefinition[] {
    return [
      {
        name: 'llmText',
        type: 'string',
        description: 'Raw text response from the LLM',
        example: 'Based on the analysis, I found that...'
      },
      {
        name: 'llmResponse',
        type: 'object',
        description: 'Parsed response from the LLM (JSON if parseable, otherwise object with text)',
        example: { text: 'Response text', raw: 'Raw response' }
      },
      {
        name: 'llmMetadata',
        type: 'object',
        description: 'Metadata about the LLM execution',
        example: {
          model: 'gemini-pro',
          promptLength: 150,
          responseLength: 300,
          processedAt: '2024-01-01T12:00:00Z'
        }
      }
    ];
  }

  async execute(input: any, data: LLMAgentNodeData, context: ExecutionContext): Promise<any> {
    const { logger, eventBus, config } = context.services;
    
    logger?.info('Executing LLM Agent node');
    eventBus?.emit('node.execution.started', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      input,
    });

    try {
      // Process prompt with variable substitution - THIS PRESERVES NESTED VARIABLE FUNCTIONALITY
      const processedPrompt = context.replaceVariables(data.prompt, input);
      
      // Get API key from configuration
      const apiKey = config?.api?.geminiApiKey;
      if (!apiKey) {
        throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY environment variable.');
      }
      
      logger?.info(`Sending prompt to LLM (${processedPrompt.length} chars)`, {
        model: data.model || config?.api?.defaultModel || 'gemini-pro',
        temperature: data.temperature,
        maxTokens: data.maxTokens,
      });

      // Call the Gemini API
      const llmResponse = await generateTextWithGemini(processedPrompt, {
        apiKey,
        model: data.model || config?.api?.defaultModel || 'gemini-pro',
        temperature: data.temperature || 0.7,
        maxTokens: data.maxTokens || 1000,
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
          model: data.model || config?.api?.defaultModel || 'gemini-pro',
          promptLength: processedPrompt.length,
          responseLength: llmResponse.length,
          processedAt: new Date().toISOString(),
        },
      };

      logger?.info(`LLM response received (${llmResponse.length} chars)`);
      eventBus?.emit('node.execution.completed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        output,
      });

      return output;

    } catch (error: any) {
      logger?.error(`LLM Agent execution failed: ${error.message}`, error);
      eventBus?.emit('node.execution.failed', {
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
          model: data.model || context.services.config?.api?.defaultModel || 'gemini-pro',
          error: error.message,
          failedAt: new Date().toISOString(),
        },
      };

      return errorOutput;
    }
  }

  renderEditor(data: LLMAgentNodeData, onChange: (data: LLMAgentNodeData) => void, context?: NodeEditorContext): React.ReactNode {
    return React.createElement('div', { className: 'space-y-4' }, [
      // Prompt field - simplified version without MentionsInput for now
      React.createElement('div', { key: 'prompt' }, [
        React.createElement('label', {
          key: 'prompt-label',
          htmlFor: 'prompt',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Prompt Template'),
        React.createElement('textarea', {
          key: 'prompt-textarea',
          id: 'prompt',
          value: data.prompt,
          onChange: (e: any) => onChange({ ...data, prompt: e.target.value }),
          rows: 6,
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono',
          placeholder: 'Enter your prompt here. Use {variable} syntax to include data from previous nodes.',
        }),
        React.createElement('p', {
          key: 'prompt-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Use variables from previous nodes like {input}, {httpResponse.data}, etc. Supports nested variable access.'),
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
          React.createElement('option', { key: 'gemini-1.5-flash', value: 'gemini-1.5-flash' }, 'Gemini 1.5 Flash'),
          React.createElement('option', { key: 'gemini-1.5-pro', value: 'gemini-1.5-pro' }, 'Gemini 1.5 Pro'),
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
          max: 8192
        }),
        React.createElement('p', {
          key: 'maxTokens-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Maximum length of the response (1-8192 tokens)')
      ])
    ]);
  }

  renderNode(data: LLMAgentNodeData): React.ReactNode {
    const promptPreview = data.prompt.length > 30 ? 
      data.prompt.substring(0, 30) + '...' : 
      data.prompt;
      
    return React.createElement('div', { className: 'text-xs' }, [
      React.createElement('p', { key: 'prompt', className: 'truncate', title: data.prompt },
        `💭 ${promptPreview}`
      ),
      React.createElement('p', { key: 'model', className: 'text-slate-600' },
        `🤖 ${data.model || 'gemini-pro'}`
      )
    ]);
  }

  validateData(data: LLMAgentNodeData): string[] {
    const errors: string[] = [];
    
    if (!data.prompt?.trim()) {
      errors.push('Prompt is required');
    }
    
    if (data.prompt && data.prompt.length > 32000) {
      errors.push('Prompt is too long (max 32000 characters)');
    }
    
    if (data.temperature !== undefined && (data.temperature < 0 || data.temperature > 1)) {
      errors.push('Temperature must be between 0 and 1');
    }
    
    if (data.maxTokens !== undefined && (data.maxTokens < 1 || data.maxTokens > 8192)) {
      errors.push('Max tokens must be between 1 and 8192');
    }

    // Check for basic template syntax
    if (data.prompt && data.prompt.includes('{') && !data.prompt.includes('}')) {
      errors.push('Invalid template syntax: opening brace without closing brace');
    }
    
    return errors;
  }

  getRequiredConnections() {
    return { inputs: 1, outputs: 1 };
  }

  getHelpText(): string {
    return `
LLM Agent nodes process data using AI capabilities from Google's Gemini models.

🔤 Use variables in your prompt to include dynamic content from previous nodes:
• {input} - Raw input data
• {httpResponse.data} - Data from HTTP requests
• {variableName.property} - Nested object properties

📤 Output variables:
• {llmResponse} - Parsed response (JSON if possible)
• {llmText} - Raw text response
• {llmMetadata} - Execution metadata

💡 Tips:
• Higher temperature = more creative responses
• Lower temperature = more focused responses
• Use specific prompts for better results

⚠️ Note: This is currently using a placeholder implementation. Full Gemini API integration will be restored when services are migrated.
    `.trim();
  }

  getDocumentationUrl(): string {
    return 'https://docs.agenticflow.com/nodes/llm-agent';
  }
} 