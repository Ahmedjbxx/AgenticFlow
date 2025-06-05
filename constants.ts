export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';
export const IMAGEN_MODEL_NAME = 'imagen-3.0-generate-002';

export const NODE_TYPE_META = {
  'triggerNode': { name: 'Trigger', color: 'bg-sky-500', icon: 'TriggerIcon' },
  'llmAgentNode': { name: 'LLM Agent', color: 'bg-purple-500', icon: 'LLMIcon' },
  'toolActionNode': { name: 'Tool Action', color: 'bg-amber-500', icon: 'ToolIcon' },
  'conditionNode': { name: 'Condition', color: 'bg-orange-500', icon: 'ConditionIcon' },
  'endNode': { name: 'End', color: 'bg-red-500', icon: 'EndIcon' },
  'loopNode': { name: 'Loop', color: 'bg-indigo-500', icon: 'LoopIcon' },
  'httpRequestNode': { name: 'HTTP Request', color: 'bg-teal-500', icon: 'HttpIcon' },
  'dataTransformNode': { name: 'Data Transform', color: 'bg-cyan-500', icon: 'TransformIcon' },
  'delayNode': { name: 'Delay', color: 'bg-rose-500', icon: 'DelayIcon' },
  'switchNode': { name: 'Switch', color: 'bg-violet-500', icon: 'SwitchIcon' },
  'realNumbersNode': { name: 'Real Numbers', color: 'bg-blue-500', icon: 'NumberIcon' },
  'stringNode': { name: 'String', color: 'bg-green-500', icon: 'StringIcon' },
  'mathNode': { name: 'Math Node', color: 'bg-emerald-500', icon: 'MathIcon' },
};

export const INITIAL_PROMPT_SUGGESTION = "Summarize the following text: {input.text}";
    