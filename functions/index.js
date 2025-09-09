// functions/src/generatePortalLink.js

const { randomBytes } = require('crypto');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { HttpsError, onCall } = require('firebase-functions/v2/https');

// Initialize Firebase Admin
initializeApp();

// UTILITY FUNCTIONS
const getPortalDocRef = (db, projectId) => {
  return db.collection('projects').doc(projectId).collection('clientPortals').doc('default-portal');
};

// PORTAL CONTROL FUNCTIONS
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
      const portalDocRef = getPortalDocRef(db, projectId);

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

      // Create portal document in subcollection
      transaction.set(portalDocRef, {
        isSetup: true,
        portalSetupComplete: true,
        isEnabled: true,
        portalUrl: portalUrl,
        accessToken: accessToken,
        setupDate: FieldValue.serverTimestamp(),
        lastUpdated: FieldValue.serverTimestamp(),
        currentStepID: 'welcome',
        portalMessage: 'Welcome to your planning portal! Please complete each step to help us make your day perfect.',
        metadata: {
          totalSteps: selectedSteps.length,
          completedSteps: 0,
          completionPercentage: 0,
          lastClientActivity: null,
          clientAccessCount: 0,
        },
      });

      // Update project to reference the portal
      transaction.update(projectRef, {
        portalId: 'default-portal',
        'metadata.hasLaunchedDashboard': true,
        'metadata.portalSetupDate': FieldValue.serverTimestamp(),
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
      const portalDocRef = getPortalDocRef(db, projectId);

      transaction.update(portalAccessRef, {
        isEnabled: false,
        disabledAt: FieldValue.serverTimestamp(),
      });

      transaction.update(portalDocRef, {
        isEnabled: false,
        lastUpdated: FieldValue.serverTimestamp(),
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


// CLIENT PORTAL ACCESS AND ACTIVITY FUNCTIONS
const trackClientAccess = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken } = request.data;
  // const userId = request.auth?.uid;
  // User authentication check is optional for portal access tracking
  // since we're using access tokens, but good to have for audit trail
  if (!projectId || !accessToken) {
    throw new HttpsError('invalid-argument', 'Project ID and access token are required');
  }

  try {
    const db = getFirestore();    
    // First validate the portal token to ensure it's legitimate access
    await validatePortalToken(db, projectId, accessToken);

    // Update the portal metadata in subcollection
    const portalDocRef = getPortalDocRef(db, projectId);
    const portalDoc = await portalDocRef.get();

    if (portalDoc.exists) {
      const portalData = portalDoc.data();
      const lastActivity = portalData?.metadata?.lastClientActivity;
      const now = new Date();
      // ONLY INCREMENT ACCESS COUNT IF THIS IS A NEW PORTAL LAUNCH - (no previous activity OR last activity was more than 30 minutes ago)
      const shouldIncrementCount = !lastActivity || (lastActivity && (now - lastActivity.toDate()) > (30 * 60 * 1000));
      const updateData = {
        'metadata.lastClientActivity': FieldValue.serverTimestamp(),
        lastUpdated: FieldValue.serverTimestamp()
      };
      // ONLY INCREMENT ACCESS COUNT FOR NEW PORTAL LAUNCHES
      if (shouldIncrementCount) {
        updateData['metadata.clientAccessCount'] = FieldValue.increment(1);
      }
      await portalDocRef.update(updateData);
    }

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

    // Update the current step ID in portal document
    const portalDocRef = getPortalDocRef(db, projectId);

    await portalDocRef.update({
      currentStepID: stepId,
      lastUpdated: FieldValue.serverTimestamp()
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



// Update Step/Section status for client or photographer
const updateSectionStatus = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken, stepId, status, actionOn } = request.data;

  if (!projectId || !accessToken || !stepId || !status || !actionOn) {
    throw new HttpsError('invalid-argument', 'Project ID, access token, step ID, status, and action on are required');
  }

  try {
    const db = getFirestore();
    // Validate the portal token
    await validatePortalToken(db, projectId, accessToken);

    // Get the portal document from subcollection
    const portalDocRef = getPortalDocRef(db, projectId);
    const portalDoc = await portalDocRef.get();

    if (!portalDoc.exists) {
      throw new HttpsError('not-found', 'Portal not found');
    }

    const portalData = portalDoc.data();
    const steps = portalData.steps || [];

    // Find the step with matching portalStepID
    const stepIndex = steps.findIndex(step => step.portalStepID === stepId);

    if (stepIndex === -1) {
      throw new HttpsError('not-found', 'Section not found');
    }

    // Update the step status
    steps[stepIndex].stepStatus = status;
    steps[stepIndex].actionOn = actionOn;
    steps[stepIndex].updatedAt = new Date(); // Use JavaScript Date instead of FieldValue

    // Update the portal document using set() to handle FieldValue properly
    await portalDocRef.set({
      ...portalData,
      steps: steps,
      currentStepID: 'welcome',
      lastUpdated: FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error updating section status:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to update section status');
  }
});



// CLIENT SAVE FUNCTIONS
// Allows a client to save their location data.
const clientSaveLocations = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken, locations, config } = request.data;

  if (!projectId || !accessToken || !Array.isArray(locations)) {
    throw new HttpsError('invalid-argument', 'Project ID, access token, and a locations array are required.');
  }

  if (locations.length > 6) {
    throw new HttpsError('invalid-argument', 'Too many locations provided.');
  }

  try {
    const db = getFirestore();
    await validatePortalToken(db, projectId, accessToken);
    const batch = db.batch();
    const itemsRef = db.collection('projects').doc(projectId).collection('locations').doc('items');
    
    batch.set(itemsRef, { 
      list: locations,
    }, { merge: true });

    if (config && Object.keys(config).length > 0) {
      const configRef = db.collection('projects').doc(projectId).collection('locations').doc('config');
      batch.set(configRef, { 
        ...config, 
        updatedAt: FieldValue.serverTimestamp() 
      }, { merge: true });
    }

    await batch.commit();
    return { success: true };

  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('Error in clientSaveLocations:', error);
    throw new HttpsError('internal', 'Failed to save locations.');
  }
});
// Allows a client to save their key people data as a draft.
const clientSaveKeyPeople = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken, people, config } = request.data;

  if (!projectId || !accessToken || !Array.isArray(people)) {
    throw new HttpsError('invalid-argument', 'Project ID, token, and people array are required.');
  }

  // Input validation
  if (people.length > 10) {
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
  if (allLocalItems.length > 30) {
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
    throw new HttpsError('invalid-argument', 'Project ID, token, and an events array are required.');
  }

  // Basic validation of newEvent
  if (events.length > 15) {
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

    // const configRef = db.collection('projects').doc(projectId).collection('timeline').doc('config');
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
    // await batch.commit();    
    // return { success: true, newEventId: eventWithId.id };
    
    await batch.commit();
    return { success: true };

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

// Allows a client to skip a step
const clientSkipStep = onCall({ region: "us-central1" }, async (request) => {
  const { projectId, accessToken, stepId } = request.data;

  if (!projectId || !accessToken || !stepId) {
    throw new HttpsError('invalid-argument', 'Project ID, access token, and step ID are required');
  }

  try {
    const db = getFirestore();

    // Validate the portal token
    await validatePortalToken(db, projectId, accessToken);

    // Use transaction for consistency
    const result = await db.runTransaction(async (transaction) => {
      const portalDocRef = getPortalDocRef(db, projectId);
      const configRef = db.collection('projects').doc(projectId).collection(stepId).doc('config');

      // Get current portal document
      const portalDoc = await transaction.get(portalDocRef);
      if (!portalDoc.exists) {
        throw new HttpsError('not-found', 'Portal not found');
      }

      const portalData = portalDoc.data();
      const steps = portalData.steps || [];

      // Find the step with matching portalStepID
      const stepIndex = steps.findIndex(step => step.portalStepID === stepId);
      if (stepIndex === -1) {
        throw new HttpsError('not-found', 'Step not found');
      }

      // Update the step status in the portal document
      steps[stepIndex].stepStatus = 'finalized';
      steps[stepIndex].actionOn = 'none';
      steps[stepIndex].updatedAt = new Date();

      // Update metadata to increment completed steps
      const currentCompleted = portalData.metadata?.completedSteps || 0;
      const updatedMetadata = {
        ...portalData.metadata,
        completedSteps: currentCompleted + 1,
        completionPercentage: Math.round(((currentCompleted + 1) / (portalData.metadata?.totalSteps || 1)) * 100)
      };

      // Update portal document
      transaction.set(portalDocRef, {
        ...portalData,
        steps: steps,
        metadata: updatedMetadata,
        currentStepID: 'welcome', // Reset to welcome
        lastUpdated: FieldValue.serverTimestamp()
      }, { merge: true });

      // Update section config to mark as finalized
      transaction.set(configRef, {
        finalized: true,
        skipped: true,
        skippedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      return { success: true };
    });

    return result;

  } catch (error) {
    console.error('Error skipping step:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to skip step');
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
  clientSaveTimeline,
  clientSkipStep,
  photographerApproveSection,
  photographerRequestRevision,
  trackClientAccess,
  updateClientCurrentStep,
  updateSectionStatus,
};
