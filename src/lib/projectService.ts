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
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from './firebase';
import { ProjectData, PersonWithRole, LocationFull, GroupShot, PhotoRequest, TimelineEvent } from '@/types';

const getPortalAuthToken = httpsCallable<{ projectId: string; accessToken: string }, { token: string }>(functions, 'getPortalAuthToken');

export const projectService = {
  getProjectData: async (projectId: string, token: string): Promise<ProjectData> => {
    const result = await getPortalAuthToken({ projectId, accessToken: token });
    const customToken = result.data.token;
    if (!customToken) throw new Error("Could not retrieve a valid authentication token.");
    
    await signInWithCustomToken(auth, customToken);
    
    const projectRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(projectRef);
    if (!docSnap.exists()) throw new Error("Project not found.");

    return docSnap.data() as ProjectData;
  },

  listenToProjectUpdates: (projectId: string, callback: (data: ProjectData) => void): Unsubscribe => {
    const projectRef = doc(db, 'projects', projectId);
    return onSnapshot(projectRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as ProjectData);
      }
    });
  },

  updatePortalStatus: async (projectId: string, newStep: number): Promise<void> => {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      'portalStatus.currentStep': newStep,
      'portalStatus.lastUpdated': serverTimestamp(),
    });
  },

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