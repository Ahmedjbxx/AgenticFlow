import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData, CustomNodeType } from '@agenticflow/types';
import { applicationCore } from '@agenticflow/core';

// Temporary icons until we create a proper icons package
const TriggerIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const LLMIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ToolIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ConditionIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const EndIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
  </svg>
);

const LoopIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const HttpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const TransformIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DelayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SwitchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CogIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Icon mapping for different node types
const iconMap: Record<string, React.FC<{ className?: string }>> = {
  'triggerNode': TriggerIcon,
  'llmAgentNode': LLMIcon,
  'toolActionNode': ToolIcon,
  'conditionNode': ConditionIcon,
  'endNode': EndIcon,
  'loopNode': LoopIcon,
  'httpRequestNode': HttpIcon,
  'dataTransformNode': TransformIcon,
  'delayNode': DelayIcon,
  'switchNode': SwitchIcon,
};

interface BaseNodeProps extends NodeProps<NodeData> {
  // Additional props can be added here
}

const BaseNode: React.FC<BaseNodeProps> = memo(({ data, selected, type }) => {
  // Get plugin metadata from the node registry
  const plugin = applicationCore.nodeRegistry.get(data.type);
  const metadata = plugin?.metadata || {
    name: data.type,
    description: 'Unknown node type'
  };

  // Add color property for UI rendering
  const nodeMetadata = {
    ...metadata,
    color: getNodeTypeColor(data.type)
  };

  const IconComponent = iconMap[data.type] || CogIcon;

  // Get node-specific display content from the plugin
  let nodeContent: React.ReactNode = null;
  if (plugin) {
    try {
      nodeContent = plugin.renderNode(data);
    } catch (error) {
      console.error(`Error rendering node content for ${data.type}:`, error);
      nodeContent = <p className="text-xs text-slate-600">Error rendering node</p>;
    }
  }

  // Helper function to get required connections (temporary until plugin interface is updated)
  const getRequiredConnections = (nodeType: string) => {
    switch (nodeType) {
      case 'triggerNode': return { inputs: 0, outputs: 1 };
      case 'endNode': return { inputs: 1, outputs: 0 };
      case 'conditionNode': return { inputs: 1, outputs: 2 };
      case 'switchNode': return { inputs: 1, outputs: 3 }; // Variable outputs
      case 'loopNode': return { inputs: 1, outputs: 2 };
      default: return { inputs: 1, outputs: 1 };
    }
  };

  const requirements = getRequiredConnections(data.type);

  return (
    <div className={`w-52 rounded-lg shadow-md border-2 ${selected ? 'border-blue-500 shadow-blue-300' : 'border-transparent'} ${nodeMetadata.color} text-white overflow-hidden`}>
      <div className={`px-3 py-2 flex items-center space-x-2 ${nodeMetadata.color}`}>
        <IconComponent className="w-5 h-5 text-white" />
        <div className="font-semibold truncate text-sm">{data.label || nodeMetadata.name}</div>
      </div>
      <div className="p-3 bg-white text-slate-700 text-xs min-h-[2rem]">
        {nodeContent || <p className="text-slate-500">No preview available</p>}
      </div>
      
      {/* Input Handle - use requirements for inputs */}
      {requirements.inputs > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          id="input_main"
          className="!bg-slate-500 !w-3 !h-3"
        />
      )}

      {/* Output Handles - use requirements for outputs */}
      {(() => {
        const outputCount = requirements.outputs;
        
        if (outputCount === 1) {
          // Single output
          return (
            <Handle
              type="source"
              position={Position.Right}
              id="output_main"
              className="!bg-slate-500 !w-3 !h-3"
            />
          );
        } else if (outputCount === 2 && data.type === 'conditionNode') {
          // Condition node - true/false outputs
          return (
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
          );
        } else if (outputCount > 2 && data.type === 'switchNode') {
          // Switch node - multiple case outputs
          const switchData = data as any; // Type assertion for switch data
          const cases = switchData.cases || [];
          
          return (
            <>
              {cases.map((switchCase: any, index: number) => (
                <Handle
                  key={`switch_${switchCase.value}`}
                  type="source"
                  position={Position.Right}
                  id={`output_${switchCase.value}`}
                  style={{ top: `${20 + (index * 60 / cases.length)}%` }}
                  className="!bg-blue-500 !w-3 !h-3"
                />
              ))}
              {switchData.defaultCase && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id="output_default"
                  style={{ top: '80%' }}
                  className="!bg-gray-500 !w-3 !h-3"
                />
              )}
            </>
          );
        } else if (data.type === 'loopNode') {
          // Loop node - main output and loop output
          return (
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
          );
        } else if (outputCount > 0) {
          // Generic multiple outputs
          return (
            <>
              {Array.from({ length: outputCount }, (_, index) => (
                <Handle
                  key={`output_${index}`}
                  type="source"
                  position={Position.Right}
                  id={`output_${index}`}
                  style={{ top: `${20 + (index * 60 / outputCount)}%` }}
                  className="!bg-slate-500 !w-3 !h-3"
                />
              ))}
            </>
          );
        }
        
        return null;
      })()}
    </div>
  );
});

// Helper function to get colors for different node types
const getNodeTypeColor = (type: string): string => {
  switch (type) {
    case 'triggerNode': return 'bg-green-500';
    case 'httpRequestNode': return 'bg-blue-500';
    case 'llmAgentNode': return 'bg-purple-500';
    case 'conditionNode': return 'bg-yellow-500';
    case 'switchNode': return 'bg-orange-500';
    case 'loopNode': return 'bg-indigo-500';
    case 'dataTransformNode': return 'bg-pink-500';
    case 'delayNode': return 'bg-gray-500';
    case 'endNode': return 'bg-red-500';
    default: return 'bg-slate-500';
  }
};

// Specific node components that wrap BaseNode
export const TriggerNode: React.FC<NodeProps<any>> = (props) => <BaseNode {...props} />;
export const LLMAgentNode: React.FC<NodeProps<any>> = (props) => <BaseNode {...props} />;
export const ToolActionNode: React.FC<NodeProps<any>> = (props) => <BaseNode {...props} />;
export const ConditionNode: React.FC<NodeProps<any>> = (props) => <BaseNode {...props} />;
export const EndNode: React.FC<NodeProps<any>> = (props) => <BaseNode {...props} />;
export const LoopNode: React.FC<NodeProps<any>> = (props) => <BaseNode {...props} />;
export const HttpRequestNode: React.FC<NodeProps<any>> = (props) => <BaseNode {...props} />;
export const DataTransformNode: React.FC<NodeProps<any>> = (props) => <BaseNode {...props} />;
export const DelayNode: React.FC<NodeProps<any>> = (props) => <BaseNode {...props} />;
export const SwitchNode: React.FC<NodeProps<any>> = (props) => <BaseNode {...props} />;

// Export a utility class for the editor
export class CustomNodes {
  static getNodeTypes() {
    return {
      'triggerNode': TriggerNode,
      'llmAgentNode': LLMAgentNode,
      'toolActionNode': ToolActionNode,
      'conditionNode': ConditionNode,
      'endNode': EndNode,
      'loopNode': LoopNode,
      'httpRequestNode': HttpRequestNode,
      'dataTransformNode': DataTransformNode,
      'delayNode': DelayNode,
      'switchNode': SwitchNode,
    };
  }

  static getNodeComponent(nodeType: string) {
    const nodeTypes = this.getNodeTypes();
    return nodeTypes[nodeType as keyof typeof nodeTypes] || BaseNode;
  }
} 