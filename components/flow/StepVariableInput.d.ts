import React from 'react';
interface StepVariable {
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
interface StepVariableInputProps {
    value: string;
    onChange: (value: string) => void;
    availableSteps: StepVariable[];
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
    label?: string;
    helpText?: string;
    className?: string;
}
export declare const StepVariableInput: React.FC<StepVariableInputProps>;
export {};
//# sourceMappingURL=StepVariableInput.d.ts.map