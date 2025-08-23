// src/app/page.tsx
'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import {
  ProjectData,
  PortalLocationData,
  PortalKeyPeopleData,
  PortalGroupShotData,
  PortalPhotoRequestData,
  PortalTimelineData,
  ClientLocationFull,
  ClientKeyPersonFull,
  ClientGroupShotItemFull,
  ClientPhotoRequestItemFull,
  ClientTimelineEventFull,
} from '@/types';

import { Header } from '@/components/layouts/Header';
import { StatusBar } from '@/components/layouts/StatusBar';
import { KeyPeopleSection } from '@/components/sections/KeyPeopleSection';
import { LocationsSection } from '@/components/sections/LocationsSection';
import { GroupShotsSection } from '@/components/sections/GroupShotsSection';
import { PhotoRequestsSection } from '@/components/sections/PhotoRequestsSection';
import { TimelineSection } from '@/components/sections/TimelineSection';

import { projectService } from '@/lib/projectService';
import { useUnsavedChangesPrompt } from '@/lib/useUnsavedChangesPrompt';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
// import { getLocationIconSrc } from '@/lib/iconMaps';

const PLANNING_STEPS = [
  { id: 'welcome', title: 'Welcome!', description: 'Begin planning your perfect day with us.' },
  { id: 'people', title: 'Step 1: Key People', description: "Let's start by adding the main wedding party and family members." },
  { id: 'locations', title: 'Step 2: Locations', description: 'Now, tell us about the key places for the day.' },
  { id: 'groups', title: 'Step 3: Group Photos', description: 'Plan your formal group photos. Use our suggestions or create your own.' },
  { id: 'requests', title: 'Step 4: Special Requests', description: 'Add any specific, must-have photo ideas.' },
  { id: 'timeline', title: 'Step 5: Timeline', description: 'Finally, outline the main events of your day.' },
  { id: 'complete', title: 'All Done!', description: 'Thank you! Your photographer will review the details and be in touch.' },
];

function PortalPageContent() {
  const [projectHeader, setProjectHeader] = useState<ProjectData | null>(null);
  const [locationData, setLocationData] = useState<PortalLocationData | null>(null);
  const [keyPeopleData, setKeyPeopleData] = useState<PortalKeyPeopleData | null>(null);
  const [groupShotData, setGroupShotData] = useState<PortalGroupShotData | null>(null);
  const [photoRequestData, setPhotoRequestData] = useState<PortalPhotoRequestData | null>(null);
  const [timelineData, setTimelineData] = useState<PortalTimelineData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Confirmation modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [sectionToSubmit, setSectionToSubmit] = useState<string | null>(null);

  // Local-state-first VMs and dirty flags
  const [locLocal, setLocLocal] = useState<PortalLocationData | null>(null);
  const [peopleLocal, setPeopleLocal] = useState<PortalKeyPeopleData | null>(null);
  const [requestsLocal, setRequestsLocal] = useState<PortalPhotoRequestData | null>(null);

  const searchParams = useSearchParams();
  const projectId = useMemo(() => searchParams?.get('project') || '', [searchParams]);
  const token = useMemo(() => searchParams?.get('token') || '', [searchParams]);
  useEffect(() => {
    if (!projectId || !token) {
      setError('Invalid or missing portal link.');
      setIsLoading(false);
      return;
    }

    let unsubLocations: (() => void) | undefined;
    let unsubPeople: (() => void) | undefined;
    let unsubGroupShots: (() => void) | undefined;
    let unsubPhotoRequests: (() => void) | undefined;
    let unsubTimeline: (() => void) | undefined;
    let unsubProject: (() => void) | undefined;

    projectService
      .getProjectData(projectId, token)
      .then((project) => {  
        setProjectHeader(project);

        const anyProj = project as unknown as { portalStatus?: { currentStep?: number } };
        if (anyProj.portalStatus?.currentStep !== undefined) {
          setCurrentStep(anyProj.portalStatus.currentStep);
        }

        unsubLocations = projectService.listenToLocationUpdates(projectId, (d)=>{ setLocationData(d); setLocLocal((prev)=> prev ?? d); });
        unsubPeople = projectService.listenToKeyPeopleUpdates(projectId, (d)=>{ setKeyPeopleData(d); setPeopleLocal((prev)=> prev ?? d); });
        unsubGroupShots = projectService.listenToGroupShotData(projectId, setGroupShotData);
        unsubPhotoRequests = projectService.listenToPhotoRequestUpdates(projectId, (d)=>{ setPhotoRequestData(d); setRequestsLocal((prev)=> prev ?? d); });
        unsubTimeline = projectService.listenToTimelineUpdates(projectId, setTimelineData);
        unsubProject = projectService.listenToProjectUpdates(projectId, (data) => setProjectHeader(data));

        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setIsLoading(false);
      });

    return () => {
      unsubLocations?.();
      unsubPeople?.();
      unsubGroupShots?.();
      unsubPhotoRequests?.();
      unsubTimeline?.();
      unsubProject?.();
    };
  }, [projectId, searchParams, token]);

  const handleStepChange = (newStep: number) => {
    setCurrentStep(newStep);
    if (projectId) projectService.updatePortalStatus(projectId, newStep);
  };

  // Local mutators for Locations/KeyPeople/Requests
  const handleAddLocation = (newLocation: Omit<ClientLocationFull, 'id'>) => {
    setLocLocal(curr => curr ? { ...curr, items: [...curr.items, { ...newLocation, id: `loc_${Date.now()}` }] } : curr);
  };

  const handleUpdateLocations = (updatedItems: ClientLocationFull[]) => {
    setLocLocal(curr => curr ? { ...curr, items: updatedItems } : curr);
  };

  const handleDeleteLocation = (id: string) => {
    if (!locLocal) return;
    
    // Remove the location from local state
    const updatedLocations = locLocal.items.filter(l => l.id !== id);
    setLocLocal({ ...locLocal, items: updatedLocations });
    
    // Note: The actual deletion will be saved when the user clicks "Save Locations Data"
    // or when the section is submitted for review
  };



  // const handleAddCustomGroup = (input: { name: string; peopleIds: string[]; notes?: string }) => {
  //   if (!projectId || !groupShotData) return;
  //   const othersCat = groupShotData.categories.find((c) => c.id === 'group_shot_cat_others')?.id || groupShotData.categories[0]?.id;
  //   const newItem: ClientGroupShotItemFull = {
  //     id: `group_${Date.now()}`,
  //     name: input.name,
  //     notes: input.notes,
  //     categoryId: othersCat,
  //     time: 3, // default estimated minutes
  //     checked: true,
  //   };
  //   const updated = [...groupShotData.items, newItem];
  //   projectService.updateGroupShotSelections(projectId, updated);
  // };

  const handleAddPerson = (newPerson: Omit<ClientKeyPersonFull, 'id'>) => {
    setPeopleLocal(curr => curr ? { ...curr, items: [...curr.items, { ...newPerson, id: `person_${Date.now()}` }] } : curr);
  };

  const handleUpdatePeople = (updatedItems: ClientKeyPersonFull[]) => {
    setPeopleLocal(curr => curr ? { ...curr, items: updatedItems } : curr);
  };

  const handleEditPerson = (id: string) => {
    // Find the person to edit
    const personToEdit = peopleLocal?.items.find(p => p.id === id);
    if (!personToEdit) return;
    
    // For now, we'll just log the edit action and could implement a basic edit approach
    // In a full implementation, you might open an edit modal or navigate to an edit form
    console.log('Editing person:', personToEdit);
    
    // TODO: Implement edit modal/form for person
    // This could involve:
    // 1. Opening an edit modal with pre-filled form
    // 2. Updating the person in local state
    // 3. Saving changes to the backend
    
    // Basic implementation: You could implement inline editing or a modal
    // For example, you could:
    // - Set an editingPersonId state
    // - Show inline edit form in the KeyPeopleSection
    // - Handle the update through handleUpdatePeople
    // - Save changes when the user confirms
  };

  const handleDeletePerson = (id: string) => {
    if (!peopleLocal) return;
    
    // Remove the person from local state
    const updatedPeople = peopleLocal.items.filter(p => p.id !== id);
    setPeopleLocal({ ...peopleLocal, items: updatedPeople });
    
    // Note: The actual deletion will be saved when the user clicks "Save Key People Data"
    // or when the section is submitted for review
  };

  const handleUpdateGroupShots = (updatedItems: ClientGroupShotItemFull[]) => {
    if (projectId) projectService.updateGroupShotSelections(projectId, token, updatedItems);
  };

  const handleAddRequest = (newRequest: Omit<ClientPhotoRequestItemFull, 'id'>) => {
    setRequestsLocal(curr => curr ? { ...curr, items: [...curr.items, { ...newRequest, id: `request_${Date.now()}` }] } : curr);
  };

  const saveRequests = async () => {
    if (!projectId || !requestsLocal) return;
    try {
      await projectService.savePhotoRequestsDraft(projectId, requestsLocal.config, requestsLocal.items);
      console.log('Photo requests saved successfully');
    } catch (error) {
      console.error('Error saving photo requests:', error);
      // You could add user notification here
    }
  };

  // Submit functions for review
  const submitLocations = async () => {
    await saveLocations();
    if (projectId) await projectService.submitSection(projectId, 'locations');
  };

  const submitKeyPeople = async () => {
    await saveKeyPeople();
    if (projectId) await projectService.submitSection(projectId, 'keyPeople');
  };

  const submitRequests = async () => {
    await saveRequests();
    if (projectId) await projectService.submitSection(projectId, 'photoRequests');
  };

  const handleAddEvent = (newEvent: Omit<ClientTimelineEventFull, 'id'>) => {
    if (projectId) projectService.addTimelineEvent(projectId, token, newEvent);
  };

  const handleUpdateTimeline = (updatedItems: ClientTimelineEventFull[]) => {
    // Update timeline in local state
    if (timelineData) {
      setTimelineData({ ...timelineData, items: updatedItems });
    }
    
    // Note: Since timeline doesn't use local state like other sections, we're updating the main timelineData
    // In a full implementation, you might want to:
    // 1. Add timelineLocal state similar to other sections
    // 2. Implement saveTimeline and submitTimeline functions
    // 3. Add timeline to the dirty checking system
    console.log('Timeline updated:', updatedItems);
  };

  const handleDeleteTimelineEvent = (id: string) => {
    if (!timelineData) return;
    
    // Remove the event from local state
    const updatedEvents = timelineData.items.filter(e => e.id !== id);
    
    // Update the timeline data directly since timeline doesn't use local state yet
    // In a full implementation, you might want to add timelineLocal state similar to other sections
    setTimelineData(prev => prev ? { ...prev, items: updatedEvents } : null);
    
    // Note: Since there's no deleteTimelineEvent in projectService, we're just updating local state
    // The actual deletion would need to be implemented in the backend or projectService
    console.log('Timeline event deleted locally:', id);
    
    // TODO: Implement proper timeline deletion in projectService
    // This could involve:
    // 1. Adding deleteTimelineEvent method to projectService
    // 2. Using arrayRemove in Firestore to remove the event
    // 3. Updating the backend state
  };

  // Helper function to check if a section has unsaved changes
  // Commented out as currently unused - can be restored if needed for future features
  // const hasUnsavedChanges = (section: string) => {
  //   switch (section) {
  //     case 'locations':
  //       return locationData && locLocal && (JSON.stringify(locationData) !== JSON.stringify(locLocal));
  //     case 'keyPeople':
  //       return keyPeopleData && peopleLocal && (JSON.stringify(keyPeopleData) !== JSON.stringify(peopleLocal));
  //     case 'requests':
  //       return photoRequestData && requestsLocal && (JSON.stringify(photoRequestData) !== JSON.stringify(requestsLocal));
  //     default:
  //       return false;
  //   }
  // };

  // Enhanced save functions with better error handling
  const saveLocations = async () => {
    if (!projectId || !locLocal) return;
    try {
      await projectService.saveLocations(projectId, locLocal.items);
      console.log('Locations saved successfully');
    } catch (error) {
      console.error('Error saving locations:', error);
      // You could add user notification here
    }
  };

  const saveKeyPeople = async () => {
    if (!projectId || !peopleLocal) return;
    try {
      await projectService.saveKeyPeopleDraft(projectId, peopleLocal.config, peopleLocal.items);
      console.log('Key people saved successfully');
    } catch (error) {
      console.error('Error saving key people:', error);
      // You could add user notification here
    }
  };

  // Unsaved warning if any section dirty (simple pointer compare)
  const dirty = Boolean(
    (locationData && locLocal && (JSON.stringify(locationData) !== JSON.stringify(locLocal))) ||
    (keyPeopleData && peopleLocal && (JSON.stringify(keyPeopleData) !== JSON.stringify(peopleLocal))) ||
    (photoRequestData && requestsLocal && (JSON.stringify(photoRequestData) !== JSON.stringify(requestsLocal)))
  );
  useUnsavedChangesPrompt(dirty);

  const confirmSubmit = (section: string) => {
    setSectionToSubmit(section);
    setIsConfirmModalOpen(true);
  };

  const handleSubmitForReview = async () => {
    if (!sectionToSubmit) return;
    
    try {
      if (sectionToSubmit === 'keyPeople') {
        await saveKeyPeople(); // Use enhanced save function
        await submitKeyPeople();
      } else if (sectionToSubmit === 'locations') {
        await saveLocations(); // Use enhanced save function
        await submitLocations();
      } else if (sectionToSubmit === 'requests') {
        await saveRequests(); // Use enhanced save function
        await submitRequests();
      }
      setIsConfirmModalOpen(false);
      setSectionToSubmit(null);
    } catch (error) {
      console.error('Error submitting section:', error);
      // You could add error handling here if needed
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading Portal...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  if (!projectHeader) return <div className="flex items-center justify-center h-screen">Could not load project data.</div>;

  const activeSection = PLANNING_STEPS[currentStep]?.id;
  const nameA = projectHeader.projectInfo.personA.firstName ?? [projectHeader.projectInfo.personA.firstName, projectHeader.projectInfo.personA.surname].filter(Boolean).join(' ');
  const nameB = projectHeader.projectInfo.personB.firstName ?? [projectHeader.projectInfo.personB.firstName, projectHeader.projectInfo.personB.surname].filter(Boolean).join(' ');

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header 
        projectName={projectHeader.projectInfo.projectName} 
        photographerName={projectHeader.projectInfo.photographerName} 
        personA={projectHeader.projectInfo.personA.firstName} 
        personB={projectHeader.projectInfo.personB.firstName} 
      />
                    {activeSection !== 'welcome' && (
          <StatusBar
            steps={PLANNING_STEPS.slice(1, 6)}
            currentStep={currentStep - 1}
            onNext={() => handleStepChange(currentStep + 1)}
            onPrev={() => handleStepChange(currentStep - 1)}
          />
        )}
      <main className="space-y-10 px-4">
        {activeSection === 'welcome' && (
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <h1 className="text-xl" >Congratulations</h1>
            <p className="text-lg text-gray-700">{nameA} & {nameB}</p>
            <h2 className="text-2xl font-bold">Welcome to your Planning Portal!</h2>
            <p className="mt-2 text-gray-700">Let&apos;s begin planning your perfect day.</p>
            <Button onClick={() => handleStepChange(1)} className="mt-4">
              Start Planning
            </Button>
          </div>
        )}
        {activeSection === 'people' && peopleLocal && (
          <>
            <KeyPeopleSection config={peopleLocal.config} items={peopleLocal.items} onAddPerson={handleAddPerson} onUpdate={handleUpdatePeople} onSave={saveKeyPeople} onEdit={handleEditPerson} onDelete={handleDeletePerson} />
            <div className="flex gap-3 mt-4">
              <Button onClick={saveKeyPeople}>Save Key People Data</Button>
              <Button onClick={() => confirmSubmit('keyPeople')}>Submit for Review</Button>
            </div>
          </>
        )}
        {activeSection === 'locations' && locLocal && (
          <LocationsSection
            config={locLocal.config}
            items={locLocal.items}
            onAddLocation={handleAddLocation}
            onSetMultipleLocations={(multiple)=> setLocLocal(curr => curr ? { ...curr, config: { ...curr.config, multipleLocations: multiple } } : curr)}
            onUpdate={handleUpdateLocations}
            onDelete={handleDeleteLocation}
          />
        )}
        {activeSection === 'locations' && (
          <div className="flex gap-3 mt-4">
            <Button onClick={saveLocations}>Save Locations Data</Button>
            <Button onClick={() => confirmSubmit('locations')}>Submit for Review</Button>
          </div>
        )}
        {activeSection === 'groups' && groupShotData && (
          <GroupShotsSection
            data={groupShotData}
            people={keyPeopleData?.items || []}
            onUpdateSelections={handleUpdateGroupShots}
            // onAddCustomGroup={handleAddCustomGroup}
          />
        )}
        {activeSection === 'requests' && requestsLocal && (
          <>
            <PhotoRequestsSection config={requestsLocal.config} items={requestsLocal.items} onAddRequest={handleAddRequest} projectId={projectId} />
            <div className="flex gap-3 mt-4">
              <Button onClick={saveRequests}>Save Special Requests Data</Button>
              <Button onClick={() => confirmSubmit('requests')}>Submit for Review</Button>
            </div>
          </>
        )}
        {activeSection === 'timeline' && timelineData && (
          <TimelineSection 
            config={timelineData.config} 
            items={timelineData.items} 
            onAddEvent={handleAddEvent} 
            onUpdate={handleUpdateTimeline}
            onDelete={handleDeleteTimelineEvent}
          />
        )}
        {activeSection === 'complete' && (
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-green-600">Thank You!</h2>
            <p className="mt-2 text-gray-700">All information has been saved.</p>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirm Submission">
        <div className="space-y-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                                 <p className="text-sm text-yellow-700">
                   <strong>Warning:</strong> Once you submit this section for review, you won&apos;t be able to make any more changes until your photographer has reviewed it.
                 </p>
              </div>
            </div>
          </div>
          
          <p className="text-gray-700">
            Are you sure you want to submit this section for review? This action cannot be undone.
          </p>
          
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitForReview} className="bg-orange-600 hover:bg-orange-700">
              Yes, Submit for Review
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function PortalPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <PortalPageContent />
    </Suspense>
  );
}
