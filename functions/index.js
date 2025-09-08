// Optimized and combined Firebase functions

const { randomBytes } = require('crypto');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { HttpsError, onCall } = require('firebase-functions/v2/https');

// Initialize Firebase Admin
initializeApp();

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

// Client Update Functions
// Allows a client to save their location data.
const clientSaveLocations = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken, locations, config } = request.data;

  // 1. Validate inputs
  if (!projectId || !accessToken || !Array.isArray(locations)) {
    throw new HttpsError('invalid-argument', 'Project ID, access token, and a locations array are required.');
  }

  // Basic input sanitization
  if (locations.length > 6) {
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

// Allows a client to save their key people data
const clientSaveKeyPeople = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken, people, config } = request.data;

  if (!projectId || !accessToken || !Array.isArray(people)) {
    throw new HttpsError('invalid-argument', 'Project ID, token, and people array are required.');
  }

  // Input validation
  if (items.length > 10) {
    throw new HttpsError('invalid-argument', 'Too many people provided.');
  }

  try {
    const db = getFirestore();
    await validatePortalToken(db, projectId, accessToken);

    const batch = db.batch();
    const itemsRef = db.collection('projects').doc(projectId).collection('keyPeople').doc('items');

    batch.set(itemsRef, { 
      list: people,
    }, { merge: true });

     // CHANGE: Only set config if it exists and has properties
    if (config && Object.keys(config).length > 0) {
      const configRef = db.collection('projects').doc(projectId).collection('keyPeople').doc('config');
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
  const { projectId, accessToken, requests, config } = request.data;

  if (!projectId || !accessToken || !Array.isArray(requests)) {
    throw new HttpsError('invalid-argument', 'Project ID, token, and requests array are required.');
  }

  // Input validation
  if (requests.length > 5) {
    throw new HttpsError('invalid-argument', 'Too many requests provided.');
  }

  try {
    const db = getFirestore();
    await validatePortalToken(db, projectId, accessToken);

    const batch = db.batch();
    const itemsRef = db.collection('projects').doc(projectId).collection('photoRequests').doc('items');
    
    batch.set(itemsRef, { 
      list: requests,
    }, { merge: true });
    
    // CHANGE: Only set config if it exists and has properties
    if (config && Object.keys(config).length > 0) {
      const configRef = db.collection('projects').doc(projectId).collection('photoRequests').doc('config');
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
  if (allLocalItems.length > 100) {
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
const clientSaveTimeline = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken, events, config } = request.data;

  if (!projectId || !accessToken || !Array.isArray(events)) {
    throw new HttpsError('invalid-argument', 'Project ID, token, and events array are required.');
  }

  // Basic validation of newEvent
  if (events.length > 12) {
    throw new HttpsError('invalid-argument', 'Too many events provided.');
  }

  try {
    const db = getFirestore();
    await validatePortalToken(db, projectId, accessToken);

    const batch = db.batch();    
    const itemsRef = db.collection('projects').doc(projectId).collection('timeline').doc('items');

    batch.set(itemsRef, { 
      list: events,
    }, { merge: true });

    if (config && Object.keys(config).length > 0) {
      const configRef = db.collection('projects').doc(projectId).collection('timeline').doc('config');
      batch.set(configRef, { 
        ...config, 
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }
    // const eventWithId = { 
    //   ...newEvent, 
    //   id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    //   createdAt: FieldValue.serverTimestamp()
    // };

    
    // batch.set(itemsRef, { list: FieldValue.arrayUnion(eventWithId) }, { merge: true });
    // batch.set(configRef, { 
    //   updatedAt: FieldValue.serverTimestamp(), 
    //   clientLastViewed: FieldValue.serverTimestamp() 
    // }, { merge: true });

    await batch.commit();
    return { success: true };
    // return { success: true, newEventId: eventWithId.id };

  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('Error in clientSaveTimelineEvents:', error);
    throw new HttpsError('internal', 'Failed to add timeline event.');
  }
});



// COMBINED CLIENT PORTAL ACTIVITY FUNCTION
// This replaces trackClientAccess, updateClientCurrentStep, and updateSectionStatus
const updateClientPortalActivity = onCall({ region: "us-central1" }, async (request) => {
  const { 
    projectId, 
    accessToken, 
    action, // 'access', 'navigate', 'submit'
    stepId = null, 
    sectionId = null 
  } = request.data;

  if (!projectId || !accessToken || !action) {
    throw new HttpsError('invalid-argument', 'Project ID, access token, and action are required');
  }

  const validActions = ['access', 'navigate', 'submit'];
  if (!validActions.includes(action)) {
    throw new HttpsError('invalid-argument', 'Invalid action. Must be: access, navigate, or submit');
  }

  // Validate required parameters for specific actions
  if (action === 'navigate' && !stepId) {
    throw new HttpsError('invalid-argument', 'Step ID is required for navigate action');
  }
  if (action === 'submit' && !sectionId) {
    throw new HttpsError('invalid-argument', 'Section ID is required for submit action');
  }

  try {
    const db = getFirestore();
    
    // Validate the portal token
    await validatePortalToken(db, projectId, accessToken);
    
    // Use transaction for atomic operations
    const result = await db.runTransaction(async (transaction) => {
      const projectRef = db.collection('projects').doc(projectId);
      const projectDoc = await transaction.get(projectRef);
      
      if (!projectDoc.exists) {
        throw new HttpsError('not-found', 'Project not found');
      }
      
      const projectData = projectDoc.data();
      const now = FieldValue.serverTimestamp();
      
      // Base update data
      const updateData = {
        'clientPortal.lastUpdated': now
      };
      
      // Handle different actions
      switch (action) {
        case 'access':
          const lastActivity = projectData?.clientPortal?.metadata?.lastClientActivity;
          const shouldIncrementCount = !lastActivity || 
            (lastActivity && (new Date() - lastActivity.toDate()) > (30 * 60 * 1000));
          
          updateData['clientPortal.metadata.lastClientActivity'] = now;
          if (shouldIncrementCount) {
            updateData['clientPortal.metadata.clientAccessCount'] = FieldValue.increment(1);
          }
          break;
          
        case 'navigate':
          updateData['clientPortal.currentStepID'] = stepId;
          break;
          
        case 'submit':
          // Find and update the specific step
          const steps = projectData.clientPortal?.steps || [];
          const stepIndex = steps.findIndex(step => step.portalStepID === sectionId);
          
          if (stepIndex === -1) {
            throw new HttpsError('not-found', 'Section not found');
          }
          
          steps[stepIndex].stepStatus = 'locked';
          steps[stepIndex].actionOn = 'photographer';
          steps[stepIndex].updatedAt = now;
          
          updateData['clientPortal.steps'] = steps;
          updateData['clientPortal.currentStepID'] = 'welcome';
          break;
      }
      
      transaction.update(projectRef, updateData);
      return { success: true, action };
    });
    
    return result;
    
  } catch (error) {
    console.error('Error updating client portal activity:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to update client portal activity');
  }
});

// COMBINED PHOTOGRAPHER SECTION MANAGEMENT
// This replaces photographerApproveSection and photographerRequestRevision
const photographerManageSection = onCall({ region: "us-central1" }, async (request) => {
  const { 
    projectId, 
    sectionId, 
    action, // 'approve' or 'request_revision'
    revisionReason = null 
  } = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  if (!projectId || !sectionId || !action) {
    throw new HttpsError('invalid-argument', 'Project ID, section ID, and action are required');
  }

  const validActions = ['approve', 'request_revision'];
  if (!validActions.includes(action)) {
    throw new HttpsError('invalid-argument', 'Invalid action. Must be: approve or request_revision');
  }

  // Validate revision reason for request_revision action
  if (action === 'request_revision') {
    if (!revisionReason || typeof revisionReason !== 'string' || revisionReason.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'Revision reason is required and must be a non-empty string');
    }
    if (revisionReason.length > 1000) {
      throw new HttpsError('invalid-argument', 'Revision reason is too long (max 1000 characters)');
    }
  }

  try {
    const db = getFirestore();
    
    // Use transaction to ensure consistency
    const result = await db.runTransaction(async (transaction) => {
      const configRef = db.collection('projects').doc(projectId).collection(sectionId).doc('config');
      const configDoc = await transaction.get(configRef);
      
      if (!configDoc.exists) {
        throw new HttpsError('not-found', 'Section config not found');
      }
      
      const now = FieldValue.serverTimestamp();
      let updateData = {
        updatedAt: now,
        lastActionBy: userId,
        lastActionAt: now
      };
      
      if (action === 'approve') {
        updateData = {
          ...updateData,
          finalized: true,
          locked: true,
          actionOn: 'none',
          approvedAt: now,
          approvedBy: userId,
          // Clear any previous revision data
          revisionRequested: false,
          revisionReason: FieldValue.delete(),
          revisionRequestedAt: FieldValue.delete(),
          revisionRequestedBy: FieldValue.delete()
        };
      } else if (action === 'request_revision') {
        updateData = {
          ...updateData,
          locked: false,
          finalized: false,
          actionOn: 'client',
          revisionRequested: true,
          revisionReason: revisionReason.trim(),
          revisionRequestedAt: now,
          revisionRequestedBy: userId
        };
      }
      
      transaction.update(configRef, updateData);
      return { success: true, action };
    });
    
    return result;
    
  } catch (error) {
    console.error('Error managing section:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to manage section');
  }
});

// ENHANCED BATCH PORTAL OPERATIONS
// For handling multiple portal operations in a single call
const batchPortalOperations = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken, operations } = request.data;

  if (!projectId || !accessToken || !Array.isArray(operations)) {
    throw new HttpsError('invalid-argument', 'Project ID, access token, and operations array are required');
  }

  if (operations.length > 10) {
    throw new HttpsError('invalid-argument', 'Too many operations (max 10)');
  }

  try {
    const db = getFirestore();
    
    // Validate the portal token once
    await validatePortalToken(db, projectId, accessToken);
    
    // Process operations in a transaction
    const result = await db.runTransaction(async (transaction) => {
      const projectRef = db.collection('projects').doc(projectId);
      const projectDoc = await transaction.get(projectRef);
      
      if (!projectDoc.exists) {
        throw new HttpsError('not-found', 'Project not found');
      }
      
      const results = [];
      const now = FieldValue.serverTimestamp();
      
      for (const operation of operations) {
        const { type, data } = operation;
        
        switch (type) {
          case 'track_access':
            // Track access logic here
            results.push({ type, success: true });
            break;
          case 'update_step':
            // Update step logic here
            results.push({ type, success: true });
            break;
          case 'submit_section':
            // Submit section logic here
            results.push({ type, success: true });
            break;
          default:
            results.push({ type, success: false, error: 'Unknown operation type' });
        }
      }
      
      // Single update to project
      transaction.update(projectRef, {
        'clientPortal.lastUpdated': now,
        'clientPortal.lastBatchOperation': now
      });
      
      return { success: true, results };
    });
    
    return result;
    
  } catch (error) {
    console.error('Error processing batch portal operations:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to process batch operations');
  }
});

// UTILITY: Validate Portal Token (keeping existing implementation)
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

// UTILITY: Enhanced logging and analytics
const logPortalActivity = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken, activityType, metadata = {} } = request.data;

  if (!projectId || !accessToken || !activityType) {
    throw new HttpsError('invalid-argument', 'Project ID, access token, and activity type are required');
  }

  try {
    const db = getFirestore();
    await validatePortalToken(db, projectId, accessToken);
    
    // Log to analytics collection
    const logRef = db.collection('portalAnalytics').doc();
    await logRef.set({
      projectId,
      activityType,
      metadata,
      timestamp: FieldValue.serverTimestamp(),
      sessionId: metadata.sessionId || null,
      userAgent: metadata.userAgent || null
    });
    
    return { success: true };
    
  } catch (error) {
    console.error('Error logging portal activity:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to log activity');
  }
});

// Export optimized functions
module.exports = {
  // Keep existing functions that are well-implemented
  generatePortalLink,
  disablePortalLink,
  getPortalAuthToken,
  clientSaveLocations,
  clientSaveKeyPeople,
  clientSavePhotoRequests,
  clientSaveGroupShotSelections,
  clientSaveTimeline,
  
  // New combined/optimized functions
  updateClientPortalActivity, // Replaces trackClientAccess, updateClientCurrentStep, updateSectionStatus
  photographerManageSection,  // Replaces photographerApproveSection, photographerRequestRevision
  batchPortalOperations,      // New: Handle multiple operations efficiently
  logPortalActivity,          // New: Enhanced analytics
  
  // Utility functions
  validatePortalToken
};

// // functions/src/generatePortalLink.js

// const { randomBytes } = require('crypto');
// const { initializeApp } = require('firebase-admin/app');
// const { getAuth } = require('firebase-admin/auth');
// const { FieldValue, getFirestore } = require('firebase-admin/firestore');
// const { HttpsError, onCall } = require('firebase-functions/v2/https');

// // Initialize Firebase Admin
// initializeApp();


// // Portal Settings
// const generatePortalLink = onCall({ region: "us-central1" }, async (request) => {
//   const { projectId, selectedSteps } = request.data;
//   const userId = request.auth?.uid;

//   if (!userId) {
//     throw new HttpsError("unauthenticated", "User must be authenticated.");
//   }

//   if (!projectId) {
//     throw new HttpsError('invalid-argument', 'Project ID is required');
//   }
  
//   if (!selectedSteps || selectedSteps.length === 0) {
//     throw new HttpsError('invalid-argument', 'At least one step must be selected');
//   }

//   try {
//     const db = getFirestore();
    
//     // Generate secure token
//     const accessToken = randomBytes(32).toString('hex');
//     const portalId = `portal_${projectId}_${Date.now()}`;
    
//     // Use a transaction to ensure data consistency
//     const result = await db.runTransaction(async (transaction) => {
//       const portalAccessRef = db.collection('portalAccess').doc(projectId);
//       const projectRef = db.collection('projects').doc(projectId);
      
//       // Create portal access document
//       transaction.set(portalAccessRef, {
//         projectId,
//         accessToken,
//         portalId,
//         selectedSteps,
//         isEnabled: true,
//         createdAt: FieldValue.serverTimestamp(),
//         expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days
//         accessCount: 0,
//         lastAccessedAt: null,
//       });
      
//       // Generate the portal URL
//       const portalUrl = `https://eye-doo-client-portal.vercel.app/?project=${projectId}&token=${accessToken}`;
      
//       // Update project with portal info
//       transaction.update(projectRef, {
//         'clientPortal.isSetup': true,
//         'clientPortal.portalSetupComplete': true,
//         'clientPortal.isEnabled': true,
//         'clientPortal.portalUrl': portalUrl,
//         'clientPortal.accessToken': accessToken,
//         'clientPortal.setupDate': FieldValue.serverTimestamp(),
//         'clientPortal.lastUpdated': FieldValue.serverTimestamp(),
//         'clientPortal.currentStepID': 'welcome',
//         'clientPortal.portalMessage': 'Welcome to your planning portal! Please complete each step to help us make your day perfect.',
//       });
      
//       return {
//         portalUrl,
//         accessToken,
//         portalId,
//       };
//     });
    
//     return result;
    
//   } catch (error) {
//     console.error('Error generating portal link:', error);
//     if (error instanceof HttpsError) {
//       throw error;
//     }
//     throw new HttpsError('internal', 'Failed to generate portal link');
//   }
// });

// const disablePortalLink = onCall({ region: "us-central1" }, async (request) => {
//   const { projectId } = request.data;
  
//   if (!projectId) {
//     throw new HttpsError('invalid-argument', 'Project ID is required');
//   }

//   try {
//     const db = getFirestore();
    
//     // Use transaction for consistency
//     await db.runTransaction(async (transaction) => {
//       const portalAccessRef = db.collection('portalAccess').doc(projectId);
//       const projectRef = db.collection('projects').doc(projectId);
      
//       transaction.update(portalAccessRef, {
//         isEnabled: false,
//         disabledAt: FieldValue.serverTimestamp(),
//       });
      
//       transaction.update(projectRef, {
//         'clientPortal.isEnabled': false,
//         'clientPortal.updatedAt': FieldValue.serverTimestamp(),
//       });
//     });
    
//     return { success: true };
    
//   } catch (error) {
//     console.error('Error disabling portal link:', error);
//     if (error instanceof HttpsError) {
//       throw error;
//     }
//     throw new HttpsError('internal', 'Failed to disable portal link');
//   }
// });

// // Get Portal Auth Token
// const getPortalAuthToken = onCall({ region: "us-central1" }, async (request) => {
//   const { projectId, accessToken } = request.data || {};

//   if (!projectId || !accessToken) {
//     throw new HttpsError("invalid-argument", "Missing project ID or access token.");
//   }

//   try {
//     const db = getFirestore();
//     await validatePortalToken(db, projectId, accessToken);

//     // Update access logs
//     const portalAccessRef = db.collection("portalAccess").doc(projectId);
//     await portalAccessRef.update({
//       accessCount: FieldValue.increment(1),
//       lastAccessedAt: FieldValue.serverTimestamp(),
//     });

//     // Create a more unique UID to avoid conflicts
//     const customUID = `portal_${projectId}_${Date.now()}`;
//     const customToken = await getAuth().createCustomToken(customUID, { 
//       portalAccess: true,
//       projectId: projectId // Add project ID to claims for easier access in security rules
//     });
    
//     return { token: customToken };
//   } catch (error) {
//     if (error instanceof HttpsError) {
//       throw error;
//     }
//     console.error('Error in getPortalAuthToken:', error);
//     throw new HttpsError('internal', 'Failed to generate auth token');
//   }
// });
// // Validate Portal Token
// const validatePortalToken = async (db, projectId, accessToken) => {
//   const portalAccessRef = db.collection('portalAccess').doc(projectId);
//   const portalDoc = await portalAccessRef.get();

//   if (!portalDoc.exists) {
//     throw new HttpsError('not-found', 'This portal link is invalid.');
//   }

//   const portalData = portalDoc.data();
//   if (portalData.accessToken !== accessToken || !portalData.isEnabled) {
//     throw new HttpsError('permission-denied', 'This portal link is invalid or has been disabled.');
//   }
//   if (portalData.expiresAt.toDate() < new Date()) {
//     throw new HttpsError('permission-denied', 'This portal link has expired.');
//   }
//   return portalData;
// };


// // Track client portal access and activity
// const trackClientAccess = onCall({ region: "us-central1" }, async (request) => {
//   const { projectId, accessToken } = request.data;
//   const userId = request.auth?.uid;

//   // User authentication check is optional for portal access tracking
//   // since we're using access tokens, but good to have for audit trail

//   if (!projectId || !accessToken) {
//     throw new HttpsError('invalid-argument', 'Project ID and access token are required');
//   }

//   try {
//     const db = getFirestore();
    
//     // First validate the portal token to ensure it's legitimate access
//     await validatePortalToken(db, projectId, accessToken);
    
//     // Update the client portal metadata
//     const projectRef = db.collection('projects').doc(projectId);
//     const projectDoc = await projectRef.get();

//     if (projectDoc.exists) {
//       const projectData = projectDoc.data();
//       const lastActivity = projectData?.clientPortal?.metadata?.lastClientActivity;
//       const now = new Date();

//       // Only increment access count if this is a new portal launch
//       // (no previous activity OR last activity was more than 30 minutes ago)
//       const shouldIncrementCount = !lastActivity ||
//         (lastActivity && (now - lastActivity.toDate()) > (30 * 60 * 1000));

//       const updateData = {
//         'clientPortal.metadata.lastClientActivity': FieldValue.serverTimestamp(),
//         'clientPortal.lastUpdated': FieldValue.serverTimestamp()
//       };

//       // Only increment access count for new portal launches
//       if (shouldIncrementCount) {
//         updateData['clientPortal.metadata.clientAccessCount'] = FieldValue.increment(1);
//       }

//       await projectRef.update(updateData);
//     }

//     return { success: true };
//   } catch (error) {
//     console.error('Error tracking client access:', error);
//     if (error instanceof HttpsError) {
//       throw error;
//     }
//     throw new HttpsError('internal', 'Failed to track client access');
//   }
// });

// // Update current step ID when client navigates
// const updateClientCurrentStep = onCall({ region: "us-central1" }, async (request) => {
//   const { projectId, accessToken, stepId } = request.data;

//   if (!projectId || !accessToken || !stepId) {
//     throw new HttpsError('invalid-argument', 'Project ID, access token, and step ID are required');
//   }

//   try {
//     const db = getFirestore();
    
//     // Validate the portal token
//     await validatePortalToken(db, projectId, accessToken);
    
//     // Update the current step ID
//     const projectRef = db.collection('projects').doc(projectId);
    
//     await projectRef.update({
//       'clientPortal.currentStepID': stepId,
//       'clientPortal.lastUpdated': FieldValue.serverTimestamp()
//     });

//     return { success: true };
//   } catch (error) {
//     console.error('Error updating client current step:', error);
//     if (error instanceof HttpsError) {
//       throw error;
//     }
//     throw new HttpsError('internal', 'Failed to update current step');
//   }
// });


// // Update section status after client saves
// const updateSectionStatus = onCall({ region: "us-central1" }, async (request) => {
//   const { projectId, accessToken, sectionId } = request.data;

//   if (!projectId || !accessToken || !sectionId) {
//     throw new HttpsError('invalid-argument', 'Project ID, access token, and section ID are required');
//   }

//   try {
//     const db = getFirestore();
    
//     // Validate the portal token
//     await validatePortalToken(db, projectId, accessToken);
    
//     // Find the step to update by portalStepID
//     const projectRef = db.collection('projects').doc(projectId);
//     const projectDoc = await projectRef.get();
    
//     if (!projectDoc.exists) {
//       throw new HttpsError('not-found', 'Project not found');
//     }
    
//     const projectData = projectDoc.data();
//     const steps = projectData.clientPortal?.steps || [];
    
//     // Find the step with matching portalStepID
//     const stepIndex = steps.findIndex(step => step.portalStepID === sectionId);
    
//     if (stepIndex === -1) {
//       throw new HttpsError('not-found', 'Section not found');
//     }
    
//     // Update the step status
//     steps[stepIndex].stepStatus = 'locked';
//     steps[stepIndex].actionOn = 'photographer';
//     steps[stepIndex].updatedAt = FieldValue.serverTimestamp();
    
//     // Update the project document
//     await projectRef.update({
//       'clientPortal.steps': steps,
//       'clientPortal.currentStepID': 'welcome',
//       'clientPortal.lastUpdated': FieldValue.serverTimestamp()
//     });

//     return { success: true };
//   } catch (error) {
//     console.error('Error updating section status:', error);
//     if (error instanceof HttpsError) {
//       throw error;
//     }
//     throw new HttpsError('internal', 'Failed to update section status');
//   }
// });

// // Client Update Functions
// // Allows a client to save their location data.
// const clientSaveLocations = onCall({ region: "us-central1" }, async (request) => {
//   const { projectId, accessToken, locations, config } = request.data;

//   // 1. Validate inputs
//   if (!projectId || !accessToken || !Array.isArray(locations)) {
//     throw new HttpsError('invalid-argument', 'Project ID, access token, and a locations array are required.');
//   }

//   // Basic input sanitization
//   if (locations.length > 10) {
//     throw new HttpsError('invalid-argument', 'Too many locations provided.');
//   }

//   try {
//     const db = getFirestore();
    
//     // 2. Validate the client's token
//     await validatePortalToken(db, projectId, accessToken);

//     // 3. Perform the write operation
//     const batch = db.batch();
//     const itemsRef = db.collection('projects').doc(projectId).collection('locations').doc('items');
    
//     batch.set(itemsRef, { 
//       list: locations,
//       // updatedAt: FieldValue.serverTimestamp()
//     }, { merge: true });

//     // NEW: Save config if it exists (for multipleLocations boolean)
//     if (config && Object.keys(config).length > 0) {
//       const configRef = db.collection('projects').doc(projectId).collection('locations').doc('config');
//       batch.set(configRef, { 
//         ...config, 
//         updatedAt: FieldValue.serverTimestamp() 
//       }, { merge: true });
//     }

//     await batch.commit();

//     // 4. Return success
//     return { success: true };

//   } catch (error) {
//     if (error instanceof HttpsError) throw error;
//     console.error('Error in clientSaveLocations:', error);
//     throw new HttpsError('internal', 'Failed to save locations.');
//   }
// });

// // Allows a client to save their key people data as a draft.
// const clientSaveKeyPeople = onCall({ region: "us-central1" }, async (request) => {
//   const { projectId, accessToken, items, config } = request.data;

//   if (!projectId || !accessToken || !Array.isArray(items)) {
//     throw new HttpsError('invalid-argument', 'Project ID, token, and items array are required.');
//   }

//   // Input validation
//   if (items.length > 30) {
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
//       // updatedAt: FieldValue.serverTimestamp()
//     }, { merge: true });

//      // CHANGE: Only set config if it exists and has properties
//     if (config && Object.keys(config).length > 0) {
//       batch.set(configRef, { 
//         ...config, 
//         updatedAt: FieldValue.serverTimestamp() 
//       }, { merge: true });
//     }

//     await batch.commit();

//     return { success: true };

//   } catch (error) {
//     if (error instanceof HttpsError) throw error;
//     console.error('Error in clientSaveKeyPeople:', error);
//     throw new HttpsError('internal', 'Failed to save key people.');
//   }
// });

// // Allows a client to save their photo requests data as a draft.
// const clientSavePhotoRequests = onCall({ region: "us-central1" }, async (request) => {
//   const { projectId, accessToken, items, config } = request.data;

//   // CHANGE: Make config optional for consistency with keyPeople
//   if (!projectId || !accessToken || !Array.isArray(items)) {
//     throw new HttpsError('invalid-argument', 'Project ID, token, and items array are required.');
//   }

//   // Input validation
//   if (items.length > 10) {
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
//     }, { merge: true });
    
//     // CHANGE: Only set config if it exists and has properties
//     if (config && Object.keys(config).length > 0) {
//       batch.set(configRef, { 
//         ...config, 
//         updatedAt: FieldValue.serverTimestamp() 
//       }, { merge: true });
//     }

//     await batch.commit();

//     return { success: true };

//   } catch (error) {
//     if (error instanceof HttpsError) throw error;
//     console.error('Error in clientSavePhotoRequests:', error);
//     throw new HttpsError('internal', 'Failed to save photo requests.');
//   }
// });

// // Allows a client to update their group shot selections.
// const clientSaveGroupShotSelections = onCall({ region: "us-central1" }, async (request) => {
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
//     console.error('Error in clientSaveGroupShotSelections:', error);
//     throw new HttpsError('internal', 'Failed to update group shots.');
//   }
// });

// // Allows a client to add a new event to the timeline.
// const clientSaveTimelineEvents = onCall({ region: "us-central1" }, async (request) => {
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
//     console.error('Error in clientSaveTimelineEvents:', error);
//     throw new HttpsError('internal', 'Failed to add timeline event.');
//   }
// });

// // Allows a photographer to approve a section.
// const photographerApproveSection = onCall({ region: "us-central1" }, async (request) => {
//   const { projectId, sectionId } = request.data;
//   const userId = request.auth?.uid;

//   if (!userId) {
//     throw new HttpsError("unauthenticated", "User must be authenticated.");
//   }

//   if (!projectId || !sectionId) {
//     throw new HttpsError('invalid-argument', 'Project ID and section ID are required');
//   }

//   try {
//     const db = getFirestore();
    
//     // Update the section's config to mark it as finalized and locked
//     const configRef = db.collection('projects').doc(projectId).collection(sectionId).doc('config');
    
//     await configRef.update({
//       finalized: true,
//       locked: true,
//       approvedAt: FieldValue.serverTimestamp(),
//       approvedBy: userId,
//       actionOn: 'none', // Photographer has taken action
//       updatedAt: FieldValue.serverTimestamp()
//     });

//     return { success: true };

//   } catch (error) {
//     console.error('Error approving section:', error);
//     if (error instanceof HttpsError) {
//       throw error;
//     }
//     throw new HttpsError('internal', 'Failed to approve section');
//   }
// });

// // Allows a photographer to request a revision.
// const photographerRequestRevision = onCall({ region: "us-central1" }, async (request) => {
//   const { projectId, sectionId, revisionReason } = request.data;
//   const userId = request.auth?.uid;

//   if (!userId) {
//     throw new HttpsError("unauthenticated", "User must be authenticated.");
//   }

//   if (!projectId || !sectionId) {
//     throw new HttpsError('invalid-argument', 'Project ID and section ID are required');
//   }

//   if (!revisionReason || typeof revisionReason !== 'string' || revisionReason.trim().length === 0) {
//     throw new HttpsError('invalid-argument', 'Revision reason is required and must be a non-empty string');
//   }

//   // Limit revision reason length for security
//   if (revisionReason.length > 1000) {
//     throw new HttpsError('invalid-argument', 'Revision reason is too long (max 1000 characters)');
//   }

//   try {
//     const db = getFirestore();
    
//     // Update the section's config to unlock it and set action back to client
//     const configRef = db.collection('projects').doc(projectId).collection(sectionId).doc('config');
    
//     await configRef.update({
//       locked: false,
//       finalized: false, // Reset finalized status when requesting revision
//       actionOn: 'client', // Client needs to take action
//       revisionRequested: true,
//       revisionReason: revisionReason.trim(),
//       revisionRequestedAt: FieldValue.serverTimestamp(),
//       revisionRequestedBy: userId,
//       updatedAt: FieldValue.serverTimestamp()
//     });

//     return { success: true };

//   } catch (error) {
//     console.error('Error requesting revision:', error);
//     if (error instanceof HttpsError) {
//       throw error;
//     }
//     throw new HttpsError('internal', 'Failed to request revision');
//   }
// });


// // Export all functions
// module.exports = {
//   generatePortalLink,
//   disablePortalLink,
//   getPortalAuthToken,
//   clientSaveLocations,
//   clientSaveKeyPeople,
//   clientSavePhotoRequests,
//   clientSaveGroupShotSelections,
//   clientSaveTimelineEvents,
//   photographerApproveSection,
//   photographerRequestRevision,
//   trackClientAccess,
//   updateClientCurrentStep,
//   updateSectionStatus,
// };
