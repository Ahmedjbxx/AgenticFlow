
import React from 'react';
import { CustomNode, NodeData, CustomNodeType, LLMAgentNodeData, ToolActionNodeData, TriggerNodeData, ConditionNodeData, EndNodeData } from '../../types';
import { GEMINI_MODEL_NAME, NODE_TYPE_META } from '../../constants';
import { XMarkIcon } from '../icons/EditorIcons';

interface NodeEditorPanelProps {
  node: CustomNode;
  onUpdateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  onClose: () => void;
}

const NodeEditorPanel: React.FC<NodeEditorPanelProps> = ({ node, onUpdateNodeData, onClose }) => {
  const { data, id } = node;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    onUpdateNodeData(id, { [name]: value });
  };
  
  const handleNumberInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    onUpdateNodeData(id, { [name]: parseFloat(value) });
  };


  const renderCommonFields = () => (
    <div>
      <label htmlFor="label" className="block text-sm font-medium text-slate-700">Label</label>
      <input
        type="text"
        id="label"
        name="label"
        value={data.label}
        onChange={handleInputChange}
        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </div>
  );

  const renderSpecificFields = () => {
    switch (data.type) {
      case CustomNodeType.TRIGGER:
        const triggerData = data as TriggerNodeData;
        return (
          <div>
            <label htmlFor="triggerType" className="block text-sm font-medium text-slate-700">Trigger Type</label>
            <input
              type="text"
              id="triggerType"
              name="triggerType"
              value={triggerData.triggerType}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., New Email, API Webhook"
            />
          </div>
        );
      case CustomNodeType.LLM_AGENT:
        const llmData = data as LLMAgentNodeData;
        return (
          <>
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-slate-700">Prompt Template</label>
              <textarea
                id="prompt"
                name="prompt"
                value={llmData.prompt}
                onChange={handleInputChange}
                rows={6}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your prompt. Use {input.fieldName} for dynamic values."
              />
              <p className="mt-1 text-xs text-slate-500">Gemini API key is read from `process.env.API_KEY`.</p>
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-slate-700">Model</label>
              <input
                type="text"
                id="model"
                name="model"
                value={llmData.model || GEMINI_MODEL_NAME}
                readOnly
                className="mt-1 block w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md shadow-sm sm:text-sm"
              />
            </div>
          </>
        );
      case CustomNodeType.TOOL_ACTION:
        const toolData = data as ToolActionNodeData;
        return (
          <>
            <div>
              <label htmlFor="toolName" className="block text-sm font-medium text-slate-700">Tool Name</label>
              <input
                type="text"
                id="toolName"
                name="toolName"
                value={toolData.toolName}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., Send Slack Message"
              />
            </div>
            <div>
              <label htmlFor="apiEndpoint" className="block text-sm font-medium text-slate-700">API Endpoint (Optional)</label>
              <input
                type="text"
                id="apiEndpoint"
                name="apiEndpoint"
                value={toolData.apiEndpoint || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="https://api.example.com/action"
              />
            </div>
             <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700">Tool API Key (Placeholder)</label>
              <input
                type="password"
                id="apiKey"
                name="apiKey"
                value={toolData.apiKey || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter tool-specific API key if needed"
              />
               <p className="mt-1 text-xs text-slate-500">Note: For MVP, this key is for display/mock only.</p>
            </div>
          </>
        );
      case CustomNodeType.CONDITION:
        const conditionData = data as ConditionNodeData;
        return (
          <div>
            <label htmlFor="conditionLogic" className="block text-sm font-medium text-slate-700">Condition Logic</label>
            <textarea
              id="conditionLogic"
              name="conditionLogic"
              value={conditionData.conditionLogic}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., input.isQualified === true or input.email.includes('@example.com')"
            />
            <p className="mt-1 text-xs text-slate-500">Use 'input' to access previous node's output. E.g., <code>input.summary.length &gt; 100</code>. For the 'Yes' path, the condition must evaluate to true.</p>
          </div>
        );
      case CustomNodeType.END:
        const endData = data as EndNodeData;
        return (
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-700">End Message</label>
            <input
              type="text"
              id="message"
              name="message"
              value={endData.message}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., Flow completed successfully."
            />
          </div>
        );
      default:
        return <p>No specific editor for this node type.</p>;
    }
  };

  return (
    <div className="w-96 bg-slate-100 p-4 border-l border-slate-300 shadow-lg flex flex-col h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-700">Edit {NODE_TYPE_META[data.type]?.name || 'Node'}</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
      <div className="space-y-4">
        {renderCommonFields()}
        {renderSpecificFields()}
      </div>
      <div className="mt-auto pt-4">
        <p className="text-xs text-slate-400">Node ID: {id}</p>
      </div>
    </div>
  );
};

export default NodeEditorPanel;
    