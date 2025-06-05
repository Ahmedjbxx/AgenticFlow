# Node Styling Troubleshooting Guide

## Overview

This guide helps you troubleshoot and fix styling issues for nodes in AgenticFlow. When a node appears as a plain white box without proper coloring, icons, or styling, follow this checklist.

## Common Symptoms

- ✅ Node functionality works (can be added, configured, executed)
- ❌ Node appears as plain white box without proper styling
- ❌ Node lacks proper icon
- ❌ Node doesn't have the expected background color
- ❌ React Flow console error: `Node type "nodeTypeName" not found. Using fallback type "default"`

## Root Cause Analysis

Node styling in AgenticFlow requires coordination between **multiple systems**:

1. **Frontend UI System** (old system) - handles visual appearance
2. **Plugin System** (new monorepo) - handles functionality
3. **React Flow Integration** - connects plugins to UI components

The issue typically occurs when a node is properly defined in the plugin system but missing from the frontend styling configuration.

---

## Step-by-Step Fix Process

### Step 1: Verify Plugin System (New Monorepo)

First, ensure the node plugin is properly defined:

#### 1.1 Check Node Plugin Implementation
**Location**: `packages/nodes/src/builtin/[NodeName]Plugin.ts`

```typescript
// ✅ Plugin should be properly implemented
export class YourNodePlugin extends NodePlugin<YourNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'yourNodeType',        // ⚠️ Remember this type name
    name: 'Your Node',
    color: 'bg-blue-500',        // ⚠️ This color should match frontend
    // ... other metadata
  };
  // ... implementation
}
```

#### 1.2 Check Type Definition
**Location**: `packages/types/src/nodes.ts`

```typescript
// ✅ Ensure your node type is in the enum
export enum CustomNodeType {
  // ... existing types
  YOUR_NODE = 'yourNodeType',    // ⚠️ Must match plugin metadata.type
}

// ✅ Ensure your node data interface exists
export interface YourNodeData extends BaseNodeData {
  type: CustomNodeType.YOUR_NODE;
  // ... your node specific properties
}

// ✅ Ensure it's in the union type
export type NodeData = 
  | TriggerNodeData 
  | LLMAgentNodeData
  // ... other types
  | YourNodeData;                // ⚠️ Add your node data here
```

#### 1.3 Check Plugin Export
**Location**: `packages/nodes/src/builtin/index.ts`

```typescript
// ✅ Ensure your plugin is exported
export { YourNodePlugin } from './YourNodePlugin.js';
```

### Step 2: Fix Frontend Styling (Old System)

The frontend system needs to be updated to recognize and style your node.

#### 2.1 Add to Constants
**Location**: `constants.ts`

```typescript
// ✅ Add your node to NODE_TYPE_META
export const NODE_TYPE_META = {
  'triggerNode': { name: 'Trigger', color: 'bg-sky-500', icon: 'TriggerIcon' },
  // ... existing nodes
  'yourNodeType': { name: 'Your Node', color: 'bg-blue-500', icon: 'YourIcon' },
  //     ↑ Must match plugin type    ↑ Should match plugin color  ↑ Icon name
};
```

#### 2.2 Create Node Icon
**Location**: `components/icons/NodeIcons.tsx`

```typescript
// ✅ Add your node icon
export const YourIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    {/* Your SVG path here */}
    <path strokeLinecap="round" strokeLinejoin="round" d="..." />
  </svg>
);
```

#### 2.3 Add to Icon Mapping
**Location**: `components/flow/CustomNodes.tsx`

```typescript
// ✅ Add to iconMap
const iconMap: Record<string, React.FC<{ className?: string }>> = {
  [CustomNodeType.TRIGGER]: TriggerIcon,
  // ... existing mappings
  'yourNodeType': YourIcon,  // ⚠️ Use string literal, not enum
};

// ✅ Add node-specific rendering logic in BaseNode component
{data.type === 'yourNodeType' && <p>Your custom content: {(data as YourNodeData).yourProperty}</p>}

// ✅ Export your node component
export const YourNode: React.FC<NodeProps<YourNodeData>> = (props) => <BaseNode {...props} />;
```

#### 2.4 Register with React Flow
**Location**: `components/flow/FlowBuilder.tsx`

```typescript
// ✅ Import your node component
import {
  TriggerNode,
  // ... other nodes
  YourNode,
} from './CustomNodes';

// ✅ Add to nodeTypes mapping
const nodeTypes = useMemo(() => {
  return {
    'triggerNode': TriggerNode,
    // ... existing mappings
    'yourNodeType': YourNode,  // ⚠️ Key must match plugin type
  };
}, []);
```

#### 2.5 Add Color Mapping for Variable Picker
**Location**: `components/flow/VariablePicker.tsx`

```typescript
const getNodeTypeColor = (nodeType: string) => {
  const colors: Record<string, string> = {
    'llmAgentNode': 'bg-purple-100 text-purple-800',
    // ... existing colors
    'yourNodeType': 'bg-blue-100 text-blue-800',  // ⚠️ Lighter version of main color
  };
  return colors[nodeType] || 'bg-gray-100 text-gray-800';
};
```

### Step 3: Build and Test

#### 3.1 Build Packages
```powershell
# From project root
pnpm build --filter=@agenticflow/types
pnpm build --filter=@agenticflow/nodes
```

#### 3.2 Verify Frontend Compilation
```powershell
# Check for TypeScript errors
pnpm dev
```

#### 3.3 Test in Browser
1. ✅ Node should appear with proper color and icon
2. ✅ No React Flow console errors
3. ✅ Node should be selectable and editable

---

## Common Issues and Solutions

### Issue 1: TypeScript Errors with Enum Usage

**Error**: `'CustomNodeType' cannot be used as a value because it was exported using 'export type'.`

**Solution**: Use string literals instead of enum values in certain contexts:

```typescript
// ❌ Wrong
const nodeTypes = {
  [CustomNodeType.YOUR_NODE]: YourNode,
};

// ✅ Correct  
const nodeTypes = {
  'yourNodeType': YourNode,
};
```

### Issue 2: React Flow "Node type not found" Error

**Error**: `Node type "yourNodeType" not found. Using fallback type "default"`

**Root Cause**: Node type is not registered in the `nodeTypes` object in `FlowBuilder.tsx`

**Solution**: Follow Step 2.4 above.

### Issue 3: Node Shows Wrong Color

**Root Cause**: Color mismatch between plugin metadata and frontend constants

**Solution**: Ensure colors match in:
- `packages/nodes/src/builtin/YourNodePlugin.ts` → `metadata.color`
- `constants.ts` → `NODE_TYPE_META['yourNodeType'].color`

### Issue 4: Icon Not Displaying

**Root Cause**: Icon not properly imported or mapped

**Solution**: 
1. Verify icon exists in `NodeIcons.tsx`
2. Check import in `CustomNodes.tsx`
3. Verify mapping in `iconMap` object

---

## Prevention Checklist

When adding a new node type, use this checklist to avoid styling issues:

### Plugin System (New Monorepo)
- [ ] Plugin implemented in `packages/nodes/src/builtin/`
- [ ] Type added to `CustomNodeType` enum in `packages/types/src/nodes.ts`
- [ ] Data interface created and added to union type
- [ ] Plugin exported from `packages/nodes/src/builtin/index.ts`
- [ ] Packages built successfully

### Frontend System (Old System)
- [ ] Node added to `NODE_TYPE_META` in `constants.ts`
- [ ] Icon created in `components/icons/NodeIcons.tsx`
- [ ] Icon imported and mapped in `components/flow/CustomNodes.tsx`
- [ ] Node-specific rendering logic added to `BaseNode`
- [ ] Node component exported from `CustomNodes.tsx`
- [ ] Node registered in `nodeTypes` in `FlowBuilder.tsx`
- [ ] Color mapping added to `VariablePicker.tsx`

### Testing
- [ ] TypeScript compilation passes
- [ ] No React Flow console errors
- [ ] Node displays with proper color and icon
- [ ] Node is selectable and editable

---

## Example: Complete Implementation

Here's a complete example for adding a "Timer" node:

**1. Plugin**: `packages/nodes/src/builtin/TimerNodePlugin.ts`
```typescript
export class TimerNodePlugin extends NodePlugin<TimerNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'timerNode',
    name: 'Timer',
    color: 'bg-orange-500',
    // ... rest of metadata
  };
  // ... implementation
}
```

**2. Types**: `packages/types/src/nodes.ts`
```typescript
export enum CustomNodeType {
  TIMER = 'timerNode',
}

export interface TimerNodeData extends BaseNodeData {
  type: CustomNodeType.TIMER;
  duration: number;
}
```

**3. Constants**: `constants.ts`
```typescript
export const NODE_TYPE_META = {
  'timerNode': { name: 'Timer', color: 'bg-orange-500', icon: 'TimerIcon' },
};
```

**4. Icon**: `components/icons/NodeIcons.tsx`
```typescript
export const TimerIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className || "w-6 h-6"}>
    <path d="..." />
  </svg>
);
```

**5. CustomNodes**: `components/flow/CustomNodes.tsx`
```typescript
import { TimerIcon } from '../icons/NodeIcons';

const iconMap = {
  'timerNode': TimerIcon,
};

// In BaseNode component:
{data.type === 'timerNode' && <p>Duration: {(data as TimerNodeData).duration}s</p>}

export const TimerNode: React.FC<NodeProps<TimerNodeData>> = (props) => <BaseNode {...props} />;
```

**6. FlowBuilder**: `components/flow/FlowBuilder.tsx`
```typescript
import { TimerNode } from './CustomNodes';

const nodeTypes = useMemo(() => ({
  'timerNode': TimerNode,
}), []);
```

**7. VariablePicker**: `components/flow/VariablePicker.tsx`
```typescript
const colors = {
  'timerNode': 'bg-orange-100 text-orange-800',
};
```

---

## Related Files Reference

### Core Files for Node Styling
- `constants.ts` - Node metadata and colors
- `components/flow/CustomNodes.tsx` - Node components and icon mapping
- `components/flow/FlowBuilder.tsx` - React Flow integration
- `components/icons/NodeIcons.tsx` - Icon definitions
- `components/flow/VariablePicker.tsx` - Variable picker colors

### Plugin System Files
- `packages/types/src/nodes.ts` - Type definitions
- `packages/nodes/src/builtin/[NodeName]Plugin.ts` - Plugin implementation
- `packages/nodes/src/builtin/index.ts` - Plugin exports

### Build Files
- `packages/types/package.json` - Types package configuration
- `packages/nodes/package.json` - Nodes package configuration
- `turbo.json` - Build orchestration

---

## Additional Notes

- **Hybrid Architecture**: AgenticFlow currently uses both old (frontend styling) and new (plugin functionality) systems
- **Migration**: Eventually, the frontend should be migrated to use the new monorepo packages completely
- **Testing**: Always test both visual appearance and functional behavior
- **Consistency**: Keep colors and naming consistent between systems

This troubleshooting guide should help you quickly identify and fix node styling issues in the future! 