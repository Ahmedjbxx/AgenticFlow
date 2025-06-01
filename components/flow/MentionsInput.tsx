import React from 'react';
import { Mention, MentionsInput as ReactMentionsInput } from 'react-mentions';
import { AvailableVariable } from '../../core/variables/VariableRegistry';

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
        return jsonStr.length > 60 ? jsonStr.substring(0, 60) + '...' : jsonStr;
      } catch {
        return '[Object]';
      }
    }
    
    return String(value);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'string': return '📝';
      case 'number': return '🔢';
      case 'boolean': return '✅';
      case 'object': return '📦';
      case 'array': return '📋';
      default: return '📄';
    }
  };

  // Enhanced style for the mentions input
  const mentionsInputStyle = {
    control: {
      backgroundColor: '#fff',
      fontSize: 14,
      fontWeight: 'normal',
    },
    '&multiLine': {
      control: {
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        minHeight: rows * 24 + 16,
        border: '1px solid #cbd5e1',
        borderRadius: '6px',
        padding: '8px 12px',
      },
      highlighter: {
        padding: '8px 12px',
        border: '1px solid transparent',
        borderRadius: '6px',
      },
      input: {
        padding: '8px 12px',
        outline: 'none',
        border: 'none',
        borderRadius: '6px',
        resize: 'vertical' as const,
      },
    },
    suggestions: {
      list: {
        backgroundColor: 'white',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        maxHeight: '300px', // Increased for hierarchical display
        overflowY: 'auto' as const,
        zIndex: 50,
      },
      item: {
        padding: '0px',
        '&focused': {
          backgroundColor: '#f3f4f6',
        },
      },
    },
  };

  // Enhanced style for highlighted mentions (purple for nested, blue for static)
  const mentionStyle = {
    backgroundColor: '#f3e8ff',
    color: '#7c3aed',
    fontWeight: '600',
    padding: '2px 4px',
    borderRadius: '4px',
    border: '1px solid #c4b5fd',
  };

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}

      {/* Variable Statistics */}
      {availableVariables.length > 0 && (
        <div className="mb-2 flex items-center space-x-4 text-xs text-gray-600">
          <span className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Static: {availableVariables.filter(v => !v.isNested).length}</span>
          </span>
          <span className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <span>Runtime: {availableVariables.filter(v => v.isNested).length}</span>
          </span>
          <span>
            Nodes: {new Set(availableVariables.map(v => v.nodeId)).size}
          </span>
        </div>
      )}

      {/* Mentions Input */}
      <div className="relative">
        <ReactMentionsInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={mentionsInputStyle}
          allowSpaceInQuery={false}
          suggestionsPortalHost={document.body}
        >
          <Mention
            trigger="{"
            data={mentionSuggestions}
            style={mentionStyle}
            renderSuggestion={renderSuggestion}
            displayTransform={(id, display) => `{${id}}`}
            markup="{__id__}"
            appendSpaceOnAdd={false}
          />
        </ReactMentionsInput>
      </div>

      {/* Help text */}
      {helpText && (
        <p className="mt-1 text-xs text-slate-500">
          {helpText}
        </p>
      )}

      {/* Enhanced variable hint */}
      {availableVariables.length > 0 && (
        <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded text-xs">
          <p className="text-slate-600 mb-1">
            💡 Type <kbd className="px-1 py-0.5 bg-white border rounded text-xs font-mono">{`{`}</kbd> to insert variables:
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-slate-500">Static schema variables</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-slate-500">Runtime extracted variables</span>
            </span>
          </div>
        </div>
      )}

      {/* No variables available message */}
      {availableVariables.length === 0 && (
        <p className="mt-1 text-xs text-slate-400 italic">
          No variables available. Execute upstream nodes to see their output variables.
        </p>
      )}
    </div>
  );
}; 