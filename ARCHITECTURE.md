# **Architecture Documentation**

## **🏗️ System Architecture Overview**

The Eye Doo Client Portal utilizes a modern, component-based architecture built on Next.js with the App Router. The system is designed for a real-time, collaborative planning experience, using Firebase for backend services and Zustand for robust client-side state management.

## **🔄 Data Flow Architecture**

The application's data flow is unidirectional and centers around the Zustand store, ensuring a single source of truth for the UI.

Firebase Firestore \---\> portalService \---\> Zustand Store \---\> React Components  
       ^                     |                   |                   |  
       |                     |                   |                   v  
       \+---------------------+-------------------+------------ User Interactions

1. **Initialization**: On page load, the portalService authenticates with Firebase and fetches the initial project data.  
2. **Real-time Listeners**: The portalService sets up real-time Firestore listeners for each data section (Key People, Locations, etc.).  
3. **State Hydration**: As data is received from Firebase (either initially or through a listener update), the portalService calls actions that update the Zustand store.  
4. **Component Rendering**: React components subscribe to the Zustand store. When the state changes, components re-render automatically to reflect the new data.  
5. **User Actions**: User interactions (e.g., adding a new person, checking a box) call update functions within the components.  
6. **Local State Update**: These functions immediately update the local state in the Zustand store and set an isDirty flag to true. This provides an optimistic UI update for a responsive user experience.  
7. **Data Persistence**: When the user clicks "Save Changes", the saveCurrentStep action in the Zustand store is triggered. This action calls the portalService to persist the updated section data back to Firebase via a secure Cloud Function. The isDirty flag is reset to false upon successful save.

## **🧠 State Management Architecture (Zustand)**

Global state is managed centrally in a single Zustand store, defined in src/store/usePortalStore.ts.

### **Store State (PortalState)**

The store holds the entire application state, including:

* isLoading, isSaving, error: UI status flags.  
* project: Core project details.  
* currentStep: The currently active planning section (PortalStepID).  
* keyPeople, locations, groupShots, etc.: The data for each planning section.  
* isDirty: A boolean flag that tracks if there are unsaved changes in the current section.

### **Store Actions (PortalActions)**

Actions are functions that modify the state. Key actions include:

* initialize: Fetches initial data and sets up listeners.  
* setStep: Navigates between planning sections.  
* updateKeyPeople, updateLocations, etc.: Update local state for a section and set isDirty to true.  
* saveCurrentStep: Persists the current section's dirty data to Firebase.

## **🧩 Component Architecture**

### **Component Hierarchy**

PortalPage (Root Component)  
├── Header  
├── StatusBar  
└── Current Section Component (Dynamically Rendered)  
    ├── WelcomeSection  
    ├── KeyPeopleSection  
    │   └── SectionContainer  
    │       └── AddEditModal  
    ├── LocationsSection  
    │   └── SectionContainer  
    │       └── AddEditModal  
    ├── GroupShotsSection  
    │   └── SectionContainer  
    │       └── AddEditModal  
    ├── PhotoRequestsSection  
    │   └── SectionContainer  
    │       └── AddEditModal  
    └── TimelineSection  
        └── SectionContainer  
            └── AddEditModal

### **Component Responsibilities**

* **PortalPage**: The main container that orchestrates the UI. It reads the currentStep from the Zustand store and dynamically renders the appropriate section component. It also contains the main navigation and save buttons.  
* **Section Components (KeyPeopleSection, etc.)**: Each section is a self-contained feature component. It is responsible for:  
  * Subscribing to its specific slice of data from the Zustand store.  
  * Displaying the data.  
  * Handling user input and calling the corresponding update action in the store (e.g., updateKeyPeople).  
* **UI Components (SectionContainer, AddEditModal)**: Reusable presentational components that provide a consistent look and feel. SectionContainer provides the standard section wrapper with locking/finalized status indicators. AddEditModal provides a consistent modal for adding and editing items.  
* **useEntityManagement Hook**: A custom hook that abstracts the logic for managing a list of entities (add, edit, delete, modal state), promoting reusability across all section components.

## **🗄️ Service Layer Architecture**

### **portalService**

The portalService object (src/services/portalService.ts) is the single point of contact between the client application and the Firebase backend. It abstracts all data fetching and persistence logic away from the components and the store.

#### **Core Responsibilities**

* **Authentication**: Handles the custom token authentication flow by calling the getPortalAuthToken Cloud Function.  
* **Initial Data Fetching**: Retrieves the main ClientProject document.  
* **Real-time Data Subscriptions**: Manages Firestore's onSnapshot listeners for each data category.  
* **Data Persistence**: Uses a single saveClientData Cloud Function to write updated section data back to Firestore, ensuring security and data validation on the server side.

// portalService methods  
{  
  getInitialData(projectId, token): Promise\<ClientProject\>,  
  listenToCategory\<T\>(projectId, category, callback): Unsubscribe,  
  saveSectionData(projectId, token, section, data): Promise\<void\>  
}

## **🔒 Security Architecture**

* **Authentication**: Client access is granted via a short-lived, custom Firebase token generated by a secure Cloud Function (getPortalAuthToken). This function validates the projectId and a secret accessToken before issuing the token.  
* **Data Access**: All database writes are proxied through a single, secure Cloud Function (saveClientData). This function re-validates the user's credentials and ensures they are only writing to their own project data. Firestore Security Rules provide an additional layer of protection, ensuring authenticated users can only read/write data corresponding to their projectId.  
* **Input Validation**: Zod schemas (src/types/types.ts) are used to define the shape of data, providing a foundation for robust validation both on the client and potentially on the server within the Cloud Functions.