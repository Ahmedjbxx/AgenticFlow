import React from 'react';
import { Mention, MentionsInput as ReactMentionsInput } from 'react-mentions';
import { AvailableVariable } from '@agenticflow/core';

interface MentionsInputProps {
  value: string;
  onChange: (value: string) => void;
  availableVariables: AvailableVariable[];
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  label?: string;
  helpText?: string;
  className?: string;
}

interface GroupedVariable {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  staticVariables: AvailableVariable[];
  nestedVariables: AvailableVariable[];
}

export const MentionsInput: React.FC<MentionsInputProps> = ({
  value,
  onChange,
  availableVariables,
  placeholder,
  rows = 4,
  disabled = false,
  label,
  helpText,
  className = '',
}) => {
  // Group variables by node and type (static vs nested)
  const groupedVariables = React.useMemo(() => {
    const groups = new Map<string, GroupedVariable>();

    availableVariables.forEach(variable => {
      if (!groups.has(variable.nodeId)) {
        groups.set(variable.nodeId, {
          nodeId: variable.nodeId,
          nodeLabel: variable.nodeLabel,
          nodeType: variable.nodeType,
          staticVariables: [],
          nestedVariables: [],
        });
      }

      const group = groups.get(variable.nodeId)!;
      if (variable.isNested) {
        group.nestedVariables.push(variable);
      } else {
        group.staticVariables.push(variable);
      }
    });

    // Sort nested variables by depth
    groups.forEach(group => {
      group.nestedVariables.sort((a, b) => (a.depth || 0) - (b.depth || 0));
    });

    return Array.from(groups.values());
  }, [availableVariables]);

  // Convert variables to react-mentions format with enhanced display
  const mentionSuggestions = availableVariables.map(variable => ({
    id: variable.fullPath,
    display: variable.isNested 
      ? `${variable.nodeLabel}.${variable.variableName}` 
      : `${variable.nodeLabel}.${variable.variableName}`,
    variableName: variable.variableName,
    nodeLabel: variable.nodeLabel,
    nodeType: variable.nodeType,
    variableType: variable.variableType,
    description: variable.description,
    example: variable.example,
    isNested: variable.isNested,
    depth: variable.depth,
    actualValue: variable.actualValue,
    extractedAt: variable.extractedAt,
  }));

  // Get type icon for variable type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'string': return '📝';
      case 'number': return '🔢';
      case 'boolean': return '✅';
      case 'object': return '📦';
      case 'array': return '📋';
      case 'null': return '∅';
      case 'undefined': return '❓';
      default: return '📄';
    }
  };

  // Format display value for different types
  const formatDisplayValue = (value: any, isNested: boolean): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    if (typeof value === 'string') {
      return value.length > 50 ? value.substring(0, 50) + '...' : value;
    }
    
    if (typeof value === 'object') {
      try {
        const jsonStr = JSON.stringify(value);
        return jsonStr.length > 50 ? jsonStr.substring(0, 50) + '...' : jsonStr;
      } catch {
        return '[Object]';
      }
    }
    
    return String(value);
  };

  // Enhanced suggestion renderer with hierarchical display
  const renderSuggestion = (suggestion: any, search: string, highlightedDisplay: React.ReactNode) => {
    const depthIndent = (suggestion.depth || 0) * 12; // 12px per depth level
    const isStale = suggestion.extractedAt && (Date.now() - suggestion.extractedAt) > 60000; // 1 minute

    return (
      <div className="px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100">
        <div className="flex items-start space-x-2">
          {/* Depth indicator for nested variables */}
          {suggestion.isNested && (
            <div style={{ paddingLeft: `${depthIndent}px` }} className="flex items-center">
              <div className="w-2 h-2 bg-purple-300 rounded-full mr-2"></div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Variable name and type with nesting indicator */}
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs">{getTypeIcon(suggestion.variableType)}</span>
              
              {suggestion.isNested && (
                <span className="text-xs text-purple-600 font-medium">
                  L{suggestion.depth || 0}
                </span>
              )}
              
              <code className={`text-sm font-medium px-1 rounded ${
                suggestion.isNested 
                  ? 'text-purple-900 bg-purple-100' 
                  : 'text-gray-900 bg-gray-100'
              }`}>
                {suggestion.isNested ? suggestion.variableName : suggestion.variableName}
              </code>
              
              <span className="text-xs text-gray-500">
                {suggestion.variableType}
              </span>

              {/* Static/Runtime indicator */}
              <span className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${
                suggestion.isNested
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {suggestion.isNested ? 'Runtime' : 'Static'}
              </span>

              {/* Freshness indicator for runtime variables */}
              {suggestion.isNested && (
                <span className={`w-2 h-2 rounded-full ${
                  isStale ? 'bg-yellow-400' : 'bg-green-400'
                }`} title={isStale ? 'Data may be stale' : 'Fresh data'} />
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-gray-600 mb-1">
              {suggestion.description}
            </p>

            {/* Node info with enhanced styling */}
            <div className="flex items-center space-x-2 mb-1">
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                suggestion.isNested
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {suggestion.nodeLabel}
              </span>
              <code className="text-xs text-gray-500 bg-gray-50 px-1 rounded">
                {suggestion.id}
              </code>
            </div>

            {/* Example value with better formatting */}
            {suggestion.example !== undefined && (
              <div className="mt-1">
                <span className="text-xs text-gray-500">
                  {suggestion.isNested ? 'Actual: ' : 'Example: '}
                </span>
                <code className={`text-xs px-1 rounded max-w-xs truncate inline-block ${
                  suggestion.isNested
                    ? 'text-purple-700 bg-purple-50'
                    : 'text-gray-700 bg-yellow-50'
                }`}>
                  {formatDisplayValue(suggestion.example, suggestion.isNested)}
                </code>
              </div>
            )}

            {/* Timestamp for runtime variables */}
            {suggestion.isNested && suggestion.extractedAt && (
              <div className="mt-1">
                <span className="text-xs text-gray-400">
                  Extracted: {new Date(suggestion.extractedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        <ReactMentionsInput
          value={value}
          onChange={(event, newValue) => onChange(newValue)}
          placeholder={placeholder}
          disabled={disabled}
          className="mentions-input w-full border border-gray-300 rounded-md shadow-sm"
          style={{
            '&multiLine': {
              control: {
                fontSize: '14px',
                lineHeight: '1.4',
                minHeight: `${rows * 1.4 + 1}em`,
                border: 'none',
                outline: 'none',
              },
              highlighter: {
                padding: '8px 12px',
                border: 'none',
                fontSize: '14px',
                lineHeight: '1.4',
              },
              input: {
                padding: '8px 12px',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                lineHeight: '1.4',
                resize: 'vertical',
              },
            },
            suggestions: {
              list: {
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                maxHeight: '300px',
                overflow: 'auto',
                fontSize: '14px',
              },
              item: {
                padding: '0',
                borderBottom: 'none',
                '&focused': {
                  backgroundColor: '#f9fafb',
                },
              },
            },
          }}
        >
          <Mention
            trigger="{"
            data={mentionSuggestions}
            renderSuggestion={renderSuggestion}
            style={{
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              padding: '1px 3px',
              borderRadius: '3px',
              fontWeight: '500',
            }}
            displayTransform={(id, display) => `{${display}}`}
          />
        </ReactMentionsInput>
      </div>

      {helpText && (
        <p className="text-sm text-gray-500">
          {helpText}
        </p>
      )}

      {/* Variable statistics */}
      {availableVariables.length > 0 && (
        <div className="text-xs text-gray-500">
          {availableVariables.filter(v => !v.isNested).length} static, {' '}
          {availableVariables.filter(v => v.isNested).length} runtime variables available
        </div>
      )}
    </div>
  );
}; 