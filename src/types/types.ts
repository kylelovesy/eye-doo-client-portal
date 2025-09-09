// src/types/types.ts - TYPE DEFINITIONS FOR CLIENT PORTAL
// =================================================================================
// UPDATED FOR NEW SUBCOLLECTION ARCHITECTURE:
//
// DATA STRUCTURE OVERVIEW:
// 1. PortalSubcollection - Complete portal configuration in clientPortals/default-portal
// 2. ClientProject - Client-safe project data (combines project + portal info)
// 3. Section-specific types for keyPeople, locations, photoRequests, etc.
//
// TYPE SAFETY FEATURES:
// - Zod schemas for runtime validation and TypeScript inference
// - Discriminated unions for type-safe data handling
// - Strict typing for Firebase document structures
// - Client-safe types that exclude sensitive server-only data
// =================================================================================

import { z } from 'zod';

// Reusable Schemas
export const FirestoreTimestampSchema = z.object({
  seconds: z.number(),
  nanoseconds: z.number(),
});
export type FirestoreTimestamp = z.infer<typeof FirestoreTimestampSchema>;

// Enums
export enum PortalStepID {
  WELCOME = 'welcome',
  KEY_PEOPLE = 'keyPeople',
  LOCATIONS = 'locations',
  GROUP_SHOTS = 'groupShots',
  PHOTO_REQUESTS = 'photoRequests',
  TIMELINE = 'timeline',
  THANK_YOU = 'thankYou'
}

export enum SectionStatus {
  UNLOCKED = 'unlocked',
  IN_PROGRESS = 'inProgress',
  LOCKED = 'locked', // Submitted by client, waiting for photographer review
  FINALIZED = 'finalized', // Locked by photographer
}

export enum ActionOn {
  CLIENT = 'client',
  PHOTOGRAPHER = 'photographer',
  NONE = 'none',
}

export enum LocationType {
    SINGLE_LOCATION = 'Single Location',
    MAIN_VENUE = 'Main Venue',
    CEREMONY = 'Ceremony',
    GETTING_READY_1 = 'Getting Ready 1',
    GETTING_READY_2 = 'Getting Ready 2',
    RECEPTION = 'Reception',
    PHOTO_LOCATION = 'Photo Location',
    ACCOMMODATION = 'Accommodation',
    OTHER = 'Other',
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

export enum KeyPersonInvolvement {
  SPEECH = 'Speech',
  READING = 'Reading',
  TOAST = 'Toast',
  WALK_DOWN_AISLE = 'Walk Down Aisle',
  SPECIAL_DANCE = 'Special Dance',
  OTHER = 'Other',
  NONE = 'None'
}

export enum PhotoRequestType {
    GROUP_SHOT = 'Group Shot',
    INDIVIDUAL_SHOT = 'Individual Shot',
    COUPLE_SHOT = 'Couple Shot',
    CANDID_SHOT = 'Candid Shot',
    DETAIL_SHOT = 'Detail Shot',
    OTHER = 'Other',
}

export enum PhotoRequestPriority {
    HIGH = 'High',
    MEDIUM = 'Medium',
    LOW = 'Low',
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

export const PortalStepSchema = z.object({
  id: z.nativeEnum(PortalStepID), // Use enum for type safety
  portalStepID: z.nativeEnum(PortalStepID), 
  stepTitle: z.string(),
  requiredStep: z.boolean().default(true).optional(),
  stepIcon: z.string().optional(),
  stepStatus: z.nativeEnum(SectionStatus).default(SectionStatus.LOCKED),
  stepDescription: z.string().optional(),
  actionOn: z.nativeEnum(ActionOn).default(ActionOn.CLIENT),
});
export type PortalStep = z.infer<typeof PortalStepSchema>;

// Client Portal Metadata Schema
// Updated to match the portal subcollection metadata structure
export const ClientPortalMetadataSchema = z.object({
  clientAccessCount: z.number().default(0),
  lastClientActivity: FirestoreTimestampSchema.optional().nullable(),
  totalSteps: z.number().default(0),
  completedSteps: z.number().default(0),
  completionPercentage: z.number().default(0),
});
export type ClientPortalMetadata = z.infer<typeof ClientPortalMetadataSchema>;

// Portal Subcollection Document Schema
// ============================================================================
// REPRESENTS: projects/{projectId}/clientPortals/default-portal
//
// PURPOSE:
// - Complete portal configuration and state management
// - Client access control and authentication tracking
// - Step-by-step progress tracking and navigation
// - Metadata for analytics and completion statistics
//
// STRUCTURE:
// - Portal setup and configuration flags
// - Access control (tokens, URLs, enable/disable)
// - Client navigation state (currentStepID, steps array)
// - Activity tracking (metadata with access counts, completion stats)
// ============================================================================
export const PortalSubcollectionSchema = z.object({
  // Portal Setup & Configuration
  isSetup: z.boolean(),                    // Whether portal has been configured
  portalSetupComplete: z.boolean(),        // Whether setup process is finished
  isEnabled: z.boolean(),                  // Whether portal is accessible to client

  // Access Control
  portalUrl: z.string(),                   // Public URL for client access
  accessToken: z.string(),                 // Secure token for authentication

  // Timestamps
  setupDate: FirestoreTimestampSchema,     // When portal was first created
  lastUpdated: FirestoreTimestampSchema,   // Last modification timestamp

  // Client Navigation
  currentStepID: z.nativeEnum(PortalStepID), // Current active step
  portalMessage: z.string(),               // Welcome message and instructions

  // Portal State
  metadata: ClientPortalMetadataSchema,   // Access statistics and completion data
  steps: z.array(PortalStepSchema),        // Array of portal steps with status
});
export type PortalSubcollection = z.infer<typeof PortalSubcollectionSchema>;

// Client Project Schema
// ============================================================================
// REPRESENTS: Combined data sent to client portal (project + portal info)
//
// PURPOSE:
// - Client-safe data structure for portal UI consumption
// - Combines basic project info with portal configuration
// - Excludes sensitive server-only data and access tokens
// - Provides all necessary data for client-side portal functionality
//
// DATA SOURCES:
// - Project document: Basic project info (names, dates, photographer)
// - Portal subcollection: Portal configuration, steps, and metadata
//
// SECURITY:
// - No sensitive authentication tokens or server configuration
// - Only client-relevant data for UI rendering and navigation
// ============================================================================
export const ClientProjectSchema = z.object({
  // Project Identity
  id: z.string(),                          // Unique project identifier
  projectName: z.string(),                 // Human-readable project name

  // Couple Information
  personA: z.object({                      // First person in couple
    firstName: z.string(),
    surname: z.string().optional()
  }),
  personB: z.object({                      // Second person in couple
    firstName: z.string(),
    surname: z.string().optional()
  }),

  // Event Details
  eventDate: FirestoreTimestampSchema,     // Wedding/event date
  photographerName: z.string(),            // Assigned photographer

  // Portal Configuration
  portalMessage: z.string().optional(),    // Welcome message
  currentStepID: z.nativeEnum(PortalStepID), // Current navigation step
  portalSteps: z.array(PortalStepSchema),  // All available steps
  metadata: ClientPortalMetadataSchema.optional(), // Access statistics
});
export type ClientProject = z.infer<typeof ClientProjectSchema>;



// Project
// export const ClientPortalProjectSchema = z.object({
//   id: z.string(),
//   photographerName: z.string(),
//   projectInfo: z.object({
//     projectName: z.string(),
//     personA: z.object({ firstName: z.string() }),
//     personB: z.object({ firstName: z.string() }),
//     eventDate: FirestoreTimestampSchema,
//     locationName: z.string(),
//   }),
//   clientPortal: z.object({
//     isSetup: z.boolean(),
//     isEnabled: z.boolean(),
//     createdAt: FirestoreTimestampSchema,
//     expiresAt: FirestoreTimestampSchema,
//     lastUpdated: FirestoreTimestampSchema,
//     currentStepID: z.nativeEnum(PortalStepID),
//     portalMessage: z.string().optional(),
//     metadata: z.object({
//       completedSteps: z.number(),
//       totalSteps: z.number(),
//       completionPercentage: z.number(),
//     }).optional(),
//     steps: z.array(PortalStepSchema),
//   }).optional(),
// });
// export type ClientPortalProject = z.infer<typeof ClientPortalProjectSchema>;


// API Payloads
export interface AuthRequest {
  projectId: string;
  accessToken: string;
}

export interface AuthResponse {
  token: string;
}



// Base Config for each section
const SectionConfigSchema = z.object({
  finalized: z.boolean().default(false),
  locked: z.boolean().default(false),
  updatedAt: FirestoreTimestampSchema.optional().nullable(),// Add this for locations
});
export type SectionConfig = z.infer<typeof SectionConfigSchema>;

// Portal Key People Data
// ============================================================================
// REPRESENTS: projects/{projectId}/keyPeople/items
//
// PURPOSE:
// - Client-defined list of important people for wedding photography
// - Roles, involvement levels, and special photography requirements
// - Helps photographer identify VIPs and plan photo coverage
//
// STRUCTURE:
// - config: Section configuration (finalized, locked, timestamps)
// - items: Array of key people with roles and requirements
// ============================================================================
export const ClientKeyPersonSchema = z.object({
  id: z.string(),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.nativeEnum(KeyPersonRole),
  involvement: z.nativeEnum(KeyPersonInvolvement).default(KeyPersonInvolvement.NONE),
  notes: z.string().optional(),
  mustPhotograph: z.boolean().default(false),
  dontPhotograph: z.boolean().default(false),
  isVIP: z.boolean().default(false),
  canRallyPeople: z.boolean().default(false),
});
export type ClientKeyPerson = z.infer<typeof ClientKeyPersonSchema>;

export const PortalKeyPeopleDataSchema = z.object({
  config: SectionConfigSchema,
  items: z.array(ClientKeyPersonSchema),
});
export type PortalKeyPeopleData = z.infer<typeof PortalKeyPeopleDataSchema>;

// Portal Location Data
// ============================================================================
// REPRESENTS: projects/{projectId}/locations/items
//
// PURPOSE:
// - Client-defined event locations and venues
// - Travel logistics and timing coordination
// - Helps photographer plan location-based photo shoots
//
// STRUCTURE:
// - config: Section configuration with multipleLocations flag
// - items: Array of locations with addresses and timing
//
// FEATURES:
// - Supports single venue or multiple location events
// - Includes travel time estimates between locations
// - Arrival/departure times for each location
// ============================================================================
export const ClientLocationSchema = z.object({
  id: z.string(),
  locationName: z.string().min(1, 'Location name is required'),
  locationType: z.nativeEnum(LocationType),
  locationAddress1: z.string().min(1, 'Address is required'),
  locationPostcode: z.string().min(1, 'Postcode is required'),
  locationNotes: z.string().optional(),
  arriveTime: FirestoreTimestampSchema.optional().nullable(),
  leaveTime: FirestoreTimestampSchema.optional().nullable(),
  nextLocationTravelTimeEstimate: z.number().default(0),
  nextLocationTravelArrangements: z.string().optional(),
});
export type ClientLocation = z.infer<typeof ClientLocationSchema>;

export const PortalLocationDataSchema = z.object({
  config: SectionConfigSchema.extend({
    multipleLocations: z.boolean().optional().default(false),
  }),
  items: z.array(ClientLocationSchema),
});
export type PortalLocationData = z.infer<typeof PortalLocationDataSchema>;

// Portal Photo Requests Data
// Config
// Items (Photo Requests)
export const ClientPhotoRequestSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'A title is required.'),
  description: z.string().optional(),
  priority: z.nativeEnum(PhotoRequestPriority).default(PhotoRequestPriority.MEDIUM),
  type: z.nativeEnum(PhotoRequestType).default(PhotoRequestType.INDIVIDUAL_SHOT),
  peopleInvolved: z.array(z.string()).optional(),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
});
export type ClientPhotoRequest = z.infer<typeof ClientPhotoRequestSchema>;

export const PortalPhotoRequestDataSchema = z.object({
  config: SectionConfigSchema,
  items: z.array(ClientPhotoRequestSchema),
});
export type PortalPhotoRequestData = z.infer<typeof PortalPhotoRequestDataSchema>;

// Portal Group Shots Data
// Config
// Categories Array
// Items Array
export const ClientGroupShotItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  categoryId: z.string(),
  isPredefined: z.boolean().default(true),
  notes: z.string().optional(),
  checked: z.boolean().default(false),
  time: z.number().default(3),
});
export type ClientGroupShotItem = z.infer<typeof ClientGroupShotItemSchema>;

export const ClientGroupShotCategorySchema = z.object({
  id: z.string(),
  displayName: z.string(),
  isPredefined: z.boolean().default(true),
  iconName: z.string().optional(),
});
export type ClientGroupShotCategory = z.infer<typeof ClientGroupShotCategorySchema>;

export const PortalGroupShotDataSchema = z.object({
  config: SectionConfigSchema.extend({
      totalTimeEstimated: z.number().default(0),
  }),
  categories: z.array(ClientGroupShotCategorySchema),
  items: z.array(ClientGroupShotItemSchema),
});
export type PortalGroupShotData = z.infer<typeof PortalGroupShotDataSchema>;

// Portal Timeline Data
// Config
// Items (Timeline Events)
export const ClientTimelineEventSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(TimelineEventType).default(TimelineEventType.OTHER),
  title: z.string().min(1, "Event title is required"),
  startTime: FirestoreTimestampSchema,
  duration: z.number().min(0).default(0),
  locationId: z.string().optional(),
  clientNotes: z.string().optional(),
});
export type ClientTimelineEvent = z.infer<typeof ClientTimelineEventSchema>;
export const PortalTimelineDataSchema = z.object({
  config: SectionConfigSchema.extend({
    eventDate: FirestoreTimestampSchema,
  }),
  items: z.array(ClientTimelineEventSchema),
});
export type PortalTimelineData = z.infer<typeof PortalTimelineDataSchema>;
