import React, { useState } from 'react';

interface Variable {
  name: string;
  type: string;
  value?: any;
}

interface VariablePickerProps {
  onSelect: (variable: Variable) => void;
  className?: string;
}

export const VariablePicker: React.FC<VariablePickerProps> = ({
  onSelect,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Placeholder variables - will be replaced with real variable registry integration
  const mockVariables: Variable[] = [
    { name: 'httpResponse.data', type: 'object' },
    { name: 'httpResponse.status', type: 'number' },
    { name: 'userInput', type: 'string' },
    { name: 'currentTime', type: 'string' },
  ];

  return (
    <div className={`relative ${className || ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm hover:bg-slate-200 focus:ring-2 focus:ring-blue-500"
      >
        📎 Variables
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-64 bg-white border border-slate-300 rounded-md shadow-lg">
          <div className="p-2 border-b border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700">Available Variables</h4>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {mockVariables.map((variable, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelect(variable);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex justify-between items-center"
              >
                <span className="font-mono text-purple-600">{variable.name}</span>
                <span className="text-xs text-slate-500">{variable.type}</span>
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-slate-200 bg-yellow-50">
            <p className="text-xs text-yellow-800">
              Note: Real variable integration pending migration.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 