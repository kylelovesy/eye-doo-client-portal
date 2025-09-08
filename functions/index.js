// functions/src/generatePortalLink.js

const { randomBytes } = require('crypto');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { HttpsError, onCall } = require('firebase-functions/v2/https');

// Initialize Firebase Admin
initializeApp();


// Portal Settings
const generatePortalLink = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, selectedSteps } = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  if (!projectId) {
    throw new HttpsError('invalid-argument', 'Project ID is required');
  }
  
  if (!selectedSteps || selectedSteps.length === 0) {
    throw new HttpsError('invalid-argument', 'At least one step must be selected');
  }

  try {
    const db = getFirestore();
    
    // Generate secure token
    const accessToken = randomBytes(32).toString('hex');
    const portalId = `portal_${projectId}_${Date.now()}`;
    
    // Use a transaction to ensure data consistency
    const result = await db.runTransaction(async (transaction) => {
      const portalAccessRef = db.collection('portalAccess').doc(projectId);
      const projectRef = db.collection('projects').doc(projectId);
      
      // Create portal access document
      transaction.set(portalAccessRef, {
        projectId,
        accessToken,
        portalId,
        selectedSteps,
        isEnabled: true,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days
        accessCount: 0,
        lastAccessedAt: null,
      });
      
      // Generate the portal URL
      const portalUrl = `https://eye-doo-client-portal.vercel.app/?project=${projectId}&token=${accessToken}`;
      
      // Update project with portal info
      transaction.update(projectRef, {
        'clientPortal.isSetup': true,
        'clientPortal.portalSetupComplete': true,
        'clientPortal.isEnabled': true,
        'clientPortal.portalUrl': portalUrl,
        'clientPortal.accessToken': accessToken,
        'clientPortal.setupDate': FieldValue.serverTimestamp(),
        'clientPortal.lastUpdated': FieldValue.serverTimestamp(),
        'clientPortal.currentStepID': 'welcome',
        'clientPortal.portalMessage': 'Welcome to your planning portal! Please complete each step to help us make your day perfect.',
      });
      
      return {
        portalUrl,
        accessToken,
        portalId,
      };
    });
    
    return result;
    
  } catch (error) {
    console.error('Error generating portal link:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to generate portal link');
  }
});

const disablePortalLink = onCall({ region: "us-central1" }, async (request) => {
  const { projectId } = request.data;
  
  if (!projectId) {
    throw new HttpsError('invalid-argument', 'Project ID is required');
  }

  try {
    const db = getFirestore();
    
    // Use transaction for consistency
    await db.runTransaction(async (transaction) => {
      const portalAccessRef = db.collection('portalAccess').doc(projectId);
      const projectRef = db.collection('projects').doc(projectId);
      
      transaction.update(portalAccessRef, {
        isEnabled: false,
        disabledAt: FieldValue.serverTimestamp(),
      });
      
      transaction.update(projectRef, {
        'clientPortal.isEnabled': false,
        'clientPortal.updatedAt': FieldValue.serverTimestamp(),
      });
    });
    
    return { success: true };
    
  } catch (error) {
    console.error('Error disabling portal link:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to disable portal link');
  }
});

// Get Portal Auth Token
const getPortalAuthToken = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken } = request.data || {};

  if (!projectId || !accessToken) {
    throw new HttpsError("invalid-argument", "Missing project ID or access token.");
  }

  try {
    const db = getFirestore();
    await validatePortalToken(db, projectId, accessToken);

    // Update access logs
    const portalAccessRef = db.collection("portalAccess").doc(projectId);
    await portalAccessRef.update({
      accessCount: FieldValue.increment(1),
      lastAccessedAt: FieldValue.serverTimestamp(),
    });

    // Create a more unique UID to avoid conflicts
    const customUID = `portal_${projectId}_${Date.now()}`;
    const customToken = await getAuth().createCustomToken(customUID, { 
      portalAccess: true,
      projectId: projectId // Add project ID to claims for easier access in security rules
    });
    
    return { token: customToken };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    console.error('Error in getPortalAuthToken:', error);
    throw new HttpsError('internal', 'Failed to generate auth token');
  }
});
// Validate Portal Token
const validatePortalToken = async (db, projectId, accessToken) => {
  const portalAccessRef = db.collection('portalAccess').doc(projectId);
  const portalDoc = await portalAccessRef.get();

  if (!portalDoc.exists) {
    throw new HttpsError('not-found', 'This portal link is invalid.');
  }

  const portalData = portalDoc.data();
  if (portalData.accessToken !== accessToken || !portalData.isEnabled) {
    throw new HttpsError('permission-denied', 'This portal link is invalid or has been disabled.');
  }
  if (portalData.expiresAt.toDate() < new Date()) {
    throw new HttpsError('permission-denied', 'This portal link has expired.');
  }
  return portalData;
};


// Track client portal access and activity
const trackClientAccess = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken } = request.data;
  const userId = request.auth?.uid;

  // User authentication check is optional for portal access tracking
  // since we're using access tokens, but good to have for audit trail

  if (!projectId || !accessToken) {
    throw new HttpsError('invalid-argument', 'Project ID and access token are required');
  }

  try {
    const db = getFirestore();
    
    // First validate the portal token to ensure it's legitimate access
    await validatePortalToken(db, projectId, accessToken);
    
    // Update the client portal metadata
    const projectRef = db.collection('projects').doc(projectId);
    
    await projectRef.update({
      'clientPortal.metadata.clientAccessCount': FieldValue.increment(1),
      'clientPortal.metadata.lastClientActivity': FieldValue.serverTimestamp(),
      'clientPortal.lastUpdated': FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error tracking client access:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to track client access');
  }
});

// Update current step ID when client navigates
const updateClientCurrentStep = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken, stepId } = request.data;

  if (!projectId || !accessToken || !stepId) {
    throw new HttpsError('invalid-argument', 'Project ID, access token, and step ID are required');
  }

  try {
    const db = getFirestore();
    
    // Validate the portal token
    await validatePortalToken(db, projectId, accessToken);
    
    // Update the current step ID
    const projectRef = db.collection('projects').doc(projectId);
    
    await projectRef.update({
      'clientPortal.currentStepID': stepId,
      'clientPortal.lastUpdated': FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating client current step:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to update current step');
  }
});


// Update section status after client saves
const updateSectionStatus = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken, sectionId } = request.data;

  if (!projectId || !accessToken || !sectionId) {
    throw new HttpsError('invalid-argument', 'Project ID, access token, and section ID are required');
  }

  try {
    const db = getFirestore();
    
    // Validate the portal token
    await validatePortalToken(db, projectId, accessToken);
    
    // Find the step to update by portalStepID
    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();
    
    if (!projectDoc.exists) {
      throw new HttpsError('not-found', 'Project not found');
    }
    
    const projectData = projectDoc.data();
    const steps = projectData.clientPortal?.steps || [];
    
    // Find the step with matching portalStepID
    const stepIndex = steps.findIndex(step => step.portalStepID === sectionId);
    
    if (stepIndex === -1) {
      throw new HttpsError('not-found', 'Section not found');
    }
    
    // Update the step status
    steps[stepIndex].stepStatus = 'locked';
    steps[stepIndex].actionOn = 'photographer';
    steps[stepIndex].updatedAt = FieldValue.serverTimestamp();
    
    // Update the project document
    await projectRef.update({
      'clientPortal.steps': steps,
      'clientPortal.currentStepID': 'welcome',
      'clientPortal.lastUpdated': FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating section status:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to update section status');
  }
});

// Client Update Functions
// Allows a client to save their location data.
const clientSaveLocations = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken, locations, config } = request.data;

  // 1. Validate inputs
  if (!projectId || !accessToken || !Array.isArray(locations)) {
    throw new HttpsError('invalid-argument', 'Project ID, access token, and a locations array are required.');
  }

  // Basic input sanitization
  if (locations.length > 10) {
    throw new HttpsError('invalid-argument', 'Too many locations provided.');
  }

  try {
    const db = getFirestore();
    
    // 2. Validate the client's token
    await validatePortalToken(db, projectId, accessToken);

    // 3. Perform the write operation
    const batch = db.batch();
    const itemsRef = db.collection('projects').doc(projectId).collection('locations').doc('items');
    
    batch.set(itemsRef, { 
      list: locations,
      // updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    // NEW: Save config if it exists (for multipleLocations boolean)
    if (config && Object.keys(config).length > 0) {
      const configRef = db.collection('projects').doc(projectId).collection('locations').doc('config');
      batch.set(configRef, { 
        ...config, 
        updatedAt: FieldValue.serverTimestamp() 
      }, { merge: true });
    }

    await batch.commit();

    // 4. Return success
    return { success: true };

  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('Error in clientSaveLocations:', error);
    throw new HttpsError('internal', 'Failed to save locations.');
  }
});

// Allows a client to save their key people data as a draft.
const clientSaveKeyPeople = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken, items, config } = request.data;

  if (!projectId || !accessToken || !Array.isArray(items)) {
    throw new HttpsError('invalid-argument', 'Project ID, token, and items array are required.');
  }

  // Input validation
  if (items.length > 30) {
    throw new HttpsError('invalid-argument', 'Too many items provided.');
  }

  try {
    const db = getFirestore();
    await validatePortalToken(db, projectId, accessToken);

    const batch = db.batch();
    const itemsRef = db.collection('projects').doc(projectId).collection('keyPeople').doc('items');
    const configRef = db.collection('projects').doc(projectId).collection('keyPeople').doc('config');

    batch.set(itemsRef, { 
      list: items,
      // updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

     // CHANGE: Only set config if it exists and has properties
    if (config && Object.keys(config).length > 0) {
      batch.set(configRef, { 
        ...config, 
        updatedAt: FieldValue.serverTimestamp() 
      }, { merge: true });
    }

    await batch.commit();

    return { success: true };

  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('Error in clientSaveKeyPeople:', error);
    throw new HttpsError('internal', 'Failed to save key people.');
  }
});

// Allows a client to save their photo requests data as a draft.
const clientSavePhotoRequests = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken, items, config } = request.data;

  // CHANGE: Make config optional for consistency with keyPeople
  if (!projectId || !accessToken || !Array.isArray(items)) {
    throw new HttpsError('invalid-argument', 'Project ID, token, and items array are required.');
  }

  // Input validation
  if (items.length > 10) {
    throw new HttpsError('invalid-argument', 'Too many items provided.');
  }

  try {
    const db = getFirestore();
    await validatePortalToken(db, projectId, accessToken);

    const batch = db.batch();
    const itemsRef = db.collection('projects').doc(projectId).collection('photoRequests').doc('items');
    const configRef = db.collection('projects').doc(projectId).collection('photoRequests').doc('config');

    batch.set(itemsRef, { 
      list: items,
    }, { merge: true });
    
    // CHANGE: Only set config if it exists and has properties
    if (config && Object.keys(config).length > 0) {
      batch.set(configRef, { 
        ...config, 
        updatedAt: FieldValue.serverTimestamp() 
      }, { merge: true });
    }

    await batch.commit();

    return { success: true };

  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('Error in clientSavePhotoRequests:', error);
    throw new HttpsError('internal', 'Failed to save photo requests.');
  }
});

// Allows a client to update their group shot selections.
const clientSaveGroupShotSelections = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken, allLocalItems } = request.data;

  if (!projectId || !accessToken || !Array.isArray(allLocalItems)) {
    throw new HttpsError('invalid-argument', 'Project ID, token, and an items array are required.');
  }

  // Input validation
  if (allLocalItems.length > 200) {
    throw new HttpsError('invalid-argument', 'Too many items provided.');
  }

  try {
    const db = getFirestore();
    await validatePortalToken(db, projectId, accessToken);

    const batch = db.batch();
    const itemsRef = db.collection('projects').doc(projectId).collection('groupShots').doc('items');
    const configRef = db.collection('projects').doc(projectId).collection('groupShots').doc('config');

    const checkedItemsToSave = allLocalItems.filter(i => i.checked);
    const totalTimeEstimated = checkedItemsToSave.reduce((sum, i) => sum + (i.time || 0), 0);

    batch.set(itemsRef, { 
      list: checkedItemsToSave,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    batch.set(configRef, {
      totalTimeEstimated,
      updatedAt: FieldValue.serverTimestamp(),
      clientLastViewed: FieldValue.serverTimestamp(),
    }, { merge: true });

    await batch.commit();

    return { success: true };

  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('Error in clientSaveGroupShotSelections:', error);
    throw new HttpsError('internal', 'Failed to update group shots.');
  }
});

// Allows a client to add a new event to the timeline.
const clientSaveTimelineEvents = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken, newEvent } = request.data;

  if (!projectId || !accessToken || !newEvent) {
    throw new HttpsError('invalid-argument', 'Project ID, token, and a new event object are required.');
  }

  // Basic validation of newEvent
  if (typeof newEvent !== 'object' || Array.isArray(newEvent)) {
    throw new HttpsError('invalid-argument', 'New event must be a valid object.');
  }

  try {
    const db = getFirestore();
    await validatePortalToken(db, projectId, accessToken);

    const itemsRef = db.collection('projects').doc(projectId).collection('timeline').doc('items');
    const configRef = db.collection('projects').doc(projectId).collection('timeline').doc('config');
    const eventWithId = { 
      ...newEvent, 
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: FieldValue.serverTimestamp()
    };

    const batch = db.batch();
    batch.set(itemsRef, { list: FieldValue.arrayUnion(eventWithId) }, { merge: true });
    batch.set(configRef, { 
      updatedAt: FieldValue.serverTimestamp(), 
      clientLastViewed: FieldValue.serverTimestamp() 
    }, { merge: true });

    await batch.commit();
    
    return { success: true, newEventId: eventWithId.id };

  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('Error in clientSaveTimelineEvents:', error);
    throw new HttpsError('internal', 'Failed to add timeline event.');
  }
});

// Allows a photographer to approve a section.
const photographerApproveSection = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, sectionId } = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  if (!projectId || !sectionId) {
    throw new HttpsError('invalid-argument', 'Project ID and section ID are required');
  }

  try {
    const db = getFirestore();
    
    // Update the section's config to mark it as finalized and locked
    const configRef = db.collection('projects').doc(projectId).collection(sectionId).doc('config');
    
    await configRef.update({
      finalized: true,
      locked: true,
      approvedAt: FieldValue.serverTimestamp(),
      approvedBy: userId,
      actionOn: 'none', // Photographer has taken action
      updatedAt: FieldValue.serverTimestamp()
    });

    return { success: true };

  } catch (error) {
    console.error('Error approving section:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to approve section');
  }
});

// Allows a photographer to request a revision.
const photographerRequestRevision = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, sectionId, revisionReason } = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  if (!projectId || !sectionId) {
    throw new HttpsError('invalid-argument', 'Project ID and section ID are required');
  }

  if (!revisionReason || typeof revisionReason !== 'string' || revisionReason.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Revision reason is required and must be a non-empty string');
  }

  // Limit revision reason length for security
  if (revisionReason.length > 1000) {
    throw new HttpsError('invalid-argument', 'Revision reason is too long (max 1000 characters)');
  }

  try {
    const db = getFirestore();
    
    // Update the section's config to unlock it and set action back to client
    const configRef = db.collection('projects').doc(projectId).collection(sectionId).doc('config');
    
    await configRef.update({
      locked: false,
      finalized: false, // Reset finalized status when requesting revision
      actionOn: 'client', // Client needs to take action
      revisionRequested: true,
      revisionReason: revisionReason.trim(),
      revisionRequestedAt: FieldValue.serverTimestamp(),
      revisionRequestedBy: userId,
      updatedAt: FieldValue.serverTimestamp()
    });

    return { success: true };

  } catch (error) {
    console.error('Error requesting revision:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to request revision');
  }
});


// Export all functions
module.exports = {
  generatePortalLink,
  disablePortalLink,
  getPortalAuthToken,
  clientSaveLocations,
  clientSaveKeyPeople,
  clientSavePhotoRequests,
  clientSaveGroupShotSelections,
  clientSaveTimelineEvents,
  photographerApproveSection,
  photographerRequestRevision,
  trackClientAccess,
  updateClientCurrentStep,
  updateSectionStatus,
};


// Allows a client to save their location data.
// const saveClientLocations = onCall(async (request) => {
//   const { projectId, accessToken, locations } = request.data;

//   // 1. Validate inputs
//   if (!projectId || !accessToken || !Array.isArray(locations)) {
//     throw new HttpsError('invalid-argument', 'Project ID, access token, and a locations array are required.');
//   }

//   // Basic input sanitization
//   if (locations.length > 100) {
//     throw new HttpsError('invalid-argument', 'Too many locations provided.');
//   }

//   try {
//     const db = getFirestore();
    
//     // 2. Validate the client's token
//     await validatePortalToken(db, projectId, accessToken);

//     // 3. Perform the write operation
//     const itemsRef = db.collection('projects').doc(projectId).collection('locations').doc('items');
//     await itemsRef.set({ 
//       list: locations,
//       updatedAt: FieldValue.serverTimestamp()
//     }, { merge: true });

//     // 4. Return success
//     return { success: true };

//   } catch (error) {
//     if (error instanceof HttpsError) throw error;
//     console.error('Error in saveClientLocations:', error);
//     throw new HttpsError('internal', 'Failed to save locations.');
//   }
// });

// // Allows a client to save their key people data as a draft.
// const saveClientKeyPeople = onCall(async (request) => {
//   const { projectId, accessToken, items, config } = request.data;

//   if (!projectId || !accessToken || !Array.isArray(items) || !config) {
//     throw new HttpsError('invalid-argument', 'Project ID, token, items array, and config object are required.');
//   }

//   // Input validation
//   if (items.length > 200) {
//     throw new HttpsError('invalid-argument', 'Too many items provided.');
//   }

//   try {
//     const db = getFirestore();
//     await validatePortalToken(db, projectId, accessToken);

//     const batch = db.batch();
//     const itemsRef = db.collection('projects').doc(projectId).collection('keyPeople').doc('items');
//     const configRef = db.collection('projects').doc(projectId).collection('keyPeople').doc('config');

//     batch.set(itemsRef, { 
//       list: items,
//       updatedAt: FieldValue.serverTimestamp()
//     }, { merge: true });
//     batch.set(configRef, { 
//       ...config, 
//       updatedAt: FieldValue.serverTimestamp() 
//     }, { merge: true });

//     await batch.commit();

//     return { success: true };

//   } catch (error) {
//     if (error instanceof HttpsError) throw error;
//     console.error('Error in saveClientKeyPeople:', error);
//     throw new HttpsError('internal', 'Failed to save key people.');
//   }
// });

// // Allows a client to save their photo requests data as a draft.
// const saveClientPhotoRequests = onCall(async (request) => {
//   const { projectId, accessToken, items, config } = request.data;

//   if (!projectId || !accessToken || !Array.isArray(items) || !config) {
//     throw new HttpsError('invalid-argument', 'Project ID, token, items array, and config object are required.');
//   }

//   // Input validation
//   if (items.length > 500) {
//     throw new HttpsError('invalid-argument', 'Too many items provided.');
//   }

//   try {
//     const db = getFirestore();
//     await validatePortalToken(db, projectId, accessToken);

//     const batch = db.batch();
//     const itemsRef = db.collection('projects').doc(projectId).collection('photoRequests').doc('items');
//     const configRef = db.collection('projects').doc(projectId).collection('photoRequests').doc('config');

//     batch.set(itemsRef, { 
//       list: items,
//       updatedAt: FieldValue.serverTimestamp()
//     }, { merge: true });
//     batch.set(configRef, { 
//       ...config, 
//       updatedAt: FieldValue.serverTimestamp() 
//     }, { merge: true });
    
//     await batch.commit();

//     return { success: true };

//   } catch (error) {
//     if (error instanceof HttpsError) throw error;
//     console.error('Error in saveClientPhotoRequests:', error);
//     throw new HttpsError('internal', 'Failed to save photo requests.');
//   }
// });

// // Allows a client to update their group shot selections.
// const updateClientGroupShotSelections = onCall(async (request) => {
//   const { projectId, accessToken, allLocalItems } = request.data;

//   if (!projectId || !accessToken || !Array.isArray(allLocalItems)) {
//     throw new HttpsError('invalid-argument', 'Project ID, token, and an items array are required.');
//   }

//   // Input validation
//   if (allLocalItems.length > 200) {
//     throw new HttpsError('invalid-argument', 'Too many items provided.');
//   }

//   try {
//     const db = getFirestore();
//     await validatePortalToken(db, projectId, accessToken);

//     const batch = db.batch();
//     const itemsRef = db.collection('projects').doc(projectId).collection('groupShots').doc('items');
//     const configRef = db.collection('projects').doc(projectId).collection('groupShots').doc('config');

//     const checkedItemsToSave = allLocalItems.filter(i => i.checked);
//     const totalTimeEstimated = checkedItemsToSave.reduce((sum, i) => sum + (i.time || 0), 0);

//     batch.set(itemsRef, { 
//       list: checkedItemsToSave,
//       updatedAt: FieldValue.serverTimestamp()
//     }, { merge: true });
//     batch.set(configRef, {
//       totalTimeEstimated,
//       updatedAt: FieldValue.serverTimestamp(),
//       clientLastViewed: FieldValue.serverTimestamp(),
//     }, { merge: true });

//     await batch.commit();

//     return { success: true };

//   } catch (error) {
//     if (error instanceof HttpsError) throw error;
//     console.error('Error in updateClientGroupShotSelections:', error);
//     throw new HttpsError('internal', 'Failed to update group shots.');
//   }
// });

// // Allows a client to add a new event to the timeline.
// const addClientTimelineEvent = onCall(async (request) => {
//   const { projectId, accessToken, newEvent } = request.data;

//   if (!projectId || !accessToken || !newEvent) {
//     throw new HttpsError('invalid-argument', 'Project ID, token, and a new event object are required.');
//   }

//   // Basic validation of newEvent
//   if (typeof newEvent !== 'object' || Array.isArray(newEvent)) {
//     throw new HttpsError('invalid-argument', 'New event must be a valid object.');
//   }

//   try {
//     const db = getFirestore();
//     await validatePortalToken(db, projectId, accessToken);

//     const itemsRef = db.collection('projects').doc(projectId).collection('timeline').doc('items');
//     const configRef = db.collection('projects').doc(projectId).collection('timeline').doc('config');
//     const eventWithId = { 
//       ...newEvent, 
//       id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//       createdAt: FieldValue.serverTimestamp()
//     };

//     const batch = db.batch();
//     batch.set(itemsRef, { list: FieldValue.arrayUnion(eventWithId) }, { merge: true });
//     batch.set(configRef, { 
//       updatedAt: FieldValue.serverTimestamp(), 
//       clientLastViewed: FieldValue.serverTimestamp() 
//     }, { merge: true });

//     await batch.commit();
    
//     return { success: true, newEventId: eventWithId.id };

//   } catch (error) {
//     if (error instanceof HttpsError) throw error;
//     console.error('Error in addClientTimelineEvent:', error);
//     throw new HttpsError('internal', 'Failed to add timeline event.');
//   }
// });

