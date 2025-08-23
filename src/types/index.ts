import { Timestamp } from "firebase/firestore";

// --- Enums needed by the Portal ---
export enum LocationType {
    SINGLE_LOCATION = 'Single Location', // New value for when multipleLocations is false
    MAIN_VENUE = 'Main Venue',
    CEREMONY = 'Ceremony',
    GETTING_READY_1 = 'Getting Ready 1',
    GETTING_READY_2 = 'Getting Ready 2',
    RECEPTION = 'Reception',
    PHOTO_LOCATION = 'Photo Location',
    ACCOMMODATION = 'Accommodation',
    OTHER = 'Other'
}
export enum KeyPersonRole {
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
    OTHER = 'Other',
}  
export enum KeyPersonActions {
    SPEECH = 'Speech',
    READING = 'Reading',
    TOAST = 'Toast',
    WALK_DOWN_AISLE = 'Walk Down Aisle',
    SPECIAL_DANCE = 'Special Dance',
    OTHER = 'Other',
}
export enum PhotoRequestType {
    GROUP_SHOT = 'Group Shot',
    INDIVIDUAL_SHOT = 'Individual Shot',
    COUPLE_SHOT = 'Couple Shot',
    CANDID_SHOT = 'Candid Shot',
    DETAIL_SHOT = 'Detail Shot',
    OTHER = 'Other',
}
export enum TimelineEventType {
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
    OTHER = 'Other',
}

export type SectionStatus  = 'unlocked' | 'locked' | 'finalized';

// --- Interfaces for the 'locations' subcollection ---
export interface LocationConfig {
  multipleLocations: boolean;
  finalized: boolean; // If true, the portal UI should disable editing.
  photographerReviewed: boolean;
  status?: SectionStatus;
}

export interface ClientLocationFull {
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

export interface PortalLocationData {
  config: LocationConfig;
  items: ClientLocationFull[];
}

// --- Interfaces for the 'keyPeople' subcollection ---
export interface KeyPeopleConfig {
  finalized: boolean;
  photographerReviewed?: boolean;
  familySituationsNotes?: string;
  guestsToAvoidNotes?: string;
  surprisesNotes?: string;
  status?: SectionStatus;
}
export interface InvolvedInAction {
    type: KeyPersonActions;
    timelineEventId?: string; // The client might not link it to a specific event
}
export interface ClientKeyPersonFull {
  id: string;
  fullName: string;
  role: KeyPersonRole;
  notes?: string;
  isVIP?: boolean;
  canRallyPeople?: boolean;
  mustPhotograph?: boolean;
  dontPhotograph?: boolean;
  involvedIn?: InvolvedInAction[];
}
export interface PortalKeyPeopleData {
    config: KeyPeopleConfig;
    items: ClientKeyPersonFull[];
}

// --- Interfaces for the 'photoRequests' subcollection ---
export interface PhotoRequestConfig {
    finalized: boolean;
    photographerReviewed?: boolean;    
    status?: SectionStatus;
}
export interface ClientPhotoRequestItemFull {
    id: string;
    description: string;
    imageUrl?: string;
    type: PhotoRequestType;
    priority: 'Must Have' | 'Nice to Have';
    // Photographer-specific fields like 'status' and 'photographerNotes' are omitted.
    // 'linkedPeopleIds' is also omitted for portal simplicity; the client can use the
    // description field to mention who is in the shot.
}
export interface PortalPhotoRequestData {
    config: PhotoRequestConfig;
    items: ClientPhotoRequestItemFull[];
}

// --- Interfaces for the 'groupShots' subcollection ---
export interface GroupShotConfig {
    finalized: boolean;
    totalTimeEstimated: number;
    status?: SectionStatus;
}  
export interface ClientGroupShotItemFull {
id: string;
name: string;
categoryId: string;
notes?: string;
time: number;
checked: boolean;
peopleIds?: string[];
}
export interface ClientGroupShotCategory {
id: string;
displayName: string;
iconName?: string; // We can use this to render the correct SVG icon
}
export interface PortalGroupShotData {
config: GroupShotConfig;
categories: ClientGroupShotCategory[];
items: ClientGroupShotItemFull[];
}
// --- Interfaces for the 'timeline' subcollection ---
export interface TimelineConfig {
finalized: boolean;
officialStartTime?: Date | Timestamp;
officialEndTime?: Date | Timestamp;
status?: SectionStatus;
}

export interface ClientTimelineEventFull {
id: string;
title: string;
type: TimelineEventType;
startTime: Timestamp;
duration: number;
locationId?: string;
linkedPeopleIds?: string[];
clientNotes?: string;
}

export interface PortalTimelineData {
config: TimelineConfig;
items: ClientTimelineEventFull[];
}

export interface ProjectData {
    projectInfo: {
        projectName: string;
        eventDate?: Date | Timestamp;
        personA: {
            firstName: string;
            surname: string;
        };
        personB: {
            firstName: string;
            surname: string;
        };
    };
    photographerName: string;
    clientPortal?: ClientPortal; // Added from main app
    metadata?: ProjectMetadata; // Added from main app
}

export interface ClientPortal {
    portalSetup: boolean;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    expiresAt?: Timestamp;
    currentStepID: string; // Simplified to string for portal
    portalUrl?: string;
    accessToken?: string;
    isEnabled: boolean;
    portalMessage?: string;
    portalSetupComplete: boolean;
}

export interface ProjectMetadata {
    hasLaunchedDashboard?: boolean;
    firstLaunchDate?: Date | Timestamp | null;
}

export interface PortalStatus {
    currentStep: number;
    lastUpdated: Timestamp;
    sectionStates?: {
      locations?: SectionStatus;
      keyPeople?: SectionStatus;
      groupShots?: SectionStatus;
      photoRequests?: SectionStatus;
      timeline?: SectionStatus;
    };
  }