/**
 * Convert node-based variables to step-based variables
 */
export function convertToStepVariables(availableVariables, executionLogs) {
    // Group variables by node
    const nodeGroups = new Map();
    availableVariables.forEach(variable => {
        if (!nodeGroups.has(variable.nodeId)) {
            nodeGroups.set(variable.nodeId, {
                nodeId: variable.nodeId,
                nodeLabel: variable.nodeLabel,
                nodeType: variable.nodeType,
                variables: [],
            });
        }
        nodeGroups.get(variable.nodeId).variables.push(variable);
    });
    // Add execution outputs if available
    if (executionLogs) {
        executionLogs.forEach(log => {
            if (log.output && nodeGroups.has(log.nodeId)) {
                nodeGroups.get(log.nodeId).output = log.output;
            }
        });
    }
    // Convert to step-based format
    const stepVariables = [];
    let stepIndex = 1;
    // Sort nodes by their order in the flow (for now, use alphabetical by nodeId)
    const sortedNodes = Array.from(nodeGroups.values()).sort((a, b) => a.nodeId.localeCompare(b.nodeId));
    sortedNodes.forEach(nodeGroup => {
        const fields = nodeGroup.variables.map(variable => ({
            name: extractFieldName(variable.variableName),
            type: variable.variableType,
            description: variable.description,
            example: variable.example || variable.actualValue,
        }));
        // Add common fields that all steps might have
        if (!fields.some(f => f.name === 'output')) {
            fields.unshift({
                name: 'output',
                type: 'object',
                description: 'Complete output object from this step',
                example: nodeGroup.output,
            });
        }
        stepVariables.push({
            stepId: stepIndex,
            stepLabel: nodeGroup.nodeLabel,
            stepType: nodeGroup.nodeType,
            fields,
            output: nodeGroup.output,
        });
        stepIndex++;
    });
    return stepVariables;
}
/**
 * Extract clean field name from variable name (remove node prefixes)
 */
function extractFieldName(variableName) {
    // Remove node ID prefixes like "httpRequestNode-123.field"
    if (variableName.includes('.')) {
        const parts = variableName.split('.');
        return parts[parts.length - 1]; // Get the last part
    }
    return variableName;
}
/**
 * Generate step variables from execution context
 */
export function generateStepVariablesFromFlow(nodes, nodeOutputs) {
    const stepVariables = [];
    nodes.forEach((node, index) => {
        const output = nodeOutputs.get(node.id);
        const fields = [];
        // Add basic output field
        fields.push({
            name: 'output',
            type: 'object',
            description: `Complete output from ${node.data.label}`,
            example: output,
        });
        // Extract fields from output if it's an object
        if (output && typeof output === 'object') {
            Object.keys(output).forEach(key => {
                if (!fields.some(f => f.name === key)) {
                    fields.push({
                        name: key,
                        type: typeof output[key],
                        description: `${key} field from ${node.data.label}`,
                        example: output[key],
                    });
                }
            });
        }
        stepVariables.push({
            stepId: index + 1, // 1-based indexing
            stepLabel: node.data.label,
            stepType: node.data.type,
            fields,
            output,
        });
    });
    return stepVariables;
}
/**
 * Get available step variables up to a certain step
 */
export function getAvailableStepsUpTo(allSteps, currentStepIndex) {
    return allSteps.filter(step => step.stepId < currentStepIndex);
}
/**
 * Validate step variable reference
 */
export function validateStepReference(reference, availableSteps) {
    const match = reference.match(/^(\d+)\.([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_\[\]"]+)*)$/);
    if (!match) {
        return {
            isValid: false,
            error: 'Invalid format. Use {{stepId.field}} syntax (e.g., {{2.email}})',
        };
    }
    const [, stepIdStr, fieldPath] = match;
    const stepId = parseInt(stepIdStr, 10);
    const step = availableSteps.find(s => s.stepId === stepId);
    if (!step) {
        return {
            isValid: false,
            error: `Step ${stepId} not found or not available yet`,
        };
    }
    const fieldName = fieldPath.split('.')[0]; // Get the top-level field
    const hasField = step.fields.some(f => f.name === fieldName);
    if (!hasField) {
        return {
            isValid: false,
            error: `Field '${fieldName}' not available in step ${stepId}`,
        };
    }
    return { isValid: true };
}
/**
 * Extract step references from template text
 */
export function extractStepReferences(template) {
    const matches = template.match(/\{\{(\d+\.[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_\[\]"]+)*)\}\}/g);
    if (!matches)
        return [];
    return matches.map(match => match.replace(/^\{\{|\}\}$/g, '') // Remove {{ and }}
    );
}
/**
 * Convert AvailableVariable array to StepVariable array for StepVariableInput
 * This function analyzes the flow structure to determine step numbers based on node topology
 */
export function convertAvailableVariablesToStepVariables(availableVariables, flowData) {
    const stepVariables = new Map();
    // Group variables by node and analyze flow topology to determine step numbers
    const nodeVariables = new Map();
    // Group by nodeId
    availableVariables.forEach(variable => {
        if (!nodeVariables.has(variable.nodeId)) {
            nodeVariables.set(variable.nodeId, []);
        }
        nodeVariables.get(variable.nodeId).push(variable);
    });
    // If we have flow data, use topological ordering to determine step numbers
    let nodeToStepMap = new Map();
    if (flowData) {
        const orderedNodes = getTopologicalOrder(flowData);
        orderedNodes.forEach((nodeId, index) => {
            nodeToStepMap.set(nodeId, index + 1); // 1-based indexing
        });
    }
    else {
        // Fallback: just use incremental numbering based on insertion order
        let stepCounter = 1;
        nodeVariables.forEach((_, nodeId) => {
            nodeToStepMap.set(nodeId, stepCounter++);
        });
    }
    // Convert to step variables
    nodeVariables.forEach((variables, nodeId) => {
        const stepId = nodeToStepMap.get(nodeId) || 1;
        const firstVariable = variables[0];
        const fields = variables.map(variable => ({
            name: variable.isNested ? variable.variableName : variable.variableName,
            type: variable.variableType,
            description: variable.description,
            example: variable.example
        }));
        stepVariables.set(stepId, {
            stepId,
            stepLabel: firstVariable.nodeLabel,
            stepType: firstVariable.nodeType,
            fields,
            output: undefined // We don't have access to actual output here
        });
    });
    return Array.from(stepVariables.values()).sort((a, b) => a.stepId - b.stepId);
}
/**
 * Get topological order of nodes in the flow
 */
function getTopologicalOrder(flowData) {
    const nodes = flowData.nodes;
    const edges = flowData.edges;
    // Build adjacency list
    const adjacencyList = new Map();
    const inDegree = new Map();
    // Initialize
    nodes.forEach(node => {
        adjacencyList.set(node.id, []);
        inDegree.set(node.id, 0);
    });
    // Build graph
    edges.forEach(edge => {
        if (edge.source && edge.target) {
            adjacencyList.get(edge.source)?.push(edge.target);
            inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
        }
    });
    // Kahn's algorithm
    const queue = [];
    const result = [];
    // Start with nodes that have no incoming edges
    inDegree.forEach((degree, nodeId) => {
        if (degree === 0) {
            queue.push(nodeId);
        }
    });
    while (queue.length > 0) {
        const current = queue.shift();
        result.push(current);
        adjacencyList.get(current)?.forEach(neighbor => {
            const newDegree = (inDegree.get(neighbor) || 0) - 1;
            inDegree.set(neighbor, newDegree);
            if (newDegree === 0) {
                queue.push(neighbor);
            }
        });
    }
    return result;
}
//# sourceMappingURL=stepVariableUtils.js.map