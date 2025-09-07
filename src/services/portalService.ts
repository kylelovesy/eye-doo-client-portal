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
  } from '@/types/types';
  
  // Define the shape of the data that can be saved.
  // Using a discriminated union to ensure type safety.
  type SaveableData =
    | { type: 'keyPeople'; data: PortalKeyPeopleData }
    | { type: 'locations'; data: PortalLocationData }
    | { type: 'photoRequests'; data: PortalPhotoRequestData }
    | { type: 'groupShots'; data: PortalGroupShotData }
    | { type: 'timeline'; data: PortalTimelineData };
  
  interface SaveClientDataRequest {
    projectId: string;
    accessToken: string;
    section: SaveableData['type'];
    data: SaveableData['data'];
  }
  
  // Callable Functions
  const getPortalAuthToken = httpsCallable<AuthRequest, AuthResponse>(functions, 'getPortalAuthToken');
  const saveClientData = httpsCallable<SaveClientDataRequest, void>(functions, 'saveClientData');
  
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
      await saveClientData({ projectId, accessToken, section, data });
    } catch (error) {
      console.error(`Error saving ${section} data:`, error);
      throw new Error(`Failed to save ${section}. Please try again.`);
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
    try {
      // Call a cloud function to skip the step
      const skipStepFunction = httpsCallable<{ projectId: string; accessToken: string; stepId: string }, void>(
        functions,
        'skipStep'
      );
      await skipStepFunction({ projectId, accessToken, stepId });
    } catch (error) {
      console.error(`Error skipping step ${stepId}:`, error);
      throw new Error(`Failed to skip step. Please try again.`);
    }
  },
};
  