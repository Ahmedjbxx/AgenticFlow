# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

I understand you want me to scan and analyze the project structure to get an overview of what's in your workspace. Let me explore the codebase to understand what kind of project this is and provide you with a comprehensive summary.

Ran tool

Read file: package.json

Read file: README.md

Read file: metadata.json

Ran tool

Ran tool

Ran tool

Read file: App.tsx

Read file: types.ts

Ran tool

Ran tool
## Project Scan Summary

I understand you want me to scan and analyze your project. Based on my exploration, here's what I found:

**What I understood:** You have a **Universal Agentic Automation System** - a React-based web application that provides a visual flow builder for creating automated workflows with AI integration.

### Project Overview:
- **Type**: React + TypeScript web application using Vite
- **Purpose**: Building, visualizing, and executing automated workflows using a visual flow builder
- **AI Integration**: Uses Google's Gemini API for intelligent task processing

### Technology Stack:
- **Frontend**: React 19.1.0 + TypeScript
- **Flow Visualization**: ReactFlow library for the visual workflow builder
- **AI Service**: Google GenAI (@google/genai)
- **Build Tool**: Vite
- **Styling**: Appears to use Tailwind CSS classes

### Project Structure:
```
📁 Root
├── 📄 App.tsx - Main application component
├── 📄 types.ts - TypeScript definitions for workflow nodes and data structures
├── 📄 constants.ts - Application constants
├── 📁 components/
│   ├── 📁 flow/ - Visual flow builder components
│   │   ├── FlowBuilder.tsx - Main flow builder interface
│   │   ├── CustomNodes.tsx - Custom node types (Trigger, LLM Agent, Tool Action, etc.)
│   │   ├── NodeEditorPanel.tsx - Node configuration panel
│   │   └── ExecutionLogView.tsx - Execution monitoring
│   └── 📁 icons/ - Icon components
├── 📁 services/
│   ├── geminiService.ts - Google Gemini API integration
│   └── mockFlowExecutor.ts - Flow execution engine
└── 📁 utils/
    └── templates.ts - Predefined workflow templates
```

### Key Features (Based on Code Structure):
1. **Visual Flow Builder** - Drag-and-drop workflow creation
2. **Multiple Node Types**:
   - Trigger nodes (workflow starters)
   - LLM Agent nodes (AI processing)
   - Tool Action nodes (external integrations)
   - Condition nodes (decision logic)
   - End nodes (workflow completion)
3. **AI Integration** - Gemini API for intelligent processing
4. **Execution Engine** - Can run and monitor workflows
5. **Template System** - Predefined workflow templates

Is this what you meant by "scan the project"? Would you like me to dive deeper into any specific aspect, such as the flow builder functionality, AI integration, or any particular component?
