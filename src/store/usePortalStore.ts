// src/store/usePortalStore.ts
import { create, StateCreator } from 'zustand';
import { portalService } from '../services/portalService';
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
} from '../types/types';

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

  setStep: (stepId) => {
    set({ currentStep: stepId });
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

  // --- LOCAL DATA MUTATORS ---
  updateKeyPeople: (data) => set({ keyPeople: data, isDirty: true }),
  updateLocations: (data) => set({ locations: data, isDirty: true }),
  updateGroupShots: (data) => set({ groupShots: data, isDirty: true }),
  updatePhotoRequests: (data) => set({ photoRequests: data, isDirty: true }),
  updateTimeline: (data) => set({ timeline: data, isDirty: true }),

  saveCurrentStep: async () => {
    const { projectId, accessToken, currentStep, keyPeople, locations, groupShots, photoRequests, timeline } = get();

    if (!projectId || !accessToken) {
        if (!get().project) {
            set({ error: "Cannot save: Portal not properly initialized." });
            return;
        }
    }

    let dataToSave: SaveableData | null = null;
    let category: PortalStepID | null = null;
    switch (currentStep) {
      case PortalStepID.KEY_PEOPLE:    dataToSave = keyPeople; category = PortalStepID.KEY_PEOPLE; break;
      case PortalStepID.LOCATIONS:     dataToSave = locations; category = PortalStepID.LOCATIONS; break;
      case PortalStepID.GROUP_SHOTS:   dataToSave = groupShots; category = PortalStepID.GROUP_SHOTS; break;
      case PortalStepID.PHOTO_REQUESTS: dataToSave = photoRequests; category = PortalStepID.PHOTO_REQUESTS; break;
      case PortalStepID.TIMELINE:      dataToSave = timeline; category = PortalStepID.TIMELINE; break;
      default:
        console.warn(`No save action defined for step: ${currentStep}`);
        return;
    }

    if (!dataToSave || !category) {
      console.warn(`No data to save for step: ${currentStep}`);
      return;
    }

    set({ isSaving: true, error: null });
    try { 
      await portalService.saveSectionData(projectId || '', accessToken || '', category, dataToSave);
      set({ isDirty: false, saveSuccess: true }); // Set success state on successful save
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to save data.' });
      throw err;
    } finally {
      set({ isSaving: false });
    }
  },

  clearError: () => set({ error: null }),
  resetSaveSuccess: () => set({ saveSuccess: false }), // Action to reset success state
});

export const usePortalStore = create<PortalState & PortalActions>(storeCreator);
