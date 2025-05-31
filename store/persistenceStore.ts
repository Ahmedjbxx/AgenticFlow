import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FlowData } from '../types';

// Persistence configuration
interface PersistenceState {
  // Saved flows
  savedFlows: Record<string, SavedFlow>;
  recentFlows: string[]; // Flow IDs in recent order
  
  // Auto-save settings
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // minutes
  lastAutoSave: Date | null;
  
  // Storage settings
  storageLocation: 'local' | 'cloud';
  maxRecentFlows: number;
}

interface SavedFlow {
  id: string;
  name: string;
  data: FlowData;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  description?: string;
  tags?: string[];
}

interface PersistenceActions {
  // Flow persistence
  saveFlow: (flowId: string, name: string, data: FlowData, description?: string) => void;
  loadFlow: (flowId: string) => SavedFlow | null;
  deleteFlow: (flowId: string) => void;
  duplicateFlow: (flowId: string, newName: string) => string;
  
  // Recent flows
  addToRecentFlows: (flowId: string) => void;
  removeFromRecentFlows: (flowId: string) => void;
  clearRecentFlows: () => void;
  
  // Auto-save
  setAutoSaveEnabled: (enabled: boolean) => void;
  setAutoSaveInterval: (minutes: number) => void;
  updateLastAutoSave: () => void;
  
  // Flow management
  getAllFlows: () => SavedFlow[];
  getFlowsByTag: (tag: string) => SavedFlow[];
  searchFlows: (query: string) => SavedFlow[];
  updateFlowMetadata: (flowId: string, updates: Partial<Pick<SavedFlow, 'name' | 'description' | 'tags'>>) => void;
  
  // Import/Export
  exportFlow: (flowId: string) => string;
  importFlow: (jsonData: string) => string;
  exportAllFlows: () => string;
  importFlows: (jsonData: string) => void;
  
  // Storage management
  getStorageStats: () => { totalFlows: number; storageSize: number; lastBackup: Date | null };
  clearAllData: () => void;
}

type PersistenceStore = PersistenceState & PersistenceActions;

export const usePersistenceStore = create<PersistenceStore>()(
  persist(
    (set, get) => ({
      // Initial state
      savedFlows: {},
      recentFlows: [],
      autoSaveEnabled: true,
      autoSaveInterval: 5, // 5 minutes
      lastAutoSave: null,
      storageLocation: 'local',
      maxRecentFlows: 10,

      // Flow persistence
      saveFlow: (flowId, name, data, description) => {
        const now = new Date();
        const existingFlow = get().savedFlows[flowId];
        
        const savedFlow: SavedFlow = {
          id: flowId,
          name,
          data,
          description,
          createdAt: existingFlow?.createdAt || now,
          updatedAt: now,
          version: '1.0.0',
          tags: existingFlow?.tags || [],
        };

        set((state) => ({
          savedFlows: {
            ...state.savedFlows,
            [flowId]: savedFlow,
          },
        }));

        // Add to recent flows
        get().addToRecentFlows(flowId);
      },

      loadFlow: (flowId) => {
        const flow = get().savedFlows[flowId];
        if (flow) {
          get().addToRecentFlows(flowId);
          return flow;
        }
        return null;
      },

      deleteFlow: (flowId) => {
        set((state) => {
          const newSavedFlows = { ...state.savedFlows };
          delete newSavedFlows[flowId];
          
          return {
            savedFlows: newSavedFlows,
            recentFlows: state.recentFlows.filter(id => id !== flowId),
          };
        });
      },

      duplicateFlow: (flowId, newName) => {
        const originalFlow = get().savedFlows[flowId];
        if (!originalFlow) {
          throw new Error(`Flow ${flowId} not found`);
        }

        const newFlowId = `flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();

        const duplicatedFlow: SavedFlow = {
          ...originalFlow,
          id: newFlowId,
          name: newName,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          savedFlows: {
            ...state.savedFlows,
            [newFlowId]: duplicatedFlow,
          },
        }));

        get().addToRecentFlows(newFlowId);
        return newFlowId;
      },

      // Recent flows
      addToRecentFlows: (flowId) => {
        set((state) => {
          const newRecentFlows = [flowId, ...state.recentFlows.filter(id => id !== flowId)]
            .slice(0, state.maxRecentFlows);
          
          return { recentFlows: newRecentFlows };
        });
      },

      removeFromRecentFlows: (flowId) => {
        set((state) => ({
          recentFlows: state.recentFlows.filter(id => id !== flowId),
        }));
      },

      clearRecentFlows: () => {
        set({ recentFlows: [] });
      },

      // Auto-save
      setAutoSaveEnabled: (enabled) => {
        set({ autoSaveEnabled: enabled });
      },

      setAutoSaveInterval: (minutes) => {
        set({ autoSaveInterval: Math.max(1, Math.min(60, minutes)) }); // 1-60 minutes
      },

      updateLastAutoSave: () => {
        set({ lastAutoSave: new Date() });
      },

      // Flow management
      getAllFlows: () => {
        return Object.values(get().savedFlows);
      },

      getFlowsByTag: (tag) => {
        return Object.values(get().savedFlows).filter(flow => 
          flow.tags?.includes(tag)
        );
      },

      searchFlows: (query) => {
        const lowerQuery = query.toLowerCase();
        return Object.values(get().savedFlows).filter(flow =>
          flow.name.toLowerCase().includes(lowerQuery) ||
          flow.description?.toLowerCase().includes(lowerQuery) ||
          flow.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      },

      updateFlowMetadata: (flowId, updates) => {
        set((state) => {
          const flow = state.savedFlows[flowId];
          if (!flow) return state;

          return {
            savedFlows: {
              ...state.savedFlows,
              [flowId]: {
                ...flow,
                ...updates,
                updatedAt: new Date(),
              },
            },
          };
        });
      },

      // Import/Export
      exportFlow: (flowId) => {
        const flow = get().savedFlows[flowId];
        if (!flow) {
          throw new Error(`Flow ${flowId} not found`);
        }

        return JSON.stringify({
          type: 'agenticflow-export',
          version: '1.0.0',
          flow,
          exportedAt: new Date().toISOString(),
        }, null, 2);
      },

      importFlow: (jsonData) => {
        try {
          const parsed = JSON.parse(jsonData);
          
          if (parsed.type !== 'agenticflow-export') {
            throw new Error('Invalid export format');
          }

          const flow: SavedFlow = parsed.flow;
          const newFlowId = `flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const now = new Date();

          const importedFlow: SavedFlow = {
            ...flow,
            id: newFlowId,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            savedFlows: {
              ...state.savedFlows,
              [newFlowId]: importedFlow,
            },
          }));

          get().addToRecentFlows(newFlowId);
          return newFlowId;
        } catch (error) {
          throw new Error(`Failed to import flow: ${(error as Error).message}`);
        }
      },

      exportAllFlows: () => {
        const flows = get().getAllFlows();
        
        return JSON.stringify({
          type: 'agenticflow-backup',
          version: '1.0.0',
          flows,
          exportedAt: new Date().toISOString(),
          totalFlows: flows.length,
        }, null, 2);
      },

      importFlows: (jsonData) => {
        try {
          const parsed = JSON.parse(jsonData);
          
          if (parsed.type !== 'agenticflow-backup') {
            throw new Error('Invalid backup format');
          }

          const flows: SavedFlow[] = parsed.flows;
          const now = new Date();

          set((state) => {
            const newSavedFlows = { ...state.savedFlows };
            
            flows.forEach(flow => {
              const newFlowId = `flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              newSavedFlows[newFlowId] = {
                ...flow,
                id: newFlowId,
                createdAt: now,
                updatedAt: now,
              };
            });

            return { savedFlows: newSavedFlows };
          });
        } catch (error) {
          throw new Error(`Failed to import flows: ${(error as Error).message}`);
        }
      },

      // Storage management
      getStorageStats: () => {
        const flows = get().getAllFlows();
        const storageSize = JSON.stringify(get().savedFlows).length;
        
        return {
          totalFlows: flows.length,
          storageSize,
          lastBackup: null, // TODO: Implement backup tracking
        };
      },

      clearAllData: () => {
        set({
          savedFlows: {},
          recentFlows: [],
          lastAutoSave: null,
        });
      },
    }),
    {
      name: 'agenticflow-persistence',
      version: 1,
      partialize: (state) => ({
        savedFlows: state.savedFlows,
        recentFlows: state.recentFlows,
        autoSaveEnabled: state.autoSaveEnabled,
        autoSaveInterval: state.autoSaveInterval,
        lastAutoSave: state.lastAutoSave,
        storageLocation: state.storageLocation,
        maxRecentFlows: state.maxRecentFlows,
      }),
    }
  )
);

// Auto-save hook
export const useAutoSave = () => {
  const autoSaveEnabled = usePersistenceStore(state => state.autoSaveEnabled);
  const autoSaveInterval = usePersistenceStore(state => state.autoSaveInterval);
  const updateLastAutoSave = usePersistenceStore(state => state.updateLastAutoSave);
  const saveFlow = usePersistenceStore(state => state.saveFlow);

  return {
    autoSaveEnabled,
    autoSaveInterval,
    triggerAutoSave: (flowId: string, name: string, data: FlowData) => {
      if (autoSaveEnabled) {
        saveFlow(flowId, name, data, 'Auto-saved');
        updateLastAutoSave();
      }
    },
  };
};

// Selector hooks
export const useSavedFlows = () => usePersistenceStore(state => state.getAllFlows());
export const useRecentFlows = () => usePersistenceStore(state => 
  state.recentFlows.map(id => state.savedFlows[id]).filter(Boolean)
);

// Persistence actions hook
export const usePersistenceActions = () => usePersistenceStore(state => ({
  saveFlow: state.saveFlow,
  loadFlow: state.loadFlow,
  deleteFlow: state.deleteFlow,
  duplicateFlow: state.duplicateFlow,
  exportFlow: state.exportFlow,
  importFlow: state.importFlow,
  searchFlows: state.searchFlows,
  updateFlowMetadata: state.updateFlowMetadata,
})); 