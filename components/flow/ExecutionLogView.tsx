
import React, { useState } from 'react';
import { ExecutionLogEntry } from '../../types';
import { ChevronDownIcon, ChevronUpIcon, InformationCircleIcon, CheckCircleIcon, ExclamationCircleIcon, ClockIcon } from '../icons/EditorIcons';

interface ExecutionLogViewProps {
  log: ExecutionLogEntry[];
}

const StatusIcon: React.FC<{ status: ExecutionLogEntry['status'] }> = ({ status }) => {
  switch (status) {
    case 'processing':
      return <ClockIcon className="w-5 h-5 text-blue-500" />;
    case 'success':
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    case 'error':
      return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
    case 'skipped':
      return <InformationCircleIcon className="w-5 h-5 text-slate-400" />;
    default:
      return null;
  }
};

const ExecutionLogView: React.FC<ExecutionLogViewProps> = ({ log }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-slate-800 text-white shadow-2xl transition-all duration-300 ease-in-out z-10 ${isExpanded ? 'h-64' : 'h-12'}`}>
      <div className="flex justify-between items-center p-3 cursor-pointer border-b border-slate-700" onClick={() => setIsExpanded(!isExpanded)}>
        <h4 className="text-md font-semibold">Execution Log ({log.length} steps)</h4>
        <button>
          {isExpanded ? <ChevronDownIcon className="w-6 h-6" /> : <ChevronUpIcon className="w-6 h-6" />}
        </button>
      </div>
      {isExpanded && (
        <div className="p-3 overflow-y-auto h-[calc(100%-3rem)]">
          {log.length === 0 && <p className="text-slate-400">No execution data yet. Click "Run Flow" to start.</p>}
          <ul className="space-y-2">
            {log.map((entry, index) => (
              <li key={index} className="p-2 bg-slate-700 rounded-md text-sm">
                <div className="flex items-center space-x-2">
                  <StatusIcon status={entry.status} />
                  <span className="font-semibold">{entry.nodeLabel} ({entry.nodeId})</span>
                  <span className="text-slate-400 text-xs">[{new Date(entry.timestamp).toLocaleTimeString()}]</span>
                </div>
                <p className="ml-7 text-slate-300">{entry.message}</p>
                {entry.input && (
                  <details className="ml-7 mt-1 text-xs">
                    <summary className="cursor-pointer text-slate-400">Input Data</summary>
                    <pre className="bg-slate-600 p-1 rounded text-slate-200 max-h-20 overflow-auto">{JSON.stringify(entry.input, null, 2)}</pre>
                  </details>
                )}
                {entry.output && (
                  <details className="ml-7 mt-1 text-xs">
                    <summary className="cursor-pointer text-slate-400">Output Data</summary>
                    <pre className="bg-slate-600 p-1 rounded text-slate-200 max-h-20 overflow-auto">{JSON.stringify(entry.output, null, 2)}</pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExecutionLogView;
    