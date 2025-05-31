import { CustomNodeType } from './types';

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';
export const IMAGEN_MODEL_NAME = 'imagen-3.0-generate-002';

export const NODE_TYPE_META = {
  [CustomNodeType.TRIGGER]: { name: 'Trigger', color: 'bg-sky-500', icon: 'TriggerIcon' },
  [CustomNodeType.LLM_AGENT]: { name: 'LLM Agent', color: 'bg-purple-500', icon: 'LLMIcon' },
  [CustomNodeType.TOOL_ACTION]: { name: 'Tool Action', color: 'bg-amber-500', icon: 'ToolIcon' },
  [CustomNodeType.CONDITION]: { name: 'Condition', color: 'bg-teal-500', icon: 'ConditionIcon' },
  [CustomNodeType.END]: { name: 'End', color: 'bg-rose-500', icon: 'EndIcon' },
  [CustomNodeType.LOOP]: { name: 'Loop', color: 'bg-indigo-500', icon: 'LoopIcon' },
  [CustomNodeType.HTTP_REQUEST]: { name: 'HTTP Request', color: 'bg-green-500', icon: 'HttpIcon' },
  [CustomNodeType.DATA_TRANSFORM]: { name: 'Transform', color: 'bg-orange-500', icon: 'TransformIcon' },
  [CustomNodeType.DELAY]: { name: 'Delay', color: 'bg-gray-500', icon: 'DelayIcon' },
  [CustomNodeType.SWITCH]: { name: 'Switch', color: 'bg-cyan-500', icon: 'SwitchIcon' },
};

export const INITIAL_PROMPT_SUGGESTION = "Summarize the following text: {input.text}";
    