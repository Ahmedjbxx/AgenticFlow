import { AvailableVariable } from '../core/variables/VariableRegistry';
import { FlowData } from '../types';
export interface StepVariable {
    stepId: number;
    stepLabel: string;
    stepType: string;
    fields: Array<{
        name: string;
        type: string;
        description?: string;
        example?: any;
    }>;
    output?: any;
}
/**
 * Convert node-based variables to step-based variables
 */
export declare function convertToStepVariables(availableVariables: AvailableVariable[], executionLogs?: Array<{
    nodeId: string;
    nodeLabel: string;
    output?: any;
    timestamp: Date;
}>): StepVariable[];
/**
 * Generate step variables from execution context
 */
export declare function generateStepVariablesFromFlow(nodes: Array<{
    id: string;
    data: {
        label: string;
        type: string;
    };
}>, nodeOutputs: Map<string, any>): StepVariable[];
/**
 * Get available step variables up to a certain step
 */
export declare function getAvailableStepsUpTo(allSteps: StepVariable[], currentStepIndex: number): StepVariable[];
/**
 * Validate step variable reference
 */
export declare function validateStepReference(reference: string, availableSteps: StepVariable[]): {
    isValid: boolean;
    error?: string;
};
/**
 * Extract step references from template text
 */
export declare function extractStepReferences(template: string): string[];
/**
 * Convert AvailableVariable array to StepVariable array for StepVariableInput
 * This function analyzes the flow structure to determine step numbers based on node topology
 */
export declare function convertAvailableVariablesToStepVariables(availableVariables: AvailableVariable[], flowData?: FlowData): StepVariable[];
//# sourceMappingURL=stepVariableUtils.d.ts.map