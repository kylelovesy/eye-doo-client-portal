// // 1. Create this new file: src/lib/mockData.ts
// // This file centralizes all the mock data, structured to match your Firestore subcollections.

// import {
//   ProjectData,
//   PortalLocationData,
//   PortalKeyPeopleData,
//   PortalGroupShotData,
//   PortalPhotoRequestData,
//   PortalTimelineData,
//   LocationType,
//   KeyPersonRole,
//   PhotoRequestType,
//   TimelineEventType,
//   KeyPersonActions,
// } from '@/types';
// import { Timestamp } from 'firebase/firestore';

// export const mockProjectHeader: Pick<ProjectData, 'projectInfo' | 'photographerName' | 'portalStatus'> = {
//   projectInfo: {
//     projectName: 'Ava + Noah — Riverside Wedding',
//   },
//   photographerName: 'Alex',
//   portalStatus: {
//     currentStep: 0,
//   },
// };

// export const mockLocationData: PortalLocationData = {
//   config: {
//     multipleLocations: true,
//     finalized: false,
//     photographerReviewed: false,
//   },
//   items: [
//     { id: 'loc_venue', locationName: 'Riverside Manor', locationType: LocationType.MAIN_VENUE, locationAddress1: '22 Riverside Lane, Wells BA5 2AB', locationPostcode: 'BA5 2AB' },
//     { id: 'loc_ceremony', locationName: 'The Oak Room', locationType: LocationType.CEREMONY, locationAddress1: 'Riverside Manor — Main House', locationPostcode: 'BA5 2AB' },
//   ],
// };

// export const mockKeyPeopleData: PortalKeyPeopleData = {
//     config: {
//         finalized: false,
//     },
//     items: [
//         { id: 'person_ava', fullName: 'Ava Johnson', role: KeyPersonRole.MATRON_OF_HONOR, notes: 'Prefers candid photos' },
//         { id: 'person_noah', fullName: 'Noah Williams', role: KeyPersonRole.GROOMSMAN },
//         { id: 'person_emma', fullName: 'Emma Johnson', role: KeyPersonRole.BRIDESMAID },
//         { id: 'person_liam', fullName: 'Liam Carter', role: KeyPersonRole.BEST_MAN, notes: 'Speech right after mains', involvedIn: [{type: KeyPersonActions.SPEECH}] },
//     ]
// };

// export const mockPhotoRequestData: PortalPhotoRequestData = {
//     config: {
//         finalized: false,
//     },
//     items: [
//         { id: 'req_ring_detail', description: 'Macro shot of rings on invitation suite', imageUrl: 'https://placehold.co/600x400/E9ECEF/1A1A1A?text=Rings', type: PhotoRequestType.DETAIL_SHOT, priority: 'Nice to Have' },
//         { id: 'req_dog', description: 'Photo with our dog, Milo, after the ceremony', imageUrl: 'https://placehold.co/600x400/E9ECEF/1A1A1A?text=Milo', type: PhotoRequestType.GROUP_SHOT, priority: 'Must Have' },
//     ]
// };

// export const mockGroupShotData: PortalGroupShotData = {
//   config: {
//       finalized: false,
//       totalTimeEstimated: 15,
//   },
//   categories: [
//       { id: 'group_shot_cat_family', displayName: 'Family' },
//       { id: 'group_shot_cat_wedding_party', displayName: 'Wedding Party' },
//   ],
//   items: [
//       { id: 'gsf03', name: 'All parents', categoryId: 'group_shot_cat_family', notes: 'Couple with both sets of parents together', time: 5, checked: true },
//       { id: 'gswp01', name: 'Full wedding party', categoryId: 'group_shot_cat_wedding_party', notes: 'Couple posed with entire wedding party together', time: 10, checked: true },
//       { id: 'gsf01', name: 'P1 parents', categoryId: 'group_shot_cat_family', notes: 'Couple posed with Partner 1s parents', time: 5, checked: false },
//   ]
// };

// export const mockTimelineData: PortalTimelineData = {
//     config: {
//         finalized: false,
//     },
//     items: [
//         { id: 'evt_prep_start', title: 'Bridal Prep', startTime: Timestamp.fromDate(new Date('2025-05-01T10:30:00')), type: TimelineEventType.BRIDAL_PREP, duration: 90, clientNotes: "Ava's Suite — East Wing" },
//         { id: 'evt_ceremony', title: 'Ceremony Begins', startTime: Timestamp.fromDate(new Date('2025-05-01T14:00:00')), type: TimelineEventType.CEREMONY_BEGINS, duration: 45, clientNotes: 'The Oak Room' },
//     ]
// };