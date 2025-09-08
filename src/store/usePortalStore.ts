// src/store/usePortalStore.ts
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
}

// Define the actions that can be performed on the state
interface PortalActions {
  initialize: (projectId: string, token: string) => Promise<void>;
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
}

// Define a union type for the data that can be saved
type SaveableData = PortalKeyPeopleData | PortalLocationData | PortalGroupShotData | PortalPhotoRequestData | PortalTimelineData;


// The store creator function, now fully typed
const storeCreator: StateCreator<PortalState & PortalActions> = (set, get) => ({
  // --- INITIAL STATE ---
  isLoading: true,
  isSaving: false,
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

  // --- ACTIONS ---
  initialize: async (projectId, token) => {
    try {
      set({ isLoading: true, error: null, projectId, accessToken: token });

      const projectData = await portalService.getInitialData(projectId, token);
      set({ project: projectData, currentStep: projectData.currentStepID });

      portalService.listenToCategory<PortalKeyPeopleData>(projectId, 'keyPeople', (data) => set({ keyPeople: data, isDirty: false }));
      portalService.listenToCategory<PortalLocationData>(projectId, 'locations', (data) => set({ locations: data, isDirty: false }));
      portalService.listenToCategory<PortalGroupShotData>(projectId, 'groupShots', (data) => set({ groupShots: data, isDirty: false }));
      portalService.listenToCategory<PortalPhotoRequestData>(projectId, 'photoRequests', (data) => set({ photoRequests: data, isDirty: false }));
      portalService.listenToCategory<PortalTimelineData>(projectId, 'timeline', (data) => set({ timeline: data, isDirty: false }));

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
      
      // Update Firestore with the new current step
      await portalService.updateCurrentStep(projectId, accessToken, stepId);
      
      // Note: Section data is already being listened to via listenToCategory in initialize()
      // So the data will automatically update when the section changes
      
    } catch (error) {
      console.error('Error updating current step:', error);
      // Could optionally revert local state or show error to user
    }
  },

  
  skipStep: async (stepId) => {
    const { projectId, accessToken, project } = get();

    if (!projectId || !accessToken || !project) {
      set({ error: "Cannot skip step: Portal not properly initialized." });
      return;
    }

    // Update the portal step status
    const updatedSteps = project.portalSteps.map(step =>
      step.id === stepId
        ? { ...step, stepStatus: SectionStatus.FINALIZED, actionOn: ActionOn.NONE }
        : step
    );

    const updatedProject = { ...project, portalSteps: updatedSteps };

    set({ isSaving: true, error: null, project: updatedProject });

    try {
      // Save to firestore via portalService
      await portalService.skipStep(projectId, accessToken, stepId);

      // Navigate to next step or welcome
      const steps = [
        PortalStepID.WELCOME, PortalStepID.KEY_PEOPLE, PortalStepID.LOCATIONS,
        PortalStepID.GROUP_SHOTS, PortalStepID.PHOTO_REQUESTS, PortalStepID.TIMELINE,
        PortalStepID.THANK_YOU
      ];
      const currentIndex = steps.indexOf(stepId);
      let nextIndex = currentIndex + 1;

      // Find the next unlocked or in-progress step
      while (nextIndex < steps.length) {
        const nextStepId = steps[nextIndex];
        const nextStep = updatedSteps.find(s => s.id === nextStepId);
        if (nextStep && (nextStep.stepStatus === 'unlocked' || nextStep.stepStatus === 'inProgress')) {
          set({ currentStep: nextStepId });
          return;
        }
        nextIndex++;
      }

      // If no more steps, go back to welcome
      set({ currentStep: PortalStepID.WELCOME });

    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to skip step.' });
    } finally {
      set({ isSaving: false });
    }
  },

  setShowSaveConfirmation: (show, sectionId) => {
    set({ showSaveConfirmation: show, currentSectionToSave: sectionId || null });
  },

  confirmSaveSection: async () => {
    const { projectId, accessToken, currentSectionToSave, project } = get();
    
    if (!projectId || !accessToken || !currentSectionToSave || !project) {
      set({ error: "Cannot save section: Missing required data." });
      return;
    }
  
    try {
      set({ isSaving: true, showSaveConfirmation: false, error: null });
  
      // Get the current section data using the helper function
      const sectionData = getCurrentSectionData();
      if (!sectionData) {
        throw new Error("No data to save for this section.");
      }
      
      // Map PortalStepID enum to the expected string type for saveSectionData
      const sectionType = mapStepIdToSectionType(currentSectionToSave);
      
      // First save the section data
      await portalService.saveSectionData(projectId, accessToken, sectionType, sectionData);
  
      // Then update the section status using the enum value directly
      await portalService.updateSectionStatus(projectId, accessToken, currentSectionToSave);
  
      // Refresh data by calling initialize again
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
  updateKeyPeople: (data) => set({ keyPeople: data, isDirty: true }),
  updateLocations: (data) => set({ locations: data, isDirty: true }),
  updateGroupShots: (data) => set({ groupShots: data, isDirty: true }),
  updatePhotoRequests: (data) => set({ photoRequests: data, isDirty: true }),
  updateTimeline: (data) => set({ timeline: data, isDirty: true }),

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

export const usePortalStore = create<PortalState & PortalActions>(storeCreator);
