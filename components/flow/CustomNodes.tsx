
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData, CustomNodeType, TriggerNodeData, LLMAgentNodeData, ToolActionNodeData, ConditionNodeData, EndNodeData } from '../../types';
import { NODE_TYPE_META } from '../../constants';
import { TriggerIcon, LLMIcon, ToolIcon, ConditionIcon, EndIcon, CogIcon } from '../icons/NodeIcons';

const iconMap: Record<CustomNodeType, React.FC<{ className?: string }>> = {
  [CustomNodeType.TRIGGER]: TriggerIcon,
  [CustomNodeType.LLM_AGENT]: LLMIcon,
  [CustomNodeType.TOOL_ACTION]: ToolIcon,
  [CustomNodeType.CONDITION]: ConditionIcon,
  [CustomNodeType.END]: EndIcon,
};

interface BaseNodeProps extends NodeProps<NodeData> {
  // children?: React.ReactNode;
}

const BaseNode: React.FC<BaseNodeProps> = memo(({ data, selected, type /*, children */ }) => {
  const nodeMeta = NODE_TYPE_META[data.type];
  const IconComponent = iconMap[data.type] || CogIcon;

  return (
    <div className={`w-52 rounded-lg shadow-md border-2 ${selected ? 'border-blue-500 shadow-blue-300' : 'border-transparent'} ${nodeMeta.color} text-white overflow-hidden`}>
      <div className={`px-3 py-2 flex items-center space-x-2 ${nodeMeta.color}`}>
        <IconComponent className="w-5 h-5 text-white" />
        <div className="font-semibold truncate text-sm">{data.label || nodeMeta.name}</div>
      </div>
      <div className="p-3 bg-white text-slate-700 text-xs">
        {data.type === CustomNodeType.TRIGGER && <p>Type: {(data as TriggerNodeData).triggerType}</p>}
        {data.type === CustomNodeType.LLM_AGENT && <p className="truncate" title={(data as LLMAgentNodeData).prompt}>Prompt: {(data as LLMAgentNodeData).prompt.substring(0,30)}...</p>}
        {data.type === CustomNodeType.TOOL_ACTION && <p>Tool: {(data as ToolActionNodeData).toolName}</p>}
        {data.type === CustomNodeType.CONDITION && <p className="truncate" title={(data as ConditionNodeData).conditionLogic}>Logic: {(data as ConditionNodeData).conditionLogic.substring(0,30)}...</p>}
        {data.type === CustomNodeType.END && <p>Message: {(data as EndNodeData).message}</p>}
      </div>
      
      {/* Input Handle (except for Trigger) */}
      {data.type !== CustomNodeType.TRIGGER && (
        <Handle
          type="target"
          position={Position.Left}
          id="input_main"
          className="!bg-slate-500 !w-3 !h-3"
        />
      )}

      {/* Output Handles */}
      {data.type !== CustomNodeType.END && data.type !== CustomNodeType.CONDITION && (
        <Handle
          type="source"
          position={Position.Right}
          id="output_main"
          className="!bg-slate-500 !w-3 !h-3"
        />
      )}
      {data.type === CustomNodeType.CONDITION && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="output_true"
            style={{ top: '35%' }}
            className="!bg-green-500 !w-3 !h-3"
          />
           <Handle
            type="source"
            position={Position.Right}
            id="output_false"
            style={{ top: '65%' }}
            className="!bg-red-500 !w-3 !h-3"
          />
        </>
      )}
    </div>
  );
});

// Specific node components just wrap BaseNode or can be customized further
export const TriggerNode: React.FC<NodeProps<TriggerNodeData>> = (props) => <BaseNode {...props} />;
export const LLMAgentNode: React.FC<NodeProps<LLMAgentNodeData>> = (props) => <BaseNode {...props} />;
export const ToolActionNode: React.FC<NodeProps<ToolActionNodeData>> = (props) => <BaseNode {...props} />;
export const ConditionNode: React.FC<NodeProps<ConditionNodeData>> = (props) => <BaseNode {...props} />;
export const EndNode: React.FC<NodeProps<EndNodeData>> = (props) => <BaseNode {...props} />;

    