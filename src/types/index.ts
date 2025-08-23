// Type definitions aligned with CLIENT_PORTAL_DATA_SCHEMA.md

// --- Firestore Timestamp Interface ---
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

// --- Enums from Schema ---
// LocationType as const object for runtime values
export const LocationType = {
  SINGLE_LOCATION: 'Single Location',
  MAIN_VENUE: 'Main Venue',
  CEREMONY: 'Ceremony',
  GETTING_READY_1: 'Getting Ready 1',
  GETTING_READY_2: 'Getting Ready 2',
  RECEPTION: 'Reception',
  PHOTO_LOCATION: 'Photo Location',
  ACCOMMODATION: 'Accommodation',
  OTHER: 'Other'
} as const;

export type LocationType = typeof LocationType[keyof typeof LocationType];

// KeyPersonRole as const object for runtime values
export const KeyPersonRole = {
  MAID_OF_HONOR: 'Maid of Honor',
  BEST_MAN: 'Best Man',
  BRIDESMAID: 'Bridesmaid',
  GROOMSMAN: 'Groomsman',
  MOTHER_OF_BRIDE: 'Mother of the Bride',
  FATHER_OF_BRIDE: 'Father of the Bride',
  MOTHER_OF_GROOM: 'Mother of the Groom',
  FATHER_OF_GROOM: 'Father of the Groom',
  OTHER: 'Other'
} as const;

export type KeyPersonRole = typeof KeyPersonRole[keyof typeof KeyPersonRole];

// KeyPersonActions as const object for runtime values
export const KeyPersonActions = {
  SPEECH: 'Speech',
  READING: 'Reading',
  TOAST: 'Toast',
  WALK_DOWN_AISLE: 'Walk Down Aisle',
  SPECIAL_DANCE: 'Special Dance',
  OTHER: 'Other'
} as const;

export type KeyPersonActions = typeof KeyPersonActions[keyof typeof KeyPersonActions];

// Legacy SpecialAction type for backward compatibility
export type SpecialAction = 
  | 'Speech'
  | 'Reading'
  | 'Toast'
  | 'Walk Down Aisle'
  | 'Special Dance'
  | 'Other';

// PhotoRequestCategory as const object for runtime values
export const PhotoRequestCategory = {
  GROUP_SHOT: 'Group Shot',
  INDIVIDUAL_SHOT: 'Individual Shot',
  COUPLE_SHOT: 'Couple Shot',
  CANDID_SHOT: 'Candid Shot',
  DETAIL_SHOT: 'Detail Shot',
  OTHER: 'Other'
} as const;

export type PhotoRequestCategory = typeof PhotoRequestCategory[keyof typeof PhotoRequestCategory];

// PhotoRequestPriority as const object for runtime values
export const PhotoRequestPriority = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High'
} as const;

export type PhotoRequestPriority = typeof PhotoRequestPriority[keyof typeof PhotoRequestPriority];

// TimelineEventType as const object for runtime values
export const TimelineEventType = {
  BRIDAL_PREP: 'Bridal Prep',
  GROOM_PREP: 'Groom Prep',
  CEREMONY_BEGINS: 'Ceremony Begins',
  GUESTS_ARRIVE: 'Guests Arrive',
  CONFETTI_AND_MINGLING: 'Confetti and Mingling',
  EVENING_GUESTS_ARRIVE: 'Evening Guests Arrive',
  CAKE_CUTTING: 'Cake Cutting',
  EVENING_BUFFET: 'Evening Buffet',
  CARRIAGES: 'Carriages',
  RECEPTION_DRINKS: 'Reception Drinks',
  GROUP_PHOTOS: 'Group Photos',
  COUPLE_PORTRAITS: 'Couple Portraits',
  WEDDING_BREAKFAST: 'Wedding Breakfast',
  SPEECHES: 'Speeches',
  FIRST_DANCE: 'First Dance',
  EVENING_ENTERTAINMENT: 'Evening Entertainment',
  OTHER: 'Other'
} as const;

export type TimelineEventType = typeof TimelineEventType[keyof typeof TimelineEventType];

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
    photographerName: string;
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
  
  // Add status field for UI state management
  status?: 'draft' | 'locked' | 'finalized';
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
  
  // Add missing fields that the component expects
  locationAddress1?: string; // Legacy field for backward compatibility
  arriveTime?: FirestoreTimestamp; // Arrival time
  leaveTime?: FirestoreTimestamp; // Departure time
  nextLocationTravelTimeEstimate?: number; // Travel time in minutes
  nextLocationTravelArrangements?: string; // Travel arrangements
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
  
  // Add status field for UI state management
  status?: 'draft' | 'locked' | 'finalized';
}

export interface ClientKeyPersonFull {
  id: string; // Format: "person_{timestamp}"
  fullName: string;
  role: KeyPersonRole;
  phoneNumber?: string;
  email?: string;
  
  // New fields for photo preferences
  mustPhotograph: boolean;
  dontPhotograph: boolean;
  isVIP: boolean;
  canRallyPeople: boolean;
  
  // Special actions they're involved in (updated to use new structure)
  involvedIn?: Array<{ type: KeyPersonActions }>;
  
  // Legacy field for backward compatibility
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
  
  // Add status field for UI state management
  status?: 'draft' | 'locked' | 'finalized';
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
  
  // Add missing fields that the component expects
  type?: PhotoRequestCategory; // Alias for category
  imageUrl?: string; // For reference images
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
  
  // Add status field for UI state management
  status?: 'draft' | 'locked' | 'finalized';
}

export interface ClientTimelineEventFull {
  id: string; // Format: "event_{timestamp}"
  title: string;
  
  // Use 'type' instead of 'eventType' to match component expectations
  type: TimelineEventType;
  
  // Use FirestoreTimestamp for startTime to match component expectations
  startTime: FirestoreTimestamp;
  endTime?: FirestoreTimestamp;
  
  // Add missing fields that the component expects
  duration: number; // Duration in minutes
  clientNotes?: string; // Notes from client
  
  // Legacy fields for backward compatibility
  eventType?: TimelineEventType; // Alias for type
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
export type PortalGroupShotData = GroupShotData;

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
  details?: unknown;
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