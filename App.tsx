import React from 'react';
import FlowBuilder from './components/flow/FlowBuilder';

const App: React.FC = () => {
  console.log('🚀 SYSTEM CHECK: Running from ROOT App.tsx - HYBRID SYSTEM (FlowBuilder + Monorepo Packages)');
  
  return (
    <div className="h-screen w-screen flex flex-col antialiased text-slate-800">
      <header className="bg-slate-800 text-white p-4 shadow-md z-20">
        <h1 className="text-2xl font-semibold">Universal Agentic Automation System</h1>
        <div className="text-sm text-blue-300 mt-1">
          🚀 HYBRID SYSTEM (FlowBuilder + Monorepo Ready)
        </div>
      </header>
      <main className="flex-grow relative">
        <FlowBuilder />
      </main>
    </div>
  );
};

export default App;
    