import { useMemo } from 'react';
import { useFlowStore } from '../store/flowStore';
import { AvailableVariable } from '../core/variables/VariableRegistry';

/**
 * Hook to access the variable system for a specific node
 */
export const useVariables = (nodeId: string) => {
  const getAvailableVariablesForNode = useFlowStore(state => state.getAvailableVariablesForNode);
  const refreshAvailableVariables = useFlowStore(state => state.refreshAvailableVariables);

  const availableVariables = useMemo(() => {
    return getAvailableVariablesForNode(nodeId);
  }, [getAvailableVariablesForNode, nodeId]);

  return {
    availableVariables,
    refreshAvailableVariables,
    hasVariables: availableVariables.length > 0,
  };
};

/**
 * Hook to get variable suggestions with search filtering
 */
export const useVariableSuggestions = (nodeId: string, searchTerm: string = '') => {
  const { availableVariables } = useVariables(nodeId);

  const filteredVariables = useMemo(() => {
    if (!searchTerm) {
      return availableVariables;
    }

    const term = searchTerm.toLowerCase();
    return availableVariables.filter(
      variable =>
        variable.variableName.toLowerCase().includes(term) ||
        variable.nodeLabel.toLowerCase().includes(term) ||
        variable.description.toLowerCase().includes(term)
    );
  }, [availableVariables, searchTerm]);

  return {
    suggestions: filteredVariables,
    hasResults: filteredVariables.length > 0,
    totalAvailable: availableVariables.length,
  };
};

/**
 * Hook to validate variable references in text
 */
export const useVariableValidation = (nodeId: string, text: string) => {
  const { availableVariables } = useVariables(nodeId);

  const validation = useMemo(() => {
    const variableRegex = /\{([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)\}/g;
    const availablePaths = new Set(availableVariables.map(v => v.fullPath));
    const issues: Array<{
      reference: string;
      isValid: boolean;
      error?: string;
    }> = [];

    let match;
    while ((match = variableRegex.exec(text)) !== null) {
      const fullPath = `${match[1]}.${match[2]}`;
      const isValid = availablePaths.has(fullPath);
      issues.push({
        reference: match[0],
        isValid,
        error: isValid ? undefined : `Variable "${fullPath}" is not available`,
      });
    }

    return {
      issues,
      isValid: issues.every(issue => issue.isValid),
      errorCount: issues.filter(issue => !issue.isValid).length,
    };
  }, [availableVariables, text]);

  return validation;
}; 