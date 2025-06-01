import { FlowData, CustomNode, CustomEdge, ExecutionLogEntry, NodeData, CustomNodeType } from '../../types';
import { ApplicationCore } from '../ApplicationCore';
import { NodeRegistry } from '../registry/NodeRegistry';
import { ExecutionContext } from './ExecutionContext';

/**
 * Plugin-based flow executor that uses the node registry
 */
export class PluginBasedFlowExecutor {
  private nodeRegistry: NodeRegistry;
  private applicationCore: ApplicationCore;

  constructor(applicationCore: ApplicationCore) {
    this.applicationCore = applicationCore;
    this.nodeRegistry = applicationCore.nodeRegistry;
  }

  /**
   * Execute a flow using the plugin-based architecture
   */
  async executeFlow(
    flow: FlowData,
    triggerInput: any,
    onLog: (logEntry: ExecutionLogEntry) => void,
    llmApiCall?: (prompt: string) => Promise<string>
  ): Promise<void> {
    const { nodes, edges } = flow;
    const { eventBus, logger } = this.applicationCore;
    
    // Generate unique execution ID
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const flowId = `flow_${Date.now()}`;
    
    logger.info(`Starting flow execution: ${flowId}`, {
      executionId,
      totalNodes: nodes.length,
      totalEdges: edges.length,
    });

    eventBus.emit('flow.execution.started', {
      flowId,
      executionId,
      totalNodes: nodes.length,
      triggerInput,
    });

    // Find the trigger node
    let currentNode: CustomNode | undefined = nodes.find(n => n.data.type === CustomNodeType.TRIGGER);
    let currentInput: any = triggerInput;

    if (!currentNode) {
      const errorLog: ExecutionLogEntry = {
        nodeId: 'N/A',
        nodeLabel: 'System',
        status: 'error',
        message: 'No Trigger node found. Cannot start flow.',
        timestamp: new Date(),
      };
      onLog(errorLog);
      
      eventBus.emit('flow.execution.failed', {
        flowId,
        executionId,
        error: new Error('No Trigger node found'),
      });
      
      return;
    }

    const visitedNodes = new Set<string>();
    let nodeIndex = 0;

    while (currentNode) {
      // Prevent infinite loops
      if (visitedNodes.has(currentNode.id)) {
        const errorLog: ExecutionLogEntry = {
          nodeId: currentNode.id,
          nodeLabel: currentNode.data.label,
          status: 'error',
          message: `Infinite loop detected at node ${currentNode.data.label}. Halting execution.`,
          timestamp: new Date(),
          input: currentInput,
        };
        onLog(errorLog);
        
        eventBus.emit('flow.execution.failed', {
          flowId,
          executionId,
          error: new Error('Infinite loop detected'),
          nodeId: currentNode.id,
        });
        
        return;
      }
      
      visitedNodes.add(currentNode.id);

      // Log processing start
      const processingLog: ExecutionLogEntry = {
        nodeId: currentNode.id,
        nodeLabel: currentNode.data.label,
        status: 'processing',
        message: 'Processing node...',
        timestamp: new Date(),
        input: { ...currentInput },
      };
      onLog(processingLog);

      let output: any = null;
      let nextNodeId: string | null = null;

      try {
        // Get the plugin for this node type
        const plugin = this.nodeRegistry.get(currentNode.data.type);
        
        if (!plugin) {
          throw new Error(`No plugin found for node type: ${currentNode.data.type}`);
        }

        // Create execution context
        const context: ExecutionContext = this.applicationCore.createExecutionContext({
          flowId,
          nodeId: currentNode.id,
          executionId,
          input: currentInput,
          metadata: {
            retryCount: 0,
            totalNodes: nodes.length,
            currentNodeIndex: nodeIndex,
          },
        });

        // Execute the node using its plugin
        output = await plugin.execute(currentInput, currentNode.data, context);

        // ✨ CRITICAL FIX: Register the output for runtime variable extraction
        context.setNodeOutput(currentNode.id, output);

        // Log successful execution
        const successLog: ExecutionLogEntry = {
          nodeId: currentNode.id,
          nodeLabel: currentNode.data.label,
          status: 'success',
          message: `Node executed successfully`,
          timestamp: new Date(),
          input: currentInput,
          output: output,
        };
        onLog(successLog);

        // Determine next node based on node type and output
        nextNodeId = this.determineNextNode(currentNode, output, edges);

      } catch (error: any) {
        // Log execution error
        const errorLog: ExecutionLogEntry = {
          nodeId: currentNode.id,
          nodeLabel: currentNode.data.label,
          status: 'error',
          message: `Error during node execution: ${error.message}`,
          timestamp: new Date(),
          input: currentInput,
        };
        onLog(errorLog);

        eventBus.emit('flow.execution.failed', {
          flowId,
          executionId,
          error,
          nodeId: currentNode.id,
        });
        
        return;
      }

      // Move to next node
      currentInput = output;
      nodeIndex++;
      
      if (nextNodeId) {
        currentNode = nodes.find(n => n.id === nextNodeId);
        
        if (!currentNode) {
          const errorLog: ExecutionLogEntry = {
            nodeId: nextNodeId,
            nodeLabel: `Target node ID: ${nextNodeId}`,
            status: 'error',
            message: `Next node with ID "${nextNodeId}" not found. Halting flow.`,
            timestamp: new Date(),
          };
          onLog(errorLog);
          
          eventBus.emit('flow.execution.failed', {
            flowId,
            executionId,
            error: new Error(`Node not found: ${nextNodeId}`),
          });
          
          return;
        }
      } else {
        // No next node, check if this is an end node
        if (currentNode.data.type === CustomNodeType.END) {
          // Proper completion at end node
          logger.info(`Flow completed successfully at end node: ${currentNode.id}`);
          return;
        } else {
          // Flow ended without reaching an end node
          const warningLog: ExecutionLogEntry = {
            nodeId: 'System',
            nodeLabel: 'Flow',
            status: 'skipped',
            message: 'Flow execution finished, but did not reach an End node.',
            timestamp: new Date(),
          };
          onLog(warningLog);
          
          return;
        }
      }
    }
  }

  /**
   * Determine the next node based on current node type and output
   */
  private determineNextNode(
    currentNode: CustomNode, 
    output: any, 
    edges: CustomEdge[]
  ): string | null {
    const outgoingEdges = edges.filter(edge => edge.source === currentNode.id);
    
    if (outgoingEdges.length === 0) {
      return null;
    }

    // Handle different node types with special routing logic
    switch (currentNode.data.type) {
      case CustomNodeType.CONDITION:
        // Route based on condition result
        const conditionResult = output.conditionResult;
        if (conditionResult) {
          const trueEdge = outgoingEdges.find(edge => edge.sourceHandle === 'output_true');
          return trueEdge?.target || null;
        } else {
          const falseEdge = outgoingEdges.find(edge => edge.sourceHandle === 'output_false');
          return falseEdge?.target || null;
        }

      case CustomNodeType.SWITCH:
        // Route based on switch expression result
        const switchResult = output.switchResult;
        if (switchResult !== undefined) {
          const matchingEdge = outgoingEdges.find(edge => 
            edge.sourceHandle === `output_${switchResult}`
          );
          if (matchingEdge) {
            return matchingEdge.target;
          }
          
          // Fall back to default case
          const defaultEdge = outgoingEdges.find(edge => 
            edge.sourceHandle === 'output_default'
          );
          return defaultEdge?.target || null;
        }
        break;

      case CustomNodeType.LOOP:
        // Loop nodes have special routing logic
        const shouldContinueLoop = output.shouldContinueLoop;
        if (shouldContinueLoop) {
          const loopEdge = outgoingEdges.find(edge => edge.sourceHandle === 'output_loop');
          return loopEdge?.target || null;
        } else {
          const mainEdge = outgoingEdges.find(edge => edge.sourceHandle === 'output_main');
          return mainEdge?.target || null;
        }

      case CustomNodeType.END:
        // End nodes have no outgoing connections
        return null;

      default:
        // Default routing: take the first (and usually only) outgoing edge
        return outgoingEdges[0]?.target || null;
    }

    return null;
  }

  /**
   * Validate that all nodes in the flow have registered plugins
   */
  validateFlow(flow: FlowData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const node of flow.nodes) {
      const plugin = this.nodeRegistry.get(node.data.type);
      if (!plugin) {
        errors.push(`No plugin registered for node type: ${node.data.type} (Node: ${node.data.label})`);
        continue;
      }
      
      // Validate node data if plugin supports it
      if (plugin.validateData) {
        const validationErrors = plugin.validateData(node.data);
        if (validationErrors.length > 0) {
          errors.push(`Node "${node.data.label}" validation errors: ${validationErrors.join(', ')}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
} 