import React from 'react';
import { CustomNode, NodeData, CustomNodeType, LLMAgentNodeData, ToolActionNodeData, TriggerNodeData, ConditionNodeData, EndNodeData, LoopNodeData, HttpRequestNodeData, DataTransformNodeData, DelayNodeData, SwitchNodeData } from '../../types';
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

  const handleSwitchCasesChange = (cases: Array<{value: string, label: string}>) => {
    onUpdateNodeData(id, { cases });
  };

  const addSwitchCase = () => {
    const switchData = data as SwitchNodeData;
    const newCases = [...switchData.cases, { value: 'new_case', label: 'New Case' }];
    handleSwitchCasesChange(newCases);
  };

  const removeSwitchCase = (index: number) => {
    const switchData = data as SwitchNodeData;
    const newCases = switchData.cases.filter((_, i) => i !== index);
    handleSwitchCasesChange(newCases);
  };

  const updateSwitchCase = (index: number, field: 'value' | 'label', value: string) => {
    const switchData = data as SwitchNodeData;
    const newCases = switchData.cases.map((caseItem, i) => 
      i === index ? { ...caseItem, [field]: value } : caseItem
    );
    handleSwitchCasesChange(newCases);
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
      case CustomNodeType.LOOP:
        const loopData = data as LoopNodeData;
        return (
          <>
            <div>
              <label htmlFor="iterateOver" className="block text-sm font-medium text-slate-700">Iterate Over</label>
              <input
                type="text"
                id="iterateOver"
                name="iterateOver"
                value={loopData.iterateOver}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="input.items"
              />
              <p className="mt-1 text-xs text-slate-500">Array or collection to loop through. Use dot notation like 'input.contacts'</p>
            </div>
            <div>
              <label htmlFor="itemVariable" className="block text-sm font-medium text-slate-700">Item Variable Name</label>
              <input
                type="text"
                id="itemVariable"
                name="itemVariable"
                value={loopData.itemVariable}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="item"
              />
              <p className="mt-1 text-xs text-slate-500">Variable name for current item in loop (e.g., 'contact', 'order')</p>
            </div>
            <div>
              <label htmlFor="maxIterations" className="block text-sm font-medium text-slate-700">Max Iterations</label>
              <input
                type="number"
                id="maxIterations"
                name="maxIterations"
                value={loopData.maxIterations || 100}
                onChange={handleNumberInputChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min="1"
                max="1000"
              />
              <p className="mt-1 text-xs text-slate-500">Safety limit to prevent infinite loops</p>
            </div>
          </>
        );
      case CustomNodeType.HTTP_REQUEST:
        const httpData = data as HttpRequestNodeData;
        return (
          <>
            <div>
              <label htmlFor="method" className="block text-sm font-medium text-slate-700">HTTP Method</label>
              <select
                id="method"
                name="method"
                value={httpData.method}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-slate-700">URL</label>
              <input
                type="text"
                id="url"
                name="url"
                value={httpData.url}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="https://api.example.com/endpoint"
              />
              <p className="mt-1 text-xs text-slate-500">Use variables like {`{input.userId}`} for dynamic URLs</p>
            </div>
            <div>
              <label htmlFor="body" className="block text-sm font-medium text-slate-700">Request Body (JSON)</label>
              <textarea
                id="body"
                name="body"
                value={httpData.body || ''}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder='{"key": "value", "data": "{input.data}"}'
              />
              <p className="mt-1 text-xs text-slate-500">JSON body for POST/PUT requests. Use variables with {`{input.field}`}</p>
            </div>
            <div>
              <label htmlFor="timeout" className="block text-sm font-medium text-slate-700">Timeout (ms)</label>
              <input
                type="number"
                id="timeout"
                name="timeout"
                value={httpData.timeout || 5000}
                onChange={handleNumberInputChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min="1000"
                max="30000"
              />
            </div>
          </>
        );
      case CustomNodeType.DATA_TRANSFORM:
        const transformData = data as DataTransformNodeData;
        return (
          <>
            <div>
              <label htmlFor="transformType" className="block text-sm font-medium text-slate-700">Transform Type</label>
              <select
                id="transformType"
                name="transformType"
                value={transformData.transformType}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="extract">Extract Fields</option>
                <option value="format">Format Data</option>
                <option value="parse">Parse Content</option>
                <option value="filter">Filter Data</option>
                <option value="custom">Custom Logic</option>
              </select>
            </div>
            <div>
              <label htmlFor="transformLogic" className="block text-sm font-medium text-slate-700">Transform Logic</label>
              <textarea
                id="transformLogic"
                name="transformLogic"
                value={transformData.transformLogic}
                onChange={handleInputChange}
                rows={6}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="return { name: input.fullName, email: input.emailAddress };"
              />
              <p className="mt-1 text-xs text-slate-500">JavaScript code to transform data. Return the transformed result.</p>
            </div>
            <div>
              <label htmlFor="outputFormat" className="block text-sm font-medium text-slate-700">Output Format</label>
              <select
                id="outputFormat"
                name="outputFormat"
                value={transformData.outputFormat || 'json'}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="text">Text</option>
                <option value="array">Array</option>
              </select>
            </div>
          </>
        );
      case CustomNodeType.DELAY:
        const delayData = data as DelayNodeData;
        return (
          <>
            <div>
              <label htmlFor="delayType" className="block text-sm font-medium text-slate-700">Delay Type</label>
              <select
                id="delayType"
                name="delayType"
                value={delayData.delayType}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="fixed">Fixed Duration</option>
                <option value="dynamic">Dynamic Duration</option>
                <option value="until">Wait Until Condition</option>
              </select>
            </div>
            {delayData.delayType === 'fixed' && (
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-slate-700">Duration (ms)</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={delayData.duration || 1000}
                  onChange={handleNumberInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  min="100"
                  max="300000"
                />
                <p className="mt-1 text-xs text-slate-500">Fixed delay in milliseconds (1000 = 1 second)</p>
              </div>
            )}
            {delayData.delayType === 'dynamic' && (
              <div>
                <label htmlFor="durationExpression" className="block text-sm font-medium text-slate-700">Duration Expression</label>
                <input
                  type="text"
                  id="durationExpression"
                  name="durationExpression"
                  value={delayData.durationExpression || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="input.waitTime * 1000"
                />
                <p className="mt-1 text-xs text-slate-500">Expression to calculate delay duration from input data</p>
              </div>
            )}
            {delayData.delayType === 'until' && (
              <div>
                <label htmlFor="untilCondition" className="block text-sm font-medium text-slate-700">Wait Until Condition</label>
                <input
                  type="text"
                  id="untilCondition"
                  name="untilCondition"
                  value={delayData.untilCondition || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="input.ready === true"
                />
                <p className="mt-1 text-xs text-slate-500">Condition to wait for before proceeding</p>
              </div>
            )}
          </>
        );
      case CustomNodeType.SWITCH:
        const switchData = data as SwitchNodeData;
        return (
          <>
            <div>
              <label htmlFor="switchExpression" className="block text-sm font-medium text-slate-700">Switch Expression</label>
              <input
                type="text"
                id="switchExpression"
                name="switchExpression"
                value={switchData.switchExpression}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="input.category"
              />
              <p className="mt-1 text-xs text-slate-500">Expression to evaluate for routing (e.g., input.priority, input.type)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Switch Cases</label>
              {switchData.cases.map((caseItem, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={caseItem.value}
                    onChange={(e) => updateSwitchCase(index, 'value', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="value"
                  />
                  <input
                    type="text"
                    value={caseItem.label}
                    onChange={(e) => updateSwitchCase(index, 'label', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Label"
                  />
                  <button
                    type="button"
                    onClick={() => removeSwitchCase(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSwitchCase}
                className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              >
                Add Case
              </button>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={switchData.defaultCase || false}
                  onChange={(e) => onUpdateNodeData(id, { defaultCase: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-slate-700">Include Default Case</span>
              </label>
              <p className="mt-1 text-xs text-slate-500">Add a default path for values that don't match any case</p>
            </div>
          </>
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
    