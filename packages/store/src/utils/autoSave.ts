import { useCallback } from 'react';
import { useAppStore, usePersistenceActions, usePersistenceState } from '../store.js';

/**
 * Hook for managing auto-save functionality
 */
export const useAutoSave = () => {
  const { autoSaveEnabled, autoSaveInterval, lastAutoSave } = usePersistenceState();
  const { setAutoSaveEnabled, setAutoSaveInterval, updateLastAutoSave } = usePersistenceActions();
  const { exportFlowData, markSaved } = useAppStore((state) => ({
    exportFlowData: state.exportFlowData,
    markSaved: state.markSaved,
    flowName: state.flowName,
  }));

  const triggerAutoSave = useCallback((flowId: string, name: string, flowData: any) => {
    const { saveFlow, updateLastAutoSave } = usePersistenceActions();
    saveFlow(flowId, name, flowData);
    updateLastAutoSave();
    markSaved();
  }, [markSaved]);

  const enableAutoSave = useCallback(() => {
    setAutoSaveEnabled(true);
  }, [setAutoSaveEnabled]);

  const disableAutoSave = useCallback(() => {
    setAutoSaveEnabled(false);
  }, [setAutoSaveEnabled]);

  const setInterval = useCallback((minutes: number) => {
    setAutoSaveInterval(minutes);
  }, [setAutoSaveInterval]);

  const getTimeSinceLastSave = useCallback(() => {
    if (!lastAutoSave) return null;
    return Date.now() - new Date(lastAutoSave).getTime();
  }, [lastAutoSave]);

  return {
    autoSaveEnabled,
    autoSaveInterval,
    lastAutoSave,
    triggerAutoSave,
    enableAutoSave,
    disableAutoSave,
    setInterval,
    getTimeSinceLastSave,
  };
}; 