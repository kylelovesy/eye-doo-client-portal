// This file consolidates the enums and types you provided for easy import.

// --- From enum.ts ---
export enum LocationType {
    MAIN_VENUE = 'Main Venue',
    CEREMONY = 'Ceremony',
    GETTING_READY_1 = 'Getting Ready 1',
    GETTING_READY_2 = 'Getting Ready 2',
    RECEPTION = 'Reception',
    PHOTO_LOCATION = 'Photo Location',
    ACCOMMODATION = 'Accommodation',
    OTHER = 'Other',
}

export enum RelationshipToCouple {
    BRIDE = 'Bride',
    GROOM = 'Groom',
    BRIDE_FAMILY = 'Brides Family',
    GROOM_FAMILY = 'Grooms Family',
    BRIDE_FRIENDS = 'Brides Friends',
    GROOM_FRIENDS = 'Grooms Friends',
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

// --- Simplified types based on your project.ts for the portal ---

export interface PersonWithRole {
  id: string;
  fullName: string;
  role: string;
  relationship: RelationshipToCouple;
  notes?: string;
}

export interface LocationFull {
  id:string;
  locationType: LocationType;
  locationName: string;
  locationAddress1: string;
}

export interface GroupShot {
    id: string;
    name: string;
    notes?: string;
    peopleIds: string[]; // This would store IDs of people from the PersonWithRole array
}

export interface PhotoRequest {
    id: string;
    request: string;
    imageUrl?: string;
}

export interface TimelineEvent {
    id: string;
    name: string;
    time: string; // Storing as string for simplicity in the portal UI
    type: TimelineEventType;
    notes?: string;
}

// This represents the structure of the main project document we'll work with
export interface ProjectData {
    projectInfo: {
        projectName: string;
    };
    photographerName: string;
    peopleInfo: {
        weddingParty: PersonWithRole[];
    };
    locationInfo: LocationFull[];
    groupShots: GroupShot[];
    photoInfo: {
        photoRequests: PhotoRequest[];
    };
    timeline: {
        events: TimelineEvent[];
    };
    portalStatus?: {
        currentStep: number;
    };
}