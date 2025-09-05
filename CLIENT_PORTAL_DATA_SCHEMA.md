# **Client Portal Data Schema**

This document outlines the data structures used in the Eye Doo Client Portal. The schemas are defined using Zod in src/types/types.ts and are the single source of truth for the application's data model. All data is stored in Firebase Firestore.

## **Table of Contents**

1. [Authentication and Project Data](https://www.google.com/search?q=%23authentication-and-project-data)  
2. [Section Data Structure](https://www.google.com/search?q=%23section-data-structure)  
3. [Detailed Schemas](https://www.google.com/search?q=%23detailed-schemas)  
   * [Key People](https://www.google.com/search?q=%231-key-people)  
   * [Locations](https://www.google.com/search?q=%232-locations)  
   * [Group Shots](https://www.google.com/search?q=%233-group-shots)  
   * [Photo Requests](https://www.google.com/search?q=%234-photo-requests)  
   * [Timeline](https://www.google.com/search?q=%235-timeline)  
4. [Enums](https://www.google.com/search?q=%23enums)

## **Authentication and Project Data**

The client is authenticated via a Firebase custom token. After authentication, the main project document is fetched. This document contains the core, non-editable information for the portal's UI.

### **ClientProjectSchema**

This is the main schema for the data passed to the client portal upon initialization.

// Transmitted to the client on load  
export const ClientProjectSchema \= z.object({  
  id: z.string(),  
  projectName: z.string(),  
  personA: z.object({ firstName: z.string(), surname: z.string().optional() }),  
  personB: z.object({ firstName: z.string(), surname: z.string().optional() }),  
  eventDate: FirestoreTimestampSchema,  
  photographerName: z.string(),  
  portalMessage: z.string().optional(),  
  currentStepID: z.nativeEnum(PortalStepID),  
  portalSteps: z.array(PortalStepSchema),  
});

### **PortalStepSchema**

Defines the structure for each step in the planning portal navigation.

export const PortalStepSchema \= z.object({  
  id: z.nativeEnum(PortalStepID),  
  stepTitle: z.string(),  
  stepIcon: z.string().optional(),  
  stepStatus: z.nativeEnum(SectionStatus).default(SectionStatus.LOCKED),  
  actionOn: z.nativeEnum(ActionOn).default(ActionOn.CLIENT),  
});

## **Section Data Structure**

Each of the five main planning sections follows a consistent data pattern. The data for a section is stored in a single document within a subcollection in Firestore (e.g., /projects/{projectId}/keyPeople/items).

### **SectionConfigSchema**

This base schema is extended by each section to manage its state.

const SectionConfigSchema \= z.object({  
  finalized: z.boolean().default(false), // Locked by photographer  
  locked: z.boolean().default(false),    // Submitted by client, awaiting review  
  updatedAt: FirestoreTimestampSchema.optional().nullable(),  
});

### **Generic Section Data Structure**

Each section's data object contains a config object and an items array.

// Generic structure for section data  
interface SectionData\<T\> {  
  config: SectionConfig; // Or an extended version of it  
  items: T\[\];            // Array of items for that section  
}

## **Detailed Schemas**

### **1\. Key People**

**Firestore Path**: /projects/{projectId}/keyPeople/items

#### **PortalKeyPeopleDataSchema**

export const PortalKeyPeopleDataSchema \= z.object({  
  config: SectionConfigSchema,  
  items: z.array(ClientKeyPersonSchema),  
});

export const ClientKeyPersonSchema \= z.object({  
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

### **2\. Locations**

**Firestore Path**: /projects/{projectId}/locations/items

#### **PortalLocationDataSchema**

export const PortalLocationDataSchema \= z.object({  
  config: SectionConfigSchema.extend({  
    multipleLocations: z.boolean().default(false),  
  }),  
  items: z.array(ClientLocationSchema),  
});

export const ClientLocationSchema \= z.object({  
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

### **3\. Group Shots**

**Firestore Path**: /projects/{projectId}/groupShotData/groupShot

**Note:** Group Shots are stored differently. The data, including categories, is in a single document named groupShot.

#### **PortalGroupShotDataSchema**

export const PortalGroupShotDataSchema \= z.object({  
  config: SectionConfigSchema.extend({  
      totalTimeEstimated: z.number().default(0),  
  }),  
  categories: z.array(ClientGroupShotCategorySchema),  
  items: z.array(ClientGroupShotItemSchema),  
});

export const ClientGroupShotCategorySchema \= z.object({  
  id: z.string(),  
  displayName: z.string(),  
  isPredefined: z.boolean().default(true),  
  icon: z.string().optional(),  
});

export const ClientGroupShotItemSchema \= z.object({  
  id: z.string(),  
  name: z.string(),  
  categoryId: z.string(),  
  isPredefined: z.boolean().default(true),  
  notes: z.string().optional(),  
  clientWants: z.boolean().default(false),  
  time: z.number().default(3),  
});

### **4\. Photo Requests**

**Firestore Path**: /projects/{projectId}/photoRequests/items

#### **PortalPhotoRequestDataSchema**

export const PortalPhotoRequestDataSchema \= z.object({  
  config: SectionConfigSchema,  
  items: z.array(ClientPhotoRequestSchema),  
});

export const ClientPhotoRequestSchema \= z.object({  
  id: z.string(),  
  title: z.string().min(1, 'A title is required.'),  
  description: z.string().optional(),  
  priority: z.nativeEnum(PhotoRequestPriority).default(PhotoRequestPriority.MEDIUM),  
  type: z.nativeEnum(PhotoRequestType).default(PhotoRequestType.INDIVIDUAL\_SHOT),  
  peopleInvolved: z.array(z.string()).optional(),  
  notes: z.string().optional(),  
  imageUrl: z.string().optional(),  
});

### **5\. Timeline**

**Firestore Path**: /projects/{projectId}/timeline/items

#### **PortalTimelineDataSchema**

export const PortalTimelineDataSchema \= z.object({  
  config: SectionConfigSchema.extend({  
    eventDate: FirestoreTimestampSchema,  
  }),  
  items: z.array(ClientTimelineEventSchema),  
});

export const ClientTimelineEventSchema \= z.object({  
  id: z.string(),  
  type: z.nativeEnum(TimelineEventType).default(TimelineEventType.OTHER),  
  title: z.string().min(1, "Event title is required"),  
  startTime: FirestoreTimestampSchema,  
  duration: z.number().min(0).default(0),  
  locationId: z.string().optional(),  
  clientNotes: z.string().optional(),  
});

## **Enums**

The application uses enums for type safety and consistency across various fields. These are defined in src/types/types.ts and include:

* PortalStepID  
* SectionStatus  
* ActionOn  
* LocationType  
* KeyPersonRole  
* KeyPersonInvolvement  
* PhotoRequestType  
* PhotoRequestPriority  
* TimelineEventType