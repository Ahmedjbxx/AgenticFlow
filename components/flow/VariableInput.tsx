import React, { useState, useRef, useCallback } from 'react';
import { VariablePicker } from './VariablePicker';
import { AvailableVariable } from '../../core/variables/VariableRegistry';

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  availableVariables: AvailableVariable[];
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
  label?: string;
  helpText?: string;
  showVariableButton?: boolean;
}

export const VariableInput: React.FC<VariableInputProps> = ({
  value,
  onChange,
  availableVariables,
  placeholder,
  className = '',
  rows = 4,
  disabled = false,
  label,
  helpText,
  showVariableButton = true,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle variable selection
  const handleVariableSelect = useCallback((variable: AvailableVariable) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const beforeCursor = value.substring(0, cursorPosition);
    const afterCursor = value.substring(cursorPosition);
    const variableRef = `{${variable.fullPath}}`;
    
    const newValue = beforeCursor + variableRef + afterCursor;
    const newCursorPosition = cursorPosition + variableRef.length;

    onChange(newValue);
    setShowPicker(false);
    setSearchTerm('');

    // Set cursor position after variable insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  }, [value, cursorPosition, onChange]);

  // Handle cursor position tracking
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    setCursorPosition((e.target as HTMLTextAreaElement).selectionStart);
  };

  const handleTextareaKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setCursorPosition((e.target as HTMLTextAreaElement).selectionStart);
  };

  // Handle variable picker keyboard shortcut
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '{' && e.ctrlKey) {
      e.preventDefault();
      setShowPicker(true);
      setCursorPosition((e.target as HTMLTextAreaElement).selectionStart);
    }
  };

  // Get filtered variables based on search
  const filteredVariables = searchTerm 
    ? availableVariables.filter(variable =>
        variable.variableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variable.nodeLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variable.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableVariables;

  // Validate variable references in current text
  const getVariableValidation = () => {
    const variableRegex = /\{([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)\}/g;
    const availablePaths = new Set(availableVariables.map(v => v.fullPath));
    const issues: string[] = [];
    
    let match;
    while ((match = variableRegex.exec(value)) !== null) {
      const fullPath = `${match[1]}.${match[2]}`;
      if (!availablePaths.has(fullPath)) {
        issues.push(`Variable "${fullPath}" is not available`);
      }
    }
    
    return issues;
  };

  const validationIssues = getVariableValidation();

  return (
    <div ref={containerRef} className="relative">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onClick={handleTextareaClick}
          onKeyUp={handleTextareaKeyUp}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500
            ${validationIssues.length > 0 ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
            ${className}
          `}
        />

        {/* Variable picker button */}
        {showVariableButton && availableVariables.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setShowPicker(!showPicker);
              if (textareaRef.current) {
                setCursorPosition(textareaRef.current.selectionStart);
              }
            }}
            disabled={disabled}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 disabled:opacity-50"
            title="Insert variable (Ctrl+{)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
        )}

        {/* Variable picker */}
        {showPicker && (
          <div className="relative">
            <VariablePicker
              availableVariables={filteredVariables}
              onVariableSelect={handleVariableSelect}
              onClose={() => {
                setShowPicker(false);
                setSearchTerm('');
              }}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>
        )}
      </div>

      {/* Help text */}
      {helpText && (
        <p className="mt-1 text-xs text-slate-500">
          {helpText}
        </p>
      )}

      {/* Variable shortcut hint */}
      {availableVariables.length > 0 && (
        <p className="mt-1 text-xs text-slate-500">
          💡 Press <kbd className="px-1 py-0.5 bg-gray-100 border rounded text-xs">Ctrl+{`{`}</kbd> to insert variables
        </p>
      )}

      {/* Validation issues */}
      {validationIssues.length > 0 && (
        <div className="mt-1 space-y-1">
          {validationIssues.map((issue, index) => (
            <p key={index} className="text-xs text-red-600 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {issue}
            </p>
          ))}
        </div>
      )}

      {/* Click overlay to close picker */}
      {showPicker && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowPicker(false);
            setSearchTerm('');
          }}
        />
      )}
    </div>
  );
}; 