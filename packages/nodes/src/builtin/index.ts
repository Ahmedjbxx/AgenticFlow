// Built-in node plugins
export { HttpRequestNodePlugin } from './HttpRequestNodePlugin.js';
export { LLMAgentNodePlugin } from './LLMAgentNodePlugin.js';
export { EndNodePlugin } from './EndNodePlugin.js';
export { TriggerNodePlugin } from './TriggerNodePlugin.js';
export { ConditionNodePlugin } from './ConditionNodePlugin.js';
export { DataTransformNodePlugin } from './DataTransformNodePlugin.js';
export { DelayNodePlugin } from './DelayNodePlugin.js';
export { SwitchNodePlugin } from './SwitchNodePlugin.js';
export { LoopNodePlugin } from './LoopNodePlugin.js';
export { RealNumbersNodePlugin } from './RealNumbersNodePlugin.js';
export { StringNodePlugin } from './StringNodePlugin.js';
export { MathNodePlugin } from './MathNodePlugin.js';

// All 9 core built-in nodes have been successfully migrated! 🎉
// Plus our new testing nodes: RealNumbersNodePlugin, StringNodePlugin, MathNodePlugin

// Import all plugins for registration
import { HttpRequestNodePlugin } from './HttpRequestNodePlugin.js';
import { LLMAgentNodePlugin } from './LLMAgentNodePlugin.js';
import { EndNodePlugin } from './EndNodePlugin.js';
import { TriggerNodePlugin } from './TriggerNodePlugin.js';
import { ConditionNodePlugin } from './ConditionNodePlugin.js';
import { DataTransformNodePlugin } from './DataTransformNodePlugin.js';
import { DelayNodePlugin } from './DelayNodePlugin.js';
import { SwitchNodePlugin } from './SwitchNodePlugin.js';
import { LoopNodePlugin } from './LoopNodePlugin.js';
import { RealNumbersNodePlugin } from './RealNumbersNodePlugin.js';
import { StringNodePlugin } from './StringNodePlugin.js';
import { MathNodePlugin } from './MathNodePlugin.js';

/**
 * Register all built-in node plugins with the provided registry
 */
export function registerBuiltInPlugins(registry: { register: (plugin: any) => void }): void {
  // Register all built-in plugins
  registry.register(new HttpRequestNodePlugin());
  registry.register(new LLMAgentNodePlugin());
  registry.register(new EndNodePlugin());
  registry.register(new TriggerNodePlugin());
  registry.register(new ConditionNodePlugin());
  registry.register(new DataTransformNodePlugin());
  registry.register(new DelayNodePlugin());
  registry.register(new SwitchNodePlugin());
  registry.register(new LoopNodePlugin());
  registry.register(new RealNumbersNodePlugin());
  registry.register(new StringNodePlugin());
  registry.register(new MathNodePlugin());
}

// More nodes will be exported here as they are added
// export { SwitchNodePlugin } from './SwitchNodePlugin.js';
// export { LoopNodePlugin } from './LoopNodePlugin.js'; 