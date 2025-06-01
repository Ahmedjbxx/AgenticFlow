import React from 'react';
import { EditorNode } from '../types.js';

interface NodeEditorPanelProps {
  node: EditorNode;
  onUpdateNodeData: (nodeId: string, newData: any) => void;
  onClose: () => void;
}

export const NodeEditorPanel: React.FC<NodeEditorPanelProps> = ({
  node,
  onUpdateNodeData,
  onClose,
}) => {
  return (
    <div className="w-80 bg-white border-l border-slate-300 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">
          Edit Node: {node.data.label}
        </h3>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-700 text-xl font-bold"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Node Label
          </label>
          <input
            type="text"
            value={node.data.label || ''}
            onChange={(e) => onUpdateNodeData(node.id, { label: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="text-sm text-slate-600">
          <p><strong>Type:</strong> {node.type}</p>
          <p><strong>ID:</strong> {node.id}</p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Full node editor implementation will be migrated in a later task.
            Currently showing basic controls only.
          </p>
        </div>
      </div>
    </div>
  );
}; 