# Complete Guide: How to Create Any Node in AgenticFlow

**Based on Reverse Engineering the RealNumbers Node Implementation**

This guide provides a complete blueprint for creating new nodes in AgenticFlow, based on analyzing all files touched during the RealNumbers node implementation.

---

## 📋 Overview

AgenticFlow uses a **hybrid architecture** where:
- **New Monorepo System** (`packages/`) handles functionality 
- **Old Frontend System** handles styling and UI
- **Both systems must be updated** for a node to work properly

---

## 🏗️ Architecture Pattern

### File Structure Analysis
```
📁 AgenticFlow Project Root
├── 📁 packages/                           # NEW MONOREPO SYSTEM
│   ├── 📁 types/src/nodes.ts             # Type definitions
│   └── 📁 nodes/src/builtin/             # Plugin implementations
│       ├── YourNodePlugin.ts             # ← Main plugin file
│       └── index.ts                      # ← Export registration
├── 📁 components/                         # OLD FRONTEND SYSTEM  
│   ├── 📁 flow/
│   │   ├── CustomNodes.tsx               # ← Node components
│   │   ├── FlowBuilder.tsx               # ← React Flow integration
│   │   └── VariablePicker.tsx            # ← Variable picker colors
│   └── 📁 icons/NodeIcons.tsx            # ← Icon definitions
├── constants.ts                          # ← Node metadata & colors
└── types.ts                             # ← Old type definitions
```

---

## 🎯 Complete Implementation Checklist

### Phase 1: New Monorepo System (Functionality)

#### 1.1 Create Type Definition
**File**: `packages/types/src/nodes.ts`

```typescript
// Add to CustomNodeType enum
export enum CustomNodeType {
  // ... existing types
  YOUR_NODE = 'yourNodeType',
}

// Create your node data interface
export interface YourNodeData extends BaseNodeData {
  type: CustomNodeType.YOUR_NODE;
  yourProperty1: string;
  yourProperty2: number;
  // ... your custom properties
}

// Add to union type
export type NodeData = 
  | TriggerNodeData 
  | LLMAgentNodeData
  // ... other types
  | YourNodeData;
```

#### 1.2 Create Plugin Implementation
**File**: `packages/nodes/src/builtin/YourNodePlugin.ts`

```typescript
import React from 'react';
import { NodePlugin, NodePluginMetadata, NodeEditorContext } from '../base/NodePlugin.js';
import { ExecutionContext, VariableDefinition } from '@agenticflow/core';
import { YourNodeData } from '@agenticflow/types';

export class YourNodePlugin extends NodePlugin<YourNodeData> {
  readonly metadata: NodePluginMetadata = {
    type: 'yourNodeType',                    // ⚠️ Must match enum value
    name: 'Your Node Name',
    description: 'Description of what your node does',
    version: '1.0.0',
    category: 'utility',                     // or 'action', 'trigger', etc.
    icon: 'YourIcon',                       // ⚠️ Must match icon name
    color: 'bg-purple-500',                 // ⚠️ Tailwind color class
    tags: ['tag1', 'tag2', 'tag3'],
    author: 'Your Name',
    documentation: 'https://docs.example.com',
  };

  createDefaultData(): YourNodeData {
    return {
      id: '',
      type: 'yourNodeType' as any,          // ⚠️ String literal for compatibility
      label: 'Your Node Name',
      yourProperty1: 'default value',
      yourProperty2: 42,
    };
  }

  getOutputSchema(): VariableDefinition[] {
    return [
      {
        name: 'outputVar1',
        type: 'string',
        description: 'Description of output variable',
        example: 'example value'
      },
      {
        name: 'outputVar2',
        type: 'number',
        description: 'Another output variable',
        example: 123
      }
    ];
  }

  async execute(input: any, data: YourNodeData, context: ExecutionContext): Promise<any> {
    const { logger } = context.services;
    
    logger?.info('Executing your node...');

    try {
      // Your node logic here
      const result = this.processData(data, input);
      
      const output = {
        ...input,
        outputVar1: result.value1,
        outputVar2: result.value2,
        processedAt: new Date().toISOString(),
        nodeType: 'yourNodeType',
      };

      logger?.info(`Node executed successfully`);
      return output;

    } catch (error: any) {
      logger?.error(`Node execution failed: ${error.message}`, error);
      
      return {
        ...input,
        error: error.message,
        outputVar1: '',
        outputVar2: 0,
        processedAt: new Date().toISOString(),
      };
    }
  }

  private processData(data: YourNodeData, input: any): any {
    // Your custom processing logic
    return {
      value1: `Processed: ${data.yourProperty1}`,
      value2: data.yourProperty2 * 2
    };
  }

  renderEditor(data: YourNodeData, onChange: (data: YourNodeData) => void, context?: NodeEditorContext): React.ReactNode {
    return React.createElement('div', { className: 'space-y-4' }, [
      // Property 1 input
      React.createElement('div', { key: 'property1' }, [
        React.createElement('label', {
          key: 'property1-label',
          htmlFor: 'yourProperty1',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Property 1'),
        React.createElement('input', {
          key: 'property1-input',
          type: 'text',
          id: 'yourProperty1',
          value: data.yourProperty1,
          onChange: (e: any) => onChange({ ...data, yourProperty1: e.target.value }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
        })
      ]),
      
      // Property 2 input
      React.createElement('div', { key: 'property2' }, [
        React.createElement('label', {
          key: 'property2-label',
          htmlFor: 'yourProperty2',
          className: 'block text-sm font-medium text-slate-700'
        }, 'Property 2'),
        React.createElement('input', {
          key: 'property2-input',
          type: 'number',
          id: 'yourProperty2',
          value: data.yourProperty2,
          onChange: (e: any) => onChange({ ...data, yourProperty2: parseInt(e.target.value) || 0 }),
          className: 'mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
        })
      ])
    ]);
  }

  renderNode(data: YourNodeData): React.ReactNode {
    return React.createElement('div', { className: 'text-xs' },
      React.createElement('p', { className: 'font-medium' }, '🎯 Your Node'),
      React.createElement('p', { className: 'text-slate-600' }, 
        `${data.yourProperty1}: ${data.yourProperty2}`
      )
    );
  }
}
```

#### 1.3 Register Plugin
**File**: `packages/nodes/src/builtin/index.ts`

```typescript
// Add export
export { YourNodePlugin } from './YourNodePlugin.js';

// Add import to registerBuiltinNodes function
import { YourNodePlugin } from './YourNodePlugin.js';

// Add registration
export function registerBuiltinNodes(registry: NodeRegistry): void {
  // ... existing registrations
  registry.register(new YourNodePlugin());
}
```

#### 1.4 Build Packages
```powershell
pnpm build --filter=@agenticflow/types
pnpm build --filter=@agenticflow/nodes
```

### Phase 2: Old Frontend System (Styling & UI)

#### 2.1 Update Old Types (Temporary Compatibility)
**File**: `types.ts`

```typescript
export enum CustomNodeType {
  // ... existing types
  YOUR_NODE = 'yourNodeType',
}

export interface YourNodeData extends BaseNodeData {
  type: CustomNodeType.YOUR_NODE;
  yourProperty1: string;
  yourProperty2: number;
}

export type NodeData = 
  | TriggerNodeData 
  | LLMAgentNodeData
  // ... other types
  | YourNodeData;
```

#### 2.2 Add Node Metadata & Colors
**File**: `constants.ts`

```typescript
export const NODE_TYPE_META = {
  'triggerNode': { name: 'Trigger', color: 'bg-sky-500', icon: 'TriggerIcon' },
  // ... existing nodes
  'yourNodeType': { name: 'Your Node Name', color: 'bg-purple-500', icon: 'YourIcon' },
  //      ↑ Must match plugin type           ↑ Must match plugin color    ↑ Icon name
};
```

#### 2.3 Create Icon
**File**: `components/icons/NodeIcons.tsx`

```typescript
export const YourIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="YOUR_SVG_PATH_HERE" />
  </svg>
);
```

#### 2.4 Register Node Component
**File**: `components/flow/CustomNodes.tsx`

```typescript
// Add imports
import { YourNodeData } from '../../types';
import { YourIcon } from '../icons/NodeIcons';

// Add to iconMap
const iconMap: Record<string, React.FC<{ className?: string }>> = {
  [CustomNodeType.TRIGGER]: TriggerIcon,
  // ... existing mappings
  [CustomNodeType.YOUR_NODE]: YourIcon,
};

// Add rendering logic in BaseNode component
{data.type === CustomNodeType.YOUR_NODE && <p>🎯 Your Node: {(data as YourNodeData).yourProperty1}</p>}

// Export component
export const YourNode: React.FC<NodeProps<YourNodeData>> = (props) => <BaseNode {...props} />;
```

#### 2.5 Register with React Flow
**File**: `components/flow/FlowBuilder.tsx`

```typescript
// Add import
import {
  TriggerNode,
  // ... other nodes
  YourNode,
} from './CustomNodes';

// Add to nodeTypes
const nodeTypes = useMemo(() => {
  return {
    'triggerNode': TriggerNode,
    // ... existing mappings
    'yourNodeType': YourNode,  // ⚠️ Key must match plugin type
  };
}, []);
```

#### 2.6 Add Variable Picker Colors
**File**: `components/flow/VariablePicker.tsx`

```typescript
const getNodeTypeColor = (nodeType: string) => {
  const colors: Record<string, string> = {
    'llmAgentNode': 'bg-purple-100 text-purple-800',
    // ... existing colors
    'yourNodeType': 'bg-purple-100 text-purple-800',  // ⚠️ Lighter version of main color
  };
  return colors[nodeType] || 'bg-gray-100 text-gray-800';
};
```

---

## 📊 Real Numbers Node Analysis

### Files Modified (12 total)

#### New Monorepo System (4 files)
1. **`packages/types/src/nodes.ts`** - Type definitions
2. **`packages/nodes/src/builtin/RealNumbersNodePlugin.ts`** - Main plugin
3. **`packages/nodes/src/builtin/index.ts`** - Plugin registration
4. **Build system** - Package compilation

#### Old Frontend System (8 files)
5. **`types.ts`** - Old type definitions (compatibility)
6. **`constants.ts`** - Node metadata and colors
7. **`components/icons/NodeIcons.tsx`** - Icon definition
8. **`components/flow/CustomNodes.tsx`** - Node component & icon mapping
9. **`components/flow/FlowBuilder.tsx`** - React Flow integration
10. **`components/flow/VariablePicker.tsx`** - Variable picker colors
11. **`packages/editor/src/components/CustomNodes.tsx`** - Editor-specific (if using new editor)
12. **Dependencies** - Package.json updates

### Key Implementation Insights

1. **Type Consistency**: Both old and new type systems must have identical interfaces
2. **String Literals**: Use `'yourNodeType'` strings in frontend, not enum values
3. **Color Coordination**: Plugin color must match frontend constants
4. **Icon Chain**: Icon name in plugin → icon implementation → icon mapping → component import
5. **Build Dependencies**: New packages must build before frontend can use them

---

## 🔧 Common Patterns & Best Practices

### Naming Conventions
```typescript
// Plugin file: YourNodePlugin.ts
// Plugin class: YourNodePlugin  
// Node type: 'yourNodeType' (camelCase)
// Enum value: YOUR_NODE (UPPER_SNAKE_CASE)
// Interface: YourNodeData
// Component: YourNode
// Icon: YourIcon
```

### Error Handling Pattern
```typescript
async execute(input: any, data: YourNodeData, context: ExecutionContext): Promise<any> {
  try {
    // Main logic
    return successOutput;
  } catch (error: any) {
    // Always return structured error output
    return {
      ...input,
      error: error.message,
      // ... default values for your outputs
    };
  }
}
```

### Editor Rendering Pattern
```typescript
renderEditor(data: YourNodeData, onChange: (data: YourNodeData) => void): React.ReactNode {
  return React.createElement('div', { className: 'space-y-4' }, [
    // Always use React.createElement for compatibility
    // Always provide keys for arrays
    // Always handle onChange with spread operator: { ...data, property: newValue }
  ]);
}
```

---

## 🚨 Critical Success Factors

### Must-Do Items
- [ ] **Consistent Type Names**: Same interface in both type systems
- [ ] **Color Matching**: Plugin metadata color = constants color
- [ ] **Icon Chain**: Plugin icon name → icon implementation → mapping → import
- [ ] **React Flow Registration**: Node type in nodeTypes object
- [ ] **Build Order**: Types → Nodes → Frontend
- [ ] **String Literals**: Use strings, not enums, in frontend mappings

### Common Pitfalls
- ❌ Using enum values in frontend (causes TypeScript errors)
- ❌ Mismatched colors between plugin and constants
- ❌ Missing icon in the mapping chain
- ❌ Forgetting to add to union types
- ❌ Not building packages before testing
- ❌ Missing React Flow nodeTypes registration

---

## 🎯 Quick Reference Template

### Minimum Required Files (6 core files)
1. `packages/types/src/nodes.ts` - Add enum, interface, union type
2. `packages/nodes/src/builtin/YourNodePlugin.ts` - Main implementation
3. `packages/nodes/src/builtin/index.ts` - Export & register
4. `constants.ts` - Metadata & color
5. `components/icons/NodeIcons.tsx` - Icon
6. `components/flow/CustomNodes.tsx` - Component & mapping

### Build & Test Commands
```powershell
# Build packages
pnpm build --filter=@agenticflow/types
pnpm build --filter=@agenticflow/nodes

# Test frontend
pnpm dev

# Verify no errors
# ✅ TypeScript compilation passes
# ✅ No React Flow console errors  
# ✅ Node appears with proper styling
# ✅ Node can be added, configured, executed
```

---

## 📈 Success Metrics

A properly implemented node should:

✅ **Functionality**: Execute without errors, produce expected outputs  
✅ **Styling**: Appear with correct color, icon, and layout  
✅ **Integration**: Work with React Flow, variable picker, execution logs  
✅ **Consistency**: Follow same patterns as existing nodes  
✅ **Type Safety**: No TypeScript errors or `any` types  

---

This complete blueprint ensures any new node will integrate seamlessly with AgenticFlow's hybrid architecture! 🚀 