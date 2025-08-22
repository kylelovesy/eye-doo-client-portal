# API Documentation

## 🔥 Firebase Services

### Authentication Service

#### Custom Token Authentication
```typescript
// Endpoint: Cloud Function
GET https://us-central1-eyedooapp.cloudfunctions.net/getPortalAuthTokenHttp

// Query Parameters
{
  project: string,    // Project ID
  token: string       // Access token
}

// Response
{
  token: string       // Firebase custom token
  error?: string      // Error message if authentication fails
}
```

#### Firebase Auth Integration
```typescript
import { signInWithCustomToken } from 'firebase/auth';

// Authenticate with custom token
await signInWithCustomToken(auth, customToken);
```

### Firestore Database

#### Collections Structure

##### Projects Collection
```typescript
// Path: projects/{projectId}
interface ProjectData {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userID: string;
  members: string[];
  photographerName: string;
  projectInfo: {
    projectName: string;
    projectStatus: 'Draft' | 'Active' | 'Completed';
    eventDate: Timestamp;
    personA: {
      firstName: string;
      surname: string;
    };
    personB: {
      firstName: string;
      surname: string;
    };
    location: {
      locationAddress: string;
      locationPostcode: string;
    };
    contact: {
      primaryEmail: string;
      primaryPhone: string;
    };
  };
  portalStatus: {
    currentStep: number;
    lastUpdated: Timestamp;
    sectionStates?: Record<string, SectionStatus>;
  };
  userLists: {
    coupleShotListCategories: { list: CategoryItem[] };
    groupShotListCategories: { list: CategoryItem[] };
    kitCategories: { list: CategoryItem[] };
    tasksCategories: { list: CategoryItem[] };
  };
}
```

##### Locations Subcollection
```typescript
// Path: projects/{projectId}/locations/config
interface LocationConfig {
  multipleLocations: boolean;
  finalized: boolean;
  photographerReviewed: boolean;
  status?: SectionStatus;
}

// Path: projects/{projectId}/locations/items/{itemId}
interface ClientLocationFull {
  id: string;
  locationName: string;
  locationType: LocationType;
  locationAddress1: string;
  locationAddress2?: string;
  locationPostcode: string;
  locationNotes?: string;
  arriveTime?: Timestamp | null;
  leaveTime?: Timestamp | null;
  nextLocationTravelTimeEstimate?: number | null;
  nextLocationTravelArrangements?: string | null;
}
```

##### Key People Subcollection
```typescript
// Path: projects/{projectId}/keyPeople/config
interface KeyPeopleConfig {
  finalized: boolean;
  photographerReviewed: boolean;
  status?: SectionStatus;
}

// Path: projects/{projectId}/keyPeople/items/{itemId}
interface ClientKeyPersonFull {
  id: string;
  firstName: string;
  surname: string;
  role: KeyPersonRole;
  actions: KeyPersonActions[];
  notes?: string;
  isPredefined: boolean;
}
```

##### Group Shots Subcollection
```typescript
// Path: projects/{projectId}/groupShots/config
interface GroupShotConfig {
  finalized: boolean;
  photographerReviewed: boolean;
  status?: SectionStatus;
}

// Path: projects/{projectId}/groupShots/items/{itemId}
interface ClientGroupShotItemFull {
  id: string;
  categoryID: string;
  name: string;
  notes?: string;
  checked: boolean;
  isPredefined: boolean;
  time?: number;
}
```

##### Photo Requests Subcollection
```typescript
// Path: projects/{projectId}/photoRequests/config
interface PhotoRequestConfig {
  finalized: boolean;
  photographerReviewed: boolean;
  status?: SectionStatus;
}

// Path: projects/{projectId}/photoRequests/items/{itemId}
interface ClientPhotoRequestItemFull {
  id: string;
  requestType: PhotoRequestType;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  notes?: string;
  isPredefined: boolean;
}
```

##### Timeline Subcollection
```typescript
// Path: projects/{projectId}/timeline/config
interface TimelineConfig {
  finalized: boolean;
  photographerReviewed: boolean;
  status?: SectionStatus;
}

// Path: projects/{projectId}/timeline/items/{itemId}
interface ClientTimelineEventFull {
  id: string;
  eventType: TimelineEventType;
  eventName: string;
  startTime: Timestamp;
  endTime: Timestamp;
  location?: string;
  notes?: string;
  isPredefined: boolean;
}
```

#### Master Data Collections

##### Kit Collection
```typescript
// Path: masterData/kit
interface KitMasterData {
  config: {
    type: 'KIT';
    source: 'MASTER_LIST';
    defaultValues: boolean;
    createdAt: string;
    updatedAt: string;
  };
  categories: CategoryItem[];
  items: KitItem[];
}

interface KitItem {
  id: string;
  name: string;
  categoryId: string;
  checked: boolean;
  notes: string;
  quantity: number;
  isPredefined: boolean;
}
```

##### Couple Shots Collection
```typescript
// Path: masterData/coupleShots
interface CoupleShotsMasterData {
  config: {
    type: 'COUPLE_SHOTS';
    source: 'MASTER_LIST';
    defaultValues: boolean;
    createdAt: string;
    updatedAt: string;
  };
  categories: CategoryItem[];
  items: CoupleShotItem[];
}

interface CoupleShotItem {
  id: string;
  name: string;
  categoryId: string;
  checked: boolean;
  notes: string;
  isPredefined: boolean;
  time: number;
}
```

## 🛠️ Service Layer API

### ProjectService Class

#### Authentication Methods

```typescript
/**
 * Authenticate via Cloud Function and fetch top-level project data
 * @param projectId - Unique project identifier
 * @param token - Access token for authentication
 * @returns Promise<ProjectData> - Project information
 */
getProjectData(projectId: string, token: string): Promise<ProjectData>
```

#### Real-time Listener Methods

```typescript
/**
 * Listen to project header updates
 * @param projectId - Project identifier
 * @param callback - Function to call on data changes
 * @returns Unsubscribe function
 */
listenToProjectUpdates(
  projectId: string, 
  callback: (data: ProjectData) => void
): Unsubscribe

/**
 * Listen to location data updates
 * @param projectId - Project identifier
 * @param callback - Function to call on data changes
 * @returns Unsubscribe function
 */
listenToLocationUpdates(
  projectId: string, 
  callback: (data: PortalLocationData) => void
): Unsubscribe

/**
 * Listen to key people data updates
 * @param projectId - Project identifier
 * @param callback - Function to call on data changes
 * @returns Unsubscribe function
 */
listenToKeyPeopleUpdates(
  projectId: string, 
  callback: (data: PortalKeyPeopleData) => void
): Unsubscribe

/**
 * Listen to group shot data updates
 * @param projectId - Project identifier
 * @param callback - Function to call on data changes
 * @returns Unsubscribe function
 */
listenToGroupShotData(
  projectId: string, 
  callback: (data: PortalGroupShotData) => void
): Unsubscribe

/**
 * Listen to photo request updates
 * @param projectId - Project identifier
 * @param callback - Function to call on data changes
 * @returns Unsubscribe function
 */
listenToPhotoRequestUpdates(
  projectId: string, 
  callback: (data: PortalPhotoRequestData) => void
): Unsubscribe

/**
 * Listen to timeline updates
 * @param projectId - Project identifier
 * @param callback - Function to call on data changes
 * @returns Unsubscribe function
 */
listenToTimelineUpdates(
  projectId: string, 
  callback: (data: PortalTimelineData) => void
): Unsubscribe
```

#### Data Update Methods

```typescript
/**
 * Update location data
 * @param projectId - Project identifier
 * @param data - Updated location data
 * @returns Promise<void>
 */
updateLocationData(
  projectId: string, 
  data: PortalLocationData
): Promise<void>

/**
 * Update key people data
 * @param projectId - Project identifier
 * @param data - Updated key people data
 * @returns Promise<void>
 */
updateKeyPeopleData(
  projectId: string, 
  data: PortalKeyPeopleData
): Promise<void>

/**
 * Update group shot data
 * @param projectId - Project identifier
 * @param data - Updated group shot data
 * @returns Promise<void>
 */
updateGroupShotData(
  projectId: string, 
  data: PortalGroupShotData
): Promise<void>

/**
 * Update photo request data
 * @param projectId - Project identifier
 * @param data - Updated photo request data
 * @returns Promise<void>
 */
updatePhotoRequestData(
  projectId: string, 
  data: PortalPhotoRequestData
): Promise<void>

/**
 * Update timeline data
 * @param projectId - Project identifier
 * @param data - Updated timeline data
 * @returns Promise<void>
 */
updateTimelineData(
  projectId: string, 
  data: PortalTimelineData
): Promise<void>
```

#### Status Management Methods

```typescript
/**
 * Update portal status and progress
 * @param projectId - Project identifier
 * @param currentStep - Current planning step
 * @param sectionStates - Optional section state updates
 * @returns Promise<void>
 */
updatePortalStatus(
  projectId: string, 
  currentStep: number, 
  sectionStates?: PortalStatus['sectionStates']
): Promise<void>
```

## 📊 Data Types and Enums

### Location Types
```typescript
enum LocationType {
  SINGLE_LOCATION = 'Single Location',
  MAIN_VENUE = 'Main Venue',
  CEREMONY = 'Ceremony',
  GETTING_READY_1 = 'Getting Ready 1',
  GETTING_READY_2 = 'Getting Ready 2',
  RECEPTION = 'Reception',
  PHOTO_LOCATION = 'Photo Location',
  ACCOMMODATION = 'Accommodation',
  OTHER = 'Other'
}
```

### Key Person Roles
```typescript
enum KeyPersonRole {
  MAID_OF_HONOR = 'Maid of Honor',
  MATRON_OF_HONOR = 'Matron of Honor',
  BEST_MAN = 'Best Man',
  BRIDESMAID = 'Bridesmaid',
  GROOMSMAN = 'Groomsman',
  JUNIOR_BRIDESMAID = 'Junior Bridesmaid',
  JUNIOR_GROOMSMAN = 'Junior Groomsman',
  FLOWER_GIRL = 'Flower Girl',
  RING_BEARER = 'Ring Bearer',
  USHER = 'Usher',
  MOTHER_OF_BRIDE = 'Mother of the Bride',
  FATHER_OF_BRIDE = 'Father of the Bride',
  MOTHER_OF_GROOM = 'Mother of the Groom',
  FATHER_OF_GROOM = 'Father of the Groom',
  STEPMOTHER = 'Stepmother',
  STEPFATHER = 'Stepfather',
  GRANDMOTHER = 'Grandmother',
  GRANDFATHER = 'Grandfather',
  SISTER = 'Sister',
  BROTHER = 'Brother',
  OTHER = 'Other'
}
```

### Key Person Actions
```typescript
enum KeyPersonActions {
  SPEECH = 'Speech',
  READING = 'Reading',
  TOAST = 'Toast',
  WALK_DOWN_AISLE = 'Walk Down Aisle',
  SPECIAL_DANCE = 'Special Dance',
  OTHER = 'Other'
}
```

### Photo Request Types
```typescript
enum PhotoRequestType {
  GROUP_SHOT = 'Group Shot',
  INDIVIDUAL_SHOT = 'Individual Shot',
  COUPLE_SHOT = 'Couple Shot',
  CANDID_SHOT = 'Candid Shot',
  DETAIL_SHOT = 'Detail Shot',
  OTHER = 'Other'
}
```

### Timeline Event Types
```typescript
enum TimelineEventType {
  BRIDAL_PREP = 'Bridal Prep',
  GROOM_PREP = 'Groom Prep',
  GUESTS_ARRIVE = 'Guests Arrive',
  CEREMONY_BEGINS = 'Ceremony Begins',
  CONFETTI_AND_MINGLING = 'Confetti and Mingling',
  RECEPTION_DRINKS = 'Reception Drinks',
  GROUP_PHOTOS = 'Group Photos',
  COUPLE_PORTRAITS = 'Couple Portraits',
  WEDDING_BREAKFAST = 'Wedding Breakfast',
  SPEECHES = 'Speeches',
  EVENING_GUESTS_ARRIVE = 'Evening Guests Arrive',
  CAKE_CUTTING = 'Cake Cutting',
  FIRST_DANCE = 'First Dance',
  EVENING_ENTERTAINMENT = 'Evening Entertainment',
  EVENING_BUFFET = 'Evening Buffet',
  CARRIAGES = 'Carriages',
  OTHER = 'Other'
}
```

### Section Status
```typescript
type SectionStatus = 'unlocked' | 'locked' | 'finalized';
```

## 🔐 Security and Permissions

### Firestore Security Rules

#### Basic Structure
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Project access control
    match /projects/{projectId} {
      allow read, write: if request.auth != null && 
        request.auth.token.projectId == projectId;
      
      // Subcollection access
      match /{subcollection}/{document=**} {
        allow read, write: if request.auth != null && 
          request.auth.token.projectId == projectId;
      }
    }
    
    // Master data access (read-only)
    match /masterData/{document} {
      allow read: if request.auth != null;
      allow write: if false; // No writes allowed
    }
  }
}
```

### Authentication Flow Security

1. **Token Validation**: Server-side validation of access tokens
2. **Project Isolation**: Clients can only access their assigned project
3. **Custom Token Expiration**: Time-limited access tokens
4. **HTTPS Enforcement**: All communication over secure channels

## 📱 Error Handling

### Common Error Scenarios

#### Authentication Errors
```typescript
interface AuthError {
  code: 'auth/invalid-token' | 'auth/token-expired' | 'auth/project-not-found';
  message: string;
  details?: any;
}
```

#### Data Validation Errors
```typescript
interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
```

#### Network Errors
```typescript
interface NetworkError {
  code: 'network/unavailable' | 'network/timeout' | 'network/unauthorized';
  message: string;
  retryAfter?: number;
}
```

### Error Response Format
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}
```

## 🚀 Performance Considerations

### Data Fetching Optimization

1. **Selective Listening**: Only listen to necessary data changes
2. **Batch Operations**: Use Firestore batch writes for multiple updates
3. **Pagination**: Implement pagination for large datasets
4. **Caching**: Client-side caching of frequently accessed data

### Real-time Updates

1. **Debounced Updates**: Prevent excessive re-renders
2. **Selective Re-rendering**: Only update changed components
3. **Connection Management**: Handle offline/online state gracefully
4. **Retry Logic**: Automatic retry for failed operations

## 🔧 Development and Testing

### Local Development Setup

1. **Firebase Emulator**: Use Firebase emulator for local development
2. **Environment Variables**: Configure local environment variables
3. **Mock Data**: Use sample data for development and testing
4. **Hot Reloading**: Next.js development server with hot reload

### Testing Strategies

1. **Unit Tests**: Test individual service methods
2. **Integration Tests**: Test Firebase integration
3. **Component Tests**: Test React component behavior
4. **E2E Tests**: Test complete user workflows

### Debugging Tools

1. **Firebase Console**: Monitor database operations
2. **React DevTools**: Debug component state and props
3. **Network Tab**: Monitor API calls and responses
4. **Console Logging**: Strategic logging for debugging