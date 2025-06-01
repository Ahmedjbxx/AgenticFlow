import React from 'react';
import { CustomNode } from '../../types';
import { XMarkIcon } from '../icons/EditorIcons';
import { useFlowStore } from '../../store/flowStore';
import { useVariables } from '../../hooks/useVariables';
import { applicationCore } from '../../core/ApplicationCore';

interface NodeEditorPanelProps {
  node: CustomNode;
  onUpdateNodeData: (nodeId: string, data: any) => void;
  onClose: () => void;
}

const NodeEditorPanel: React.FC<NodeEditorPanelProps> = ({ 
  node, 
  onUpdateNodeData, 
  onClose 
}) => {
  const { id, type, data } = node;
  const { availableVariables } = useVariables(id);
  
  // Get the plugin for this node type
  const plugin = type ? applicationCore.nodeRegistry.get(type) : null;
  
  if (!plugin) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-slate-900">
            Unknown Node Type
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-sm text-red-600">
          <p>Plugin not found for node type: {type}</p>
          <p className="mt-2 text-xs text-slate-500">
            This node type may not be registered or enabled.
          </p>
        </div>
    </div>
  );
  }

  const handleDataChange = (newData: any) => {
    onUpdateNodeData(id, newData);
  };

  // Validation errors
  const validationErrors = plugin.validateData ? plugin.validateData(data) : [];

        return (
    <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
          <h3 className="text-lg font-medium text-slate-900">
            Edit {plugin.metadata.name}
          </h3>
          <p className="text-sm text-slate-500">
            {plugin.metadata.description}
          </p>
          </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
            </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Common Label Field */}
            <div>
          <label htmlFor="node-label" className="block text-sm font-medium text-slate-700 mb-1">
            Label
          </label>
              <input
                type="text"
            id="node-label"
            value={data.label || ''}
            onChange={(e) => handleDataChange({ ...data, label: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder={`${plugin.metadata.name} Label`}
              />
            </div>

        {/* Plugin-specific fields */}
            <div>
          {plugin.renderEditor(data, handleDataChange, {
            nodeId: id,
            availableVariables: availableVariables,
          })}
            </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center mb-2">
              <svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h4 className="text-sm font-medium text-red-800">
                Validation Errors
              </h4>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
              </div>
            )}

        {/* Help Text */}
        {plugin.getHelpText && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start">
              <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">
                  Help
                </h4>
                <p className="text-sm text-blue-700 whitespace-pre-line">
                  {plugin.getHelpText()}
                </p>
              </div>
            </div>
              </div>
            )}

        {/* Variable Information */}
        {availableVariables.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
            <div className="flex items-center mb-2">
              <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <h4 className="text-sm font-medium text-purple-800">
                Available Variables ({availableVariables.length})
              </h4>
            </div>
            <div className="text-sm text-purple-700 space-y-1 max-h-32 overflow-y-auto">
              {availableVariables.slice(0, 5).map((variable, index) => (
                <div key={index} className="flex items-center justify-between">
                  <code className="bg-purple-100 px-1 rounded text-xs">
                    {variable.fullPath}
                  </code>
                  <span className="text-xs text-purple-600">
                    {variable.variableType}
                  </span>
                </div>
              ))}
              {availableVariables.length > 5 && (
                <p className="text-xs text-purple-600 italic">
                  +{availableVariables.length - 5} more variables
                </p>
              )}
            </div>
            </div>
        )}

        {/* Node Metadata */}
        <div className="border-t border-slate-200 pt-4 text-xs text-slate-500">
          <div className="space-y-1">
            <div>Type: <code className="bg-slate-100 px-1 rounded">{plugin.metadata.type}</code></div>
            <div>Version: {plugin.metadata.version}</div>
            <div>Category: {plugin.metadata.category}</div>
            <div>Node ID: <code className="bg-slate-100 px-1 rounded">{id}</code></div>
      </div>
      </div>
      </div>
    </div>
  );
};

export default NodeEditorPanel;
    