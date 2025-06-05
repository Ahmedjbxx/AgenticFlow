import React from 'react';
import { NodePlugin, NodePluginMetadata, NodeEditorContext } from '../base/NodePlugin.js';
import { ExecutionContext, VariableDefinition } from '@agenticflow/core';
import { HttpRequestNodeData } from '@agenticflow/types';

// HTTP Request interfaces (modular from existing implementation)
interface HttpRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: string | undefined;
  timeout?: number;
}

interface HttpResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
}

export class HttpRequestNodePlugin extends NodePlugin<HttpRequestNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'httpRequestNode',
    name: 'HTTP Request',
    description: 'Make HTTP requests to external APIs and services',
    version: '1.0.0',
    category: 'action',
    icon: 'HttpIcon',
    color: 'bg-green-500',
    tags: ['http', 'api', 'request', 'web'],
    author: 'AgenticFlow Team',
    documentation: 'https://docs.agenticflow.com/nodes/http-request',
  };

  createDefaultData(): HttpRequestNodeData {
    return {
      id: '',
      type: 'httpRequestNode' as any,
      label: 'HTTP Request',
      method: 'GET',
      url: 'https://api.restful-api.dev/objects/2',
      timeout: 5000,
    };
  }

  getOutputSchema(): VariableDefinition[] {
    return [
      {
        name: 'httpResponse',
        type: 'object',
        description: 'Complete HTTP response object with status, headers, and data',
        example: {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          data: { result: 'success' },
          responseTime: 150,
          success: true
        }
      },
      {
        name: 'responseData',
        type: 'object',
        description: 'Response body data (parsed JSON or raw text)',
        example: { result: 'success', items: [1, 2, 3] }
      },
      {
        name: 'responseStatus',
        type: 'number',
        description: 'HTTP status code',
        example: 200
      }
    ];
  }

  async execute(input: any, data: HttpRequestNodeData, context: ExecutionContext): Promise<any> {
    const { logger, eventBus } = context.services;
    
    logger?.info(`Executing HTTP ${data.method} request to ${data.url}`);
    eventBus?.emit('node.execution.started', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      input,
    });

    try {
      // Process URL with variable substitution
      const processedUrl = context.replaceVariables(data.url, input);
      
      // Process headers with variable substitution
      const processedHeaders = this.processHeaders(data.headers, input, context);
      
      // Process body with variable substitution
      let processedBody: string | undefined;
      if (data.body) {
        processedBody = context.replaceVariables(data.body, input);
        
        // Validate JSON if body is provided
        if (processedBody && (processedBody.trim().startsWith('{') || processedBody.trim().startsWith('['))) {
          try {
            JSON.parse(processedBody); // Validate JSON syntax
          } catch (jsonError) {
            throw new Error(`Invalid JSON in request body: ${(jsonError as Error).message}`);
          }
        }
      }

      // Execute the HTTP request
      const httpResponse = await this.executeHttpRequest({
        method: data.method,
        url: processedUrl,
        headers: processedHeaders,
        body: processedBody,
        timeout: data.timeout || context.services.config?.execution?.defaultTimeout || 10000,
      });

      // Create output with response data
      const output = {
        ...input,
        httpResponse: {
          status: httpResponse.status,
          statusText: httpResponse.statusText,
          headers: httpResponse.headers,
          data: httpResponse.data,
          responseTime: httpResponse.responseTime,
          success: httpResponse.status >= 200 && httpResponse.status < 300,
        },
        // Also expose response data directly for easier access
        responseData: httpResponse.data,
        responseStatus: httpResponse.status,
      };

      logger?.info(`HTTP request completed: ${httpResponse.status} ${httpResponse.statusText} (${httpResponse.responseTime}ms)`);
      eventBus?.emit('node.execution.completed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        output,
      });

      return output;

    } catch (error: any) {
      logger?.error(`HTTP request failed: ${error.message}`, error);
      eventBus?.emit('node.execution.failed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        error,
      });
      
      // Create error output but continue flow
      const errorOutput = {
        ...input,
        httpResponse: {
          error: true,
          errorMessage: error.message,
          success: false,
        },
        responseData: null,
        responseStatus: 0,
      };
      
      return errorOutput;
    }
  }

  renderEditor(data: HttpRequestNodeData, onChange: (data: HttpRequestNodeData) => void, context?: NodeEditorContext): React.ReactNode {
    return React.createElement('div', { className: 'space-y-4' }, [
      // Method selector
      React.createElement('div', { key: 'method' }, [
        React.createElement('label', {
          key: 'method-label',
          htmlFor: 'method',
          className: 'block text-sm font-medium text-slate-700'
        }, 'HTTP Method'),
        React.createElement('select', {
          key: 'method-select',
          id: 'method',
          value: data.method,
          onChange: (e: any) => onChange({ ...data, method: e.target.value as any }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
        }, [
          React.createElement('option', { key: 'GET', value: 'GET' }, 'GET'),
          React.createElement('option', { key: 'POST', value: 'POST' }, 'POST'),
          React.createElement('option', { key: 'PUT', value: 'PUT' }, 'PUT'),
          React.createElement('option', { key: 'DELETE', value: 'DELETE' }, 'DELETE'),
          React.createElement('option', { key: 'PATCH', value: 'PATCH' }, 'PATCH'),
        ])
      ]),
      
      // URL field
      React.createElement('div', { key: 'url' }, [
        React.createElement('label', {
          key: 'url-label',
          htmlFor: 'url',
          className: 'block text-sm font-medium text-slate-700'
        }, 'URL'),
        React.createElement('input', {
          key: 'url-input',
          type: 'text',
          id: 'url',
          value: data.url,
          onChange: (e: any) => onChange({ ...data, url: e.target.value }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
          placeholder: 'https://api.example.com/endpoint'
        }),
        React.createElement('p', {
          key: 'url-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Supports variables like {input.endpoint}')
      ]),
      
      // Body field (for POST, PUT, PATCH)
      ['POST', 'PUT', 'PATCH'].includes(data.method) && React.createElement('div', { key: 'body' }, [
        React.createElement('label', {
          key: 'body-label',
          htmlFor: 'body',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Request Body'),
        React.createElement('textarea', {
          key: 'body-textarea',
          id: 'body',
          value: data.body || '',
          onChange: (e: any) => onChange({ ...data, body: e.target.value }),
          rows: 4,
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
          placeholder: '{"key": "value"} or {input.payload}'
        }),
        React.createElement('p', {
          key: 'body-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'JSON payload or template with variables')
      ]),
      
      // Timeout field
      React.createElement('div', { key: 'timeout' }, [
        React.createElement('label', {
          key: 'timeout-label',
          htmlFor: 'timeout',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Timeout (ms)'),
        React.createElement('input', {
          key: 'timeout-input',
          type: 'number',
          id: 'timeout',
          value: data.timeout || 5000,
          onChange: (e: any) => onChange({ ...data, timeout: parseInt(e.target.value) }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
          min: 1000,
          max: 60000
        })
      ])
    ].filter(Boolean));
  }

  renderNode(data: HttpRequestNodeData): React.ReactNode {
    return React.createElement('div', { className: 'text-xs' },
      `${data.method} ${data.url.substring(0, 20)}...`
    );
  }

  validateData(data: HttpRequestNodeData): string[] {
    const errors: string[] = [];
    
    if (!data.url?.trim()) {
      errors.push('URL is required');
    }
    
    if (data.url && !this.isValidUrl(data.url)) {
      errors.push('URL must be a valid HTTP/HTTPS URL or template');
    }
    
    if (data.timeout && (data.timeout < 1000 || data.timeout > 60000)) {
      errors.push('Timeout must be between 1000ms and 60000ms');
    }
    
    if (data.body && ['POST', 'PUT', 'PATCH'].includes(data.method)) {
      // Try to validate JSON if it looks like JSON
      const trimmedBody = data.body.trim();
      if ((trimmedBody.startsWith('{') && trimmedBody.endsWith('}')) ||
          (trimmedBody.startsWith('[') && trimmedBody.endsWith(']'))) {
        try {
          JSON.parse(data.body);
        } catch (e) {
          // Only validate if it doesn't contain template variables
          if (!data.body.includes('{input.') && !data.body.includes('{flow.')) {
            errors.push('Request body must be valid JSON');
          }
        }
      }
    }
    
    return errors;
  }

  getRequiredConnections() {
    return { inputs: 1, outputs: 1 };
  }

  getHelpText(): string {
    return `
Make HTTP requests to external APIs and services. 
Supports variable substitution in URL, headers, and body.
Response data is available as {httpResponse} and {responseData}.
    `.trim();
  }

  getDocumentationUrl(): string {
    return 'https://docs.agenticflow.com/nodes/http-request';
  }

  // Private helper methods
  private processHeaders(headers: Record<string, string> | undefined, input: any, context: ExecutionContext): Record<string, string> {
    if (!headers) return {};
    
    const processedHeaders: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
      processedHeaders[key] = context.replaceVariables(value, input);
    });
    
    return processedHeaders;
  }

  private async executeHttpRequest(config: HttpRequestConfig): Promise<HttpResponseData> {
    const startTime = Date.now();
    
    // Create fetch configuration
    const fetchConfig: RequestInit = {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    };

    // Add body for methods that support it
    if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      fetchConfig.body = config.body;
    }

    // Add timeout support
    const controller = new AbortController();
    if (config.timeout) {
      setTimeout(() => controller.abort(), config.timeout);
    }
    fetchConfig.signal = controller.signal;

    try {
      const response = await fetch(config.url, fetchConfig);
      const responseTime = Date.now() - startTime;

      // Extract response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Parse response data based on content type
      let responseData: any;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else if (contentType.includes('text/')) {
        responseData = await response.text();
      } else {
        responseData = await response.text(); // Fallback to text
      }

      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseData,
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      // Handle different types of errors
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${config.timeout}ms`);
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Network error: ${error.message}. Check CORS settings or network connectivity.`);
      } else {
        throw new Error(`HTTP request failed: ${error.message}`);
      }
    }
  }

  private isValidUrl(url: string): boolean {
    // Allow template variables
    if (url.includes('{') && url.includes('}')) {
      return true;
    }
    
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }
} 