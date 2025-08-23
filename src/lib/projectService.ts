// src/lib/projectService.ts
import {
  AuthRequest,
  AuthResponse,
  ClientGroupShotItemFull,
  ClientKeyPersonFull,
  ClientLocationFull,
  ClientPhotoRequestItemFull,
  ClientTimelineEventFull,
  KeyPeopleConfig,
  LocationConfig,
  PhotoRequestConfig,
  PortalGroupShotData,
  PortalKeyPeopleData,
  PortalLocationData,
  PortalPhotoRequestData,
  PortalTimelineData,
  Project,
  TimelineConfig,
  SaveLocationRequest,
  SaveKeyPeopleRequest,
  SavePhotoRequestRequest,
  UpdateGroupShotsRequest,
  AddTimelineEventRequest,
  FirestoreTimestamp,
} from '@/types';
import { signInWithCustomToken } from 'firebase/auth';
import {
  Unsubscribe,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from './firebase';

// Utility to strip undefined fields from payloads (Firestore forbids undefined)
const stripUndefined = <T extends object>(obj: T): T => {
  const cleaned = {} as T;
  const source = obj as Record<string, unknown>;
  Object.keys(source).forEach((key) => {
    const value = source[key];
    if (value !== undefined) {
      (cleaned as Record<string, unknown>)[key] = value;
    }
  });
  return cleaned;
};

// Utility to convert Firestore timestamps to JavaScript Dates
const convertTimestamp = (timestamp: unknown): Date => {
  if (timestamp && typeof (timestamp as FirestoreTimestamp).toDate === 'function') {
    return (timestamp as FirestoreTimestamp).toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp as string | number);
};

// Cloud Function callable references
const getPortalAuthToken = httpsCallable<AuthRequest, AuthResponse>(functions, 'getPortalAuthToken');
const saveClientLocations = httpsCallable<SaveLocationRequest, void>(functions, 'saveClientLocations');
const saveClientKeyPeople = httpsCallable<SaveKeyPeopleRequest, void>(functions, 'saveClientKeyPeople');
const saveClientPhotoRequests = httpsCallable<SavePhotoRequestRequest, void>(functions, 'saveClientPhotoRequests');
const updateClientGroupShotSelections = httpsCallable<UpdateGroupShotsRequest, void>(functions, 'updateClientGroupShotSelections');
const addClientTimelineEvent = httpsCallable<AddTimelineEventRequest, void>(functions, 'addClientTimelineEvent');

export const projectService = {
  // Authenticate via Cloud Function and fetch top-level project data
  getProjectData: async (projectId: string, token: string): Promise<Project> => {
    try {
      // Call the secure callable function to get a custom token
      const result = await getPortalAuthToken({ projectId, accessToken: token });
      const customToken = result.data.token;

      if (!customToken) {
        throw new Error('No custom token returned from authentication function.');
      }

      // Sign in the user with the custom token
      await signInWithCustomToken(auth, customToken);

      // Now that the user is authenticated, they can fetch the project data directly
      const projectRef = doc(db, 'projects', projectId);
      const snap = await getDoc(projectRef);
      if (!snap.exists()) {
        throw new Error('Project not found');
      }
      return snap.data() as Project;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  },

  // Project header updates if needed
  listenToProjectUpdates: (projectId: string, cb: (data: Project) => void): Unsubscribe => {
    const ref = doc(db, 'projects', projectId);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) cb(snap.data() as Project);
    });
  },

  // --- LOCATIONS ---
  listenToLocationUpdates: (projectId: string, callback: (data: PortalLocationData) => void): Unsubscribe => {
    const configRef = doc(db, 'projects', projectId, 'locations', 'config');
    const itemsRef = doc(db, 'projects', projectId, 'locations', 'items');

    const cachedData: Partial<PortalLocationData> = {};

    const u1 = onSnapshot(configRef, (snap) => {
      // Get the config data, or provide a default if it doesn't exist
      cachedData.config = snap.exists()
        ? (snap.data() as LocationConfig)
        : { 
            multipleLocations: false, 
            updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0, toDate: () => new Date() } as FirestoreTimestamp
          };
      
      // If we already have the items, call the callback
      if (cachedData.items !== undefined) {
        callback(cachedData as PortalLocationData);
      }
    });

    const u2 = onSnapshot(itemsRef, (snap) => {
      // Get the list of items, or an empty array if it doesn't exist
      cachedData.items = snap.exists() ? ((snap.data().list || []) as ClientLocationFull[]) : [];
      
      // If we already have the config, call the callback
      if (cachedData.config !== undefined) {
        callback(cachedData as PortalLocationData);
      }
    });

    // Return a function that will unsubscribe from both listeners
    return () => {
      u1();
      u2();
    };
  },

  addLocation: async (projectId: string, accessToken: string, newLocation: Omit<ClientLocationFull, 'id'>): Promise<void> => {
    try {
      await saveClientLocations({ projectId, accessToken, newLocation });
    } catch (error) {
      console.error('Error adding location:', error);
      throw error;
    }
  },

  // --- KEY PEOPLE ---
  listenToKeyPeopleUpdates: (projectId: string, cb: (data: PortalKeyPeopleData) => void): Unsubscribe => {
    const configRef = doc(db, 'projects', projectId, 'keyPeople', 'config');
    const itemsRef = doc(db, 'projects', projectId, 'keyPeople', 'items');
    const cachedData: Partial<PortalKeyPeopleData> = {};

    const u1 = onSnapshot(configRef, (snap) => {
      cachedData.config = snap.exists() 
        ? (snap.data() as KeyPeopleConfig) 
        : { updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0, toDate: () => new Date() } as FirestoreTimestamp };
      if (cachedData.items) cb(cachedData as PortalKeyPeopleData);
    });
    const u2 = onSnapshot(itemsRef, (snap) => {
      cachedData.items = snap.exists() ? ((snap.data().list || []) as ClientKeyPersonFull[]) : [];
      if (cachedData.config) cb(cachedData as PortalKeyPeopleData);
    });
    return () => { u1(); u2(); };
  },

  addKeyPerson: async (projectId: string, accessToken: string, newPerson: Omit<ClientKeyPersonFull, 'id'>): Promise<void> => {
    try {
      await saveClientKeyPeople({ projectId, accessToken, newPerson });
    } catch (error) {
      console.error('Error adding key person:', error);
      throw error;
    }
  },

  // --- PHOTO REQUESTS ---
  listenToPhotoRequestUpdates: (projectId: string, cb: (data: PortalPhotoRequestData) => void): Unsubscribe => {
    const configRef = doc(db, 'projects', projectId, 'photoRequests', 'config');
    const itemsRef = doc(db, 'projects', projectId, 'photoRequests', 'items');
    const cachedData: Partial<PortalPhotoRequestData> = {};

    const u1 = onSnapshot(configRef, (snap) => {
      cachedData.config = snap.exists() 
        ? (snap.data() as PhotoRequestConfig) 
        : { updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0, toDate: () => new Date() } as FirestoreTimestamp };
      if (cachedData.items) cb(cachedData as PortalPhotoRequestData);
    });
    const u2 = onSnapshot(itemsRef, (snap) => {
      cachedData.items = snap.exists() ? ((snap.data().list || []) as ClientPhotoRequestItemFull[]) : [];
      if (cachedData.config) cb(cachedData as PortalPhotoRequestData);
    });
    return () => { u1(); u2(); };
  },

  addPhotoRequest: async (projectId: string, accessToken: string, newRequest: Omit<ClientPhotoRequestItemFull, 'id'>): Promise<void> => {
    try {
      await saveClientPhotoRequests({ projectId, accessToken, newRequest });
    } catch (error) {
      console.error('Error adding photo request:', error);
      throw error;
    }
  },

  // --- GROUP SHOTS ---
  // Schema-compliant single document approach: projects/{projectId}/groupShotData/groupShot
  listenToGroupShotData: (projectId: string, cb: (data: PortalGroupShotData) => void): Unsubscribe => {
    const groupShotRef = doc(db, 'projects', projectId, 'groupShotData', 'groupShot');
    
    return onSnapshot(groupShotRef, (snap) => {
      if (snap.exists()) {
        const groupShotData = snap.data() as PortalGroupShotData;
        cb(groupShotData);
      } else {
        // Provide default structure if document doesn't exist
        const defaultData: PortalGroupShotData = {
          config: {
            totalTimeEstimated: 0,
            updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0, toDate: () => new Date() } as FirestoreTimestamp
          },
          categories: [],
          items: []
        };
        cb(defaultData);
      }
    });
  },

  updateGroupShotSelections: async (projectId: string, accessToken: string, updatedItems: ClientGroupShotItemFull[]): Promise<void> => {
    try {
      await updateClientGroupShotSelections({ projectId, accessToken, updatedItems });
    } catch (error) {
      console.error('Error updating group shot selections:', error);
      throw error;
    }
  },

  // --- TIMELINE ---
  listenToTimelineUpdates: (projectId: string, cb: (data: PortalTimelineData) => void): Unsubscribe => {
    const configRef = doc(db, 'projects', projectId, 'timeline', 'config');
    const itemsRef = doc(db, 'projects', projectId, 'timeline', 'items');
    const cachedData: Partial<PortalTimelineData> = {};

    const u1 = onSnapshot(configRef, (snap) => {
      cachedData.config = snap.exists() 
        ? (snap.data() as TimelineConfig) 
        : { 
            eventDate: { seconds: Date.now() / 1000, nanoseconds: 0, toDate: () => new Date() } as FirestoreTimestamp,
            updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0, toDate: () => new Date() } as FirestoreTimestamp
          };
      if (cachedData.items) cb(cachedData as PortalTimelineData);
    });
    const u2 = onSnapshot(itemsRef, (snap) => {
      cachedData.items = snap.exists() ? ((snap.data().list || []) as ClientTimelineEventFull[]) : [];
      if (cachedData.config) cb(cachedData as PortalTimelineData);
    });
    return () => { u1(); u2(); };
  },

  addTimelineEvent: async (projectId: string, accessToken: string, newEvent: Omit<ClientTimelineEventFull, 'id'>): Promise<void> => {
    try {
      await addClientTimelineEvent({ projectId, accessToken, newEvent });
    } catch (error) {
      console.error('Error adding timeline event:', error);
      throw error;
    }
  },

  // --- UTILITY FUNCTIONS ---
  
  // Helper to check if a section is editable by the client
  isSectionEditable: (config: { finalized?: boolean; locked?: boolean }): boolean => {
    return !config?.finalized && !config?.locked;
  },

  // Convert Firestore timestamp to Date
  convertTimestamp,

  // Legacy functions for backward compatibility during migration
  // These should be removed once all components are updated

  // Draft save functions (deprecated - should use Cloud Functions)
  saveKeyPeopleDraft: async (projectId: string, config: KeyPeopleConfig, items: ClientKeyPersonFull[]): Promise<void> => {
    console.warn('saveKeyPeopleDraft is deprecated. Use Cloud Functions instead.');
    const itemsRef = doc(db, 'projects', projectId, 'keyPeople', 'items');
    const configRef = doc(db, 'projects', projectId, 'keyPeople', 'config');
    const batch = writeBatch(db);
    batch.set(itemsRef, { list: items }, { merge: true });
    batch.set(configRef, { ...stripUndefined(config), updatedAt: serverTimestamp() }, { merge: true });
    await batch.commit();
  },

  savePhotoRequestsDraft: async (projectId: string, config: PhotoRequestConfig, items: ClientPhotoRequestItemFull[]): Promise<void> => {
    console.warn('savePhotoRequestsDraft is deprecated. Use Cloud Functions instead.');
    const itemsRef = doc(db, 'projects', projectId, 'photoRequests', 'items');
    const configRef = doc(db, 'projects', projectId, 'photoRequests', 'config');
    const batch = writeBatch(db);
    batch.set(itemsRef, { list: items }, { merge: true });
    batch.set(configRef, { ...stripUndefined(config), updatedAt: serverTimestamp() }, { merge: true });
    await batch.commit();
  },

  submitSection: async (projectId: string, section: 'locations' | 'keyPeople' | 'photoRequests' | 'timeline' | 'groupShots'): Promise<void> => {
    console.warn('submitSection is deprecated. Use Cloud Functions instead.');
    const configRef = doc(db, 'projects', projectId, section, 'config');
    await setDoc(
      configRef,
      { locked: true, updatedAt: serverTimestamp(), clientLastViewed: serverTimestamp() },
      { merge: true }
    );
  },

  // Missing legacy methods for backward compatibility
  updatePortalStatus: async (projectId: string, currentStep: number): Promise<void> => {
    console.warn('updatePortalStatus is deprecated.');
    const ref = doc(db, 'projects', projectId);
    await setDoc(ref, {
      'portalStatus.currentStep': currentStep,
      'portalStatus.lastUpdated': serverTimestamp(),
    }, { merge: true });
  },

  saveLocations: async (projectId: string, locations: ClientLocationFull[]): Promise<void> => {
    console.warn('saveLocations direct method is deprecated. Use Cloud Functions instead.');
    const itemsRef = doc(db, 'projects', projectId, 'locations', 'items');
    const configRef = doc(db, 'projects', projectId, 'locations', 'config');
    const batch = writeBatch(db);
    batch.set(itemsRef, { list: locations });
    batch.set(configRef, {
      updatedAt: serverTimestamp(),
      clientLastViewed: serverTimestamp(),
    }, { merge: true });
    await batch.commit();
  },
};