import { StateCreator } from 'zustand';

// UI slice state interface
export interface UISliceState {
  // Selection state
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  
  // Panel states
  isEditorPanelOpen: boolean;
  isLogPanelOpen: boolean;
  isVariablePanelOpen: boolean;
  isNodeLibraryOpen: boolean;
  
  // UI preferences
  theme: 'light' | 'dark' | 'auto';
  showMinimap: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  
  // Modal states
  isSettingsModalOpen: boolean;
  isExportModalOpen: boolean;
  isImportModalOpen: boolean;
  isHelpModalOpen: boolean;
  
  // Notification system
  notifications: UINotification[];
  
  // Layout preferences
  sidebarWidth: number;
  panelHeight: number;
}

export interface UINotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number; // ms, null for persistent
  timestamp: Date;
}

// UI slice actions interface
export interface UISliceActions {
  // Selection
  setSelectedNode: (nodeId: string | null) => void;
  setSelectedEdge: (edgeId: string | null) => void;
  clearSelection: () => void;
  
  // Panel management
  setEditorPanelOpen: (open: boolean) => void;
  setLogPanelOpen: (open: boolean) => void;
  setVariablePanelOpen: (open: boolean) => void;
  setNodeLibraryOpen: (open: boolean) => void;
  toggleEditorPanel: () => void;
  toggleLogPanel: () => void;
  toggleVariablePanel: () => void;
  toggleNodeLibrary: () => void;
  
  // Theme and preferences
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setShowMinimap: (show: boolean) => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
  
  // Modal management
  setSettingsModalOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
  setImportModalOpen: (open: boolean) => void;
  setHelpModalOpen: (open: boolean) => void;
  closeAllModals: () => void;
  
  // Notification system
  addNotification: (notification: Omit<UINotification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Layout
  setSidebarWidth: (width: number) => void;
  setPanelHeight: (height: number) => void;
  resetLayout: () => void;
}

// Combined UI slice type
export type UISlice = UISliceState & UISliceActions;

// Default UI preferences
const DEFAULT_UI_STATE: UISliceState = {
  selectedNodeId: null,
  selectedEdgeId: null,
  
  isEditorPanelOpen: false,
  isLogPanelOpen: false,
  isVariablePanelOpen: false,
  isNodeLibraryOpen: true,
  
  theme: 'auto',
  showMinimap: true,
  showGrid: true,
  snapToGrid: false,
  gridSize: 20,
  
  isSettingsModalOpen: false,
  isExportModalOpen: false,
  isImportModalOpen: false,
  isHelpModalOpen: false,
  
  notifications: [],
  
  sidebarWidth: 280,
  panelHeight: 200,
};

// UI slice creator
export const createUISlice: StateCreator<
  UISlice,
  [],
  [],
  UISlice
> = (set, get, api) => ({
  ...DEFAULT_UI_STATE,

  // Selection
  setSelectedNode: (nodeId) => {
    set({ selectedNodeId: nodeId, selectedEdgeId: null });
  },

  setSelectedEdge: (edgeId) => {
    set({ selectedEdgeId: edgeId, selectedNodeId: null });
  },

  clearSelection: () => {
    set({ selectedNodeId: null, selectedEdgeId: null });
  },

  // Panel management
  setEditorPanelOpen: (open) => {
    set({ isEditorPanelOpen: open });
  },

  setLogPanelOpen: (open) => {
    set({ isLogPanelOpen: open });
  },

  setVariablePanelOpen: (open) => {
    set({ isVariablePanelOpen: open });
  },

  setNodeLibraryOpen: (open) => {
    set({ isNodeLibraryOpen: open });
  },

  toggleEditorPanel: () => {
    set((state: UISlice) => ({ isEditorPanelOpen: !state.isEditorPanelOpen }));
  },

  toggleLogPanel: () => {
    set((state: UISlice) => ({ isLogPanelOpen: !state.isLogPanelOpen }));
  },

  toggleVariablePanel: () => {
    set((state: UISlice) => ({ isVariablePanelOpen: !state.isVariablePanelOpen }));
  },

  toggleNodeLibrary: () => {
    set((state: UISlice) => ({ isNodeLibraryOpen: !state.isNodeLibraryOpen }));
  },

  // Theme and preferences
  setTheme: (theme) => {
    set({ theme });
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Auto mode - check system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },

  setShowMinimap: (show) => {
    set({ showMinimap: show });
  },

  setShowGrid: (show) => {
    set({ showGrid: show });
  },

  setSnapToGrid: (snap) => {
    set({ snapToGrid: snap });
  },

  setGridSize: (size) => {
    set({ gridSize: Math.max(10, Math.min(50, size)) }); // Clamp between 10-50
  },

  // Modal management
  setSettingsModalOpen: (open) => {
    set({ isSettingsModalOpen: open });
  },

  setExportModalOpen: (open) => {
    set({ isExportModalOpen: open });
  },

  setImportModalOpen: (open) => {
    set({ isImportModalOpen: open });
  },

  setHelpModalOpen: (open) => {
    set({ isHelpModalOpen: open });
  },

  closeAllModals: () => {
    set({
      isSettingsModalOpen: false,
      isExportModalOpen: false,
      isImportModalOpen: false,
      isHelpModalOpen: false,
    });
  },

  // Notification system
  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: UINotification = {
      ...notification,
      id,
      timestamp: new Date(),
    };

    set((state: UISlice) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-remove notification if duration is specified
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state: UISlice) => ({
      notifications: state.notifications.filter((n: UINotification) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  // Layout
  setSidebarWidth: (width) => {
    set({ sidebarWidth: Math.max(200, Math.min(600, width)) }); // Clamp between 200-600px
  },

  setPanelHeight: (height) => {
    set({ panelHeight: Math.max(150, Math.min(500, height)) }); // Clamp between 150-500px
  },

  resetLayout: () => {
    set({
      sidebarWidth: DEFAULT_UI_STATE.sidebarWidth,
      panelHeight: DEFAULT_UI_STATE.panelHeight,
      isEditorPanelOpen: DEFAULT_UI_STATE.isEditorPanelOpen,
      isLogPanelOpen: DEFAULT_UI_STATE.isLogPanelOpen,
      isVariablePanelOpen: DEFAULT_UI_STATE.isVariablePanelOpen,
      isNodeLibraryOpen: DEFAULT_UI_STATE.isNodeLibraryOpen,
    });
  },
}); 