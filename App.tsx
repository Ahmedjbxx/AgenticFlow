import React from 'react';
import FlowBuilder from './components/flow/FlowBuilder';

const App: React.FC = () => {
  console.log('🔍 SYSTEM CHECK: Running from ROOT App.tsx - OLD ENHANCED SYSTEM');
  
  return (
    <div className="h-screen w-screen flex flex-col antialiased text-slate-800">
      <header className="bg-slate-800 text-white p-4 shadow-md z-20">
        <h1 className="text-2xl font-semibold">Universal Agentic Automation System</h1>
        <div className="text-sm text-yellow-300 mt-1">
          🔍 OLD ENHANCED SYSTEM (Root App.tsx)
        </div>
      </header>
      <main className="flex-grow relative">
        <FlowBuilder />
      </main>
    </div>
  );
};

export default App;
    