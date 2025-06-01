import React from 'react';

interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  data?: any;
  error?: any;
}

interface ExecutionLogViewProps {
  log: LogEntry[];
}

export const ExecutionLogView: React.FC<ExecutionLogViewProps> = ({ log }) => {
  if (log.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-slate-800 text-white p-4 max-h-48 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">Execution Log</h4>
        <span className="text-xs text-slate-400">{log.length} entries</span>
      </div>
      
      <div className="space-y-1">
        {log.map((entry, index) => (
          <div
            key={index}
            className={`text-xs p-2 rounded ${
              entry.level === 'error'
                ? 'bg-red-900 text-red-200'
                : entry.level === 'warn'
                ? 'bg-yellow-900 text-yellow-200'
                : 'bg-slate-700 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono">{entry.timestamp.toLocaleTimeString()}</span>
              <span className={`px-1 py-0.5 rounded text-xs ${
                entry.level === 'error'
                  ? 'bg-red-600'
                  : entry.level === 'warn'
                  ? 'bg-yellow-600'
                  : 'bg-blue-600'
              }`}>
                {entry.level.toUpperCase()}
              </span>
            </div>
            <p className="mt-1">{entry.message}</p>
            {entry.data && (
              <pre className="mt-1 text-xs bg-black bg-opacity-30 p-1 rounded overflow-x-auto">
                {JSON.stringify(entry.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 