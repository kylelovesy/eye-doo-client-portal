# Client Portal Data Schema Documentation

This document provides comprehensive information about the data structures, Firebase collections, authentication model, and update patterns that the client portal (Next.js application) needs to interact with the main EyeDoo application.

## Table of Contents

1. [Authentication Model](#authentication-model)
2. [Main Project Schema](#main-project-schema)
3. [Sub-Collections Structure](#sub-collections-structure)
4. [Portal Access & Security](#portal-access--security)
5. [Data Update Patterns](#data-update-patterns)
6. [Firestore Security Rules](#firestore-security-rules)
7. [Cloud Functions API](#cloud-functions-api)
8. [Error Handling](#error-handling)

---

## Authentication Model

The client portal uses a **Custom Token Authentication** model for secure access.

### Authentication Flow

1. **Client visits portal URL**: `https://your-portal.vercel.app/?project={projectId}&token={accessToken}`
2. **Portal calls Cloud Function**: `getPortalAuthToken({ projectId, accessToken })`
3. **Function validates access**: Checks `portalAccess/{projectId}` document
4. **Custom token issued**: Firebase Admin SDK creates temporary auth token with `portalAccess: true` claim
5. **Client signs in**: Portal uses `signInWithCustomToken()` with returned token
6. **Firestore access**: Client can now read/write authorized data via Firestore Security Rules

### Key Components

- **Access Token**: 64-character hex string stored in `portalAccess` collection
- **Custom Token**: Temporary Firebase auth token with special claims
- **Project ID**: Used as the authenticated user's UID for security rules

---

## Main Project Schema

### Project Document Structure

```typescript
// Collection: projects/{projectId}
interface Project {
  id: string;
  userId: string; // Owner's Firebase UID
  
  // Basic project information
  projectInfo: {
    projectName: string;
    personA: { firstName: string; surname?: string };
    personB: { firstName: string; surname?: string };
    contact: {
      email: string;
      phone?: string;
      address?: string;
    };
    eventDate: FirestoreTimestamp;
    locationName: string;
    projectStatus?: 'Draft' | 'Active' | 'Completed' | 'Cancelled';
    locationPostcode?: string;
  };
  
  // Client portal configuration
  clientPortal?: {
    portalSetup: boolean;
    portalSetupComplete: boolean;
    isEnabled: boolean;
    currentStepID: 'welcome' | 'keyPeople' | 'locations' | 'groupShots' | 'photoRequests' | 'timeline' | 'thankYou';
    portalUrl: string;
    accessToken: string;
    portalMessage?: string;
    createdAt: FirestoreTimestamp;
    updatedAt: FirestoreTimestamp;
    expiresAt: FirestoreTimestamp;
  };
  
  // Portal steps configuration
  portalSteps?: PortalStep[];
  
  // Project metadata
  metadata?: {
    hasLaunchedDashboard?: boolean;
    firstLaunchDate?: FirestoreTimestamp;
  };
  
  // Timestamps
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

interface PortalStep {
  stepNumber: number;
  stepTitle: string;
  portalStepID: 'welcome' | 'keyPeople' | 'locations' | 'groupShots' | 'photoRequests' | 'timeline' | 'thankYou';
  stepStatus: 'unlocked' | 'inProgress' | 'completed' | 'locked' | 'finalized';
  actionOn: 'photographer' | 'client' | 'none';
  requiredStep: boolean;
  stepIcon: string;
}
```

### Firestore Timestamp Handling

```typescript
// Firestore timestamps come as objects with seconds/nanoseconds
interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date; // Method to convert to JavaScript Date
}
```

---

## Sub-Collections Structure

All client-editable data is stored in sub-collections under `projects/{projectId}/`.

### 1. Locations

**Collection**: `projects/{projectId}/locations/`

#### Config Document (`locations/config`)
```typescript
interface LocationConfig {
  multipleLocations: boolean;
  finalized?: boolean;
  locked?: boolean;
  updatedAt: FirestoreTimestamp;
  clientLastViewed?: FirestoreTimestamp;
}
```

#### Items Document (`locations/items`)
```typescript
interface LocationItems {
  list: ClientLocationFull[];
}

interface ClientLocationFull {
  id: string; // Format: "loc_{timestamp}"
  locationType: 'Single Location' | 'Main Venue' | 'Ceremony' | 'Getting Ready 1' | 'Getting Ready 2' | 'Reception' | 'Photo Location' | 'Accommodation' | 'Other';
  locationName: string;
  locationAddress: string;
  locationPostcode: string;
  locationNotes?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
}
```

### 2. Key People

**Collection**: `projects/{projectId}/keyPeople/`

#### Config Document (`keyPeople/config`)
```typescript
interface KeyPeopleConfig {
  finalized?: boolean;
  locked?: boolean;
  updatedAt: FirestoreTimestamp;
  clientLastViewed?: FirestoreTimestamp;
}
```

#### Items Document (`keyPeople/items`)
```typescript
interface KeyPeopleItems {
  list: ClientKeyPersonFull[];
}

interface ClientKeyPersonFull {
  id: string; // Format: "person_{timestamp}"
  firstName: string;
  surname?: string;
  role: 'Maid of Honor' | 'Best Man' | 'Bridesmaid' | 'Groomsman' | 'Mother of the Bride' | 'Father of the Bride' | 'Mother of the Groom' | 'Father of the Groom' | 'Other';
  relationship: string;
  phoneNumber?: string;
  email?: string;
  specialActions?: ('Speech' | 'Reading' | 'Toast' | 'Walk Down Aisle' | 'Special Dance' | 'Other')[];
  notes?: string;
}
```

### 3. Photo Requests

**Collection**: `projects/{projectId}/photoRequests/`

#### Config Document (`photoRequests/config`)
```typescript
interface PhotoRequestConfig {
  finalized?: boolean;
  locked?: boolean;
  updatedAt: FirestoreTimestamp;
  clientLastViewed?: FirestoreTimestamp;
}
```

#### Items Document (`photoRequests/items`)
```typescript
interface PhotoRequestItems {
  list: ClientPhotoRequestItemFull[];
}

interface ClientPhotoRequestItemFull {
  id: string; // Format: "request_{timestamp}"
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  category: 'Group Shot' | 'Individual Shot' | 'Couple Shot' | 'Candid Shot' | 'Detail Shot' | 'Other';
  peopleInvolved?: string[];
  locationPreference?: string;
  timePreference?: string;
  notes?: string;
}
```

### 4. Group Shots

**Collection**: `projects/{projectId}/groupShotData/`

#### Group Shot Document (`groupShotData/groupShot`)
```typescript
interface GroupShotData {
  // Configuration section
  config: {
    totalTimeEstimated: number; // Total minutes for selected shots
    finalized?: boolean;
    locked?: boolean;
    updatedAt: FirestoreTimestamp;
    clientLastViewed?: FirestoreTimestamp;
  };
  
  // Categories for organizing group shots into accordion sections
  categories: string[];
  
  // Individual group shot items
  items: ClientGroupShotItemFull[];
}

interface ClientGroupShotItemFull {
  id: string;
  title: string;
  category: string;
  time: number; // Estimated time in minutes
  checked: boolean; // Whether client selected this shot
  peopleInvolved?: string[];
  notes?: string;
}
```

**Note**: This is a single document containing all group shot data (config, categories, and items) rather than separate documents. The client portal should fetch this single document and use the `categories` array to create accordion sections, with `items` filtered by category for each accordion.

#### Implementation Guide for Client Portal GroupShotsSection

The client portal should use the `groupShotData/groupShot` document to create an accordion-based interface where each category becomes an accordion section containing its related group shot items.

##### Data Fetching Pattern
```typescript
// 1. Set up real-time listener for group shot data
const [groupShotData, setGroupShotData] = useState<GroupShotData | null>(null);
const [accordionSections, setAccordionSections] = useState<AccordionSection[]>([]);

useEffect(() => {
  const groupShotRef = doc(db, 'projects', projectId, 'groupShotData', 'groupShot');
  
  const unsubscribe = onSnapshot(groupShotRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as GroupShotData;
      setGroupShotData(data);
      
      // Transform categories into accordion sections
      const sections = data.categories.map(category => ({
        id: category.toLowerCase().replace(/\s+/g, '-'),
        title: category,
        items: data.items.filter(item => item.category === category),
        isExpanded: false,
        selectedCount: data.items.filter(item => 
          item.category === category && item.checked
        ).length
      }));
      
      setAccordionSections(sections);
    }
  });
  
  return () => unsubscribe();
}, [projectId]);
```

##### Accordion Section Interface
```typescript
interface AccordionSection {
  id: string;           // Unique identifier for the section
  title: string;        // Category name (from groupShotData.categories)
  items: ClientGroupShotItemFull[]; // Items filtered by category
  isExpanded: boolean;  // UI state for accordion
  selectedCount: number; // Number of checked items in this category
}
```

##### Component Structure Example
```typescript
// GroupShotsSection.tsx
export const GroupShotsSection = ({ projectId, accessToken }) => {
  const [accordionSections, setAccordionSections] = useState<AccordionSection[]>([]);
  const [isEditable, setIsEditable] = useState(true);
  const [totalTimeEstimated, setTotalTimeEstimated] = useState(0);
  
  // ... data fetching logic above ...
  
  const handleItemToggle = async (itemId: string, checked: boolean) => {
    if (!isEditable) return;
    
    // Update local state optimistically
    const updatedItems = groupShotData.items.map(item =>
      item.id === itemId ? { ...item, checked } : item
    );
    
    // Send update to Cloud Function
    try {
      await updateClientGroupShotSelections({
        projectId,
        accessToken,
        updatedItems
      });
    } catch (error) {
      console.error('Failed to update group shot selection:', error);
      // Revert optimistic update on error
    }
  };
  
  return (
    <div className="group-shots-section">
      <h2>Group Shot Preferences</h2>
      <p>Total estimated time: {totalTimeEstimated} minutes</p>
      
      {accordionSections.map(section => (
        <AccordionComponent
          key={section.id}
          title={section.title}
          selectedCount={section.selectedCount}
          totalCount={section.items.length}
          isExpanded={section.isExpanded}
          onToggle={() => toggleSection(section.id)}
        >
          {section.items.map(item => (
            <GroupShotItem
              key={item.id}
              item={item}
              isEditable={isEditable}
              onToggle={(checked) => handleItemToggle(item.id, checked)}
            />
          ))}
        </AccordionComponent>
      ))}
    </div>
  );
};
```

##### Key Implementation Points

1. **Category-Based Accordion Structure**: Each item in `groupShotData.categories` becomes an accordion section
2. **Item Filtering**: Use `groupShotData.items.filter(item => item.category === category)` to populate each accordion
3. **Real-time Updates**: Use `onSnapshot` to listen for changes from the photographer app
4. **Optimistic Updates**: Update UI immediately, then sync with server via Cloud Functions
5. **Read-only Mode**: Check `groupShotData.config.finalized` and `groupShotData.config.locked` to determine if editing is allowed
6. **Progress Tracking**: Show selected count per category and total estimated time

##### Data Flow Consistency with Main App

The client portal should mirror the exact same data structure and behavior as your main React Native application:

```typescript
// IMPORTANT: Use the SAME sub-collection path as main app
// Path: projects/{projectId}/groupShotData/groupShot

// Expected document structure (must match main app):
{
  config: {
    totalTimeEstimated: 45,        // Auto-calculated from selected items
    finalized: false,              // Set by photographer
    locked: false,                 // Set by photographer
    updatedAt: FirestoreTimestamp,
    clientLastViewed: FirestoreTimestamp
  },
  categories: [
    "Couple with each parent individually",
    "Couple with both sets of parents",
    "Couple with siblings",
    // ... more categories from your main app
  ],
  items: [
    {
      id: "groupshot_123",
      title: "Couple with Bride's Parents",
      category: "Couple with each parent individually",
      time: 5,                     // Minutes
      checked: true,               // Client selection
      peopleInvolved: ["Bride", "Bride's Mother", "Bride's Father"],
      notes: "Outdoor preferred"
    },
    // ... more items
  ]
}
```

**Critical Requirements:**
- Use identical collection path: `groupShotData/groupShot` 
- Respect the exact `categories` array from your main app
- Filter items by matching `item.category` to category strings
- Update `config.totalTimeEstimated` when selections change
- Always update `config.clientLastViewed` when client makes changes

### 5. Timeline

**Collection**: `projects/{projectId}/timeline/`

#### Config Document (`timeline/config`)
```typescript
interface TimelineConfig {
  eventDate: FirestoreTimestamp;
  finalized?: boolean;
  locked?: boolean;
  updatedAt: FirestoreTimestamp;
  clientLastViewed?: FirestoreTimestamp;
}
```

#### Items Document (`timeline/items`)
```typescript
interface TimelineItems {
  list: ClientTimelineEventFull[];
}

interface ClientTimelineEventFull {
  id: string; // Format: "event_{timestamp}"
  title: string;
  eventType: 'Bridal Prep' | 'Groom Prep' | 'Ceremony Begins' | 'Reception Drinks' | 'Group Photos' | 'Couple Portraits' | 'Wedding Breakfast' | 'Speeches' | 'First Dance' | 'Evening Entertainment' | 'Other';
  startTime: string; // Format: "HH:MM"
  endTime?: string; // Format: "HH:MM"
  location?: string;
  description?: string;
  peopleInvolved?: string[];
  isPhotographyRequired: boolean;
  notes?: string;
}
```

---

## Portal Access & Security

### Portal Access Collection

**Collection**: `portalAccess/{projectId}`

```typescript
interface PortalAccess {
  projectId: string;
  accessToken: string; // 64-character hex string
  portalId: string; // Format: "portal_{projectId}_{timestamp}"
  selectedSteps: string[]; // Array of step IDs enabled for this portal
  isEnabled: boolean;
  createdAt: FirestoreTimestamp;
  expiresAt: Date; // 30 days from creation
  accessCount: number;
  lastAccessedAt?: FirestoreTimestamp;
}
```

### Security Model

- **Project Owner**: Can read/write their own projects and sub-collections
- **Portal Client**: Can only read project data and write to sub-collections of their authenticated project
- **Authentication**: Portal clients authenticate with `auth.uid === projectId` and `auth.token.portalAccess === true`

---

## Data Update Patterns

### 1. Client Updates via Cloud Functions (Recommended)

All client updates should go through secure Cloud Functions that validate the portal token:

```typescript
// Example: Adding a location
const addLocation = httpsCallable(functions, 'saveClientLocations');
await addLocation({
  projectId,
  accessToken,
  newLocation: {
    locationType: 'Ceremony',
    locationName: 'St. Mary\'s Church',
    locationAddress: '123 Church St',
    locationPostcode: 'SW1A 1AA',
    // ... other fields
  }
});
```

### 2. Real-time Listeners

Set up listeners for real-time updates:

```typescript
// Listen to location updates
const unsubscribe = onSnapshot(
  doc(db, 'projects', projectId, 'locations', 'config'),
  (snapshot) => {
    if (snapshot.exists()) {
      const config = snapshot.data() as LocationConfig;
      // Update UI with config data
    }
  }
);

// Listen to group shot data updates (single document with config, categories, and items)
const unsubscribeGroupShots = onSnapshot(
  doc(db, 'projects', projectId, 'groupShotData', 'groupShot'),
  (snapshot) => {
    if (snapshot.exists()) {
      const groupShotData = snapshot.data() as GroupShotData;
      
      // Create accordion sections from categories
      const accordionSections = groupShotData.categories.map(category => ({
        id: category.toLowerCase().replace(/\s+/g, '-'),
        title: category,
        items: groupShotData.items.filter(item => item.category === category),
        isExpanded: false,
        selectedCount: groupShotData.items.filter(item => 
          item.category === category && item.checked
        ).length
      }));
      
      // Check if section is editable
      const isEditable = !groupShotData.config.finalized && !groupShotData.config.locked;
      
      // Calculate total estimated time
      const totalTime = groupShotData.items
        .filter(item => item.checked)
        .reduce((sum, item) => sum + item.time, 0);
      
      // Update component state
      setAccordionSections(accordionSections);
      setIsEditable(isEditable);
      setTotalTimeEstimated(totalTime);
    }
  }
);
```

### 3. Data Validation

All data must be validated before sending to Firestore:

```typescript
// Utility function to strip undefined values (Firestore doesn't accept undefined)
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
```

---

## Firestore Security Rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check if the user is authenticated via the client portal
    function isPortalClient(projectId) {
      return request.auth.uid == projectId && request.auth.token.portalAccess == true;
    }

    // Projects can be read by their owners or by an authenticated portal client
    match /projects/{projectId} {
      allow read: if request.auth.uid == resource.data.userId || isPortalClient(projectId);
      allow write: if request.auth.uid == resource.data.userId;

      // Rules for all subcollections within a project (e.g., locations, keyPeople)
      match /{subcollection}/{docId} {
        allow read: if isPortalClient(projectId);
        allow write: if isPortalClient(projectId);
      }
    }
    
    // Portal access links can only be read/written by the project owner (server-side)
    match /portalAccess/{projectId} {
      allow read, write: if request.auth.uid == get(/databases/$(database)/documents/projects/$(projectId)).data.userId;
    }

    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

## Cloud Functions API

### Authentication Function

**Function**: `getPortalAuthToken`
```typescript
// Input
interface AuthRequest {
  projectId: string;
  accessToken: string;
}

// Output
interface AuthResponse {
  token: string; // Custom Firebase auth token
}

// Usage
const getAuthToken = httpsCallable<AuthRequest, AuthResponse>(functions, 'getPortalAuthToken');
const result = await getAuthToken({ projectId, accessToken });
await signInWithCustomToken(auth, result.data.token);
```

### Data Update Functions

#### 1. Save Locations
**Function**: `saveClientLocations`
```typescript
interface SaveLocationRequest {
  projectId: string;
  accessToken: string;
  newLocation: Omit<ClientLocationFull, 'id'>;
}
```

#### 2. Save Key People
**Function**: `saveClientKeyPeople`
```typescript
interface SaveKeyPeopleRequest {
  projectId: string;
  accessToken: string;
  newPerson: Omit<ClientKeyPersonFull, 'id'>;
}
```

#### 3. Save Photo Requests
**Function**: `saveClientPhotoRequests`
```typescript
interface SavePhotoRequestRequest {
  projectId: string;
  accessToken: string;
  newRequest: Omit<ClientPhotoRequestItemFull, 'id'>;
}
```

#### 4. Update Group Shot Selections
**Function**: `updateClientGroupShotSelections`
```typescript
interface UpdateGroupShotsRequest {
  projectId: string;
  accessToken: string;
  updatedItems: ClientGroupShotItemFull[];
}
```

**Note**: This function updates the entire `items` array in the `groupShotData/groupShot` document. It also recalculates and updates the `config.totalTimeEstimated` field based on selected shots.

#### 5. Add Timeline Event
**Function**: `addClientTimelineEvent`
```typescript
interface AddTimelineEventRequest {
  projectId: string;
  accessToken: string;
  newEvent: Omit<ClientTimelineEventFull, 'id'>;
}
```

---

## Error Handling

### Common Error Types

1. **Authentication Errors**
   - Invalid or expired access token
   - Project not found
   - Portal access disabled

2. **Validation Errors**
   - Missing required fields
   - Invalid data types
   - Firestore undefined field errors

3. **Permission Errors**
   - Section locked by photographer
   - Portal expired
   - Insufficient permissions

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
}
```

### Example Error Handling

```typescript
try {
  await addLocation(locationData);
} catch (error) {
  if (error.code === 'unauthenticated') {
    // Redirect to authentication
  } else if (error.code === 'permission-denied') {
    // Show "section locked" message
  } else {
    // Show generic error message
  }
}
```

---

## Step Status Management

### Step Status Flow

1. **unlocked**: Step is available for client to start
2. **inProgress**: Client has started working on the step
3. **completed**: Client has finished the step
4. **locked**: Photographer has locked the step (read-only for client)
5. **finalized**: Photographer has finalized the step (no further changes)

### Section Locking Logic

```typescript
// Check if a section is editable by the client
function isSectionEditable(config: any): boolean {
  return !config?.finalized && !config?.locked;
}

// Example usage in portal
if (!isSectionEditable(locationConfig)) {
  // Show read-only view
  return <ReadOnlyLocationView />;
}
```

---

## Important Notes

### 1. Timestamp Handling
- Always use `serverTimestamp()` for Firestore writes
- Convert Firestore timestamps to JavaScript Dates in the client portal
- Handle both timestamp formats (objects and Dates) for compatibility

### 2. Data Consistency
- Use transactions for related updates (e.g., updating both items and config)
- Always update `clientLastViewed` timestamp when client makes changes
- Validate data on both client and server sides

### 3. Performance Considerations
- Use real-time listeners judiciously (only for essential updates)
- Implement proper cleanup for listeners
- Consider pagination for large data sets

### 4. Security Best Practices
- Never store sensitive data in client-accessible locations
- Always validate portal access before processing requests
- Use Cloud Functions for all write operations when possible
- Regularly audit access logs and security rules

---

## Firebase Configuration

### Required Environment Variables (Client Portal)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Firebase SDK Initialization

```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export { app };
```

---

This document provides all the essential information needed for the client portal to interact with the EyeDoo application's data structures and Firebase backend. Keep this document updated as schemas evolve.
