// src/lib/projectService.ts
// This service is updated to use the new direct HTTP Cloud Function endpoint for authentication.

import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  Unsubscribe,
} from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { auth, db } from './firebase'; // We don't need 'functions' for this method
import { ProjectData, PersonWithRole, LocationFull, GroupShot, PhotoRequest, TimelineEvent } from '@/types';

export const projectService = {
  /**
   * Authenticates the portal by calling the new HTTP endpoint to get a custom token,
   * then fetches the initial project data.
   */
  getProjectData: async (projectId: string, token: string): Promise<ProjectData> => {
    console.log(`Authenticating with HTTP endpoint for projectId: ${projectId}`);

    // 1. Construct the new HTTP endpoint URL
    const url = `https://us-central1-eyedooapp.cloudfunctions.net/getPortalAuthTokenHttp?project=${projectId}&token=${token}`;

    try {
      // 2. Make a direct fetch request to your new function
      const response = await fetch(url);

      // 3. Check for any network or function errors
      if (!response.ok) {
        // Try to parse the error message from the function's response
        const errorData = await response.json();
        throw new Error(errorData.error || `Authentication failed with status: ${response.status}`);
      }

      // 4. Parse the JSON response to get the custom token
      const { token: customToken } = await response.json();

      if (!customToken) {
        throw new Error("Could not retrieve a valid authentication token from the HTTP endpoint.");
      }

      // 5. Use the retrieved token to sign in to Firebase (this part is the same)
      await signInWithCustomToken(auth, customToken);
      console.log("Portal successfully authenticated via HTTP endpoint.");

      // 6. Fetch the initial project document
      const projectRef = doc(db, 'projects', projectId);
      const docSnap = await getDoc(projectRef);

      if (!docSnap.exists()) {
        throw new Error("Project not found.");
      }

      return docSnap.data() as ProjectData;

    } catch (error) {
      console.error("Portal authentication error:", error);
      // Re-throw the error so the UI can catch it and display a message
      throw error;
    }
  },

  /**
   * Sets up a real-time listener on the project document.
   */
  listenToProjectUpdates: (projectId: string, callback: (data: ProjectData) => void): Unsubscribe => {
    const projectRef = doc(db, 'projects', projectId);
    
    const unsubscribe = onSnapshot(projectRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as ProjectData);
      }
    });

    return unsubscribe;
  },

  /**
   * Updates the portal's current step in Firestore.
   */
  updatePortalStatus: async (projectId: string, newStep: number): Promise<void> => {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      'portalStatus.currentStep': newStep,
      'portalStatus.lastUpdated': serverTimestamp(),
    });
  },

  // --- Functions to add data to arrays in Firestore ---

  addPerson: async (projectId: string, newPerson: Omit<PersonWithRole, 'id'>): Promise<void> => {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, { 'peopleInfo.weddingParty': arrayUnion(newPerson) });
  },

  addLocation: async (projectId: string, newLocation: Omit<LocationFull, 'id'>): Promise<void> => {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, { locationInfo: arrayUnion(newLocation) });
  },

  addGroup: async (projectId: string, newGroup: Omit<GroupShot, 'id'>): Promise<void> => {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, { groupShots: arrayUnion(newGroup) });
  },

  addPhotoRequest: async (projectId: string, newRequest: Omit<PhotoRequest, 'id'>): Promise<void> => {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, { 'photoInfo.photoRequests': arrayUnion(newRequest) });
  },

  addTimelineEvent: async (projectId: string, newEvent: Omit<TimelineEvent, 'id'>): Promise<void> => {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, { 'timeline.events': arrayUnion(newEvent) });
  },
};
