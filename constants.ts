
import { CustomNodeType } from './types';

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';
export const IMAGEN_MODEL_NAME = 'imagen-3.0-generate-002';

export const NODE_TYPE_META = {
  [CustomNodeType.TRIGGER]: { name: 'Trigger', color: 'bg-sky-500', icon: 'TriggerIcon' },
  [CustomNodeType.LLM_AGENT]: { name: 'LLM Agent', color: 'bg-purple-500', icon: 'LLMIcon' },
  [CustomNodeType.TOOL_ACTION]: { name: 'Tool Action', color: 'bg-amber-500', icon: 'ToolIcon' },
  [CustomNodeType.CONDITION]: { name: 'Condition', color: 'bg-teal-500', icon: 'ConditionIcon' },
  [CustomNodeType.END]: { name: 'End', color: 'bg-rose-500', icon: 'EndIcon' },
};

export const INITIAL_PROMPT_SUGGESTION = "Summarize the following text: {input.text}";
    