# Architecture Documentation

## 🏗️ System Architecture Overview

The Eye Doo Client Portal follows a modern, component-based architecture built on Next.js 15 with the App Router pattern. The system is designed around a real-time, collaborative planning experience with Firebase as the backend service.

## 🔄 Data Flow Architecture

### 1. Authentication Flow
```
Client Portal Link → Cloud Function → Custom Token → Firebase Auth → Portal Access
```

1. **Portal Link Generation**: Unique URLs with project ID and access token
2. **Cloud Function Authentication**: Server-side token validation
3. **Custom Token Creation**: Firebase-compatible authentication token
4. **Client Authentication**: Automatic sign-in with custom token
5. **Portal Access**: Real-time data synchronization begins

### 2. Data Synchronization Flow
```
Firebase Firestore ←→ Real-time Listeners ←→ React State ←→ UI Components
```

- **Real-time Listeners**: Continuous data synchronization across all sections
- **Local State Management**: Optimistic updates with conflict resolution
- **Component Re-rendering**: Automatic UI updates on data changes
- **Unsaved Changes Protection**: Prevents data loss during editing

## 🧩 Component Architecture

### Component Hierarchy
```
PortalPage (Main Container)
├── Header (Project Info & Navigation)
├── StatusBar (Progress Indicator)
├── Planning Sections
│   ├── KeyPeopleSection
│   ├── LocationsSection
│   ├── GroupShotsSection
│   ├── PhotoRequestsSection
│   └── TimelineSection
└── Modal Components (Confirmation, Editing)
```

### Component Responsibilities

#### PortalPage (Main Container)
- **State Management**: Centralized state for all planning sections
- **Data Fetching**: Orchestrates data loading and synchronization
- **Step Navigation**: Manages planning workflow progression
- **Error Handling**: Centralized error management and user feedback

#### Section Components
- **Data Display**: Render current section data
- **User Input**: Handle form interactions and data editing
- **Local State**: Manage unsaved changes and validation
- **Section Submission**: Handle data finalization and review

#### Layout Components
- **Header**: Project information and navigation controls
- **StatusBar**: Visual progress indicator and step navigation
- **Modal**: Confirmation dialogs and editing interfaces

## 🗄️ Data Architecture

### Firebase Collections Structure

```
projects/
├── {projectId}/
│   ├── projectInfo/           # Basic project metadata
│   ├── portalStatus/          # Workflow progress tracking
│   ├── locations/             # Subcollection
│   │   ├── config/            # Section configuration
│   │   └── items/             # Location items
│   ├── keyPeople/             # Subcollection
│   │   ├── config/            # Section configuration
│   │   └── items/             # Key people items
│   ├── groupShots/            # Subcollection
│   │   ├── config/            # Section configuration
│   │   └── items/             # Group shot items
│   ├── photoRequests/         # Subcollection
│   │   ├── config/            # Section configuration
│   │   └── items/             # Photo request items
│   └── timeline/              # Subcollection
│       ├── config/            # Section configuration
│       └── items/             # Timeline event items
```

### Data Models

#### Section Configuration Pattern
All planning sections follow a consistent configuration pattern:

```typescript
interface SectionConfig {
  finalized: boolean;           // Section completion status
  photographerReviewed: boolean; // Professional review status
  status: SectionStatus;        // 'unlocked' | 'locked' | 'finalized'
  // Section-specific fields...
}
```

#### Section Data Pattern
Each section maintains a consistent data structure:

```typescript
interface SectionData<T> {
  config: SectionConfig;        // Section configuration
  items: T[];                   // Section-specific items
}
```

## 🔧 Service Layer Architecture

### ProjectService Class

The `ProjectService` class serves as the primary interface between the React application and Firebase:

#### Core Responsibilities
- **Authentication**: Handle custom token authentication
- **Data Fetching**: Retrieve project and section data
- **Real-time Updates**: Manage Firebase listeners
- **Data Persistence**: Handle CRUD operations
- **Conflict Resolution**: Manage concurrent updates

#### Service Methods

```typescript
class ProjectService {
  // Authentication
  getProjectData(projectId: string, token: string): Promise<ProjectData>
  
  // Real-time listeners
  listenToLocationUpdates(projectId: string, callback): Unsubscribe
  listenToKeyPeopleUpdates(projectId: string, callback): Unsubscribe
  listenToGroupShotData(projectId: string, callback): Unsubscribe
  listenToPhotoRequestUpdates(projectId: string, callback): Unsubscribe
  listenToTimelineUpdates(projectId: string, callback): Unsubscribe
  
  // Data updates
  updateLocationData(projectId: string, data: PortalLocationData): Promise<void>
  updateKeyPeopleData(projectId: string, data: PortalKeyPeopleData): Promise<void>
  // ... other update methods
  
  // Status management
  updatePortalStatus(projectId: string, currentStep: number, sectionStates?): Promise<void>
}
```

## 🎨 UI Architecture

### Design System

#### Typography
- **Primary Font**: Plus Jakarta Sans (sans-serif)
- **Secondary Font**: Playfair Display (serif)
- **Font Variables**: CSS custom properties for consistent usage

#### Color Scheme
- **Primary Colors**: Defined in Tailwind CSS configuration
- **Semantic Colors**: Success, warning, error states
- **Accessibility**: WCAG AA compliant color contrast

#### Component Library
- **Button Components**: Primary, secondary, and tertiary variants
- **Modal Components**: Confirmation and editing dialogs
- **Form Components**: Input fields, selects, and textareas
- **Layout Components**: Headers, navigation, and status indicators

### Responsive Design
- **Mobile-First**: Progressive enhancement approach
- **Breakpoints**: Tailwind CSS responsive utilities
- **Touch-Friendly**: Optimized for mobile interactions
- **Progressive Web App**: Offline capabilities and app-like experience

## 🔒 Security Architecture

### Authentication Security
- **Custom Tokens**: Server-side token generation and validation
- **Project Isolation**: Client data separation by project ID
- **Token Expiration**: Time-limited access tokens
- **Secure Communication**: HTTPS-only communication

### Data Security
- **Firestore Rules**: Row-level security and access control
- **Client Isolation**: Projects are completely isolated
- **Input Validation**: Client-side and server-side validation
- **XSS Protection**: React's built-in XSS protection

## 📱 State Management Architecture

### State Structure

#### Global State (PortalPage)
```typescript
interface PortalState {
  // Project data
  projectHeader: ProjectData | null;
  
  // Section data
  locationData: PortalLocationData | null;
  keyPeopleData: PortalKeyPeopleData | null;
  groupShotData: PortalGroupShotData | null;
  photoRequestData: PortalPhotoRequestData | null;
  timelineData: PortalTimelineData | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  currentStep: number;
  
  // Local state for unsaved changes
  locLocal: PortalLocationData | null;
  peopleLocal: PortalKeyPeopleData | null;
  requestsLocal: PortalPhotoRequestData | null;
}
```

#### Local State Management
- **Optimistic Updates**: Immediate UI feedback
- **Conflict Resolution**: Handle concurrent modifications
- **Unsaved Changes**: Track modifications before submission
- **Validation**: Client-side data validation

### State Update Patterns

#### Real-time Updates
```typescript
// Listen to Firebase changes
unsubLocations = projectService.listenToLocationUpdates(
  projectId, 
  (data) => {
    setLocationData(data);
    setLocLocal((prev) => prev ?? data);
  }
);
```

#### Local State Updates
```typescript
// Update local state for unsaved changes
const handleLocationUpdate = (updatedLocation: ClientLocationFull) => {
  setLocLocal(prev => ({
    ...prev!,
    items: prev!.items.map(item => 
      item.id === updatedLocation.id ? updatedLocation : item
    )
  }));
};
```

## 🚀 Performance Architecture

### Optimization Strategies

#### Code Splitting
- **Dynamic Imports**: Lazy load non-critical components
- **Route-based Splitting**: Separate bundles for different sections
- **Component-level Splitting**: On-demand component loading

#### Data Optimization
- **Selective Listening**: Only listen to necessary data changes
- **Debounced Updates**: Prevent excessive re-renders
- **Memoization**: React.memo and useMemo for expensive operations

#### Bundle Optimization
- **Tree Shaking**: Remove unused code
- **Minification**: Compress production bundles
- **Image Optimization**: Next.js automatic image optimization

## 🔄 Error Handling Architecture

### Error Categories

#### Authentication Errors
- Invalid or expired tokens
- Project access denied
- Network connectivity issues

#### Data Errors
- Firestore permission denied
- Invalid data format
- Concurrent modification conflicts

#### UI Errors
- Component rendering failures
- State synchronization issues
- User input validation errors

### Error Handling Strategy

#### Graceful Degradation
- **Fallback UI**: Show error states without crashing
- **Retry Mechanisms**: Automatic retry for transient failures
- **User Feedback**: Clear error messages and recovery options

#### Error Boundaries
- **Component-level**: Catch and handle component errors
- **Section-level**: Isolate errors to specific planning sections
- **Global-level**: Catch unhandled errors and show fallback UI

## 🔮 Future Architecture Considerations

### Scalability
- **Microservices**: Break down into smaller, focused services
- **Caching Layer**: Redis or similar for performance optimization
- **CDN Integration**: Global content delivery for better performance

### Extensibility
- **Plugin Architecture**: Modular system for additional features
- **API Gateway**: Centralized API management and versioning
- **Event-driven Architecture**: Decoupled communication between services

### Monitoring and Observability
- **Application Performance Monitoring**: Track user experience metrics
- **Error Tracking**: Comprehensive error logging and alerting
- **User Analytics**: Understand user behavior and optimize workflows