# 🔧 **AgenticFlow Node Development Guide**

## 📋 **Complete Step-by-Step Template for Creating Any Node**

This guide provides a comprehensive template for creating any type of node in the AgenticFlow system, from simple utility nodes to complex AI-powered processors.

---

## 🏗️ **Phase 1: Planning & Design**

### **Step 1: Define Your Node's Purpose**

Before coding, clearly define:

```typescript
// Node Design Checklist
interface NodeDesign {
  // Core functionality
  purpose: string;              // "Transform data", "Call API", "Process files"
  inputTypes: string[];         // ["object", "array", "string"]
  outputTypes: string[];        // ["object", "boolean"]
  
  // User interface
  configurationFields: Field[]; // What settings does user configure?
  validationRules: Rule[];      // What makes configuration valid?
  
  // Processing
  isAsync: boolean;             // Does it make network calls?
  canFail: boolean;             // Can it produce errors?
  hasProgress: boolean;         // Does it report progress?
  
  // Integration
  dependencies: string[];       // External libraries needed
  category: NodeCategory;       // Where it appears in UI
}
```

### **Step 2: Choose Your Node Category**

```typescript
type NodeCategory = 
  | 'trigger'       // Workflow starters (webhooks, schedules)
  | 'action'        // External actions (API calls, file ops)
  | 'transform'     // Data processing (format, filter, map)
  | 'condition'     // Flow control (if/then, switch, loop)
  | 'utility'       // Helpers (delay, log, variable)
  | 'ai'           // AI/ML operations (LLM, vision, audio)
  | 'integration'   // Service integrations (Slack, GitHub)
  | 'storage'      // Data persistence (database, cache)
```

---

## 🚀 **Phase 2: Implementation**

### **Step 3: Create the Node Plugin File**

Create your node file in `packages/nodes/src/builtin/` or `packages/nodes/src/custom/`:

```typescript
// packages/nodes/src/builtin/YourNodePlugin.ts
import React from 'react';
import { NodePlugin, NodePluginMetadata, NodeEditorContext } from '../base/NodePlugin.js';
import { ExecutionContext, VariableDefinition } from '@agenticflow/core';
import { YourNodeData } from '@agenticflow/types';

export class YourNodePlugin extends NodePlugin<YourNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'yourNode',                    // Unique identifier (camelCase)
    name: 'Your Node',                   // Display name
    description: 'Detailed description of what this node does and when to use it',
    version: '1.0.0',                    // Semantic versioning
    category: 'transform',               // Node category (see Step 2)
    icon: 'YourIcon',                    // Icon component name
    color: 'bg-blue-500',               // Tailwind background color
    tags: ['keyword1', 'keyword2'],     // Searchable tags
    author: 'Your Name',                // Author information
    documentation: 'https://docs.agenticflow.com/nodes/your-node',
  };

  // ... implementation continues below
}
```

### **Step 4: Define the Data Type**

Add your node's data type to `packages/types/src/nodes.ts`:

```typescript
// In @agenticflow/types
export interface YourNodeData extends BaseNodeData {
  type: 'yourNode';
  
  // Configuration fields that user can set
  yourSetting: string;
  optionalSetting?: number;
  booleanFlag?: boolean;
  
  // Complex settings
  options?: {
    mode: 'simple' | 'advanced';
    parameters: Record<string, any>;
  };
}
```

### **Step 5: Implement Core Methods**

```typescript
export class YourNodePlugin extends NodePlugin<YourNodeData> {
  // ... metadata from Step 3

  /**
   * Create default data when node is first added
   */
  createDefaultData(): YourNodeData {
    return {
      id: '',                           // Will be set by system
      type: 'yourNode' as any,
      label: 'Your Node',               // Default display name
      
      // Set sensible defaults for your settings
      yourSetting: 'default-value',
      optionalSetting: 42,
      booleanFlag: true,
      
      options: {
        mode: 'simple',
        parameters: {},
      },
    };
  }

  /**
   * Define what variables this node outputs
   */
  getOutputSchema(): VariableDefinition[] {
    return [
      {
        name: 'result',                 // Variable name users can reference
        type: 'object',                 // Data type
        description: 'Primary result of the operation',
        example: { processed: true, value: 'example' }
      },
      {
        name: 'success',
        type: 'boolean',
        description: 'Whether the operation completed successfully',
        example: true
      },
      {
        name: 'metadata',
        type: 'object',
        description: 'Additional information about the operation',
        example: {
          processingTime: 150,
          itemsProcessed: 5,
          timestamp: '2024-01-01T12:00:00.000Z'
        }
      },
      // Add error outputs if your node can fail
      {
        name: 'error',
        type: 'string',
        description: 'Error message if operation failed',
        example: 'Network timeout after 5000ms'
      }
    ];
  }

  /**
   * Main execution logic
   */
  async execute(input: any, data: YourNodeData, context: ExecutionContext): Promise<any> {
    const { logger, eventBus } = context.services;
    const startTime = performance.now();
    
    // Log execution start
    logger?.info(`Executing ${this.metadata.name}: ${data.yourSetting}`);
    eventBus?.emit('node.execution.started', {
      nodeId: context.nodeId,
      type: this.metadata.type,
      input,
    });

    try {
      // Process configuration with variable substitution
      const processedSetting = context.replaceVariables(data.yourSetting, input);
      
      // Your main logic here
      const result = await this.performOperation(input, processedSetting, data, context);
      
      // Calculate metrics
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      // Create output with all the variables from getOutputSchema()
      const output = {
        ...input,                       // Pass through input data
        result,                         // Primary result
        success: true,                  // Success flag
        metadata: {
          processingTime,
          timestamp: new Date().toISOString(),
          settings: {
            yourSetting: processedSetting,
            mode: data.options?.mode || 'simple',
          },
        },
      };

      // Log success
      logger?.info(`${this.metadata.name} completed in ${processingTime.toFixed(2)}ms`);
      eventBus?.emit('node.execution.completed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        output,
      });

      return output;

    } catch (error: any) {
      // Handle errors gracefully
      const processingTime = performance.now() - startTime;
      
      logger?.error(`${this.metadata.name} failed: ${error.message}`, error);
      eventBus?.emit('node.execution.failed', {
        nodeId: context.nodeId,
        type: this.metadata.type,
        error,
      });
      
      // Return error output (don't throw - let workflow continue)
      return {
        ...input,
        result: null,
        success: false,
        error: error.message,
        metadata: {
          processingTime,
          timestamp: new Date().toISOString(),
          failed: true,
        },
      };
    }
  }

  /**
   * Your custom processing logic
   */
  private async performOperation(
    input: any, 
    processedSetting: string, 
    data: YourNodeData, 
    context: ExecutionContext
  ): Promise<any> {
    // Implement your node's core functionality here
    
    if (data.options?.mode === 'advanced') {
      // Advanced processing
      return this.advancedOperation(input, processedSetting, data.options.parameters);
    } else {
      // Simple processing
      return this.simpleOperation(input, processedSetting);
    }
  }

  private async simpleOperation(input: any, setting: string): Promise<any> {
    // Simple operation implementation
    return { processed: true, setting, input };
  }

  private async advancedOperation(input: any, setting: string, params: Record<string, any>): Promise<any> {
    // Advanced operation implementation
    return { processed: true, setting, input, params };
  }
}
```

### **Step 6: Create the Editor UI**

```typescript
export class YourNodePlugin extends NodePlugin<YourNodeData> {
  // ... previous methods

  /**
   * Render the configuration editor
   */
  renderEditor(data: YourNodeData, onChange: (data: YourNodeData) => void, context?: NodeEditorContext): React.ReactNode {
    return React.createElement('div', { className: 'space-y-4' }, [
      
      // Basic text input
      React.createElement('div', { key: 'yourSetting' }, [
        React.createElement('label', {
          key: 'yourSetting-label',
          htmlFor: 'yourSetting',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Your Setting'),
        React.createElement('input', {
          key: 'yourSetting-input',
          type: 'text',
          id: 'yourSetting',
          value: data.yourSetting,
          onChange: (e: any) => onChange({ ...data, yourSetting: e.target.value }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
          placeholder: 'Enter your setting value'
        }),
        React.createElement('p', {
          key: 'yourSetting-help',
          className: 'mt-1 text-xs text-slate-500'
        }, 'Description of what this setting does. Supports variable substitution: {input.field}')
      ]),

      // Number input
      React.createElement('div', { key: 'optionalSetting' }, [
        React.createElement('label', {
          key: 'optionalSetting-label',
          htmlFor: 'optionalSetting',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Optional Setting'),
        React.createElement('input', {
          key: 'optionalSetting-input',
          type: 'number',
          id: 'optionalSetting',
          value: data.optionalSetting || 42,
          onChange: (e: any) => onChange({ ...data, optionalSetting: parseInt(e.target.value) || 42 }),
          min: 1,
          max: 1000,
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
        })
      ]),

      // Boolean checkbox
      React.createElement('div', { key: 'booleanFlag' }, [
        React.createElement('label', {
          key: 'booleanFlag-label',
          className: 'flex items-center space-x-2'
        }, [
          React.createElement('input', {
            key: 'booleanFlag-checkbox',
            type: 'checkbox',
            checked: data.booleanFlag || false,
            onChange: (e: any) => onChange({ ...data, booleanFlag: e.target.checked }),
            className: 'h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded'
          }),
          React.createElement('span', {
            key: 'booleanFlag-text',
            className: 'text-sm text-slate-700'
          }, 'Enable advanced features')
        ])
      ]),

      // Select dropdown
      React.createElement('div', { key: 'mode' }, [
        React.createElement('label', {
          key: 'mode-label',
          htmlFor: 'mode',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Processing Mode'),
        React.createElement('select', {
          key: 'mode-select',
          id: 'mode',
          value: data.options?.mode || 'simple',
          onChange: (e: any) => onChange({ 
            ...data, 
            options: { ...data.options, mode: e.target.value as 'simple' | 'advanced' }
          }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
        }, [
          React.createElement('option', { key: 'simple', value: 'simple' }, 'Simple - Basic processing'),
          React.createElement('option', { key: 'advanced', value: 'advanced' }, 'Advanced - Full features'),
        ])
      ]),

      // Show available variables if context is provided
      context?.availableVariables && context.availableVariables.length > 0 && React.createElement('div', {
        key: 'available-vars',
        className: 'p-2 bg-slate-50 rounded text-xs'
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
      ]),

      // Examples section
      React.createElement('div', { key: 'examples' }, [
        React.createElement('label', {
          key: 'examples-label',
          className: 'block text-sm font-medium text-slate-700 mb-2'
        }, 'Examples:'),
        React.createElement('div', {
          key: 'examples-list',
          className: 'text-xs text-slate-600 space-y-1'
        }, [
          React.createElement('div', { key: 'ex1' }, '• {input.data} - Use input data field'),
          React.createElement('div', { key: 'ex2' }, '• {httpResponse.result} - Use previous node output'),
          React.createElement('div', { key: 'ex3' }, '• static-value - Use literal text'),
        ])
      ])
    ]);
  }

  /**
   * Render the node in the flow (compact view)
   */
  renderNode(data: YourNodeData): React.ReactNode {
    const settingPreview = data.yourSetting.length > 15 ? 
      data.yourSetting.substring(0, 15) + '...' : 
      data.yourSetting;
      
    return React.createElement('div', { className: 'text-xs' }, [
      React.createElement('p', { key: 'setting', className: 'font-medium', title: data.yourSetting },
        `⚙️ ${settingPreview}`
      ),
      React.createElement('p', { key: 'mode', className: 'text-slate-600' },
        `Mode: ${data.options?.mode || 'simple'}`
      )
    ]);
  }
}
```

### **Step 7: Add Validation**

```typescript
export class YourNodePlugin extends NodePlugin<YourNodeData> {
  // ... previous methods

  /**
   * Validate node configuration
   */
  validateData(data: YourNodeData): string[] {
    const errors: string[] = [];

    // Required field validation
    if (!data.yourSetting?.trim()) {
      errors.push('Your Setting is required');
    }

    // Value validation
    if (data.optionalSetting !== undefined) {
      if (data.optionalSetting < 1 || data.optionalSetting > 1000) {
        errors.push('Optional Setting must be between 1 and 1000');
      }
    }

    // Complex validation
    if (data.options?.mode === 'advanced') {
      if (!data.options.parameters || Object.keys(data.options.parameters).length === 0) {
        errors.push('Advanced mode requires parameters');
      }
    }

    // JavaScript syntax validation (if applicable)
    if (data.yourSetting.includes('${') || data.yourSetting.includes('{')) {
      try {
        // Test if it's valid template syntax
        new Function('input', 'context', `"use strict"; return \`${data.yourSetting}\`;`);
      } catch (syntaxError) {
        errors.push(`Invalid template syntax: ${(syntaxError as Error).message}`);
      }
    }

    // Business logic validation
    if (data.yourSetting.toLowerCase().includes('forbidden')) {
      errors.push('Setting cannot contain forbidden keywords');
    }

    return errors;
  }

  /**
   * Define connection requirements
   */
  getRequiredConnections() {
    return { 
      inputs: 1,    // Number of required input connections
      outputs: 1    // Number of output connections this node provides
    };
  }

  /**
   * Provide help text for users
   */
  getHelpText(): string {
    return `
${this.metadata.name} processes input data according to your configuration.

🔧 Configuration:
• Your Setting - Main configuration parameter (supports variables)
• Optional Setting - Numeric parameter (1-1000)
• Mode - Processing complexity level

🔤 Use variables in settings:
• {input.field} - Access input data
• {previousNode.result} - Use previous node output
• Static text - Use literal values

📤 Output variables:
• {result} - Main processing result
• {success} - Operation success status
• {metadata} - Processing information

💡 Use cases:
• Data transformation and processing
• Conditional logic and filtering
• Integration with external services
• Custom business logic implementation

🔒 Features:
• Variable substitution support
• Comprehensive error handling
• Performance monitoring
• Flexible configuration options
    `.trim();
  }

  /**
   * Link to detailed documentation
   */
  getDocumentationUrl(): string {
    return 'https://docs.agenticflow.com/nodes/your-node';
  }
}
```

---

## 📦 **Phase 3: Registration & Testing**

### **Step 8: Register Your Node**

Add your node to the builtin exports in `packages/nodes/src/builtin/index.ts`:

```typescript
// Built-in node plugins
export { HttpRequestNodePlugin } from './HttpRequestNodePlugin.js';
export { LLMAgentNodePlugin } from './LLMAgentNodePlugin.js';
// ... other nodes
export { YourNodePlugin } from './YourNodePlugin.js';  // Add your node here
```

### **Step 9: Update Node Discovery**

The `NodeDiscovery` system will automatically find your node if it follows the naming convention and is exported from the builtin index.

### **Step 10: Create Tests**

Create `packages/nodes/src/builtin/YourNodePlugin.test.ts`:

```typescript
import { YourNodePlugin } from './YourNodePlugin';
import { ExecutionContext } from '@agenticflow/core';

describe('YourNodePlugin', () => {
  let plugin: YourNodePlugin;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    plugin = new YourNodePlugin();
    mockContext = {
      nodeId: 'test-node-id',
      replaceVariables: (template: string, data: any) => template.replace(/\{(\w+)\}/g, (_, key) => data[key] || ''),
      services: {
        logger: {
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
        },
        eventBus: {
          emit: jest.fn(),
          on: jest.fn(),
          off: jest.fn(),
        }
      }
    };
  });

  describe('createDefaultData', () => {
    it('should create valid default data', () => {
      const defaultData = plugin.createDefaultData();
      
      expect(defaultData.type).toBe('yourNode');
      expect(defaultData.yourSetting).toBe('default-value');
      expect(defaultData.optionalSetting).toBe(42);
      expect(defaultData.booleanFlag).toBe(true);
    });
  });

  describe('validateData', () => {
    it('should pass validation with valid data', () => {
      const validData = plugin.createDefaultData();
      const errors = plugin.validateData(validData);
      
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with missing required field', () => {
      const invalidData = { ...plugin.createDefaultData(), yourSetting: '' };
      const errors = plugin.validateData(invalidData);
      
      expect(errors).toContain('Your Setting is required');
    });

    it('should fail validation with out-of-range numeric field', () => {
      const invalidData = { ...plugin.createDefaultData(), optionalSetting: 5000 };
      const errors = plugin.validateData(invalidData);
      
      expect(errors).toContain('Optional Setting must be between 1 and 1000');
    });
  });

  describe('execute', () => {
    it('should execute successfully with valid data', async () => {
      const nodeData = plugin.createDefaultData();
      const input = { testData: 'hello' };

      const result = await plugin.execute(input, nodeData, mockContext);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.testData).toBe('hello'); // Input passed through
    });

    it('should handle errors gracefully', async () => {
      const nodeData = { ...plugin.createDefaultData(), yourSetting: '' };
      const input = {};

      const result = await plugin.execute(input, nodeData, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.metadata.failed).toBe(true);
    });

    it('should support variable substitution', async () => {
      const nodeData = { ...plugin.createDefaultData(), yourSetting: '{testVariable}' };
      const input = { testVariable: 'substituted-value' };

      const result = await plugin.execute(input, nodeData, mockContext);

      expect(result.success).toBe(true);
      // Verify that the substituted value was used
      expect(mockContext.replaceVariables).toHaveBeenCalledWith('{testVariable}', input);
    });
  });

  describe('getOutputSchema', () => {
    it('should define all output variables', () => {
      const schema = plugin.getOutputSchema();
      
      const variableNames = schema.map(v => v.name);
      expect(variableNames).toContain('result');
      expect(variableNames).toContain('success');
      expect(variableNames).toContain('metadata');
      
      // Verify each variable has required properties
      schema.forEach(variable => {
        expect(variable.name).toBeDefined();
        expect(variable.type).toBeDefined();
        expect(variable.description).toBeDefined();
        expect(variable.example).toBeDefined();
      });
    });
  });

  describe('getRequiredConnections', () => {
    it('should define connection requirements', () => {
      const connections = plugin.getRequiredConnections();
      
      expect(connections.inputs).toBe(1);
      expect(connections.outputs).toBe(1);
    });
  });
});
```

### **Step 11: Test Your Node**

```bash
# Run individual node tests
cd packages/nodes
pnpm test YourNodePlugin.test.ts

# Run all node tests
pnpm test

# Build the nodes package
pnpm build

# Test the full monorepo
cd ../..
pnpm build
```

---

## 🎨 **Phase 4: Advanced Features**

### **Complex UI Components**

```typescript
// Advanced editor with dynamic sections
renderEditor(data: YourNodeData, onChange: (data: YourNodeData) => void, context?: NodeEditorContext): React.ReactNode {
  const addParameter = () => {
    const newParams = { ...data.options?.parameters, [`param${Date.now()}`]: '' };
    onChange({ 
      ...data, 
      options: { ...data.options, parameters: newParams }
    });
  };

  const removeParameter = (key: string) => {
    const newParams = { ...data.options?.parameters };
    delete newParams[key];
    onChange({ 
      ...data, 
      options: { ...data.options, parameters: newParams }
    });
  };

  return React.createElement('div', { className: 'space-y-4' }, [
    // ... basic fields

    // Dynamic parameter list
    data.options?.mode === 'advanced' && React.createElement('div', { key: 'parameters' }, [
      React.createElement('div', {
        key: 'params-header',
        className: 'flex items-center justify-between'
      }, [
        React.createElement('label', {
          key: 'params-label',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Parameters'),
        React.createElement('button', {
          key: 'add-param-btn',
          type: 'button',
          onClick: addParameter,
          className: 'text-sm bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700'
        }, '+ Add Parameter')
      ]),
      
      // Render parameter entries
      ...Object.entries(data.options?.parameters || {}).map(([key, value]) =>
        React.createElement('div', {
          key: `param-${key}`,
          className: 'flex items-center space-x-2 p-2 bg-slate-50 rounded'
        }, [
          React.createElement('input', {
            key: 'param-key',
            type: 'text',
            value: key,
            onChange: (e: any) => {
              const newParams = { ...data.options?.parameters };
              delete newParams[key];
              newParams[e.target.value] = value;
              onChange({ ...data, options: { ...data.options, parameters: newParams }});
            },
            className: 'flex-1 px-2 py-1 text-sm border rounded'
          }),
          React.createElement('input', {
            key: 'param-value',
            type: 'text',
            value: value,
            onChange: (e: any) => {
              const newParams = { ...data.options?.parameters, [key]: e.target.value };
              onChange({ ...data, options: { ...data.options, parameters: newParams }});
            },
            className: 'flex-1 px-2 py-1 text-sm border rounded'
          }),
          React.createElement('button', {
            key: 'remove-param',
            type: 'button',
            onClick: () => removeParameter(key),
            className: 'text-red-600 hover:text-red-800'
          }, '✕')
        ])
      )
    ])
  ]);
}
```

### **Progress Reporting**

```typescript
async execute(input: any, data: YourNodeData, context: ExecutionContext): Promise<any> {
  const { logger, eventBus } = context.services;
  
  try {
    // Report progress for long operations
    const items = Array.isArray(input.items) ? input.items : [];
    const results = [];
    
    for (let i = 0; i < items.length; i++) {
      // Process item
      const result = await this.processItem(items[i], data);
      results.push(result);
      
      // Report progress
      const progress = (i + 1) / items.length;
      eventBus?.emit('node.progress', {
        nodeId: context.nodeId,
        progress,
        message: `Processed ${i + 1}/${items.length} items`
      });
      
      logger?.info(`Progress: ${Math.round(progress * 100)}%`);
    }
    
    return { ...input, results, totalProcessed: items.length };
    
  } catch (error) {
    // Handle errors...
  }
}
```

### **External Dependencies**

If your node needs external libraries:

```typescript
// packages/nodes/package.json
{
  "dependencies": {
    "@agenticflow/types": "workspace:*",
    "@agenticflow/core": "workspace:*", 
    "axios": "^1.6.0",           // HTTP client
    "cheerio": "^1.0.0-rc.12",   // HTML parsing
    "sharp": "^0.33.0"           // Image processing
  }
}
```

```typescript
// Import in your node
import axios from 'axios';
import * as cheerio from 'cheerio';
import sharp from 'sharp';

export class WebScrapingNodePlugin extends NodePlugin<WebScrapingNodeData> {
  // ... implementation
  
  private async scrapeWebsite(url: string): Promise<any> {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    return {
      title: $('title').text(),
      links: $('a').map((_, el) => $(el).attr('href')).get(),
      images: $('img').map((_, el) => $(el).attr('src')).get(),
    };
  }
}
```

---

## 📋 **Phase 5: Best Practices**

### **Error Handling Patterns**

```typescript
async execute(input: any, data: YourNodeData, context: ExecutionContext): Promise<any> {
  try {
    // Validate inputs
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid input: expected object');
    }
    
    // Check required configuration
    if (!data.yourSetting?.trim()) {
      throw new Error('Your Setting is required but not configured');
    }
    
    // Perform operation with timeout
    const result = await Promise.race([
      this.performOperation(input, data, context),
      this.createTimeout(30000) // 30 second timeout
    ]);
    
    return { ...input, result, success: true };
    
  } catch (error: any) {
    // Log detailed error information
    context.services.logger?.error(`${this.metadata.name} execution failed`, {
      error: error.message,
      stack: error.stack,
      nodeData: data,
      inputKeys: Object.keys(input || {}),
    });
    
    // Return structured error response
    return {
      ...input,
      result: null,
      success: false,
      error: error.message,
      errorCode: this.getErrorCode(error),
      retryable: this.isRetryableError(error),
    };
  }
}

private createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });
}

private getErrorCode(error: Error): string {
  if (error.message.includes('timeout')) return 'TIMEOUT';
  if (error.message.includes('network')) return 'NETWORK_ERROR';
  if (error.message.includes('validation')) return 'VALIDATION_ERROR';
  return 'UNKNOWN_ERROR';
}

private isRetryableError(error: Error): boolean {
  const retryableCodes = ['TIMEOUT', 'NETWORK_ERROR'];
  return retryableCodes.includes(this.getErrorCode(error));
}
```

### **Performance Optimization**

```typescript
export class YourNodePlugin extends NodePlugin<YourNodeData> {
  // Cache expensive computations
  private static computationCache = new Map<string, any>();
  
  async execute(input: any, data: YourNodeData, context: ExecutionContext): Promise<any> {
    const cacheKey = this.getCacheKey(input, data);
    
    // Check cache first
    if (YourNodePlugin.computationCache.has(cacheKey)) {
      context.services.logger?.info('Using cached result');
      return YourNodePlugin.computationCache.get(cacheKey);
    }
    
    // Perform computation
    const result = await this.performExpensiveOperation(input, data);
    
    // Cache result (with size limit)
    if (YourNodePlugin.computationCache.size < 100) {
      YourNodePlugin.computationCache.set(cacheKey, result);
    }
    
    return result;
  }
  
  private getCacheKey(input: any, data: YourNodeData): string {
    return `${data.yourSetting}-${JSON.stringify(input).substring(0, 100)}`;
  }
}
```

### **Memory Management**

```typescript
async execute(input: any, data: YourNodeData, context: ExecutionContext): Promise<any> {
  // Process large datasets in chunks
  if (Array.isArray(input.items) && input.items.length > 1000) {
    return this.processInChunks(input.items, data, context);
  }
  
  // Regular processing
  return this.processAll(input, data, context);
}

private async processInChunks(items: any[], data: YourNodeData, context: ExecutionContext): Promise<any> {
  const chunkSize = 100;
  const results = [];
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await this.processChunk(chunk, data, context);
    results.push(...chunkResults);
    
    // Allow garbage collection between chunks
    if (global.gc) global.gc();
  }
  
  return { results, totalProcessed: items.length };
}
```

---

## 🎯 **Quick Reference Checklist**

### **Before You Start:**
- [ ] Clear understanding of node purpose
- [ ] Input/output data types defined
- [ ] UI requirements mapped out
- [ ] External dependencies identified

### **Implementation Checklist:**
- [ ] Node plugin class created
- [ ] Metadata properly configured
- [ ] Data type defined in @agenticflow/types
- [ ] `createDefaultData()` implemented
- [ ] `getOutputSchema()` defined
- [ ] `execute()` method implemented
- [ ] `renderEditor()` UI created
- [ ] `renderNode()` compact view added
- [ ] `validateData()` validation rules
- [ ] Error handling implemented
- [ ] Variable substitution supported

### **Testing Checklist:**
- [ ] Unit tests written
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Performance tested with large inputs
- [ ] UI interactions verified
- [ ] Validation rules tested

### **Registration Checklist:**
- [ ] Node exported from builtin/index.ts
- [ ] Build passes without errors
- [ ] Node appears in UI
- [ ] Can be added to workflows
- [ ] Executes correctly in flows

### **Documentation Checklist:**
- [ ] Help text written
- [ ] Examples provided
- [ ] Documentation URL set
- [ ] Complex features explained
- [ ] Common use cases covered

---

## 🚀 **You're Ready!**

This template covers everything needed to create any type of node in AgenticFlow. Use this as your starting point and customize based on your specific requirements. The system is designed to be flexible and extensible, so don't hesitate to add innovative features that push the boundaries of what's possible!

**Happy node building! 🔧✨** 