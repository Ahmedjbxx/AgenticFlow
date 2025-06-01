import { StateCreator } from 'zustand';
import { FlowData } from '@agenticflow/types';

// Persistence slice state interface
export interface PersistenceSliceState {
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
  
  // Import/Export state
  isImporting: boolean;
  isExporting: boolean;
  lastBackup: Date | null;
}

export interface SavedFlow {
  id: string;
  name: string;
  data: FlowData;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  description?: string;
  tags?: string[];
  thumbnail?: string; // base64 encoded thumbnail
}

// Persistence slice actions interface
export interface PersistenceSliceActions {
  // Flow persistence
  saveFlow: (flowId: string, name: string, data: FlowData, description?: string) => void;
  loadSavedFlow: (flowId: string) => SavedFlow | null;
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
  updateFlowMetadata: (flowId: string, updates: Partial<Pick<SavedFlow, 'name' | 'description' | 'tags' | 'thumbnail'>>) => void;
  
  // Import/Export
  exportFlowToJson: (flowId: string) => string;
  importFlow: (jsonData: string) => string;
  exportAllFlows: () => string;
  importFlows: (jsonData: string) => void;
  
  // Storage management
  getStorageStats: () => { totalFlows: number; storageSize: number; lastBackup: Date | null };
  clearAllData: () => void;
  createBackup: () => string;
  restoreFromBackup: (backupData: string) => void;
}

// Combined persistence slice type
export type PersistenceSlice = PersistenceSliceState & PersistenceSliceActions;

// Default persistence state
const DEFAULT_PERSISTENCE_STATE: PersistenceSliceState = {
  savedFlows: {},
  recentFlows: [],
  autoSaveEnabled: true,
  autoSaveInterval: 5, // 5 minutes
  lastAutoSave: null,
  storageLocation: 'local',
  maxRecentFlows: 10,
  isImporting: false,
  isExporting: false,
  lastBackup: null,
};

// Persistence slice creator
export const createPersistenceSlice: StateCreator<
  PersistenceSlice,
  [],
  [],
  PersistenceSlice
> = (set, get, api) => ({
  ...DEFAULT_PERSISTENCE_STATE,

  // Flow persistence
  saveFlow: (flowId, name, data, description) => {
    const now = new Date();
    const existingFlow = get().savedFlows[flowId];
    
    const savedFlow: SavedFlow = {
      id: flowId,
      name,
      data,
      createdAt: existingFlow?.createdAt || now,
      updatedAt: now,
      version: '1.0.0',
      tags: existingFlow?.tags || [],
      ...(description !== undefined && { description }),
      ...(existingFlow?.thumbnail !== undefined && { thumbnail: existingFlow.thumbnail }),
    };

    set((state: PersistenceSlice) => ({
      savedFlows: {
        ...state.savedFlows,
        [flowId]: savedFlow,
      },
    }));

    // Add to recent flows
    get().addToRecentFlows(flowId);
  },

  loadSavedFlow: (flowId) => {
    const flow = get().savedFlows[flowId];
    if (flow) {
      get().addToRecentFlows(flowId);
      return flow;
    }
    return null;
  },

  deleteFlow: (flowId) => {
    set((state: PersistenceSlice) => {
      const newSavedFlows = { ...state.savedFlows };
      delete newSavedFlows[flowId];
      
      return {
        savedFlows: newSavedFlows,
        recentFlows: state.recentFlows.filter((id: string) => id !== flowId),
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

    // Deep clone the flow data to avoid reference issues
    const duplicatedFlow: SavedFlow = {
      ...originalFlow,
      id: newFlowId,
      name: newName,
      createdAt: now,
      updatedAt: now,
      data: JSON.parse(JSON.stringify(originalFlow.data)), // Deep clone
    };

    set((state: PersistenceSlice) => ({
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
    set((state: PersistenceSlice) => {
      const newRecentFlows = [flowId, ...state.recentFlows.filter((id: string) => id !== flowId)]
        .slice(0, state.maxRecentFlows);
      
      return { recentFlows: newRecentFlows };
    });
  },

  removeFromRecentFlows: (flowId) => {
    set((state: PersistenceSlice) => ({
      recentFlows: state.recentFlows.filter((id: string) => id !== flowId),
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
    return Object.values(get().savedFlows) as SavedFlow[];
  },

  getFlowsByTag: (tag) => {
    return (Object.values(get().savedFlows) as SavedFlow[]).filter((flow: SavedFlow) => 
      flow.tags?.includes(tag)
    );
  },

  searchFlows: (query) => {
    const lowerQuery = query.toLowerCase();
    return (Object.values(get().savedFlows) as SavedFlow[]).filter((flow: SavedFlow) => 
      flow.name.toLowerCase().includes(lowerQuery) ||
      flow.description?.toLowerCase().includes(lowerQuery) ||
      flow.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
    );
  },

  updateFlowMetadata: (flowId, updates) => {
    set((state: PersistenceSlice) => {
      const existingFlow = state.savedFlows[flowId];
      if (!existingFlow) return state;

      return {
        savedFlows: {
          ...state.savedFlows,
          [flowId]: {
            ...existingFlow,
            ...updates,
            updatedAt: new Date(),
          },
        },
      };
    });
  },

  // Import/Export
  exportFlowToJson: (flowId) => {
    const flow = get().savedFlows[flowId];
    if (!flow) {
      throw new Error(`Flow ${flowId} not found`);
    }

    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      flow,
    };

    return JSON.stringify(exportData, null, 2);
  },

  importFlow: (jsonData) => {
    set({ isImporting: true });
    
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.flow || !importData.flow.data) {
        throw new Error('Invalid flow data format');
      }

      const flow = importData.flow;
      const newFlowId = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
        isImporting: false,
      }));

      get().addToRecentFlows(newFlowId);
      return newFlowId;
    } catch (error) {
      set({ isImporting: false });
      throw error;
    }
  },

  exportAllFlows: () => {
    set({ isExporting: true });
    
    try {
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        flows: get().savedFlows,
        recentFlows: get().recentFlows,
        settings: {
          autoSaveEnabled: get().autoSaveEnabled,
          autoSaveInterval: get().autoSaveInterval,
          maxRecentFlows: get().maxRecentFlows,
        },
      };

      set({ isExporting: false });
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      set({ isExporting: false });
      throw error;
    }
  },

  importFlows: (jsonData) => {
    set({ isImporting: true });
    
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.flows) {
        throw new Error('Invalid backup data format');
      }

      set((state: PersistenceSlice) => ({
        savedFlows: { ...state.savedFlows, ...importData.flows },
        recentFlows: importData.recentFlows || state.recentFlows,
        autoSaveEnabled: importData.settings?.autoSaveEnabled ?? state.autoSaveEnabled,
        autoSaveInterval: importData.settings?.autoSaveInterval ?? state.autoSaveInterval,
        maxRecentFlows: importData.settings?.maxRecentFlows ?? state.maxRecentFlows,
        isImporting: false,
      }));
    } catch (error) {
      set({ isImporting: false });
      throw error;
    }
  },

  // Storage management
  getStorageStats: () => {
    const flows = get().savedFlows;
    const flowCount = Object.keys(flows).length;
    
    // Estimate storage size (rough calculation)
    const dataString = JSON.stringify(flows);
    const storageSize = new Blob([dataString]).size;

    return {
      totalFlows: flowCount,
      storageSize,
      lastBackup: get().lastBackup,
    };
  },

  clearAllData: () => {
    set({
      ...DEFAULT_PERSISTENCE_STATE,
      lastBackup: null,
    });
  },

  createBackup: () => {
    const backupData = get().exportAllFlows();
    set({ lastBackup: new Date() });
    return backupData;
  },

  restoreFromBackup: (backupData) => {
    get().importFlows(backupData);
    set({ lastBackup: new Date() });
  },
}); 