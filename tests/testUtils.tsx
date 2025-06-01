import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApplicationCore } from '../core/ApplicationCore';
import { NodeRegistry } from '../core/registry/NodeRegistry';
import { EventBus } from '../core/events/EventBus';
import { Logger } from '../core/logging/Logger';
import { ExecutionContext } from '../core/execution/ExecutionContext';
import { NodePlugin } from '@agenticflow/nodes';
import { FlowData, CustomNode } from '../types';

// Mock implementations for testing
export class MockNodePlugin extends NodePlugin<any> {
  readonly metadata = {
    type: 'mockNode' as const,
    title: 'Mock Node',
    description: 'A mock node for testing',
    category: 'test' as const,
    version: '1.0.0',
    icon: '🧪',
    color: 'bg-gray-500',
  };

  createDefaultData() {
    return { message: 'test' };
  }

  async execute(input: any, data: any, context: ExecutionContext) {
    return { ...input, processed: true };
  }

  renderEditor() {
    return React.createElement('div', { 'data-testid': 'mock-editor' }, 'Mock Editor');
  }

  renderNode(data: any) {
    return React.createElement('div', { 'data-testid': 'mock-node' }, data.message || 'Mock Node');
  }

  validateData(data: any) {
    return { isValid: true, errors: [] };
  }
}

// Test wrapper with all providers
interface TestProviderProps {
  children: React.ReactNode;
  initialState?: Partial<any>;
}

const TestProvider: React.FC<TestProviderProps> = ({ children, initialState }) => {
  return (
    <div data-testid="test-provider">
      {children}
    </div>
  );
};

// Enhanced render function with our providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options: RenderOptions & { initialState?: any } = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } => {
  const { initialState, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestProvider initialState={initialState}>
      {children}
    </TestProvider>
  );

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });
  const user = userEvent.setup();

  return {
    ...result,
    user,
  };
};

// Plugin testing utilities
export class PluginTestUtils {
  private registry: NodeRegistry;
  private eventBus: EventBus;
  private logger: Logger;

  constructor() {
    this.registry = new NodeRegistry();
    this.eventBus = new EventBus();
    this.logger = new Logger('debug', 100);
  }

  /**
   * Register a plugin for testing
   */
  registerPlugin(plugin: NodePlugin<any>) {
    this.registry.register(plugin);
  }

  /**
   * Create a mock execution context
   */
  createMockExecutionContext(nodeId: string = 'test-node'): ExecutionContext {
    return {
      nodeId,
      flowId: 'test-flow',
      executionId: 'test-execution',
      services: {
        nodeRegistry: this.registry,
        eventBus: this.eventBus,
        logger: this.logger,
      },
      evaluateExpression: (expression: string, data: any) => {
        // Simple expression evaluator for testing
        try {
          return Function('data', `return ${expression}`)(data);
        } catch {
          return undefined;
        }
      },
      getFlowVariable: (name: string) => undefined,
      setFlowVariable: (name: string, value: any) => {},
    };
  }

  /**
   * Test plugin execution
   */
  async testPluginExecution(
    plugin: NodePlugin<any>,
    input: any,
    nodeData: any,
    context?: Partial<ExecutionContext>
  ) {
    const fullContext = {
      ...this.createMockExecutionContext(),
      ...context,
    };

    const result = await plugin.execute(input, nodeData, fullContext);
    
    return {
      result,
      context: fullContext,
      logs: this.logger.getLogs(),
      events: this.getEmittedEvents(),
    };
  }

  /**
   * Test plugin validation
   */
  testPluginValidation(plugin: NodePlugin<any>, data: any) {
    return plugin.validateData(data);
  }

  /**
   * Test plugin rendering
   */
  testPluginRender(plugin: NodePlugin<any>, data: any) {
    const editor = plugin.renderEditor(data, () => {}, {});
    const node = plugin.renderNode(data);
    
    return {
      editor: renderWithProviders(editor as React.ReactElement),
      node: renderWithProviders(node as React.ReactElement),
    };
  }

  /**
   * Get all events emitted during testing
   */
  private getEmittedEvents() {
    const events: Array<{ event: string; data: any }> = [];
    
    // Mock event collection (in real implementation, we'd track emitted events)
    return events;
  }

  /**
   * Reset test environment
   */
  reset() {
    this.registry = new NodeRegistry();
    this.eventBus = new EventBus();
    this.logger.clear();
  }
}

// Flow testing utilities
export class FlowTestUtils {
  /**
   * Create a test flow with given nodes
   */
  static createTestFlow(nodes: Partial<CustomNode>[] = []): FlowData {
    const fullNodes: CustomNode[] = nodes.map((node, index) => ({
      id: node.id || `node-${index}`,
      type: node.type || 'mockNode' as any,
      position: node.position || { x: index * 200, y: 100 },
      data: {
        label: node.data?.label || `Node ${index}`,
        type: node.type || 'mockNode' as any,
        ...node.data,
      },
    }));

    return {
      id: 'test-flow',
      name: 'Test Flow',
      description: 'A flow for testing',
      nodes: fullNodes,
      edges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      viewport: { x: 0, y: 0, zoom: 1 },
    };
  }

  /**
   * Create test edges between nodes
   */
  static createTestEdges(connections: Array<{ from: string; to: string }>) {
    return connections.map(({ from, to }, index) => ({
      id: `edge-${index}`,
      source: from,
      target: to,
      type: 'default',
      markerEnd: { type: 'arrowclosed' as const },
    }));
  }
}

// Performance testing utilities
export class PerformanceTestUtils {
  /**
   * Measure component render time
   */
  static async measureRenderTime(component: React.ReactElement, iterations: number = 10) {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const { unmount } = renderWithProviders(component);
      const end = performance.now();
      times.push(end - start);
      unmount();
    }

    return {
      times,
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
    };
  }

  /**
   * Measure plugin execution time
   */
  static async measurePluginExecution(
    plugin: NodePlugin<any>,
    input: any,
    nodeData: any,
    iterations: number = 100
  ) {
    const pluginUtils = new PluginTestUtils();
    const context = pluginUtils.createMockExecutionContext();
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await plugin.execute(input, nodeData, context);
      const end = performance.now();
      times.push(end - start);
    }

    return {
      times,
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
    };
  }
}

// Accessibility testing helpers
export class AccessibilityTestUtils {
  /**
   * Check for basic accessibility violations
   */
  static checkBasicA11y(element: HTMLElement) {
    const violations: string[] = [];

    // Check for images without alt text
    const images = element.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        violations.push(`Image ${index} missing alt text`);
      }
    });

    // Check for buttons without accessible names
    const buttons = element.querySelectorAll('button');
    buttons.forEach((button, index) => {
      if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
        violations.push(`Button ${index} missing accessible name`);
      }
    });

    // Check for form inputs without labels
    const inputs = element.querySelectorAll('input, select, textarea');
    inputs.forEach((input, index) => {
      const id = input.id;
      const hasLabel = id && element.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');
      
      if (!hasLabel && !hasAriaLabel) {
        violations.push(`Form input ${index} missing label`);
      }
    });

    return violations;
  }
}

// Mock data generators
export class MockDataGenerators {
  /**
   * Generate random flow data for testing
   */
  static generateRandomFlow(nodeCount: number = 5): FlowData {
    const nodes: CustomNode[] = [];
    const nodeTypes = ['triggerNode', 'httpRequestNode', 'llmAgentNode', 'conditionNode', 'endNode'];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: `node-${i}`,
        type: nodeTypes[Math.floor(Math.random() * nodeTypes.length)] as any,
        position: {
          x: Math.random() * 800,
          y: Math.random() * 600,
        },
        data: {
          label: `Random Node ${i}`,
          type: nodeTypes[Math.floor(Math.random() * nodeTypes.length)] as any,
        },
      });
    }

    return FlowTestUtils.createTestFlow(nodes);
  }

  /**
   * Generate test execution data
   */
  static generateExecutionData() {
    return {
      simpleObject: { name: 'test', value: 42 },
      arrayData: [1, 2, 3, 4, 5],
      nestedObject: {
        user: { id: 1, name: 'John' },
        settings: { theme: 'dark', notifications: true },
      },
      stringData: 'Hello, World!',
      numberData: 123.45,
      booleanData: true,
    };
  }
}

// Re-export common testing library utilities
export * from '@testing-library/react';
export { userEvent };

// Default export with all utilities
export default {
  renderWithProviders,
  PluginTestUtils,
  FlowTestUtils,
  PerformanceTestUtils,
  AccessibilityTestUtils,
  MockDataGenerators,
  MockNodePlugin,
}; 