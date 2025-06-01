import React, { useState, useRef, useEffect } from 'react';
import { AvailableVariable } from '../../core/variables/VariableRegistry';

interface VariablePickerProps {
  availableVariables: AvailableVariable[];
  onVariableSelect: (variable: AvailableVariable) => void;
  onClose: () => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export const VariablePicker: React.FC<VariablePickerProps> = ({
  availableVariables,
  onVariableSelect,
  onClose,
  searchTerm = '',
  onSearchChange,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus search input when picker opens
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Reset selection when variables change
    setSelectedIndex(0);
  }, [availableVariables]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < availableVariables.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (availableVariables[selectedIndex]) {
          onVariableSelect(availableVariables[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
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

  const getNodeTypeColor = (nodeType: string) => {
    const colors: Record<string, string> = {
      'llmAgentNode': 'bg-purple-100 text-purple-800',
      'httpRequestNode': 'bg-blue-100 text-blue-800',
      'triggerNode': 'bg-green-100 text-green-800',
      'conditionNode': 'bg-yellow-100 text-yellow-800',
      'dataTransformNode': 'bg-orange-100 text-orange-800',
      'delayNode': 'bg-gray-100 text-gray-800',
      'loopNode': 'bg-indigo-100 text-indigo-800',
      'switchNode': 'bg-pink-100 text-pink-800',
    };
    return colors[nodeType] || 'bg-gray-100 text-gray-800';
  };

  if (availableVariables.length === 0) {
    return (
      <div className="absolute z-50 mt-1 w-96 bg-white border border-gray-300 rounded-md shadow-lg">
        <div className="p-4 text-center text-gray-500">
          <div className="mb-2">🔗</div>
          <p className="text-sm">No variables available</p>
          <p className="text-xs text-gray-400 mt-1">
            Connect nodes to see available variables
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute z-50 mt-1 w-96 bg-white border border-gray-300 rounded-md shadow-lg">
      {/* Search Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">🔗 Available Variables</span>
        </div>
        {onSearchChange && (
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search variables..."
            className="mt-2 w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {/* Variables List */}
      <div 
        ref={listRef}
        className="max-h-64 overflow-y-auto"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {availableVariables.map((variable, index) => (
          <div
            key={`${variable.nodeId}-${variable.variableName}`}
            className={`px-3 py-2 cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${
              index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
            }`}
            onClick={() => onVariableSelect(variable)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Variable name and type */}
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs">{getTypeIcon(variable.variableType)}</span>
                  <code className="text-sm font-medium text-gray-900 bg-gray-100 px-1 rounded">
                    {variable.variableName}
                  </code>
                  <span className="text-xs text-gray-500">
                    {variable.variableType}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 mb-1">
                  {variable.description}
                </p>

                {/* Node info */}
                <div className="flex items-center space-x-2">
                  <span 
                    className={`px-2 py-0.5 text-xs rounded-full ${getNodeTypeColor(variable.nodeType)}`}
                  >
                    {variable.nodeLabel}
                  </span>
                  <code className="text-xs text-gray-500 bg-gray-50 px-1 rounded">
                    {variable.fullPath}
                  </code>
                </div>

                {/* Example value */}
                {variable.example !== undefined && (
                  <div className="mt-1">
                    <span className="text-xs text-gray-500">Example: </span>
                    <code className="text-xs text-gray-700 bg-yellow-50 px-1 rounded">
                      {typeof variable.example === 'string' 
                        ? variable.example 
                        : JSON.stringify(variable.example)
                      }
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer with instructions */}
      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500">
          <kbd className="px-1 py-0.5 bg-white border rounded text-xs">↑↓</kbd> navigate • 
          <kbd className="px-1 py-0.5 bg-white border rounded text-xs ml-1">Enter</kbd> select • 
          <kbd className="px-1 py-0.5 bg-white border rounded text-xs ml-1">Esc</kbd> close
        </p>
      </div>
    </div>
  );
}; 