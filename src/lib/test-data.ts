// GEM-35-PORTAL/src/lib/test-data.ts
import {
    ClientProject,
    PortalKeyPeopleData,
    PortalLocationData,
    PortalGroupShotData,
    PortalPhotoRequestData,
    PortalTimelineData,
    PortalStepID,   
    SectionStatus,
    ActionOn,
    KeyPersonRole,
    KeyPersonInvolvement,
    LocationType,
    PhotoRequestPriority,
    PhotoRequestType,
    TimelineEventType,
  } from '../types/types';
  
  export const testProject: ClientProject = {
    id: 'test-project',
    projectName: 'Test Wedding Project',
    personA: { firstName: 'Alex' },
    personB: { firstName: 'Jordan' },
    eventDate: { seconds: Math.floor(new Date().getTime() / 1000), nanoseconds: 0 },
    photographerName: 'Test Photographer',
    portalMessage: '',
    currentStepID: PortalStepID.WELCOME,
    portalSteps: [
        { id: PortalStepID.WELCOME, stepTitle: 'Welcome', stepStatus: SectionStatus.LOCKED, actionOn: ActionOn.NONE, stepDescription: 'Welcome to your wedding planning portal!', stepIcon: '/icons/welcome-section.svg' },
        { id: PortalStepID.KEY_PEOPLE, stepTitle: 'Key People', requiredStep: false, stepStatus: SectionStatus.UNLOCKED, actionOn: ActionOn.CLIENT, stepDescription: 'For listing the important people involved in your wedding day', stepIcon: '/icons/key-people-section.svg' },
        { id: PortalStepID.LOCATIONS, stepTitle: 'Locations', requiredStep: true, stepStatus: SectionStatus.IN_PROGRESS, actionOn: ActionOn.CLIENT, stepDescription: 'For listing the important locations involved in your wedding day', stepIcon: '/icons/locations-section.svg'  },
        { id: PortalStepID.GROUP_SHOTS, stepTitle: 'Group Shots', requiredStep: true, stepStatus: SectionStatus.UNLOCKED, actionOn: ActionOn.CLIENT, stepDescription: 'Plan your formal group photographs here and calculate the time required', stepIcon: '/icons/group-shots-section.svg' },
        { id: PortalStepID.PHOTO_REQUESTS, stepTitle: 'Photo Requests', requiredStep: false, stepStatus: SectionStatus.UNLOCKED, actionOn: ActionOn.CLIENT, stepDescription: 'Request the photos of your dreams', stepIcon: '/icons/photo-requests-section.svg' },
        { id: PortalStepID.TIMELINE, stepTitle: 'Timeline', requiredStep: true, stepStatus: SectionStatus.UNLOCKED, actionOn: ActionOn.CLIENT, stepDescription: 'Let your photographer knows when and where to be for all the key moments', stepIcon: '/icons/timeline-section.svg' },
        { id: PortalStepID.THANK_YOU, stepTitle: 'Thank You', stepStatus: SectionStatus.LOCKED, actionOn: ActionOn.NONE, stepDescription: 'Thank you for using our wedding planning portal!', stepIcon: '/icons/thank-you-section.svg' },
    ],
  };
  
  export const testKeyPeople: PortalKeyPeopleData = {
    config: { finalized: false, locked: false, updatedAt: null },
    items: [
      { id: '1', fullName: 'Jane Doe', role: KeyPersonRole.MAID_OF_HONOR, involvement: KeyPersonInvolvement.SPEECH, notes: 'Allergic to peanuts.', mustPhotograph: true, dontPhotograph: false, isVIP: true, canRallyPeople: true },
      { id: '2', fullName: 'John Smith', role: KeyPersonRole.BEST_MAN, involvement: KeyPersonInvolvement.TOAST, notes: '', mustPhotograph: true, dontPhotograph: false, isVIP: true, canRallyPeople: true },
    ],
  };
  
  export const testLocations: PortalLocationData = {
      config: { multipleLocations: true, finalized: false, locked: false, updatedAt: null },
      items: [
          { id: 'loc1', locationName: 'Grand Hotel', locationType: LocationType.GETTING_READY_1, locationAddress1: '123 Main St', locationPostcode: 'SW1A 0AA', locationNotes: 'Bridal suite', nextLocationTravelTimeEstimate: 15, nextLocationTravelArrangements: 'Car', arriveTime: { seconds: Math.floor(new Date().getTime() / 1000), nanoseconds: 0 }, leaveTime: { seconds: Math.floor(new Date().getTime() / 1000) + 3600, nanoseconds: 0 } },
          { id: 'loc2', locationName: 'City Hall', locationType: LocationType.CEREMONY, locationAddress1: '456 High St', locationPostcode: 'WC1A 2AA', locationNotes: 'Ceremony at 2 PM', nextLocationTravelTimeEstimate: 15, nextLocationTravelArrangements: 'Car', arriveTime: { seconds: Math.floor(new Date().getTime() / 1000), nanoseconds: 0 }, leaveTime: { seconds: Math.floor(new Date().getTime() / 1000) + 3600, nanoseconds: 0 } },
      ],
  };
  
  export const testGroupShots: PortalGroupShotData = {
      config: { finalized: false, locked: false, totalTimeEstimated: 30, updatedAt: null },
      categories: [
        { id: 'group_shot_cat_user', displayName: 'Custom', isPredefined: true, iconName: 'user' },
        { id: 'group_shot_cat_family', displayName: 'Family', isPredefined: true, iconName: 'family' },
        { id: 'group_shot_cat_wedding_party', displayName: 'Wedding Party', isPredefined: true, iconName: 'wedding-party' },
        { id: 'group_shot_cat_extended_family', displayName: 'ExtendedFamily', isPredefined: true, iconName: 'extended-family' },
        { id: 'group_shot_cat_friends', displayName: 'Friends', isPredefined: true, iconName: 'friends' },
        { id: 'group_shot_cat_others', displayName: 'Others', isPredefined: true, iconName: 'others' },
        { id: 'group_shot_cat_fun', displayName: 'Fun', isPredefined: true, iconName: 'fun' },
      ],
      items: [
          { id: 'gsot01', name: 'Full guest group', notes: 'Capture a wide shot with all wedding guests together', categoryId: 'group_shot_cat_others', isPredefined: true, checked: false, time: 10 },
          { id: 'group_shot_item_1755644675583_7lg2df41c_24367372552', name: 'Naked Pic', notes: 'Birthday Suits', categoryId: 'group_shot_cat_others', isPredefined: true, checked: false, time: 20 },
          { id: 'gsfu05', name: 'Hobby group', notes: 'Couple with guests from a shared hobby or club', categoryId: 'group_shot_cat_fun', isPredefined: true, checked: false, time: 5 },
      ],
  };
  
  export const testPhotoRequests: PortalPhotoRequestData = {
      config: { finalized: false, locked: false, updatedAt: null },
      items: [
          { id: 'req1', title: 'Sunset Kiss', description: 'A photo of the couple kissing at sunset.', priority: PhotoRequestPriority.HIGH, type: PhotoRequestType.COUPLE_SHOT },
      ],
  };
  
  export const testTimeline: PortalTimelineData = {
      config: { finalized: false, locked: false, eventDate: { seconds: Math.floor(new Date().getTime() / 1000), nanoseconds: 0 }, updatedAt: null },
      items: [
          { id: 'event1', type: TimelineEventType.CEREMONY_BEGINS, title: 'Ceremony', startTime: { seconds: Math.floor(new Date().getTime() / 1000) + 3600, nanoseconds: 0 }, duration: 30 },
          { id: 'event2', type: TimelineEventType.RECEPTION_DRINKS, title: 'Cocktail Hour', startTime: { seconds: Math.floor(new Date().getTime() / 1000) + 5400, nanoseconds: 0 }, duration: 60 },
      ],
  };