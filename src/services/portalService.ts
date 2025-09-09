// LIVE VERSION - UPDATED FOR NEW SUBCOLLECTION STRUCTURE
// =================================================================================
// FIREBASE DATA STRUCTURE OVERVIEW:
//
// MAIN PROJECT DOCUMENT: projects/{projectId}
// - Contains basic project information (projectInfo, photographer details, etc.)
// - Contains portal metadata (portalId reference, launch status, etc.)
// - NO LONGER contains the client portal configuration
//
// PORTAL SUBCOLLECTION: projects/{projectId}/clientPortals/default-portal
// - Contains complete portal configuration and state
// - steps: Array of portal steps with their current status
// - metadata: Client access tracking and completion statistics
// - currentStepID: Current active step for the client
// - portalMessage: Welcome message and instructions
// - Access control: isEnabled, accessToken, portalUrl
//
// SECTION DATA COLLECTIONS: projects/{projectId}/{sectionName}/items
// - keyPeople: Client key people data
// - locations: Event location information
// - photoRequests: Custom photo request details
// - groupShots: Group shot selections and categories
// - timeline: Event timeline with scheduled activities
//
// COST-CONSCIOUS DESIGN:
// - listenToCategory() provides real-time listeners (use only when necessary)
// - fetchCategoryData() provides one-time data fetching (cost-effective default)
// - listenToPortalData() provides portal document real-time updates (optional)
// - Choose the appropriate method based on your cost and performance requirements
// =================================================================================

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
    ActionOn,
    PortalStepID,
    SectionStatus,
    PortalSubcollection,
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

 
  const trackClientAccess = httpsCallable<{ 
    projectId: string; 
    accessToken: string 
  }, { success: boolean }>(functions, 'trackClientAccess');

  const updateClientCurrentStep = httpsCallable<{ 
    projectId: string; 
    accessToken: string; 
    stepId: string 
  }, { success: boolean }>(functions, 'updateClientCurrentStep');

  // Add callable function
  const updateSectionStatus = httpsCallable<{
    projectId: string;
    accessToken: string;
    stepId: PortalStepID;
    status: SectionStatus;
    actionOn: ActionOn;
  }, { success: boolean }>(functions, 'updateSectionStatus');

  // Skip step function
  const clientSkipStep = httpsCallable<{
    projectId: string;
    accessToken: string;
    stepId: string;
  }, { success: boolean }>(functions, 'clientSkipStep');

  // Skip step function - commented out as it's not implemented in firestore functions
  // const skipStepFunction = httpsCallable<{ projectId: string; accessToken: string; stepId: string }, { success: boolean }>(functions, 'skipStep');
  
  export const portalService = {
    /**
     * Authenticates the client and fetches the initial, essential project data.
     *
     * DATA FETCHING STRATEGY:
     * 1. Authenticate client with custom Firebase token
     * 2. Track client access in portal subcollection metadata
     * 3. Fetch basic project info from main project document
     * 4. Fetch portal configuration from clientPortals/default-portal subcollection
     * 5. Merge and return client-safe data structure
     *
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
        await trackClientAccess({ projectId, accessToken: token });

        // Fetch the main project document for basic project info
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
          throw new Error('Project not found.');
        }

        const projectData = projectSnap.data();

        // Fetch the portal document from the new subcollection structure
        const portalRef = doc(db, 'projects', projectId, 'clientPortals', 'default-portal');
        const portalSnap = await getDoc(portalRef);

        if (!portalSnap.exists()) {
          throw new Error('Portal not found. The portal may not be set up yet.');
        }

        const portalData = portalSnap.data();

        // The portal steps are now stored in the portal document's steps array
        const portalSteps = (portalData.steps || []).map((step: PortalStep) => ({
          ...step,
          id: step.portalStepID, // Map portalStepID to id for consistency
        }));

        // Map the portal metadata from the subcollection
        const portalMetadata = portalData.metadata ? {
          clientAccessCount: portalData.metadata.clientAccessCount || 0,
          lastClientActivity: portalData.metadata.lastClientActivity || null,
          totalSteps: portalData.metadata.totalSteps || 0,
          completedSteps: portalData.metadata.completedSteps || 0,
          completionPercentage: portalData.metadata.completionPercentage || 0,
        } : undefined;

        // Shape the data to return only what the client portal needs
        // Portal data now comes from the subcollection document
        const clientProject: ClientProject = {
          id: projectSnap.id,
          projectName: projectData.projectInfo?.projectName || '',
          personA: {
            firstName: projectData.projectInfo?.personA?.firstName || projectData.projectInfo?.personA || '',
            surname: projectData.projectInfo?.personA?.surname || '',
          },
          personB: {
            firstName: projectData.projectInfo?.personB?.firstName || projectData.projectInfo?.personB || '',
            surname: projectData.projectInfo?.personB?.surname || '',
          },
          eventDate: projectData.projectInfo?.eventDate || null,
          photographerName: projectData.projectInfo?.photographerName || '',
          portalMessage: portalData.portalMessage || 'Welcome to your planning portal!',
          currentStepID: portalData.currentStepID || 'welcome',
          portalSteps: portalSteps,
          metadata: portalMetadata,
        };

        return clientProject;
      } catch (error) {
        console.error('Error during initial data fetch:', error);
        throw new Error('Could not load portal data.');
      }
    },

    /**
     * Fetches only the portal-specific data from the clientPortals subcollection.
     *
     * USE CASES:
     * - When you need portal configuration without full project details
     * - For portal status checks or metadata updates
     * - When implementing real-time portal data listeners
     *
     * RETURNS: Complete portal document including:
     * - steps: Array of portal steps with status and configuration
     * - metadata: Client access statistics and completion tracking
     * - currentStepID: Active step for client navigation
     * - Access control settings (isEnabled, portalUrl, etc.)
     *
     * @param projectId - The ID of the project.
     * @returns A promise that resolves with the portal data.
     */
    getPortalData: async (projectId: string): Promise<PortalSubcollection> => {
      try {
        const portalRef = doc(db, 'projects', projectId, 'clientPortals', 'default-portal');
        const portalSnap = await getDoc(portalRef);

        if (!portalSnap.exists()) {
          throw new Error('Portal not found. The portal may not be set up yet.');
        }

        return portalSnap.data() as PortalSubcollection;
      } catch (error) {
        console.error('Error fetching portal data:', error);
        throw new Error('Could not load portal data.');
      }
    },

    /**
     * Listens for real-time updates to a specific data category (e.g., locations).
     *
     * FIREBASE PATHS:
     * - Regular categories: projects/{projectId}/{category}/items
     * - Group shots: projects/{projectId}/groupShotData/groupShot (different structure)
     *
     * COST CONSIDERATIONS:
     * - Real-time listeners consume Firebase resources continuously
     * - Use only when real-time updates are essential
     * - Consider using fetchCategoryData() for one-time fetches instead
     *
     * @param projectId - The ID of the project.
     * @param category - The category to listen to.
     * @param callback - The function to call with the new data.
     * @returns An unsubscribe function to stop the listener.
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
     * Saves a complete section of data via secure Firebase callable functions.
     *
     * DATA STORAGE STRUCTURE:
     * - Saves to: projects/{projectId}/{sectionName}/items
     * - Each section has its own subcollection under the project
     * - Maintains separation between portal configuration and section data
     *
     * SECURITY:
     * - All saves go through Firebase callable functions for validation
     * - Access tokens are verified server-side
     * - Input validation prevents data corruption
     *
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
            // For timeline, we need to save each event individually since the firestore function
            // only supports adding single events with arrayUnion
            // Note: This approach may not be ideal for replacing entire timeline.
            // Consider updating the firestore function to support complete replacement.
            const timelineData = data as PortalTimelineData;
            const timelineEvents = timelineData.items || [];
            if (timelineEvents.length > 0) {
              // Save each event individually (this may create duplicates if events already exist)
              // For now, we'll save the first event as an example
              await clientSaveTimeline({
                projectId,
                accessToken,
                events: timelineEvents
              });
            }
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
     * Manually fetches category data once (cost-effective alternative to real-time listeners)
     * @param projectId - The ID of the project.
     * @param category - The category to fetch.
     * @returns A promise that resolves with the category data.
     */
    fetchCategoryData: async <T>(
      projectId: string,
      category: 'locations' | 'keyPeople' | 'photoRequests' | 'timeline' | 'groupShots'
    ): Promise<T> => {
      try {
        // Group shots have a different structure
        const docPath = category === 'groupShots'
          ? `projects/${projectId}/groupShotData/groupShot`
          : `projects/${projectId}/${category}/items`;

        const docRef = doc(db, docPath);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          return snap.data() as T;
        } else {
          throw new Error(`No data found for category: ${category}`);
        }
      } catch (error) {
        console.error(`Error fetching ${category} data:`, error);
        throw new Error(`Failed to fetch ${category} data`);
      }
    },

    /**
     * Listens for real-time updates to the portal document itself.
     * This is useful for tracking changes to portal metadata, current step, etc.
     * @param projectId - The ID of the project.
     * @param callback - The function to call with the new portal data.
     * @returns An unsubscribe function.
     */
    listenToPortalData: (projectId: string, callback: (data: PortalSubcollection) => void): Unsubscribe => {
      const portalRef = doc(db, 'projects', projectId, 'clientPortals', 'default-portal');
      return onSnapshot(portalRef, (snap) => {
        if (snap.exists()) {
          callback(snap.data() as PortalSubcollection);
        }
      });
    },

    /**
     * Updates the client's current step in the portal document within the subcollection.
     * This calls the Firebase function which updates the currentStepID in the portal subcollection.
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
        // This Firebase function updates the portal document in the subcollection
        await updateClientCurrentStep({ projectId, accessToken, stepId });
      } catch (error) {
        console.error(`Error updating current step to ${stepId}:`, error);
        throw new Error('Failed to update current step.');
      }
    },

  /**
   * Skips a step by marking it as finalized with actionOn set to none.
   * This updates the portal document, section config, and increments completed steps.
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
      await clientSkipStep({
        projectId,
        accessToken,
        stepId
      });
    } catch (error) {
      console.error(`Error skipping step ${stepId}:`, error);
      throw new Error(`Failed to skip step. Please try again.`);
    }
  },

    /**
     * Updates the section status in the portal document within the subcollection.
     * This calls the Firebase function which updates the steps array in the portal subcollection.
     * @param projectId - The ID of the project
     * @param accessToken - The client's access token
     * @param stepId - The step ID to update
     * @param status - The new status for the step
     * @param actionOn - Who should take action next
     */
    updateSectionStatus: async (
      projectId: string,
      accessToken: string,
      stepId: PortalStepID,
      status: SectionStatus,
      actionOn: ActionOn
    ): Promise<void> => {
      try {
        // This Firebase function updates the portal document's steps array in the subcollection
        await updateSectionStatus({ projectId, accessToken, stepId, status, actionOn });
      } catch (error) {
        console.error(`Error updating section status for ${stepId}:`, error);
        throw new Error('Failed to update section status.');
      }
    },
};

// USAGE GUIDE FOR NEW SUBCOLLECTION ARCHITECTURE
// =================================================================================
// INITIALIZATION:
// 1. const projectData = await portalService.getInitialData(projectId, token)
//    - Fetches project info + portal config from subcollection
//    - Authenticates client and tracks access
//
// DATA FETCHING PATTERNS:
// 2a. Real-time listeners (higher cost):
//    const unsubscribe = portalService.listenToCategory(projectId, 'locations', callback)
//
// 2b. One-time fetch (cost-effective):
//    const data = await portalService.fetchCategoryData(projectId, 'locations')
//
// 2c. Portal-only data:
//    const portalData = await portalService.getPortalData(projectId)
//
// SAVING DATA:
// 3. await portalService.saveSectionData(projectId, token, 'locations', locationData)
//    - Saves to projects/{projectId}/locations/items
//    - Updates section status in portal subcollection
//
// NAVIGATION:
// 4. await portalService.updateCurrentStep(projectId, token, 'keyPeople')
//    - Updates currentStepID in portal subcollection
//
// COST OPTIMIZATION:
// - Use fetchCategoryData() for one-time reads instead of listeners
// - Only enable real-time listeners when continuous updates are essential
// - Portal data changes trigger automatic UI updates via store listeners
// =================================================================================
