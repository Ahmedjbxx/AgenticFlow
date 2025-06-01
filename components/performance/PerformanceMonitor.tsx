import React, { useEffect, useState, useCallback, useRef } from 'react';
import { applicationCore } from '../../core/ApplicationCore';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  nodeCount: number;
  reRenderCount: number;
  lastUpdate: Date;
}

interface PerformanceStats {
  averageRenderTime: number;
  peakMemoryUsage: number;
  totalReRenders: number;
  performanceScore: number;
}

export const PerformanceMonitor: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    nodeCount: 0,
    reRenderCount: 0,
    lastUpdate: new Date(),
  });

  const [stats, setStats] = useState<PerformanceStats>({
    averageRenderTime: 0,
    peakMemoryUsage: 0,
    totalReRenders: 0,
    performanceScore: 100,
  });

  const [isVisible, setIsVisible] = useState(false);
  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);

  // Track component render performance
  useEffect(() => {
    if (!enabled) return;
    
    startTimeRef.current = performance.now();
    renderCountRef.current += 1;

    return () => {
      const renderTime = performance.now() - startTimeRef.current;
      renderTimesRef.current.push(renderTime);
      
      // Keep only last 50 measurements
      if (renderTimesRef.current.length > 50) {
        renderTimesRef.current = renderTimesRef.current.slice(-50);
      }
    };
  });

  // Update metrics periodically
  useEffect(() => {
    if (!enabled) return;

    const updateMetrics = () => {
      const renderTime = renderTimesRef.current.length > 0 
        ? renderTimesRef.current[renderTimesRef.current.length - 1] || 0
        : 0;

      // Get memory usage (if available)
      const memoryUsage = (performance as any).memory 
        ? (performance as any).memory.usedJSHeapSize / 1024 / 1024 // MB
        : 0;

      // Count DOM nodes as a proxy for complexity
      const nodeCount = document.querySelectorAll('*').length;

      const newMetrics: PerformanceMetrics = {
        renderTime,
        memoryUsage,
        nodeCount,
        reRenderCount: renderCountRef.current,
        lastUpdate: new Date(),
      };

      setMetrics(newMetrics);

      // Calculate statistics
      const averageRenderTime = renderTimesRef.current.length > 0
        ? renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length
        : 0;

      const peakMemoryUsage = Math.max(memoryUsage, stats.peakMemoryUsage);
      
      // Calculate performance score (0-100)
      let performanceScore = 100;
      if (averageRenderTime > 16) performanceScore -= 20; // > 16ms is bad for 60fps
      if (averageRenderTime > 33) performanceScore -= 20; // > 33ms is very bad
      if (memoryUsage > 100) performanceScore -= 20; // > 100MB is concerning
      if (renderCountRef.current > 1000) performanceScore -= 10; // Many re-renders
      if (nodeCount > 5000) performanceScore -= 10; // DOM complexity

      setStats({
        averageRenderTime,
        peakMemoryUsage,
        totalReRenders: renderCountRef.current,
        performanceScore: Math.max(0, performanceScore),
      });

      // Log performance warnings
      if (averageRenderTime > 50) {
        applicationCore.logger.warn('Slow rendering detected', {
          averageRenderTime,
          currentRenderTime: renderTime,
        });
      }

      if (memoryUsage > 200) {
        applicationCore.logger.warn('High memory usage detected', {
          memoryUsage,
          nodeCount,
        });
      }
    };

    const interval = setInterval(updateMetrics, 2000); // Update every 2 seconds
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, [enabled, stats.peakMemoryUsage]);

  // Keyboard shortcut to toggle performance monitor
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const resetStats = useCallback(() => {
    renderCountRef.current = 0;
    renderTimesRef.current = [];
    setStats({
      averageRenderTime: 0,
      peakMemoryUsage: 0,
      totalReRenders: 0,
      performanceScore: 100,
    });
  }, []);

  if (!enabled || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 min-w-80">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Performance Monitor</h3>
        <div className="flex space-x-2">
          <button
            onClick={resetStats}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Reset
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        {/* Performance Score */}
        <div className="flex justify-between">
          <span className="text-gray-600">Performance Score:</span>
          <span className={`font-medium ${getPerformanceColor(stats.performanceScore)}`}>
            {stats.performanceScore.toFixed(0)}/100
          </span>
        </div>

        {/* Current Metrics */}
        <div className="flex justify-between">
          <span className="text-gray-600">Render Time:</span>
          <span className={metrics.renderTime > 16 ? 'text-red-600' : 'text-green-600'}>
            {metrics.renderTime.toFixed(1)}ms
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Memory Usage:</span>
          <span className={metrics.memoryUsage > 100 ? 'text-orange-600' : 'text-gray-900'}>
            {metrics.memoryUsage.toFixed(1)}MB
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">DOM Nodes:</span>
          <span className="text-gray-900">{metrics.nodeCount.toLocaleString()}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Re-renders:</span>
          <span className={metrics.reRenderCount > 100 ? 'text-orange-600' : 'text-gray-900'}>
            {metrics.reRenderCount}
          </span>
        </div>

        {/* Averages */}
        <hr className="my-2" />
        
        <div className="flex justify-between">
          <span className="text-gray-600">Avg Render:</span>
          <span className={stats.averageRenderTime > 16 ? 'text-red-600' : 'text-green-600'}>
            {stats.averageRenderTime.toFixed(1)}ms
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Peak Memory:</span>
          <span className="text-gray-900">{stats.peakMemoryUsage.toFixed(1)}MB</span>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          Press Ctrl+Shift+P to toggle
        </div>
      </div>

      {/* Performance Tips */}
      {stats.performanceScore < 80 && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <div className="font-medium text-yellow-800 mb-1">Performance Tips:</div>
          <ul className="text-yellow-700 space-y-1">
            {stats.averageRenderTime > 16 && (
              <li>• Consider optimizing rendering with useMemo/useCallback</li>
            )}
            {metrics.memoryUsage > 100 && (
              <li>• High memory usage - check for memory leaks</li>
            )}
            {metrics.reRenderCount > 500 && (
              <li>• Too many re-renders - optimize state updates</li>
            )}
            {metrics.nodeCount > 3000 && (
              <li>• Simplify DOM structure for better performance</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// Hook for performance tracking in components
export const usePerformanceTracking = (componentName: string) => {
  const startTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    startTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      const renderTime = performance.now() - startTime.current;
      
      if (renderTime > 50) {
        applicationCore.logger.warn(`Slow component render: ${componentName}`, {
          renderTime,
          renderCount: renderCount.current,
        });
      }

      applicationCore.eventBus.emit('performance.component.render', {
        componentName,
        renderTime,
        renderCount: renderCount.current,
        timestamp: new Date(),
      });
    };
  });

  return {
    renderCount: renderCount.current,
  };
}; 