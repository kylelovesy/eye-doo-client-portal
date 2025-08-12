// src/lib/projectService.ts
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
  Unsubscribe,
  setDoc,
  arrayUnion,
} from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { auth, db } from './firebase';
import {
  ProjectData,
  PortalLocationData,
  ClientLocationFull,
  LocationConfig,
  PortalKeyPeopleData,
  ClientKeyPersonFull,
  KeyPeopleConfig,
  PortalPhotoRequestData,
  ClientPhotoRequestItemFull,
  PhotoRequestConfig,
  PortalGroupShotData,
  GroupShotConfig,
  ClientGroupShotItemFull,
  PortalTimelineData,
  ClientTimelineEventFull,
  TimelineConfig,
  ClientGroupShotCategory,
  PortalStatus,
} from '@/types';

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

export const projectService = {
  // Authenticate via Cloud Function and fetch top-level project data
  getProjectData: async (projectId: string, token: string): Promise<ProjectData> => {
    const url = `https://us-central1-eyedooapp.cloudfunctions.net/getPortalAuthTokenHttp?project=${projectId}&token=${token}`;
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Authentication failed: ${response.status}`);
    }
    const { token: customToken } = await response.json();
    if (!customToken) throw new Error('No custom token returned');

    await signInWithCustomToken(auth, customToken);

    const projectRef = doc(db, 'projects', projectId);
    const snap = await getDoc(projectRef);
    if (!snap.exists()) throw new Error('Project not found');
    return snap.data() as ProjectData;
  },

  // Project header updates if needed
  listenToProjectUpdates: (projectId: string, cb: (data: ProjectData) => void): Unsubscribe => {
    const ref = doc(db, 'projects', projectId);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) cb(snap.data() as ProjectData);
    });
  },

  updatePortalStatus: async (projectId: string, currentStep: number, sectionStates?: PortalStatus['sectionStates']): Promise<void> => {
    const ref = doc(db, 'projects', projectId);
    await updateDoc(ref, {
      'portalStatus.currentStep': currentStep,
      'portalStatus.lastUpdated': serverTimestamp(),
    });
    if (sectionStates) {
      await updateDoc(ref, { 'portalStatus.sectionStates': sectionStates });
    }
  },

  // --- REFACTORED LOCATIONS FUNCTIONS TO MATCH NEW DATA STRUCTURE ---
  listenToLocationUpdates: (projectId: string, callback: (data: PortalLocationData) => void): Unsubscribe => {
    const configRef = doc(db, 'projects', projectId, 'locations', 'config');
    const itemsRef = doc(db, 'projects', projectId, 'locations', 'items');

    const cachedData: Partial<PortalLocationData> = {};

    const u1 = onSnapshot(configRef, (snap) => {
      // Get the config data, or provide a default if it doesn't exist
      cachedData.config = snap.exists()
        ? (snap.data() as LocationConfig)
        : { multipleLocations: false, photographerReviewed: false, finalized: false, status: 'unlocked' };
      
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
  saveLocations: async (projectId: string, locations: ClientLocationFull[]): Promise<void> => {
    // Get references to the two documents we need to update
    const itemsRef = doc(db, 'projects', projectId, 'locations', 'items');
    const configRef = doc(db, 'projects', projectId, 'locations', 'config');

    // Use a write batch to ensure both updates happen atomically (all or nothing)
    const batch = writeBatch(db);

    // 1. Update the 'items' document with the new list of locations.
    //    Using set() here will overwrite any existing data in the document's 'list' field.
    batch.set(itemsRef, { list: locations });

    // 2. Update the 'config' document to lock the section and add timestamps.
    //    We use merge: true to avoid overwriting other config fields like 'multipleLocations'.
    batch.set(configRef, {
      status: 'locked', // <-- Set the status to 'locked'
      updatedAt: serverTimestamp(),
      clientLastViewed: serverTimestamp(),
    }, { merge: true });

    // 3. Commit the batch to execute both writes.
    await batch.commit();
  },

  // Draft save (does not lock) for Key People
  async saveKeyPeopleDraft(projectId: string, config: KeyPeopleConfig, items: ClientKeyPersonFull[]): Promise<void> {
    const itemsRef = doc(db, 'projects', projectId, 'keyPeople', 'items');
    const configRef = doc(db, 'projects', projectId, 'keyPeople', 'config');
    const batch = writeBatch(db);
    batch.set(itemsRef, { list: items }, { merge: true });
    batch.set(configRef, { ...stripUndefined(config), updatedAt: serverTimestamp() }, { merge: true });
    await batch.commit();
  },

  // Draft save (does not lock) for Photo Requests
  async savePhotoRequestsDraft(projectId: string, config: PhotoRequestConfig, items: ClientPhotoRequestItemFull[]): Promise<void> {
    const itemsRef = doc(db, 'projects', projectId, 'photoRequests', 'items');
    const configRef = doc(db, 'projects', projectId, 'photoRequests', 'config');
    const batch = writeBatch(db);
    batch.set(itemsRef, { list: items }, { merge: true });
    batch.set(configRef, { ...stripUndefined(config), updatedAt: serverTimestamp() }, { merge: true });
    await batch.commit();
  },

  // Submit generic: mark config.status = 'locked' for a section
  async submitSection(projectId: string, section: 'locations' | 'keyPeople' | 'photoRequests' | 'timeline' | 'groupShots'): Promise<void> {
    const configRef = doc(db, 'projects', projectId, section, 'config');
    await setDoc(
      configRef,
      { status: 'locked', updatedAt: serverTimestamp(), clientLastViewed: serverTimestamp() },
      { merge: true }
    );
  },

  // Locations
  // listenToLocationUpdates: (projectId: string, cb: (data: PortalLocationData) => void): Unsubscribe => {
  //   const configRef = doc(db, 'projects', projectId, 'locations', 'config');
  //   const itemsRef = doc(db, 'projects', projectId, 'locations', 'items');
  //   const cachedData: Partial<PortalLocationData> = {};

  //   const u1 = onSnapshot(configRef, (snap) => {
  //     cachedData.config = snap.exists() ? (snap.data() as LocationConfig) : { multipleLocations: false, finalized: false, photographerReviewed: false };
  //     if (cachedData.items) cb(cachedData as PortalLocationData);
  //   });
  //   const u2 = onSnapshot(itemsRef, (snap) => {
  //     cachedData.items = snap.exists() ? ((snap.data().list || []) as ClientLocationFull[]) : [];
  //     if (cachedData.config) cb(cachedData as PortalLocationData);
  //   });
  //   return () => { u1(); u2(); };
  // },

  // toggleMultipleLocations: async (projectId: string, multiple: boolean): Promise<void> => {
  //   const configRef = doc(db, 'projects', projectId, 'locations', 'config');
  //   await setDoc(configRef, { multipleLocations: multiple, updatedAt: serverTimestamp(), clientLastViewed: serverTimestamp() }, { merge: true });
  // },

  // addLocation: async (projectId: string, newLocation: Omit<ClientLocationFull, 'id'>): Promise<void> => {
  //   const itemsRef = doc(db, 'projects', projectId, 'locations', 'items');
  //   const configRef = doc(db, 'projects', projectId, 'locations', 'config');
  //   const locationWithId = stripUndefined({ ...newLocation, id: `loc_${Date.now()}` });

  //   const batch = writeBatch(db);
  //   batch.set(itemsRef, { list: arrayUnion(locationWithId) }, { merge: true });
  //   batch.set(configRef, { updatedAt: serverTimestamp(), clientLastViewed: serverTimestamp() }, { merge: true });
  //   await batch.commit();
  // },

  // Key People
  listenToKeyPeopleUpdates: (projectId: string, cb: (data: PortalKeyPeopleData) => void): Unsubscribe => {
    const configRef = doc(db, 'projects', projectId, 'keyPeople', 'config');
    const itemsRef = doc(db, 'projects', projectId, 'keyPeople', 'items');
    const cachedData: Partial<PortalKeyPeopleData> = {};

    const u1 = onSnapshot(configRef, (snap) => {
      cachedData.config = snap.exists() ? (snap.data() as KeyPeopleConfig) : { finalized: false };
      if (cachedData.items) cb(cachedData as PortalKeyPeopleData);
    });
    const u2 = onSnapshot(itemsRef, (snap) => {
      cachedData.items = snap.exists() ? ((snap.data().list || []) as ClientKeyPersonFull[]) : [];
      if (cachedData.config) cb(cachedData as PortalKeyPeopleData);
    });
    return () => { u1(); u2(); };
  },

  addKeyPerson: async (projectId: string, newPerson: Omit<ClientKeyPersonFull, 'id'>): Promise<void> => {
    const itemsRef = doc(db, 'projects', projectId, 'keyPeople', 'items');
    const configRef = doc(db, 'projects', projectId, 'keyPeople', 'config');
    const personWithId = stripUndefined({ ...newPerson, id: `person_${Date.now()}` });

    const batch = writeBatch(db);
    batch.set(itemsRef, { list: arrayUnion(personWithId) }, { merge: true });
    batch.set(configRef, { updatedAt: serverTimestamp(), clientLastViewed: serverTimestamp() }, { merge: true });
    await batch.commit();
  },

  // Photo Requests
  listenToPhotoRequestUpdates: (projectId: string, cb: (data: PortalPhotoRequestData) => void): Unsubscribe => {
    const configRef = doc(db, 'projects', projectId, 'photoRequests', 'config');
    const itemsRef = doc(db, 'projects', projectId, 'photoRequests', 'items');
    const cachedData: Partial<PortalPhotoRequestData> = {};

    const u1 = onSnapshot(configRef, (snap) => {
      cachedData.config = snap.exists() ? (snap.data() as PhotoRequestConfig) : { finalized: false };
      if (cachedData.items) cb(cachedData as PortalPhotoRequestData);
    });
    const u2 = onSnapshot(itemsRef, (snap) => {
      cachedData.items = snap.exists() ? ((snap.data().list || []) as ClientPhotoRequestItemFull[]) : [];
      if (cachedData.config) cb(cachedData as PortalPhotoRequestData);
    });
    return () => { u1(); u2(); };
  },

  addPhotoRequest: async (projectId: string, newRequest: Omit<ClientPhotoRequestItemFull, 'id'>): Promise<void> => {
    const itemsRef = doc(db, 'projects', projectId, 'photoRequests', 'items');
    const configRef = doc(db, 'projects', projectId, 'photoRequests', 'config');
    const requestWithId = stripUndefined({ ...newRequest, id: `request_${Date.now()}` });

    const batch = writeBatch(db);
    batch.set(itemsRef, { list: arrayUnion(requestWithId) }, { merge: true });
    batch.set(configRef, { updatedAt: serverTimestamp(), clientLastViewed: serverTimestamp() }, { merge: true });
    await batch.commit();
  },

  listenToGroupShotData: (projectId: string, cb: (data: PortalGroupShotData) => void): Unsubscribe => {
    // Define paths to the different data documents
    const categoriesRef = doc(db, 'projects', projectId, 'userLists', 'groupShotsCategories');
    const defaultItemsRef = doc(db, 'projects', projectId, 'groupShotsUserList');
    const savedItemsRef = doc(db, 'projects', projectId, 'groupShots', 'items');
    const configRef = doc(db, 'projects', projectId, 'groupShots', 'config');

    let cachedConfig: GroupShotConfig | null = null;
    let cachedCategories: ClientGroupShotCategory[] | null = null;
    let cachedDefaultItems: ClientGroupShotItemFull[] = [];
    let cachedSavedItems: ClientGroupShotItemFull[] = [];

    const dispatchUpdate = () => {
      // Ensure we have all necessary data before proceeding
      if (cachedConfig && cachedCategories) {
        // Merge Logic: Start with the default list. Then, create a Set of saved item IDs for quick lookup.
        // Finally, map over the default list to set the 'checked' status based on whether the item ID exists in the saved list.
        const savedItemIds = new Set(cachedSavedItems.map(item => item.id));
        
        // Custom items are those in savedItems but not in defaultItems
        const customItems = cachedSavedItems.filter(savedItem => 
            !cachedDefaultItems.some(defaultItem => defaultItem.id === savedItem.id)
        );

        const mergedItems = cachedDefaultItems.map(item => ({
          ...item,
          checked: savedItemIds.has(item.id),
        })).concat(customItems); // Add any purely custom items to the list

        cb({
          config: cachedConfig,
          categories: cachedCategories,
          items: mergedItems,
        });
      }
    };
    
    // Listener for Config
    const unsubConfig = onSnapshot(configRef, (snap) => {
      cachedConfig = snap.exists() ? (snap.data() as GroupShotConfig) : { finalized: false, totalTimeEstimated: 0 };
      dispatchUpdate();
    });

    // Listener for Categories
    const unsubCategories = onSnapshot(categoriesRef, (snap) => {
      cachedCategories = snap.exists() ? (snap.data().list as ClientGroupShotCategory[]) : [];
      dispatchUpdate();
    });
    
    // Listener for the Default Item List
    const unsubDefaultItems = onSnapshot(defaultItemsRef, (snap) => {
      cachedDefaultItems = snap.exists() ? (snap.data().list as ClientGroupShotItemFull[]) : [];
      dispatchUpdate();
    });

    // Listener for User's Saved Selections
    const unsubSavedItems = onSnapshot(savedItemsRef, (snap) => {
      cachedSavedItems = snap.exists() ? (snap.data().list as ClientGroupShotItemFull[]) : [];
      dispatchUpdate();
    });

    // Return a function to unsubscribe from all listeners
    return () => {
      unsubConfig();
      unsubCategories();
      unsubDefaultItems();
      unsubSavedItems();
    };
  },

  /**
   * Writes the updated group shot selections back to Firestore.
   * - Saves the list of CHECKED items to '/groupShots/items'.
   * - Saves the config (total time) to '/groupShots/config'.
   */
  updateGroupShotSelections: async (projectId: string, allLocalItems: ClientGroupShotItemFull[]): Promise<void> => {
    // Define the correct paths for writing data
    const itemsRef = doc(db, 'projects', projectId, 'groupShots', 'items');
    const configRef = doc(db, 'projects', projectId, 'groupShots', 'config');
    const batch = writeBatch(db);

    // Filter for only the checked items to save to the user's list
    const checkedItemsToSave = allLocalItems.filter(i => i.checked);

    // Calculate total time based *only* on the checked items
    const totalTimeEstimated = checkedItemsToSave.reduce((sum, i) => sum + (i.time || 0), 0);

    // Set the document with the list of checked items. Using set with merge is safer.
    batch.set(itemsRef, { list: checkedItemsToSave }, { merge: true });

    // Set/update the config document
    batch.set(configRef, {
      totalTimeEstimated,
      updatedAt: serverTimestamp(),
      clientLastViewed: serverTimestamp(),
    }, { merge: true });

    // Commit the batch
    await batch.commit();
  },
  // Timeline
  listenToTimelineUpdates: (projectId: string, cb: (data: PortalTimelineData) => void): Unsubscribe => {
    const configRef = doc(db, 'projects', projectId, 'timeline', 'config');
    const itemsRef = doc(db, 'projects', projectId, 'timeline', 'items');
    const cachedData: Partial<PortalTimelineData> = {};

    const u1 = onSnapshot(configRef, (snap) => {
      cachedData.config = snap.exists() ? (snap.data() as TimelineConfig) : { finalized: false };
      if (cachedData.items) cb(cachedData as PortalTimelineData);
    });
    const u2 = onSnapshot(itemsRef, (snap) => {
      cachedData.items = snap.exists() ? ((snap.data().list || []) as ClientTimelineEventFull[]) : [];
      if (cachedData.config) cb(cachedData as PortalTimelineData);
    });
    return () => { u1(); u2(); };
  },

  addTimelineEvent: async (projectId: string, newEvent: Omit<ClientTimelineEventFull, 'id'>): Promise<void> => {
    const itemsRef = doc(db, 'projects', projectId, 'timeline', 'items');
    const configRef = doc(db, 'projects', projectId, 'timeline', 'config');
    const eventWithId = stripUndefined({ ...newEvent, id: `event_${Date.now()}` });
    
    const batch = writeBatch(db);
    batch.set(itemsRef, { list: arrayUnion(eventWithId) }, { merge: true });
    batch.set(configRef, { updatedAt: serverTimestamp(), clientLastViewed: serverTimestamp() }, { merge: true });
    await batch.commit();
  },
};
// // src/lib/projectService.ts
// import {
//   doc,
//   getDoc,
//   onSnapshot,
//   serverTimestamp,
//   updateDoc,
//   arrayUnion,
//   writeBatch,
//   Unsubscribe,
//   setDoc,
// } from 'firebase/firestore';
// import { signInWithCustomToken } from 'firebase/auth';
// import { auth, db } from './firebase';
// import {
//   ProjectData,
//   PortalLocationData,
//   ClientLocationFull,
//   LocationConfig,
//   PortalKeyPeopleData,
//   ClientKeyPersonFull,
//   KeyPeopleConfig,
//   PortalPhotoRequestData,
//   ClientPhotoRequestItemFull,
//   PhotoRequestConfig,
//   PortalGroupShotData,
//   GroupShotConfig,
//   ClientGroupShotItemFull,
//   PortalTimelineData,
//   ClientTimelineEventFull,
//   TimelineConfig,
// } from '@/types';

// // Utility to strip undefined fields from payloads (Firestore forbids undefined)
// const stripUndefined = <T extends object>(obj: T): T => {
//   const cleaned = {} as T;
//   const source = obj as Record<string, unknown>;
//   Object.keys(source).forEach((key) => {
//     const value = source[key];
//     if (value !== undefined) {
//       (cleaned as Record<string, unknown>)[key] = value;
//     }
//   });
//   return cleaned;
// };

// export const projectService = {
//   // Authenticate via Cloud Function and fetch top-level project data
//   getProjectData: async (projectId: string, token: string): Promise<ProjectData> => {
//     const url = `https://us-central1-eyedooapp.cloudfunctions.net/getPortalAuthTokenHttp?project=${projectId}&token=${token}`;
//     const response = await fetch(url);
//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       throw new Error(errorData.error || `Authentication failed: ${response.status}`);
//     }
//     const { token: customToken } = await response.json();
//     if (!customToken) throw new Error('No custom token returned');

//     await signInWithCustomToken(auth, customToken);

//     const projectRef = doc(db, 'projects', projectId);
//     const snap = await getDoc(projectRef);
//     if (!snap.exists()) throw new Error('Project not found');
//     return snap.data() as ProjectData;
//   },

//   // Project header updates if needed
//   listenToProjectUpdates: (projectId: string, cb: (data: ProjectData) => void): Unsubscribe => {
//     const ref = doc(db, 'projects', projectId);
//     return onSnapshot(ref, (snap) => {
//       if (snap.exists()) cb(snap.data() as ProjectData);
//     });
//   },

//   updatePortalStatus: async (projectId: string, newStep: number): Promise<void> => {
//     const ref = doc(db, 'projects', projectId);
//     await updateDoc(ref, {
//       'portalStatus.currentStep': newStep,
//       'portalStatus.lastUpdated': serverTimestamp(),
//     });
//   },

//   // Locations
//   listenToLocationUpdates: (projectId: string, cb: (data: PortalLocationData) => void): Unsubscribe => {
//     const configRef = doc(db, 'projects', projectId, 'locations', 'config');
//     const itemsRef = doc(db, 'projects', projectId, 'locations', 'items');
//     const cachedData: Partial<PortalLocationData> = {};

//     const u1 = onSnapshot(configRef, (snap) => {
//       if (snap.exists()) cachedData.config = snap.data() as LocationConfig;
//       if (cachedData.items) cb(cachedData as PortalLocationData);
//     });
//     const u2 = onSnapshot(itemsRef, (snap) => {
//       if (snap.exists()) cachedData.items = (snap.data().list || []) as ClientLocationFull[];
//       if (cachedData.config) cb(cachedData as PortalLocationData);
//     });
//     return () => { u1(); u2(); };
//   },

//   toggleMultipleLocations: async (projectId: string, multiple: boolean): Promise<void> => {
//     const configRef = doc(db, 'projects', projectId, 'locations', 'config');
//     try {
//       await updateDoc(configRef, { multipleLocations: multiple, updatedAt: serverTimestamp(), clientLastViewed: serverTimestamp() });
//     } catch {
//       await setDoc(configRef, { multipleLocations: multiple, updatedAt: serverTimestamp(), clientLastViewed: serverTimestamp() }, { merge: true });
//     }
//   },

//   addLocation: async (projectId: string, newLocation: Omit<ClientLocationFull, 'id'>): Promise<void> => {
//     const itemsRef = doc(db, 'projects', projectId, 'locations', 'items');
//     const configRef = doc(db, 'projects', projectId, 'locations', 'config');
//     const locationWithId = stripUndefined({ ...newLocation, id: `loc_${Date.now()}` });
//     try {
//       await updateDoc(itemsRef, { list: arrayUnion(locationWithId) });
//     } catch {
//       await setDoc(itemsRef, { list: [locationWithId] }, { merge: true });
//     }
//     try {
//       await updateDoc(configRef, { updatedAt: serverTimestamp(), clientLastViewed: serverTimestamp() });
//     } catch {
//       await setDoc(configRef, { updatedAt: serverTimestamp(), clientLastViewed: serverTimestamp() }, { merge: true });
//     }
//   },

//   // Key People
//   listenToKeyPeopleUpdates: (projectId: string, cb: (data: PortalKeyPeopleData) => void): Unsubscribe => {
//     const configRef = doc(db, 'projects', projectId, 'keyPeople', 'config');
//     const itemsRef = doc(db, 'projects', projectId, 'keyPeople', 'items');
//     const cachedData: Partial<PortalKeyPeopleData> = {};

//     const u1 = onSnapshot(configRef, (snap) => {
//       if (snap.exists()) cachedData.config = snap.data() as KeyPeopleConfig;
//       if (cachedData.items) cb(cachedData as PortalKeyPeopleData);
//     });
//     const u2 = onSnapshot(itemsRef, (snap) => {
//       if (snap.exists()) cachedData.items = (snap.data().list || []) as ClientKeyPersonFull[];
//       if (cachedData.config) cb(cachedData as PortalKeyPeopleData);
//     });
//     return () => { u1(); u2(); };
//   },

//   addKeyPerson: async (projectId: string, newPerson: Omit<ClientKeyPersonFull, 'id'>): Promise<void> => {
//     const itemsRef = doc(db, 'projects', projectId, 'keyPeople', 'items');
//     const configRef = doc(db, 'projects', projectId, 'keyPeople', 'config');
//     const personWithId = stripUndefined({ ...newPerson, id: `person_${Date.now()}` });
//     try {
//       await updateDoc(itemsRef, { list: arrayUnion(personWithId) });
//     } catch {
//       await setDoc(itemsRef, { list: [personWithId] }, { merge: true });
//     }
//     try {
//       await updateDoc(configRef, { updatedAt: serverTimestamp(), clientLastViewed: serverTimestamp() });
//     } catch {
//       await setDoc(configRef, { updatedAt: serverTimestamp(), clientLastViewed: serverTimestamp() }, { merge: true });
//     }
//   },

//   // Photo Requests
//   listenToPhotoRequestUpdates: (projectId: string, cb: (data: PortalPhotoRequestData) => void): Unsubscribe => {
//     const configRef = doc(db, 'projects', projectId, 'photoRequests', 'config');
//     const itemsRef = doc(db, 'projects', projectId, 'photoRequests', 'items');
//     const cachedData: Partial<PortalPhotoRequestData> = {};

//     const u1 = onSnapshot(configRef, (snap) => {
//       if (snap.exists()) cachedData.config = snap.data() as PhotoRequestConfig;
//       if (cachedData.items) cb(cachedData as PortalPhotoRequestData);
//     });
//     const u2 = onSnapshot(itemsRef, (snap) => {
//       if (snap.exists()) cachedData.items = (snap.data().list || []) as ClientPhotoRequestItemFull[];
//       if (cachedData.config) cb(cachedData as PortalPhotoRequestData);
//     });
//     return () => { u1(); u2(); };
//   },

//   addPhotoRequest: async (projectId: string, newRequest: Omit<ClientPhotoRequestItemFull, 'id'>): Promise<void> => {
//     const itemsRef = doc(db, 'projects', projectId, 'photoRequests', 'items');
//     const configRef = doc(db, 'projects', projectId, 'photoRequests', 'config');
//     const requestWithId = stripUndefined({ ...newRequest, id: `request_${Date.now()}` });
//     try {
//       await updateDoc(itemsRef, { list: arrayUnion(requestWithId) });
//     } catch {
//       await setDoc(itemsRef, { list: [requestWithId] }, { merge: true });
//     }
//     try {
//       await updateDoc(configRef, { updatedAt: serverTimestamp(), clientLastViewed: serverTimestamp() });
//     } catch {
//       await setDoc(configRef, { updatedAt: serverTimestamp(), clientLastViewed: serverTimestamp() }, { merge: true });
//     }
//   },

//   // Group Shots
//   listenToGroupShotData: (projectId: string, cb: (data: PortalGroupShotData) => void): Unsubscribe => {
//     const configRef = doc(db, 'projects', projectId, 'groupShots', 'config');
//     const itemsRef = doc(db, 'projects', projectId, 'groupShots', 'items');
//     const cachedData: Partial<PortalGroupShotData> = {};

//     const u1 = onSnapshot(configRef, (snap) => {
//       if (snap.exists()) cachedData.config = snap.data() as GroupShotConfig;
//       if (cachedData.categories && cachedData.items) cb(cachedData as PortalGroupShotData);
//     });
//     const u2 = onSnapshot(itemsRef, (snap) => {
//       if (snap.exists()) {
//         const d = snap.data();
//         cachedData.categories = d.categories;
//         cachedData.items = d.items;
//       }
//       if (cachedData.config) cb(cachedData as PortalGroupShotData);
//     });
//     return () => { u1(); u2(); };
//   },

//   updateGroupShotSelections: async (projectId: string, updatedItems: ClientGroupShotItemFull[]): Promise<void> => {
//     const itemsRef = doc(db, 'projects', projectId, 'groupShots', 'items');
//     const configRef = doc(db, 'projects', projectId, 'groupShots', 'config');

//     const totalTimeEstimated = updatedItems.filter(i => i.checked).reduce((sum, i) => sum + i.time, 0);
//     const batch = writeBatch(db);
//     batch.update(itemsRef, { items: updatedItems });
//     batch.update(configRef, {
//       totalTimeEstimated,
//       updatedAt: serverTimestamp(),
//       clientLastViewed: serverTimestamp(),
//     });
//     await batch.commit();
//   },

//   // Timeline
//   listenToTimelineUpdates: (projectId: string, cb: (data: PortalTimelineData) => void): Unsubscribe => {
//     const configRef = doc(db, 'projects', projectId, 'timeline', 'config');
//     const itemsRef = doc(db, 'projects', projectId, 'timeline', 'items');
//     const cachedData: Partial<PortalTimelineData> = {};

//     const u1 = onSnapshot(configRef, (snap) => {
//       if (snap.exists()) cachedData.config = snap.data() as TimelineConfig;
//       if (cachedData.items) cb(cachedData as PortalTimelineData);
//     });
//     const u2 = onSnapshot(itemsRef, (snap) => {
//       if (snap.exists()) cachedData.items = (snap.data().list || []) as ClientTimelineEventFull[];
//       if (cachedData.config) cb(cachedData as PortalTimelineData);
//     });
//     return () => { u1(); u2(); };
//   },

//   addTimelineEvent: async (projectId: string, newEvent: Omit<ClientTimelineEventFull, 'id'>): Promise<void> => {
//     const itemsRef = doc(db, 'projects', projectId, 'timeline', 'items');
//     const configRef = doc(db, 'projects', projectId, 'timeline', 'config');
//     const eventWithId = stripUndefined({ ...newEvent, id: `event_${Date.now()}` });
//     try {
//       await updateDoc(itemsRef, { list: arrayUnion(eventWithId) });
//     } catch {
//       await setDoc(itemsRef, { list: [eventWithId] }, { merge: true });
//     }
//     try {
//       await updateDoc(configRef, { updatedAt: serverTimestamp(), clientLastViewed: serverTimestamp() });
//     } catch {
//       await setDoc(configRef, { updatedAt: serverTimestamp(), clientLastViewed: serverTimestamp() }, { merge: true });
//     }
//   },
// };