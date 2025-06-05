import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData, CustomNodeType, TriggerNodeData, LLMAgentNodeData, ToolActionNodeData, ConditionNodeData, EndNodeData, LoopNodeData, HttpRequestNodeData, DataTransformNodeData, DelayNodeData, SwitchNodeData, RealNumbersNodeData, StringNodeData, MathNodeData } from '../../types';
import { NODE_TYPE_META } from '../../constants';
import { TriggerIcon, LLMIcon, ToolIcon, ConditionIcon, EndIcon, CogIcon, LoopIcon, HttpIcon, TransformIcon, DelayIcon, SwitchIcon, NumberIcon, StringIcon, MathIcon } from '../icons/NodeIcons';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  [CustomNodeType.TRIGGER]: TriggerIcon,
  [CustomNodeType.LLM_AGENT]: LLMIcon,
  [CustomNodeType.TOOL_ACTION]: ToolIcon,
  [CustomNodeType.CONDITION]: ConditionIcon,
  [CustomNodeType.END]: EndIcon,
  [CustomNodeType.LOOP]: LoopIcon,
  [CustomNodeType.HTTP_REQUEST]: HttpIcon,
  [CustomNodeType.DATA_TRANSFORM]: TransformIcon,
  [CustomNodeType.DELAY]: DelayIcon,
  [CustomNodeType.SWITCH]: SwitchIcon,
  [CustomNodeType.REAL_NUMBERS]: NumberIcon,
  [CustomNodeType.STRING]: StringIcon,
  [CustomNodeType.MATH]: MathIcon,
};

interface BaseNodeProps extends NodeProps<NodeData> {
  // children?: React.ReactNode;
}

const BaseNode: React.FC<BaseNodeProps> = memo(({ data, selected, type /*, children */ }) => {
  const nodeMeta = NODE_TYPE_META[data.type] || { name: data.type, color: 'bg-slate-500', icon: 'CogIcon' };
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
        {data.type === CustomNodeType.LOOP && <p>Iterate: {(data as LoopNodeData).iterateOver}</p>}
        {data.type === CustomNodeType.HTTP_REQUEST && <p>{(data as HttpRequestNodeData).method} {(data as HttpRequestNodeData).url.substring(0,20)}...</p>}
        {data.type === CustomNodeType.DATA_TRANSFORM && <p>Type: {(data as DataTransformNodeData).transformType}</p>}
        {data.type === CustomNodeType.DELAY && <p>Mode: {(data as DelayNodeData).delayType}</p>}
        {data.type === CustomNodeType.SWITCH && <p>Cases: {(data as SwitchNodeData).cases.length}</p>}
        {data.type === CustomNodeType.REAL_NUMBERS && <p>🔢 Real Numbers: {(data as RealNumbersNodeData).minValue} - {(data as RealNumbersNodeData).maxValue}</p>}
        {data.type === CustomNodeType.STRING && <p>📝 String: "{(data as StringNodeData).outputPrefix}..."</p>}
        {data.type === CustomNodeType.MATH && <p>🧮 Math: {(data as MathNodeData).operandA} {(data as MathNodeData).operation} {(data as MathNodeData).operandB}</p>}
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
      {data.type !== CustomNodeType.END && data.type !== CustomNodeType.CONDITION && data.type !== CustomNodeType.SWITCH && (
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
      {data.type === CustomNodeType.SWITCH && (
        <>
          {(data as SwitchNodeData).cases.map((switchCase, index) => (
            <Handle
              key={`switch_${switchCase.value}`}
              type="source"
              position={Position.Right}
              id={`output_${switchCase.value}`}
              style={{ top: `${20 + (index * 60 / (data as SwitchNodeData).cases.length)}%` }}
              className="!bg-blue-500 !w-3 !h-3"
            />
          ))}
          {(data as SwitchNodeData).defaultCase && (
            <Handle
              type="source"
              position={Position.Right}
              id="output_default"
              style={{ top: '80%' }}
              className="!bg-gray-500 !w-3 !h-3"
            />
          )}
        </>
      )}
      {data.type === CustomNodeType.LOOP && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="output_main"
            className="!bg-slate-500 !w-3 !h-3"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="output_loop"
            className="!bg-indigo-500 !w-3 !h-3"
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
export const LoopNode: React.FC<NodeProps<LoopNodeData>> = (props) => <BaseNode {...props} />;
export const HttpRequestNode: React.FC<NodeProps<HttpRequestNodeData>> = (props) => <BaseNode {...props} />;
export const DataTransformNode: React.FC<NodeProps<DataTransformNodeData>> = (props) => <BaseNode {...props} />;
export const DelayNode: React.FC<NodeProps<DelayNodeData>> = (props) => <BaseNode {...props} />;
export const SwitchNode: React.FC<NodeProps<SwitchNodeData>> = (props) => <BaseNode {...props} />;
export const RealNumbersNode: React.FC<NodeProps<RealNumbersNodeData>> = (props) => <BaseNode {...props} />;
export const StringNode: React.FC<NodeProps<StringNodeData>> = (props) => <BaseNode {...props} />;
export const MathNode: React.FC<NodeProps<MathNodeData>> = (props) => <BaseNode {...props} />;

    