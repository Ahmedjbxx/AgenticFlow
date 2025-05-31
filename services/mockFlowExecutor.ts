
import { FlowData, CustomNode, CustomEdge, ExecutionLogEntry, NodeData, CustomNodeType, LLMAgentNodeData, ConditionNodeData, ToolActionNodeData, TriggerNodeData, EndNodeData } from '../types';

// Helper to replace placeholders like {input.fieldName}
const replacePlaceholders = (template: string, input: any): string => {
  if (!input || typeof input !== 'object') return template;
  return template.replace(/\{input\.([\w.]+)\}/g, (match, path) => {
    const keys = path.split('.');
    let value = input;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return match; // Placeholder not found, return original
      }
    }
    return String(value);
  });
};


export const executeFlow = async (
  flow: FlowData,
  triggerInput: any,
  onLog: (logEntry: ExecutionLogEntry) => void,
  llmApiCall: (prompt: string) => Promise<string>
): Promise<void> => {
  const { nodes, edges } = flow;
  let currentNode: CustomNode | undefined = nodes.find(n => n.data.type === CustomNodeType.TRIGGER);
  let currentInput: any = triggerInput;

  if (!currentNode) {
    onLog({
      nodeId: 'N/A',
      nodeLabel: 'System',
      status: 'error',
      message: 'No Trigger node found. Cannot start flow.',
      timestamp: new Date(),
    });
    return;
  }

  const visitedNodes = new Set<string>();

  while (currentNode) {
    let errorOccurred = false; // Declare errorOccurred here

    if (visitedNodes.has(currentNode.id)) {
      onLog({
        nodeId: currentNode.id,
        nodeLabel: currentNode.data.label,
        status: 'error',
        message: `Infinite loop detected at node ${currentNode.data.label}. Halting execution.`,
        timestamp: new Date(),
        input: currentInput,
      });
      return; // Prevent infinite loops
    }
    visitedNodes.add(currentNode.id);

    onLog({
      nodeId: currentNode.id,
      nodeLabel: currentNode.data.label,
      status: 'processing',
      message: `Processing node...`,
      timestamp: new Date(),
      input: { ...currentInput }, // Log a copy of input
    });

    let output: any = null;
    let nextNodeId: string | null = null;
    

    try {
      switch (currentNode.data.type) {
        case CustomNodeType.TRIGGER:
          const triggerData = currentNode.data as TriggerNodeData;
          output = { ...currentInput, triggerInfo: `Triggered by ${triggerData.triggerType}` };
          onLog({
            nodeId: currentNode.id,
            nodeLabel: triggerData.label,
            status: 'success',
            message: `Trigger "${triggerData.triggerType}" activated.`,
            timestamp: new Date(),
            input: currentInput,
            output: output
          });
          const triggerOutEdges = edges.filter(edge => edge.source === currentNode!.id);
          nextNodeId = triggerOutEdges.length > 0 ? triggerOutEdges[0].target : null;
          break;

        case CustomNodeType.LLM_AGENT:
          const llmData = currentNode.data as LLMAgentNodeData;
          const processedPrompt = replacePlaceholders(llmData.prompt, currentInput);
          onLog({
            nodeId: currentNode.id,
            nodeLabel: llmData.label,
            status: 'processing',
            message: `Sending prompt to LLM: "${processedPrompt.substring(0, 100)}..."`,
            timestamp: new Date(),
            input: currentInput
          });
          const llmResponse = await llmApiCall(processedPrompt);
          // Attempt to parse if LLM response is expected to be JSON, otherwise treat as text
          try {
            output = JSON.parse(llmResponse);
          } catch (e) {
            output = { text: llmResponse }; // Wrap in an object if not JSON
          }
          onLog({
            nodeId: currentNode.id,
            nodeLabel: llmData.label,
            status: 'success',
            message: `LLM response received.`,
            timestamp: new Date(),
            output: output
          });
          const llmOutEdges = edges.filter(edge => edge.source === currentNode!.id);
          nextNodeId = llmOutEdges.length > 0 ? llmOutEdges[0].target : null;
          break;

        case CustomNodeType.TOOL_ACTION:
          const toolData = currentNode.data as ToolActionNodeData;
          const processedToolName = replacePlaceholders(toolData.toolName, currentInput);
          // Simulate tool execution
          await new Promise(resolve => setTimeout(resolve, 500)); // Mock delay
          output = { result: `Mock result from ${processedToolName}`, inputReceived: currentInput };
           onLog({
            nodeId: currentNode.id,
            nodeLabel: toolData.label,
            status: 'success',
            message: `Tool "${processedToolName}" executed. API Key (placeholder): ${toolData.apiKey ? 'Provided' : 'Not Provided'}`,
            timestamp: new Date(),
            input: currentInput,
            output: output
          });
          const toolOutEdges = edges.filter(edge => edge.source === currentNode!.id);
          nextNodeId = toolOutEdges.length > 0 ? toolOutEdges[0].target : null;
          break;

        case CustomNodeType.CONDITION:
          const conditionData = currentNode.data as ConditionNodeData;
          let conditionMet = false;
          // VERY basic mock evaluation - in real scenario, this needs a secure sandbox
          try {
            // eslint-disable-next-line no-new-func
            const evaluate = new Function('input', `try { return ${conditionData.conditionLogic}; } catch(e) { console.error("Condition eval error:", e); return false; }`);
            conditionMet = !!evaluate(currentInput); // Ensure boolean
          } catch (e) {
            console.error("Error evaluating condition:", e);
            onLog({
                nodeId: currentNode.id,
                nodeLabel: conditionData.label,
                status: 'error',
                message: `Error evaluating condition logic: ${(e as Error).message}`,
                timestamp: new Date(),
            });
            errorOccurred = true; // Stop flow on condition error
          }
          
          if (errorOccurred) break;

          onLog({
            nodeId: currentNode.id,
            nodeLabel: conditionData.label,
            status: 'success',
            message: `Condition "${conditionData.conditionLogic}" evaluated to: ${conditionMet}.`,
            timestamp: new Date(),
            input: currentInput,
            output: { conditionResult: conditionMet }
          });
          output = { ...currentInput, conditionResult: conditionMet }; // Pass through input and add condition result

          const conditionOutEdges = edges.filter(edge => edge.source === currentNode!.id);
          
          if (conditionMet) {
            const trueEdge = conditionOutEdges.find(edge => edge.sourceHandle === 'output_true');
            nextNodeId = trueEdge?.target || null;
          } else {
            const falseEdge = conditionOutEdges.find(edge => edge.sourceHandle === 'output_false');
            nextNodeId = falseEdge?.target || null;
          }
                    
          if (!nextNodeId && (conditionMet || !conditionMet)) { // Check if a path was expected but not found
             const pathTaken = conditionMet ? "true ('Yes')" : "false ('No')";
             onLog({
                nodeId: currentNode.id,
                nodeLabel: conditionData.label,
                status: 'skipped',
                message: `No outgoing edge found for condition result: ${pathTaken}. Halting this branch.`,
                timestamp: new Date(),
            });
          }
          break;

        case CustomNodeType.END:
          const endData = currentNode.data as EndNodeData;
          const finalMessage = replacePlaceholders(endData.message, currentInput);
          onLog({
            nodeId: currentNode.id,
            nodeLabel: endData.label,
            status: 'success',
            message: `Flow ended. Message: "${finalMessage}"`,
            timestamp: new Date(),
            input: currentInput
          });
          nextNodeId = null; // End of flow
          break;

        default:
            // This should be unreachable if CustomNodeType is exhaustive
            const exhaustiveCheck: never = currentNode.data.type;
            onLog({
                nodeId: currentNode.id,
                nodeLabel: (currentNode.data as NodeData).label || 'Unknown Node',
                status: 'error',
                message: `Unknown node type encountered during execution: ${exhaustiveCheck}`,
                timestamp: new Date(),
            });
          errorOccurred = true;
      }
    } catch (error) {
        onLog({
            nodeId: currentNode.id,
            nodeLabel: (currentNode.data as NodeData).label,
            status: 'error',
            message: `Error during node execution: ${(error as Error).message}`,
            timestamp: new Date(),
            input: currentInput,
        });
      errorOccurred = true;
    }

    if (errorOccurred) {
      // Optionally, decide if the whole flow should stop on any error
      // For now, we stop if an error occurs within a node's logic
      return; 
    }

    currentInput = output; // Output of current node becomes input for the next
    currentNode = nextNodeId ? nodes.find(n => n.id === nextNodeId) : undefined;

    if (nextNodeId && !currentNode) {
        onLog({
            nodeId: 'N/A', // Original nextNodeId is available though.
            nodeLabel: `Target node ID: ${nextNodeId}`,
            status: 'error',
            message: `Next node with ID "${nextNodeId}" not found. Halting flow.`,
            timestamp: new Date(),
        });
        return;
    }
  }

  // Check if flow ended but not at an End node.
  // The last node processed would be Array.from(visitedNodes).pop()
  const lastProcessedNodeId = Array.from(visitedNodes).pop();
  const lastProcessedNode = lastProcessedNodeId ? nodes.find(n => n.id === lastProcessedNodeId) : undefined;

  if (!currentNode && !errorOccurred && visitedNodes.size > 0 && lastProcessedNode && lastProcessedNode.data.type !== CustomNodeType.END) {
     onLog({
        nodeId: 'System',
        nodeLabel: 'Flow',
        status: 'skipped', // Or 'warning'
        message: 'Flow execution finished, but did not reach an End node.',
        timestamp: new Date(),
    });
  } else if (visitedNodes.size === 0 && !errorOccurred) {
    // This case should be handled by initial trigger check, but as a safeguard
    onLog({
        nodeId: 'System',
        nodeLabel: 'Flow',
        status: 'skipped',
        message: 'Flow did not execute any nodes.',
        timestamp: new Date(),
    });
  }
};
