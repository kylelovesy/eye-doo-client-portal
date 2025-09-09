// src/store/usePortalStore.ts - PORTAL STATE MANAGEMENT
// =================================================================================
// UPDATED FOR NEW SUBCOLLECTION ARCHITECTURE:
//
// FIREBASE DATA FLOW:
// 1. MAIN PROJECT: projects/{projectId} - Basic project info and portal reference
// 2. PORTAL CONFIG: projects/{projectId}/clientPortals/default-portal - Portal state & steps
// 3. SECTION DATA: projects/{projectId}/{sectionName}/items - Individual section content
//
// COST-CONSCIOUS APPROACH:
// - Real-time listeners are OPTIONAL and only enabled when explicitly requested
// - Default behavior uses manual refresh to minimize Firebase costs
// - Use initialize(projectId, token, true) to enable real-time listeners when needed
// - Call cleanupListeners() to stop listeners and reduce costs when not needed

// LOCAL STORAGE STRATEGY:
// - Temporary storage for UI updates during editing sessions
// - Data always loaded fresh from Firestore on initialization
// - Local storage used only for instant UI responsiveness
// - Firebase remains the single source of truth
//
// STATE MANAGEMENT FEATURES:
// - Tracks portal loading, saving, and error states
// - Manages current step navigation and progress
// - Handles section data updates with dirty state tracking
// - Provides cleanup utilities for memory management
// =================================================================================

import { create, StateCreator } from 'zustand';
import { portalService } from '@/services/portalService';
import {
  ClientProject,
  PortalKeyPeopleData,
  PortalLocationData,
  PortalGroupShotData,
  PortalPhotoRequestData,
  PortalTimelineData,
  PortalStepID,
  SectionStatus,
  ActionOn,
} from '@/types/types';

// Define the shape of the store's state
interface PortalState {
  isLoading: boolean;
  isSaving: boolean;
  isSkipping: boolean;
  error: string | null;
  projectId: string | null;
  accessToken: string | null;
  project: ClientProject | null;
  currentStep: PortalStepID;
  keyPeople: PortalKeyPeopleData | null;
  locations: PortalLocationData | null;
  groupShots: PortalGroupShotData | null;
  photoRequests: PortalPhotoRequestData | null;
  timeline: PortalTimelineData | null;
  isDirty: boolean;
  saveSuccess: boolean; // New state for tracking save success
  showSaveConfirmation: boolean;
  currentSectionToSave: PortalStepID | null;
  realtimeEnabled: boolean; // Track if real-time listeners are active
  listeners: (() => void)[]; // Store unsubscribe functions for cleanup
}

// Define the actions that can be performed on the state
interface PortalActions {
  initialize: (projectId: string, token: string, enableRealtime?: boolean) => Promise<void>;
  setStep: (stepId: PortalStepID) => void;
  skipStep: (stepId: PortalStepID) => Promise<void>;
  updateKeyPeople: (data: PortalKeyPeopleData) => void;
  updateLocations: (data: PortalLocationData) => void;
  updateGroupShots: (data: PortalGroupShotData) => void;
  updatePhotoRequests: (data: PortalPhotoRequestData) => void;
  updateTimeline: (data: PortalTimelineData) => void;
  saveCurrentStep: () => Promise<void>;
  clearError: () => void;
  resetSaveSuccess: () => void; // New action to reset success state
  setShowSaveConfirmation: (show: boolean, sectionId?: PortalStepID) => void;
  confirmSaveSection: () => Promise<void>;
  refreshCurrentSection: () => Promise<void>; // Manual refresh instead of real-time
  cleanupListeners: () => void; // Clean up real-time listeners to save costs
  clearLocalStorage: () => void; // Clear local storage data
  cleanup: () => void; // Complete cleanup of listeners and storage
}

// Define a union type for the data that can be saved
type SaveableData = PortalKeyPeopleData | PortalLocationData | PortalGroupShotData | PortalPhotoRequestData | PortalTimelineData;

// Local Storage Keys
const STORAGE_KEYS = {
  PORTAL_DATA: 'portal_data',
  KEY_PEOPLE: 'portal_keyPeople',
  LOCATIONS: 'portal_locations',
  GROUP_SHOTS: 'portal_groupShots',
  PHOTO_REQUESTS: 'portal_photoRequests',
  TIMELINE: 'portal_timeline',
  CURRENT_STEP: 'portal_currentStep',
  PROJECT_ID: 'portal_projectId',
} as const;

// Local Storage Utilities
const localStorageUtils = {
  // Save data to local storage
  save: <T>(key: string, data: T): void => {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  },

  // Load data from local storage
  load: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
      return null;
    }
  },

  // Remove data from local storage
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove ${key} from localStorage:`, error);
    }
  },

  // Clear all portal-related local storage
  clearAll: (): void => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};


// The store creator function, now fully typed
const storeCreator: StateCreator<PortalState & PortalActions> = (set, get) => ({
  // --- INITIAL STATE ---
  isLoading: true,
  isSaving: false,
  isSkipping: false,
  error: null,
  projectId: null,
  accessToken: null,
  project: null,
  currentStep: PortalStepID.WELCOME,
  keyPeople: null,
  locations: null,
  groupShots: null,
  photoRequests: null,
  timeline: null,
  isDirty: false,
  saveSuccess: false, // Initial success state
  showSaveConfirmation: false,
  currentSectionToSave: null,
  realtimeEnabled: false, // Default to cost-effective manual refresh
  listeners: [],

  // --- ACTIONS ---
  /**
   * Initializes the portal store with fresh data from Firebase.
   *
   * INITIALIZATION SEQUENCE:
   * 1. Clean up any existing listeners to prevent memory leaks
   * 2. Fetch fresh project and portal data from Firebase (single source of truth)
   * 3. Set up real-time listeners if requested (cost-conscious)
   * 4. Save essential identifiers to localStorage for session management
   *
   * DATA STRATEGY:
   * - Always loads fresh data from Firestore (no localStorage loading)
   * - Local storage used only for session identifiers and temporary UI state
   * - Firebase remains the authoritative data source
   *
   * @param projectId - The project ID to initialize
   * @param token - Client access token for authentication
   * @param enableRealtime - Whether to enable real-time listeners (costs more)
   */
  initialize: async (projectId, token, enableRealtime = false) => {
    try {
      // Clean up any existing listeners before initializing
      const currentListeners = get().listeners;
      currentListeners.forEach(unsubscribe => unsubscribe());

      set({
        isLoading: true,
        error: null,
        projectId,
        accessToken: token,
        realtimeEnabled: enableRealtime,
        listeners: []
      });

      // Save project ID to local storage for session management
      localStorageUtils.save(STORAGE_KEYS.PROJECT_ID, projectId);

      // Fetch fresh data from Firebase (single source of truth)
      const projectData = await portalService.getInitialData(projectId, token);

      // Load section data in parallel for better performance
      const [keyPeopleData, locationsData, groupShotsData, photoRequestsData, timelineData] = await Promise.all([
        portalService.fetchCategoryData<PortalKeyPeopleData>(projectId, 'keyPeople').catch(() => null),
        portalService.fetchCategoryData<PortalLocationData>(projectId, 'locations').catch(() => null),
        portalService.fetchCategoryData<PortalGroupShotData>(projectId, 'groupShots').catch(() => null),
        portalService.fetchCategoryData<PortalPhotoRequestData>(projectId, 'photoRequests').catch(() => null),
        portalService.fetchCategoryData<PortalTimelineData>(projectId, 'timeline').catch(() => null),
      ]);

      // Set project data first
      set({
        project: projectData,
        currentStep: projectData.currentStepID
      });

      // Set section data individually with explicit typing
      if (keyPeopleData) set({ keyPeople: keyPeopleData as PortalKeyPeopleData });
      if (locationsData) set({ locations: locationsData as PortalLocationData });
      if (groupShotsData) set({ groupShots: groupShotsData as PortalGroupShotData });
      if (photoRequestsData) set({ photoRequests: photoRequestsData as PortalPhotoRequestData });
      if (timelineData) set({ timeline: timelineData as PortalTimelineData });

      // Save current step to localStorage for session persistence
      localStorageUtils.save(STORAGE_KEYS.CURRENT_STEP, projectData.currentStepID);

      // Only set up real-time listeners if explicitly enabled (cost-conscious approach)
      if (enableRealtime) {
        const newListeners: (() => void)[] = [];

        // Set up real-time listeners for category data
        // Note: Real-time listeners update UI instantly but don't save to localStorage
        // Firebase remains the single source of truth
        newListeners.push(
          portalService.listenToCategory<PortalKeyPeopleData>(projectId, 'keyPeople', (data) => {
            set({ keyPeople: data, isDirty: false });
          })
        );
        newListeners.push(
          portalService.listenToCategory<PortalLocationData>(projectId, 'locations', (data) => {
            set({ locations: data, isDirty: false });
          })
        );
        newListeners.push(
          portalService.listenToCategory<PortalGroupShotData>(projectId, 'groupShots', (data) => {
            set({ groupShots: data, isDirty: false });
          })
        );
        newListeners.push(
          portalService.listenToCategory<PortalPhotoRequestData>(projectId, 'photoRequests', (data) => {
            set({ photoRequests: data, isDirty: false });
          })
        );
        newListeners.push(
          portalService.listenToCategory<PortalTimelineData>(projectId, 'timeline', (data) => {
            set({ timeline: data, isDirty: false });
          })
        );

        set({ listeners: newListeners });
      } else {
        // Manual mode: No real-time listeners, data loaded fresh from Firebase
        console.log('Initialized with manual refresh mode - no real-time listeners active');
      }

    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'An unknown error occurred.' });
    } finally {
      set({ isLoading: false });
    }
  },

  setStep: async (stepId: PortalStepID) => {
    const { projectId, accessToken } = get();

    if (!projectId || !accessToken) {
      console.warn('Cannot update step: Portal not properly initialized');
      return;
    }

    try {
      // Update local state immediately for responsive UI
      set({ currentStep: stepId });

      // Save to local storage immediately for instant UI updates
      localStorageUtils.save(STORAGE_KEYS.CURRENT_STEP, stepId);

      // Sync to Firebase when changing steps (one of the sync triggers)
      await portalService.updateCurrentStep(projectId, accessToken, stepId);

    } catch (error) {
      console.error('Error updating current step:', error);
      // Could optionally revert local state or show error to user
    }
  },

  
  skipStep: async (stepId) => {
    const { projectId, accessToken } = get();

    if (!projectId || !accessToken) {
      set({ error: "Cannot skip step: Portal not properly initialized." });
      return;
    }

    set({ isSkipping: true, error: null });

    try {
      // Call the Firebase function to skip the step
      // This handles all updates: portal document, section config, and metadata
      await portalService.skipStep(projectId, accessToken, stepId);

      // Refresh the project data to get updated portal state
      const result = await portalService.getInitialData(projectId, accessToken);
      set({
        project: result,
        currentStep: result.currentStepID, // Firebase function sets this to 'welcome'
        isDirty: false
      });

    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to skip step.' });
    } finally {
      set({ isSkipping: false });
    }
  },

  setShowSaveConfirmation: (show, sectionId) => {
    set({ showSaveConfirmation: show, currentSectionToSave: sectionId || null });
  },

  confirmSaveSection: async () => {
    const { projectId, accessToken, currentSectionToSave, project } = get();
    console.log('confirmSaveSection', projectId, accessToken, currentSectionToSave, project);
    if (!projectId || !accessToken || !currentSectionToSave || !project) {
      set({ error: "Cannot save section: Missing required data." });
      return;
    }
  
    try {
      set({ isSaving: true, showSaveConfirmation: false, error: null });
  
      // Get the current section data using the helper function
      const sectionData = getCurrentSectionData();
      console.log('sectionData', sectionData);
      if (!sectionData) {
        throw new Error("No data to save for this section.");
      }
      
      // Map PortalStepID enum to the expected string type for saveSectionData
      const sectionType = mapStepIdToSectionType(currentSectionToSave);
      console.log('sectionType', sectionType);
      
      // First save the section data (this goes to the appropriate subcollection)
      await portalService.saveSectionData(projectId, accessToken, sectionType, sectionData);

      console.log('updateSectionStatus', projectId, accessToken, currentSectionToSave);
      // Then update the section status in the portal document within the subcollection
      // When client completes section, action passes to photographer for review
      await portalService.updateSectionStatus(projectId, accessToken, currentSectionToSave, SectionStatus.LOCKED, ActionOn.PHOTOGRAPHER);

      // Refresh data by calling getInitialData which now fetches from the updated subcollection structure
      const result = await portalService.getInitialData(projectId, accessToken);
      set({ project: result, currentStep: PortalStepID.WELCOME });
  
      // Reset dirty state and close any modals
      set({ isDirty: false, currentSectionToSave: null });
  
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save section.' });
    } finally {
      set({ isSaving: false });
    }
  },

  // --- LOCAL DATA MUTATORS ---
  // These update local storage temporarily for instant UI updates during editing
  // Firebase sync happens only on explicit save actions or step navigation
  updateKeyPeople: (data: PortalKeyPeopleData) => {
    set({ keyPeople: data, isDirty: true });
    localStorageUtils.save(STORAGE_KEYS.KEY_PEOPLE, data);
  },
  updateLocations: (data: PortalLocationData) => {
    set({ locations: data, isDirty: true });
    localStorageUtils.save(STORAGE_KEYS.LOCATIONS, data);
  },
  updateGroupShots: (data: PortalGroupShotData) => {
    set({ groupShots: data, isDirty: true });
    localStorageUtils.save(STORAGE_KEYS.GROUP_SHOTS, data);
  },
  updatePhotoRequests: (data: PortalPhotoRequestData) => {
    set({ photoRequests: data, isDirty: true });
    localStorageUtils.save(STORAGE_KEYS.PHOTO_REQUESTS, data);
  },
  updateTimeline: (data: PortalTimelineData) => {
    set({ timeline: data, isDirty: true });
    localStorageUtils.save(STORAGE_KEYS.TIMELINE, data);
  },

  // Update saveCurrentStep to show confirmation instead of saving directly
  saveCurrentStep: async () => {
    const { currentStep } = get();
    
    if (currentStep === PortalStepID.WELCOME || currentStep === PortalStepID.THANK_YOU) {
      return;
    }
    
    set({ showSaveConfirmation: true, currentSectionToSave: currentStep });
  },

  clearError: () => set({ error: null }),
  resetSaveSuccess: () => set({ saveSuccess: false }), // Action to reset success state

  /**
   * Manually refresh the current section data from Firebase (single source of truth).
   *
   * USE CASE:
   * - When you want to ensure UI shows the latest Firebase data
   * - After manual saves to confirm changes were persisted
   * - When you suspect local state might be out of sync
   *
   * BEHAVIOR:
   * - Fetches fresh data directly from Firebase
   * - Updates UI with authoritative server state
   * - No localStorage caching for data persistence
   * - Firebase remains the single source of truth
   */
  refreshCurrentSection: async () => {
    const { projectId, currentStep } = get();
    if (!projectId || !currentStep) return;

    try {
      // Map step ID to category name (only for steps that have data categories)
      const categoryMap: Partial<Record<PortalStepID, 'keyPeople' | 'locations' | 'groupShots' | 'photoRequests' | 'timeline'>> = {
        [PortalStepID.KEY_PEOPLE]: 'keyPeople',
        [PortalStepID.LOCATIONS]: 'locations',
        [PortalStepID.GROUP_SHOTS]: 'groupShots',
        [PortalStepID.PHOTO_REQUESTS]: 'photoRequests',
        [PortalStepID.TIMELINE]: 'timeline',
        // WELCOME and THANK_YOU don't have data categories
      };

      const category = categoryMap[currentStep];
      if (!category) return;

      // Fetch fresh data from Firestore using the cost-effective method
      switch (category) {
        case 'keyPeople':
          const keyPeopleData = await portalService.fetchCategoryData<PortalKeyPeopleData>(projectId, category);
          set({ keyPeople: keyPeopleData, isDirty: false });
          break;
        case 'locations':
          const locationsData = await portalService.fetchCategoryData<PortalLocationData>(projectId, category);
          set({ locations: locationsData, isDirty: false });
          break;
        case 'groupShots':
          const groupShotsData = await portalService.fetchCategoryData<PortalGroupShotData>(projectId, category);
          set({ groupShots: groupShotsData, isDirty: false });
          break;
        case 'photoRequests':
          const photoRequestsData = await portalService.fetchCategoryData<PortalPhotoRequestData>(projectId, category);
          set({ photoRequests: photoRequestsData, isDirty: false });
          break;
        case 'timeline':
          const timelineData = await portalService.fetchCategoryData<PortalTimelineData>(projectId, category);
          set({ timeline: timelineData, isDirty: false });
          break;
      }

    } catch (error) {
      console.error('Error refreshing section data:', error);
      set({ error: 'Failed to refresh data. Please try again.' });
    }
  },

  /**
   * Clean up all real-time listeners to reduce Firebase costs
   * Call this when the portal is no longer needed or when switching to manual refresh mode
   */
  cleanupListeners: () => {
    const { listeners } = get();
    listeners.forEach(unsubscribe => unsubscribe());
    set({ listeners: [], realtimeEnabled: false });
  },

  /**
   * Clear all local storage data for the current portal session
   * Useful for logout, session cleanup, or when starting fresh
   */
  clearLocalStorage: () => {
    localStorageUtils.clearAll();
  },

  /**
   * Complete cleanup: listeners + local storage
   * Call this when completely exiting the portal
   */
  cleanup: () => {
    const { listeners } = get();
    listeners.forEach(unsubscribe => unsubscribe());
    localStorageUtils.clearAll();
    set({
      listeners: [],
      realtimeEnabled: false,
      keyPeople: null,
      locations: null,
      groupShots: null,
      photoRequests: null,
      timeline: null,
      isDirty: false
    });
  },

});

// Helper function to get current section data - MOVED OUTSIDE the store
const getCurrentSectionData = (): SaveableData | null => {
  const state = usePortalStore.getState();
  const { currentSectionToSave, keyPeople, locations, groupShots, photoRequests, timeline } = state;
  
  switch (currentSectionToSave) {
    case PortalStepID.KEY_PEOPLE: return keyPeople;
    case PortalStepID.LOCATIONS: return locations;
    case PortalStepID.GROUP_SHOTS: return groupShots;
    case PortalStepID.PHOTO_REQUESTS: return photoRequests;
    case PortalStepID.TIMELINE: return timeline;
    default: return null;
  }
};

// Helper function to map PortalStepID enum to section type string
const mapStepIdToSectionType = (stepId: PortalStepID): 'keyPeople' | 'locations' | 'photoRequests' | 'groupShots' | 'timeline' => {
  switch (stepId) {
    case PortalStepID.KEY_PEOPLE: return 'keyPeople';
    case PortalStepID.LOCATIONS: return 'locations';
    case PortalStepID.GROUP_SHOTS: return 'groupShots';
    case PortalStepID.PHOTO_REQUESTS: return 'photoRequests';
    case PortalStepID.TIMELINE: return 'timeline';
    default: throw new Error(`Unknown section type for step: ${stepId}`);
  }
};

// Export the store
export const usePortalStore = create<PortalState & PortalActions>(storeCreator);

// USAGE GUIDE FOR PORTAL STORE
// =================================================================================
// INITIALIZATION (FIREBASE-FIRST):
// 1a. Basic initialization (recommended):
//    await store.initialize(projectId, token)
//    - Loads fresh data directly from Firebase (single source of truth)
//    - No localStorage data loading for instant UI
//    - Ensures UI always shows authoritative server state
//
// 1b. Real-time initialization (higher cost):
//    await store.initialize(projectId, token, true)
//    - Loads fresh data from Firebase first
//    - Enables real-time listeners for automatic updates
//    - Consumes Firebase resources continuously
//
// DATA MANAGEMENT:
// 2. UI updates: store.updateKeyPeople(data)
//    - Updates UI immediately via temporary localStorage
//    - Marks section as "dirty" for saving
//    - LocalStorage used only for responsive editing experience
//
// 3. Firebase sync triggers:
//    - store.setStep(stepId) - Navigation changes sync to Firebase
//    - store.confirmSaveSection() - User saves sync to Firebase
//    - All data persistence happens through Firebase
//
// COST OPTIMIZATION:
// 4a. Manual refresh:
//    await store.refreshCurrentSection()
//    - Fetches latest data directly from Firebase
//    - Ensures UI matches server state
//    - No ongoing listener costs
//
// 4b. Real-time mode (use sparingly):
//    - Automatic updates via Firebase listeners
//    - Higher cost due to continuous connections
//    - Call cleanupListeners() when not needed
//
// CLEANUP:
// 5. Complete cleanup: store.cleanup()
//    - Stops all listeners (saves costs)
//    - Clears temporary localStorage data
//    - Use when exiting portal completely
//
// DATA FLOW SUMMARY:
// - Firebase is the single source of truth
// - Fresh data loaded from Firebase on initialization
// - LocalStorage used only for temporary UI responsiveness
// - All persistence happens through Firebase sync
// =================================================================================
