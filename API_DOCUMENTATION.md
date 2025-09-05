# **API Documentation**

This document describes the API layer for the Eye Doo Client Portal, which consists of Firebase Callable Functions for secure operations and a client-side service (portalService) that acts as an interface to the backend.

## **🔥 Firebase Callable Functions API**

The client application does not interact directly with Firestore for write operations. Instead, it uses secure Firebase Callable Functions.

### **1\. Get Portal Authentication Token**

This function is the entry point for the application. It validates the client's access credentials and returns a custom Firebase authentication token.

**Function Name**: getPortalAuthToken

**Request Payload** (AuthRequest):

interface AuthRequest {  
  projectId: string;  
  accessToken: string;  
}

**Response Payload** (AuthResponse):

interface AuthResponse {  
  token: string; // The custom Firebase auth token  
}

**Usage**: Called once by portalService.getInitialData to sign the client into Firebase.

### **2\. Save Client Data**

This is a single, generic function used to save data for any of the planning sections. It provides a secure and centralized way to handle all database writes.

**Function Name**: saveClientData

**Request Payload** (SaveClientDataRequest):

interface SaveClientDataRequest {  
  projectId: string;  
  accessToken: string;  
  section: 'keyPeople' | 'locations' | 'photoRequests' | 'groupShots' | 'timeline';  
  data: SaveableData; // The full data object for the section  
}

// The 'data' payload will match one of the Portal...Data types, e.g., PortalKeyPeopleData  
type SaveableData \=  
  | PortalKeyPeopleData  
  | PortalLocationData  
  | PortalPhotoRequestData  
  | PortalGroupShotData  
  | PortalTimelineData;

**Response Payload**: void

**Usage**: Called by portalService.saveSectionData whenever a user saves their changes for a specific section. The function validates the token and projectId, then updates the corresponding document in Firestore.

## **🛠️ Client-Side Service Layer (portalService)**

The portalService object (src/services/portalService.ts) abstracts all backend communication. The UI and state management layers interact only with this service, not directly with Firebase.

### **Methods**

#### **getInitialData**

Authenticates the user and fetches the main project data.

/\*\*  
 \* Authenticates the client and fetches the initial project data.  
 \* @param projectId The ID of the project.  
 \* @param token The client's access token.  
 \* @returns A promise that resolves with the client-safe project data (ClientProject).  
 \*/  
getInitialData: async (projectId: string, token: string): Promise\<ClientProject\>

#### **listenToCategory**

Sets up a real-time Firestore listener for a specific data section.

/\*\*  
 \* Listens for real-time updates to a specific data category.  
 \* @param projectId The ID of the project.  
 \* @param category The section to listen to (e.g., 'locations', 'keyPeople').  
 \* @param callback The function to call with the new data when updates occur.  
 \* @returns An unsubscribe function to detach the listener.  
 \*/  
listenToCategory\<T\>(  
  projectId: string,  
  category: 'locations' | 'keyPeople' | 'photoRequests' | 'timeline' | 'groupShots',  
  callback: (data: T) \=\> void  
): Unsubscribe

**Note on groupShots**: When the category is groupShots, the service correctly points to the single document path /projects/{projectId}/groupShotData/groupShot instead of the general /items subcollection document.

#### **saveSectionData**

Saves the data for a given section using the saveClientData Firebase Callable Function.

/\*\*  
 \* Saves a complete section of data via a secure callable function.  
 \* @param projectId The ID of the project.  
 \* @param accessToken The client's access token for verification.  
 \* @param section The name of the section being saved.  
 \* @param data The data payload for that section.  
 \* @returns A promise that resolves when the save is complete.  
 \*/  
saveSectionData: async (  
  projectId: string,  
  accessToken: string,  
  section: SaveableData\['type'\],  
  data: SaveableData\['data'\]  
): Promise\<void\>  