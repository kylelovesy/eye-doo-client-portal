// Type definitions aligned with CLIENT_PORTAL_DATA_SCHEMA.md

// --- Firestore Timestamp Interface ---
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

// --- Enums from Schema ---
export type LocationType = 
  | 'Single Location'
  | 'Main Venue' 
  | 'Ceremony'
  | 'Getting Ready 1'
  | 'Getting Ready 2'
  | 'Reception'
  | 'Photo Location'
  | 'Accommodation'
  | 'Other';

export type KeyPersonRole = 
  | 'Maid of Honor'
  | 'Best Man'
  | 'Bridesmaid'
  | 'Groomsman'
  | 'Mother of the Bride'
  | 'Father of the Bride'
  | 'Mother of the Groom'
  | 'Father of the Groom'
  | 'Other';

export type SpecialAction = 
  | 'Speech'
  | 'Reading'
  | 'Toast'
  | 'Walk Down Aisle'
  | 'Special Dance'
  | 'Other';

export type PhotoRequestCategory = 
  | 'Group Shot'
  | 'Individual Shot'
  | 'Couple Shot'
  | 'Candid Shot'
  | 'Detail Shot'
  | 'Other';

export type PhotoRequestPriority = 'Low' | 'Medium' | 'High';

export type TimelineEventType = 
  | 'Bridal Prep'
  | 'Groom Prep'
  | 'Ceremony Begins'
  | 'Reception Drinks'
  | 'Group Photos'
  | 'Couple Portraits'
  | 'Wedding Breakfast'
  | 'Speeches'
  | 'First Dance'
  | 'Evening Entertainment'
  | 'Other';

export type StepStatus = 'unlocked' | 'inProgress' | 'completed' | 'locked' | 'finalized';
export type StepAction = 'photographer' | 'client' | 'none';
export type StepID = 'welcome' | 'keyPeople' | 'locations' | 'groupShots' | 'photoRequests' | 'timeline' | 'thankYou';

// --- Main Project Schema ---
export interface Project {
  id: string;
  userId: string;
  
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
  
  clientPortal?: {
    portalSetup: boolean;
    portalSetupComplete: boolean;
    isEnabled: boolean;
    currentStepID: StepID;
    portalUrl: string;
    accessToken: string;
    portalMessage?: string;
    createdAt: FirestoreTimestamp;
    updatedAt: FirestoreTimestamp;
    expiresAt: FirestoreTimestamp;
  };
  
  portalSteps?: PortalStep[];
  
  metadata?: {
    hasLaunchedDashboard?: boolean;
    firstLaunchDate?: FirestoreTimestamp;
  };
  
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface PortalStep {
  stepNumber: number;
  stepTitle: string;
  portalStepID: StepID;
  stepStatus: StepStatus;
  actionOn: StepAction;
  requiredStep: boolean;
  stepIcon: string;
}

// --- Portal Access Schema ---
export interface PortalAccess {
  projectId: string;
  accessToken: string;
  portalId: string;
  selectedSteps: string[];
  isEnabled: boolean;
  createdAt: FirestoreTimestamp;
  expiresAt: Date;
  accessCount: number;
  lastAccessedAt?: FirestoreTimestamp;
}

// --- Sub-Collection Schemas ---

// 1. Locations
export interface LocationConfig {
  multipleLocations: boolean;
  finalized?: boolean;
  locked?: boolean;
  updatedAt: FirestoreTimestamp;
  clientLastViewed?: FirestoreTimestamp;
}

export interface ClientLocationFull {
  id: string; // Format: "loc_{timestamp}"
  locationType: LocationType;
  locationName: string;
  locationAddress: string;
  locationPostcode: string;
  locationNotes?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface LocationItems {
  list: ClientLocationFull[];
}

// 2. Key People
export interface KeyPeopleConfig {
  finalized?: boolean;
  locked?: boolean;
  updatedAt: FirestoreTimestamp;
  clientLastViewed?: FirestoreTimestamp;
}

export interface ClientKeyPersonFull {
  id: string; // Format: "person_{timestamp}"
  firstName: string;
  surname?: string;
  role: KeyPersonRole;
  relationship: string;
  phoneNumber?: string;
  email?: string;
  specialActions?: SpecialAction[];
  notes?: string;
}

export interface KeyPeopleItems {
  list: ClientKeyPersonFull[];
}

// 3. Photo Requests
export interface PhotoRequestConfig {
  finalized?: boolean;
  locked?: boolean;
  updatedAt: FirestoreTimestamp;
  clientLastViewed?: FirestoreTimestamp;
}

export interface ClientPhotoRequestItemFull {
  id: string; // Format: "request_{timestamp}"
  title: string;
  description: string;
  priority: PhotoRequestPriority;
  category: PhotoRequestCategory;
  peopleInvolved?: string[];
  locationPreference?: string;
  timePreference?: string;
  notes?: string;
}

export interface PhotoRequestItems {
  list: ClientPhotoRequestItemFull[];
}

// 4. Group Shots
export interface GroupShotConfig {
  totalTimeEstimated: number;
  finalized?: boolean;
  locked?: boolean;
  updatedAt: FirestoreTimestamp;
  clientLastViewed?: FirestoreTimestamp;
}

export interface ClientGroupShotItemFull {
  id: string;
  title: string;
  category: string;
  time: number;
  checked: boolean;
  peopleInvolved?: string[];
  notes?: string;
}

// Schema-compliant GroupShotData interface (single document structure)
export interface GroupShotData {
  config: {
    totalTimeEstimated: number;
    finalized?: boolean;
    locked?: boolean;
    updatedAt: FirestoreTimestamp;
    clientLastViewed?: FirestoreTimestamp;
  };
  categories: string[];
  items: ClientGroupShotItemFull[];
}

// Legacy interface for backward compatibility
export interface GroupShotItems {
  categories: string[];
  items: ClientGroupShotItemFull[];
}

// 5. Timeline
export interface TimelineConfig {
  eventDate: FirestoreTimestamp;
  finalized?: boolean;
  locked?: boolean;
  updatedAt: FirestoreTimestamp;
  clientLastViewed?: FirestoreTimestamp;
}

export interface ClientTimelineEventFull {
  id: string; // Format: "event_{timestamp}"
  title: string;
  eventType: TimelineEventType;
  startTime: string; // Format: "HH:MM"
  endTime?: string; // Format: "HH:MM"
  location?: string;
  description?: string;
  peopleInvolved?: string[];
  isPhotographyRequired: boolean;
  notes?: string;
}

export interface TimelineItems {
  list: ClientTimelineEventFull[];
}

// --- Portal Data Interfaces (for component props) ---
export interface PortalLocationData {
  config: LocationConfig;
  items: ClientLocationFull[];
}

export interface PortalKeyPeopleData {
  config: KeyPeopleConfig;
  items: ClientKeyPersonFull[];
}

export interface PortalPhotoRequestData {
  config: PhotoRequestConfig;
  items: ClientPhotoRequestItemFull[];
}

// Use schema-compliant GroupShotData for portal components
export interface PortalGroupShotData extends GroupShotData {}

export interface PortalTimelineData {
  config: TimelineConfig;
  items: ClientTimelineEventFull[];
}

// --- Cloud Function Interfaces ---
export interface AuthRequest {
  projectId: string;
  accessToken: string;
}

export interface AuthResponse {
  token: string;
}

export interface SaveLocationRequest {
  projectId: string;
  accessToken: string;
  newLocation: Omit<ClientLocationFull, 'id'>;
}

export interface SaveKeyPeopleRequest {
  projectId: string;
  accessToken: string;
  newPerson: Omit<ClientKeyPersonFull, 'id'>;
}

export interface SavePhotoRequestRequest {
  projectId: string;
  accessToken: string;
  newRequest: Omit<ClientPhotoRequestItemFull, 'id'>;
}

export interface UpdateGroupShotsRequest {
  projectId: string;
  accessToken: string;
  updatedItems: ClientGroupShotItemFull[];
}

export interface AddTimelineEventRequest {
  projectId: string;
  accessToken: string;
  newEvent: Omit<ClientTimelineEventFull, 'id'>;
}

// --- Error Response ---
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

// --- Utility Types ---
export type ProjectData = Project; // Alias for backwards compatibility

// Legacy interfaces for gradual migration (to be removed)
export interface ClientPortal {
  portalSetup: boolean;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
  expiresAt?: FirestoreTimestamp;
  currentStepID: string;
  portalUrl?: string;
  accessToken?: string;
  isEnabled: boolean;
  portalMessage?: string;
  portalSetupComplete: boolean;
}

export interface ProjectMetadata {
  hasLaunchedDashboard?: boolean;
  firstLaunchDate?: Date | FirestoreTimestamp | null;
}