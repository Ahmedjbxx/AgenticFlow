import React, { useState, useRef, useEffect } from 'react';
import { ExecutionLogEntry } from '../../types';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  InformationCircleIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ClockIcon,
  MaximizeIcon,
  MinimizeIcon,
  FilterIcon,
  SearchIcon
} from '../icons/EditorIcons';

interface ExecutionLogViewProps {
  log: ExecutionLogEntry[];
}

// Logger states for progressive disclosure
enum LoggerState {
  HIDDEN = 'hidden',
  DEFAULT = 'default',     // 40% height
  FULLSCREEN = 'fullscreen' // 90% height
}

const StatusIcon: React.FC<{ status: ExecutionLogEntry['status'] }> = ({ status }) => {
  switch (status) {
    case 'processing':
      return <ClockIcon className="w-4 h-4 text-blue-400" />;
    case 'success':
      return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
    case 'error':
      return <ExclamationCircleIcon className="w-4 h-4 text-red-400" />;
    case 'skipped':
      return <InformationCircleIcon className="w-4 h-4 text-slate-400" />;
    default:
      return null;
  }
};

const ExecutionLogView: React.FC<ExecutionLogViewProps> = ({ log }) => {
  const [loggerState, setLoggerState] = useState<LoggerState>(LoggerState.HIDDEN);
  const [activeTab, setActiveTab] = useState<'logs' | 'filters' | 'search'>('logs');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error' | 'processing' | 'skipped'>('all');
  const lastClickTime = useRef<number>(0);
  
  // Handle ESC key to completely close logger
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && loggerState !== LoggerState.HIDDEN) {
        setLoggerState(LoggerState.HIDDEN);
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleEscapeKey);

    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [loggerState]); // Re-run when logger state changes
  
  // Get height based on state
  const getHeight = () => {
    switch (loggerState) {
      case LoggerState.HIDDEN: return 'h-10'; // Just the toggle bar
      case LoggerState.DEFAULT: return 'h-[40vh]'; // 40%
      case LoggerState.FULLSCREEN: return 'h-[90vh]'; // 90%
      default: return 'h-10';
    }
  };

  // Handle header click - simple toggle between Hidden and Default
  const handleHeaderClick = () => {
    const now = Date.now();
    const timeDiff = now - lastClickTime.current;
    
    // Double-click detection (< 300ms) - jump to fullscreen
    if (timeDiff < 300) {
      setLoggerState(LoggerState.FULLSCREEN);
      return;
    }
    
    lastClickTime.current = now;
    
    // Single click - simple toggle between Hidden and Default
    if (loggerState === LoggerState.HIDDEN) {
      setLoggerState(LoggerState.DEFAULT);
    } else {
      setLoggerState(LoggerState.HIDDEN);
    }
  };

  // Handle maximize/minimize toggle
  const handleMaximizeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loggerState === LoggerState.FULLSCREEN) {
      setLoggerState(LoggerState.DEFAULT);
    } else {
      setLoggerState(LoggerState.FULLSCREEN);
    }
  };

  // Handle minimize - always go to hidden
  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoggerState(LoggerState.HIDDEN);
  };

  // Filter logs based on search and status
  const filteredLogs = log.filter(entry => {
    const matchesSearch = searchTerm === '' || 
      entry.nodeLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.nodeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get status counts for filters
  const statusCounts = log.reduce((acc, entry) => {
    acc[entry.status] = (acc[entry.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-slate-800 text-white shadow-2xl transition-all duration-300 ease-in-out z-20 border-t border-slate-600 select-none ${getHeight()}`}>
      
      {/* Header Bar - Always Visible */}
      <div 
        className="flex justify-between items-center p-3 cursor-pointer hover:bg-slate-700/50 transition-colors duration-200 border-b border-slate-600 select-none"
        onClick={handleHeaderClick}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-semibold">Execution Logger</h4>
            <span className="text-xs bg-slate-600 px-2 py-1 rounded-full">
              {filteredLogs.length} / {log.length}
            </span>
          </div>
          
          {/* Status indicators when visible */}
          {loggerState !== LoggerState.HIDDEN && (
            <div className="flex items-center space-x-2 text-xs">
              {statusCounts.success && (
                <span className="flex items-center space-x-1 bg-green-900/30 text-green-400 px-2 py-1 rounded">
                  <CheckCircleIcon className="w-3 h-3" />
                  <span>{statusCounts.success}</span>
                </span>
              )}
              {statusCounts.error && (
                <span className="flex items-center space-x-1 bg-red-900/30 text-red-400 px-2 py-1 rounded">
                  <ExclamationCircleIcon className="w-3 h-3" />
                  <span>{statusCounts.error}</span>
                </span>
              )}
              {statusCounts.processing && (
                <span className="flex items-center space-x-1 bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
                  <ClockIcon className="w-3 h-3" />
                  <span>{statusCounts.processing}</span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Maximize/Minimize toggle - only show when open */}
          {loggerState !== LoggerState.HIDDEN && (
            <button
              onClick={handleMaximizeToggle}
              className="p-1 hover:bg-slate-600 rounded transition-colors duration-200"
              title={loggerState === LoggerState.FULLSCREEN ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {loggerState === LoggerState.FULLSCREEN ? (
                <MinimizeIcon className="w-4 h-4" />
              ) : (
                <MaximizeIcon className="w-4 h-4" />
              )}
            </button>
          )}
          
          {/* Close button - only show when open */}
          {loggerState !== LoggerState.HIDDEN && (
            <button
              onClick={handleMinimize}
              className="p-1 hover:bg-slate-600 rounded transition-colors duration-200"
              title="Close Logger"
            >
              <ChevronDownIcon className="w-4 h-4" />
            </button>
          )}
          
          {/* Expand indicator for hidden state */}
          {loggerState === LoggerState.HIDDEN && (
            <div className="flex items-center space-x-1 text-slate-400">
              <span className="text-xs">Click to open</span>
              <ChevronUpIcon className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Content Area - Only visible when not hidden */}
      {loggerState !== LoggerState.HIDDEN && (
        <div className="flex flex-col h-[calc(100%-3.5rem)] select-none">
          
          {/* Tabs for fullscreen state */}
          {loggerState === LoggerState.FULLSCREEN && (
            <div className="flex items-center justify-between border-b border-slate-600 bg-slate-800/50 select-none">
              <div className="flex">
                {['logs', 'filters', 'search'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 text-sm font-medium capitalize transition-colors duration-200 ${
                      activeTab === tab
                        ? 'text-white border-b-2 border-blue-400 bg-slate-700/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                    }`}
                  >
                    {tab === 'search' && <SearchIcon className="w-4 h-4 inline mr-1" />}
                    {tab === 'filters' && <FilterIcon className="w-4 h-4 inline mr-1" />}
                    {tab}
                  </button>
                ))}
              </div>
              
              <div className="px-4 text-xs text-slate-400">
                Double-click header for instant fullscreen • ESC to close
              </div>
            </div>
          )}

          {/* Search Bar for fullscreen */}
          {loggerState === LoggerState.FULLSCREEN && activeTab === 'search' && (
            <div className="p-3 border-b border-slate-600 bg-slate-800/30 select-none">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search logs by node, message, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent select-text"
                />
              </div>
            </div>
          )}

          {/* Filters for fullscreen */}
          {loggerState === LoggerState.FULLSCREEN && activeTab === 'filters' && (
            <div className="p-3 border-b border-slate-600 bg-slate-800/30 select-none">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">Filter by status:</span>
                {['all', 'success', 'error', 'processing', 'skipped'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as any)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors duration-200 ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {status} {status !== 'all' && statusCounts[status] ? `(${statusCounts[status]})` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Log Content */}
          <div className="flex-1 overflow-y-auto p-3 select-none">
            {filteredLogs.length === 0 && log.length === 0 && (
              <div className="text-center py-8">
                <ClockIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No execution data yet</p>
                <p className="text-slate-500 text-xs mt-1">Click "Run Flow" to start logging</p>
              </div>
            )}
            
            {filteredLogs.length === 0 && log.length > 0 && (
              <div className="text-center py-8">
                <SearchIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No logs match your filters</p>
                <p className="text-slate-500 text-xs mt-1">Try adjusting your search or filter criteria</p>
              </div>
            )}

            <div className="space-y-2">
              {filteredLogs.map((entry, index) => (
                <div 
                  key={index} 
                  className={`rounded-lg transition-all duration-200 hover:shadow-lg select-none ${
                    entry.status === 'error' ? 'bg-red-900/20 border border-red-800/50' :
                    entry.status === 'success' ? 'bg-green-900/20 border border-green-800/50' :
                    entry.status === 'processing' ? 'bg-blue-900/20 border border-blue-800/50' :
                    'bg-slate-800/50 border border-slate-700/50'
                  }`}
                >
                  {/* Default view - compact but informative */}
                  {loggerState === LoggerState.DEFAULT && (
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <StatusIcon status={entry.status} />
                          <div>
                            <span className="font-medium text-sm">{entry.nodeLabel}</span>
                            <span className="text-xs text-slate-400 ml-2">({entry.nodeId})</span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm">{entry.message}</p>
                    </div>
                  )}

                  {/* Fullscreen view - detailed with expandable sections */}
                  {loggerState === LoggerState.FULLSCREEN && (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <StatusIcon status={entry.status} />
                          <div>
                            <div className="font-semibold text-sm">{entry.nodeLabel}</div>
                            <div className="text-xs text-slate-400">{entry.nodeId}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-slate-300 text-sm mb-3">{entry.message}</p>
                      
                      {/* Input/Output for fullscreen state */}
                      <div className="space-y-2">
                        {entry.input && (
                          <details className="group">
                            <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-300 transition-colors duration-200 flex items-center space-x-1 select-none">
                              <span>📥 Input Data</span>
                              <ChevronDownIcon className="w-3 h-3 group-open:rotate-180 transition-transform duration-200" />
                            </summary>
                            <div className="mt-2 bg-slate-900/50 border border-slate-700 rounded p-3 select-text">
                              <pre className="text-xs text-slate-300 overflow-auto max-h-32 select-text">
                                {JSON.stringify(entry.input, null, 2)}
                              </pre>
                            </div>
                          </details>
                        )}
                        
                        {entry.output && (
                          <details className="group">
                            <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-300 transition-colors duration-200 flex items-center space-x-1 select-none">
                              <span>📤 Output Data</span>
                              <ChevronDownIcon className="w-3 h-3 group-open:rotate-180 transition-transform duration-200" />
                            </summary>
                            <div className="mt-2 bg-slate-900/50 border border-slate-700 rounded p-3 select-text">
                              <pre className="text-xs text-slate-300 overflow-auto max-h-32 select-text">
                                {JSON.stringify(entry.output, null, 2)}
                              </pre>
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionLogView;
    