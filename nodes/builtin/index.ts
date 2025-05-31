// Built-in node plugin exports
export { HttpRequestNodePlugin } from './HttpRequestNodePlugin';
export { TriggerNodePlugin } from './TriggerNodePlugin';
export { LLMAgentNodePlugin } from './LLMAgentNodePlugin';
export { ConditionNodePlugin } from './ConditionNodePlugin';
export { EndNodePlugin } from './EndNodePlugin';
export { LoopNodePlugin } from './LoopNodePlugin';
export { DataTransformNodePlugin } from './DataTransformNodePlugin';
export { DelayNodePlugin } from './DelayNodePlugin';
export { SwitchNodePlugin } from './SwitchNodePlugin';

// Auto-registration helper
import { NodePlugin } from '../base/NodePlugin';
import { HttpRequestNodePlugin } from './HttpRequestNodePlugin';
import { TriggerNodePlugin } from './TriggerNodePlugin';
import { LLMAgentNodePlugin } from './LLMAgentNodePlugin';
import { ConditionNodePlugin } from './ConditionNodePlugin';
import { EndNodePlugin } from './EndNodePlugin';
import { LoopNodePlugin } from './LoopNodePlugin';
import { DataTransformNodePlugin } from './DataTransformNodePlugin';
import { DelayNodePlugin } from './DelayNodePlugin';
import { SwitchNodePlugin } from './SwitchNodePlugin';

/**
 * Get all built-in node plugins
 */
export function getBuiltInNodePlugins(): NodePlugin[] {
  return [
    new TriggerNodePlugin(),
    new LLMAgentNodePlugin(),
    new HttpRequestNodePlugin(),
    new ConditionNodePlugin(),
    new EndNodePlugin(),
    new LoopNodePlugin(),
    new DataTransformNodePlugin(),
    new DelayNodePlugin(),
    new SwitchNodePlugin(),
  ];
}

/**
 * Register all built-in plugins with a registry
 */
export function registerBuiltInPlugins(registry: { register: (plugin: NodePlugin) => void }): void {
  const plugins = getBuiltInNodePlugins();
  
  plugins.forEach(plugin => {
    try {
      registry.register(plugin);
    } catch (error) {
      console.error(`Failed to register plugin ${plugin.metadata.type}:`, error);
    }
  });
} 