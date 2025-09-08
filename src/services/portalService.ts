// src/services/portalService.ts
// TEST VERSION
// GEM-35-PORTAL/src/services/portalService.ts
// import {
//   doc,
//   getDoc,
//   onSnapshot,
//   Unsubscribe,
// } from 'firebase/firestore';
// import { httpsCallable } from 'firebase/functions';
// import { signInWithCustomToken } from 'firebase/auth';
// import { auth, db, functions } from '../lib/firebase'; // Assuming you have a firebase config file
// import {
//   AuthRequest,
//   AuthResponse,
//   ClientProject,
//   PortalGroupShotData,
//   PortalKeyPeopleData,
//   PortalLocationData,
//   PortalPhotoRequestData,
//   PortalTimelineData,
// } from '../types/types';
// import {
//   testProject,
//   testKeyPeople,
//   testLocations,
//   testGroupShots,
//   testPhotoRequests,
//   testTimeline
// } from '../lib/test-data';

// // Define the shape of the data that can be saved.
// // Using a discriminated union to ensure type safety.
// type SaveableData =
//   | { type: 'keyPeople'; data: PortalKeyPeopleData }
//   | { type: 'locations'; data: PortalLocationData }
//   | { type: 'photoRequests'; data: PortalPhotoRequestData }
//   | { type: 'groupShots'; data: PortalGroupShotData }
//   | { type: 'timeline'; data: PortalTimelineData };

// interface SaveClientDataRequest {
//   projectId: string;
//   accessToken: string;
//   section: SaveableData['type'];
//   data: SaveableData['data'];
// }

// // Callable Functions
// const getPortalAuthToken = httpsCallable<AuthRequest, AuthResponse>(functions, 'getPortalAuthToken');
// const saveClientData = httpsCallable<SaveClientDataRequest, void>(functions, 'saveClientData');

// export const portalService = {
//   /**
//    * Authenticates the client and fetches the initial, essential project data.
//    * @param projectId - The ID of the project.
//    * @param token - The client's access token.
//    * @returns A promise that resolves with the client-safe project data.
//    */
//   getInitialData: async (projectId: string, token: string): Promise<ClientProject> => {
//       if (!projectId || !token) {
//           return Promise.resolve(testProject);
//       }
//     try {
//       // Get a custom Firebase auth token from the secure cloud function
//       const result = await getPortalAuthToken({ projectId, accessToken: token });
//       const customToken = result.data.token;

//       if (!customToken) {
//         throw new Error('Authentication failed: No custom token received.');
//       }

//       // Sign in anonymously with the custom token
//       await signInWithCustomToken(auth, customToken);

//       // Fetch the main project document
//       const projectRef = doc(db, 'projects', projectId);
//       const projectSnap = await getDoc(projectRef);

//       if (!projectSnap.exists()) {
//         throw new Error('Project not found.');
//       }

//       const projectData = projectSnap.data();

//       // Shape the data to return only what the client portal needs
//       const clientProject: ClientProject = {
//         id: projectSnap.id,
//         projectName: projectData.projectInfo.projectName,
//         personA: projectData.projectInfo.personA,
//         personB: projectData.projectInfo.personB,
//         eventDate: projectData.projectInfo.eventDate,
//         photographerName: projectData.projectInfo.photographerName,
//         portalMessage: projectData.clientPortal?.portalMessage,
//         currentStepID: projectData.clientPortal?.currentStepID,
//         portalSteps: projectData.clientPortal?.steps || [],
//       };

//       return clientProject;
//     } catch (error) {
//       console.error('Error during initial data fetch:', error);
//       throw new Error('Could not load portal data.');
//     }
//   },

//   /**
//    * Listens for real-time updates to a specific data category (e.g., locations).
//    * @param projectId - The ID of the project.
//    * @param category - The category to listen to.
//    * @param callback - The function to call with the new data.
//    * @returns An unsubscribe function.
//    */
//   listenToCategory<T>(
//     projectId: string,
//     category: 'locations' | 'keyPeople' | 'photoRequests' | 'timeline' | 'groupShots',
//     callback: (data: T) => void
//   ): Unsubscribe {
//       if (!projectId) {
//           const testDataMap = {
//               keyPeople: testKeyPeople,
//               locations: testLocations,
//               groupShots: testGroupShots,
//               photoRequests: testPhotoRequests,
//               timeline: testTimeline,
//           };
//           callback(testDataMap[category] as T);
//           return () => {}; // No-op unsubscribe for test data
//       }
//     // Group shots have a different structure
//     const docPath = category === 'groupShots'
//       ? `projects/${projectId}/groupShotData/groupShot`
//       : `projects/${projectId}/${category}/items`;

//     const docRef = doc(db, docPath);

//     return onSnapshot(docRef, (snap) => {
//       if (snap.exists()) {
//         callback(snap.data() as T);
//       }
//     });
//   },

//   /**
//    * Saves a complete section of data via a secure callable function.
//    * @param projectId - The ID of the project.
//    * @param accessToken - The client's access token for verification.
//    * @param section - The name of the section being saved.
//    * @param data - The data payload for that section.
//    */
//   saveSectionData: async (
//     projectId: string,
//     accessToken: string,
//     section: SaveableData['type'],
//     data: SaveableData['data']
//   ): Promise<void> => {
//       if (!projectId || !accessToken) {
//           console.log(`DEMO MODE: Saving ${section} data:`, data);
//           return Promise.resolve();
//       }
//     try {
//       await saveClientData({ projectId, accessToken, section, data });
//     } catch (error) {
//       console.error(`Error saving ${section} data:`, error);
//       throw new Error(`Failed to save ${section}. Please try again.`);
//     }
//   },

//   /**
//    * Skips a step by marking it as finalized with actionOn set to none.
//    * @param projectId - The ID of the project.
//    * @param accessToken - The client's access token for verification.
//    * @param stepId - The ID of the step to skip.
//    */
//   skipStep: async (
//     projectId: string,
//     accessToken: string,
//     stepId: string
//   ): Promise<void> => {
//       if (!projectId || !accessToken) {
//           console.log(`DEMO MODE: Skipping step ${stepId}`);
//           return Promise.resolve();
//       }
//     try {
//       // Call a cloud function to skip the step
//       const skipStepFunction = httpsCallable<{ projectId: string; accessToken: string; stepId: string }, void>(
//         functions,
//         'skipStep'
//       );
//       await skipStepFunction({ projectId, accessToken, stepId });
//     } catch (error) {
//       console.error(`Error skipping step ${stepId}:`, error);
//       throw new Error(`Failed to skip step. Please try again.`);
//     }
//   },
// };
// LIVE VERSION
import {
    doc,
    getDoc,
    onSnapshot,
    Unsubscribe,
  } from 'firebase/firestore';
  import { httpsCallable } from 'firebase/functions';
  import { signInWithCustomToken } from 'firebase/auth';
  import { auth, db, functions } from '@/lib/firebase'; // Assuming you have a firebase config file
  import {
    AuthRequest,
    AuthResponse,
    ClientProject,
    PortalGroupShotData,
    PortalKeyPeopleData,
    PortalLocationData,
    PortalPhotoRequestData,
    PortalStep,
    PortalTimelineData,
    ClientLocation,
    ClientKeyPerson,
    ClientPhotoRequest,
    ClientGroupShotItem,
    ClientTimelineEvent,
    SectionConfig,
  } from '@/types/types';
  
  // Define the shape of the data that can be saved.
  // Using a discriminated union to ensure type safety.
  type SaveableData =
    | { type: 'keyPeople'; data: PortalKeyPeopleData }
    | { type: 'locations'; data: PortalLocationData }
    | { type: 'photoRequests'; data: PortalPhotoRequestData }
    | { type: 'groupShots'; data: PortalGroupShotData }
    | { type: 'timeline'; data: PortalTimelineData };
  
  
  // Callable Functions
  const getPortalAuthToken = httpsCallable<AuthRequest, AuthResponse>(functions, 'getPortalAuthToken');

  // Individual save functions for each section
  const clientSaveLocations = httpsCallable<{ 
    projectId: string; 
    accessToken: string; 
    locations: ClientLocation[];
    config?: SectionConfig 
  }, { success: boolean }>(functions, 'clientSaveLocations');
  const clientSaveKeyPeople = httpsCallable<{ 
    projectId: string; 
    accessToken: string; 
    people: ClientKeyPerson[]; 
    config?: SectionConfig 
  }, { success: boolean }>(functions, 'clientSaveKeyPeople');
  const clientSavePhotoRequests = httpsCallable<{ 
    projectId: string; 
    accessToken: string; 
    requests: ClientPhotoRequest[]; 
    config?: SectionConfig 
  }, { success: boolean }>(functions, 'clientSavePhotoRequests');
  const clientSaveGroupShotSelections = httpsCallable<{ 
    projectId: string; 
    accessToken: string; 
    allLocalItems: ClientGroupShotItem[];
    config?: SectionConfig
   }, { success: boolean }>(functions, 'clientSaveGroupShotSelections');
  // For timeline, we'll need to handle complete replacement differently
  const clientSaveTimeline = httpsCallable<{ 
    projectId: string; 
    accessToken: string; 
    events: ClientTimelineEvent[]; 
    config?: SectionConfig
   }, { success: boolean }>(functions, 'clientSaveTimeline');

 
  // Combined client portal activity function
  const updateClientPortalActivity = httpsCallable<{
    projectId: string;
    accessToken: string;
    action: 'access' | 'navigate' | 'submit';
    stepId?: string;
    sectionId?: string;
  }, { success: boolean; action: string }>(functions, 'updateClientPortalActivity');

  // Combined photographer section management function
  // Replaces: photographerApproveSection, photographerRequestRevision
  // Benefits: Single function for all photographer actions, better state management
  const photographerManageSection = httpsCallable<{
    projectId: string;
    sectionId: string;
    action: 'approve' | 'request_revision';
    revisionReason?: string;
  }, { success: boolean; action: string }>(functions, 'photographerManageSection');

  // Batch portal operations function
  // Benefits: Handle multiple portal operations in a single atomic transaction
  // Reduces network calls and ensures consistency
  const batchPortalOperations = httpsCallable<{
    projectId: string;
    accessToken: string;
    operations: Array<{
      type: 'track_access' | 'update_step' | 'submit_section';
      data: Record<string, unknown>;
    }>;
  }, { success: boolean; results: Array<{ type: string; success: boolean; error?: string }> }>(functions, 'batchPortalOperations');

  // Enhanced analytics logging function
  // Benefits: Centralized activity logging for better insights
  const logPortalActivity = httpsCallable<{
    projectId: string;
    accessToken: string;
    activityType: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>;
  }, { success: boolean }>(functions, 'logPortalActivity');

  // Skip step function - commented out as it's not implemented in firestore functions
  // const skipStepFunction = httpsCallable<{ projectId: string; accessToken: string; stepId: string }, { success: boolean }>(functions, 'skipStep');
  
  export const portalService = {
    /**
     * Authenticates the client and fetches the initial, essential project data.
     * @param projectId - The ID of the project.
     * @param token - The client's access token.
     * @returns A promise that resolves with the client-safe project data.
     */
    getInitialData: async (projectId: string, token: string): Promise<ClientProject> => {
      try {
        // Get a custom Firebase auth token from the secure cloud function
        const result = await getPortalAuthToken({ projectId, accessToken: token });
        const customToken = result.data.token;
  
        if (!customToken) {
          throw new Error('Authentication failed: No custom token received.');
        }
  
        // Sign in anonymously with the custom token
        await signInWithCustomToken(auth, customToken);

        // Track client access (increment count and update activity timestamp)
        await updateClientPortalActivity({
          projectId,
          accessToken: token,
          action: 'access'
        });
  
        // Fetch the main project document
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);
  
        if (!projectSnap.exists()) {
          throw new Error('Project not found.');
        }
  
        const projectData = projectSnap.data();
        const portalSteps = (projectData.clientPortal?.steps || []).map((step: PortalStep) => ({
          ...step,
          id: step.portalStepID, // Map portalStepID to id
        }));
  
        // Shape the data to return only what the client portal needs
        const clientProject: ClientProject = {
          id: projectSnap.id,
          projectName: projectData.projectInfo.projectName,
          personA: projectData.projectInfo.personA,
          personB: projectData.projectInfo.personB,
          eventDate: projectData.projectInfo.eventDate,
          photographerName: projectData.projectInfo.photographerName,
          portalMessage: projectData.clientPortal?.portalMessage,
          currentStepID: projectData.clientPortal?.currentStepID,
          portalSteps: portalSteps,
        };
  
        return clientProject;
      } catch (error) {
        console.error('Error during initial data fetch:', error);
        throw new Error('Could not load portal data.');
      }
    },
  
    /**
     * Listens for real-time updates to a specific data category (e.g., locations).
     * @param projectId - The ID of the project.
     * @param category - The category to listen to.
     * @param callback - The function to call with the new data.
     * @returns An unsubscribe function.
     */
    listenToCategory<T>(
      projectId: string,
      category: 'locations' | 'keyPeople' | 'photoRequests' | 'timeline' | 'groupShots',
      callback: (data: T) => void
    ): Unsubscribe {
      // Group shots have a different structure
      const docPath = category === 'groupShots'
        ? `projects/${projectId}/groupShotData/groupShot`
        : `projects/${projectId}/${category}/items`;
  
      const docRef = doc(db, docPath);
  
      return onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          callback(snap.data() as T);
        }
      });
    },
  
      /**
   * Saves a complete section of data via a secure callable function.
   * @param projectId - The ID of the project.
   * @param accessToken - The client's access token for verification.
   * @param section - The name of the section being saved.
   * @param data - The data payload for that section.
   */
    saveSectionData: async (
      projectId: string,
      accessToken: string,
      section: SaveableData['type'],
      data: SaveableData['data']
    ): Promise<void> => {
      try {
        switch (section) {
          case 'locations':
            const locationsData = data as PortalLocationData;
            await clientSaveLocations({
              projectId,
              accessToken,
              locations: locationsData.items || [],
              config: locationsData.config // Include config for multipleLocations
            });
            break;

          case 'keyPeople':
            const keyPeopleData = data as PortalKeyPeopleData;
            await clientSaveKeyPeople({
              projectId,
              accessToken,
              people: keyPeopleData.items || [],
              config: keyPeopleData.config
              // items: (data as PortalKeyPeopleData).items || [],
              // config: (data as PortalKeyPeopleData).config || {}
            });
            break;

          case 'photoRequests':
            const photoRequestsData = data as PortalPhotoRequestData;
            await clientSavePhotoRequests({
              projectId,
              accessToken,
              requests: photoRequestsData.items || [],
              config: photoRequestsData.config
              // requests: (data as PortalPhotoRequestData).items || [],
              // config: (data as PortalPhotoRequestData).config || {}
            });
            break;

          case 'groupShots':
            // For group shots, we need to get all items that are checked
            const groupShotData = data as PortalGroupShotData;
            const allLocalItems = (groupShotData.items || []).filter(item => item.checked);
            await clientSaveGroupShotSelections({
              projectId,
              accessToken,
              allLocalItems
            });
            break;

          case 'timeline':
            // Enhanced timeline saving with complete replacement support
            // Benefits: Atomic timeline updates, supports config, better performance
            const timelineData = data as PortalTimelineData;
            await clientSaveTimeline({
              projectId,
              accessToken,
              events: timelineData.items || [],
              config: timelineData.config
            });
            break;

          default:
            throw new Error(`Unknown section: ${section}`);
        }
      } catch (error) {
        console.error(`Error saving ${section} data:`, error);
        throw new Error(`Failed to save ${section}. Please try again.`);
      }
    },

    /**
 * Updates the client's current step in Firestore
 * @param projectId - The ID of the project
 * @param accessToken - The client's access token
 * @param stepId - The step ID to set as current
 */
  updateCurrentStep: async (
    projectId: string,
    accessToken: string,
    stepId: string
  ): Promise<void> => {
    try {
      await updateClientPortalActivity({
        projectId,
        accessToken,
        action: 'navigate',
        stepId
      });
    } catch (error) {
      console.error(`Error updating current step to ${stepId}:`, error);
      throw new Error('Failed to update current step.');
    }
  },

  /**
   * Skips a step by marking it as finalized with actionOn set to none.
   * @param projectId - The ID of the project.
   * @param accessToken - The client's access token for verification.
   * @param stepId - The ID of the step to skip.
   */
  skipStep: async (
    projectId: string,
    accessToken: string,
    stepId: string
  ): Promise<void> => {
    // Skip step function is not implemented in firestore functions yet
    // For now, we'll throw an error
    console.warn(`Skip step functionality not implemented for step: ${stepId}`);
    throw new Error(`Skip step functionality is not yet available. Please contact support.`);
  },

  // Add method
  updateSectionStatus: async (
    projectId: string,
    accessToken: string,
    sectionId: string
  ): Promise<void> => {
    try {
      await updateClientPortalActivity({
        projectId,
        accessToken,
        action: 'submit',
        sectionId
      });
    } catch (error) {
      console.error(`Error updating section status for ${sectionId}:`, error);
      throw new Error('Failed to update section status.');
    }
  },

  /**
   * Photographer section management - approve or request revision
   * Benefits: Single function for all photographer actions, better state management
   * @param projectId - The ID of the project
   * @param sectionId - The section to manage
   * @param action - 'approve' or 'request_revision'
   * @param revisionReason - Required if action is 'request_revision'
   */
  photographerManageSection: async (
    projectId: string,
    sectionId: string,
    action: 'approve' | 'request_revision',
    revisionReason?: string
  ): Promise<{ success: boolean; action: string }> => {
    try {
      const result = await photographerManageSection({
        projectId,
        sectionId,
        action,
        revisionReason
      });
      return result.data;
    } catch (error) {
      console.error(`Error managing section ${sectionId} with action ${action}:`, error);
      throw new Error(`Failed to ${action} section.`);
    }
  },

  /**
   * Batch portal operations - handle multiple operations atomically
   * Benefits: Reduces network calls, ensures consistency across operations
   * @param projectId - The ID of the project
   * @param accessToken - Client access token
   * @param operations - Array of operations to perform
   */
  batchPortalOperations: async (
    projectId: string,
    accessToken: string,
    operations: Array<{
      type: 'track_access' | 'update_step' | 'submit_section';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: any;
    }>
  ): Promise<{ success: boolean; results: Array<{ type: string; success: boolean; error?: string }> }> => {
    try {
      const result = await batchPortalOperations({
        projectId,
        accessToken,
        operations
      });
      return result.data;
    } catch (error) {
      console.error('Error performing batch portal operations:', error);
      throw new Error('Failed to perform batch operations.');
    }
  },

  /**
   * Enhanced analytics logging for better insights
   * Benefits: Centralized activity tracking, session management, user behavior insights
   * @param projectId - The ID of the project
   * @param accessToken - Client access token
   * @param activityType - Type of activity being logged
   * @param metadata - Additional metadata for the activity
   */
  logPortalActivity: async (
    projectId: string,
    accessToken: string,
    activityType: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>
  ): Promise<{ success: boolean }> => {
    try {
      const result = await logPortalActivity({
        projectId,
        accessToken,
        activityType,
        metadata
      });
      return result.data;
    } catch (error) {
      console.error(`Error logging portal activity ${activityType}:`, error);
      // Don't throw error for logging failures to avoid disrupting user flow
      return { success: false };
    }
  },
};
  