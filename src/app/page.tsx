'use client'; 

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Import Types from your new central types file
import { ProjectData, PersonWithRole, LocationFull, GroupShot, PhotoRequest, TimelineEvent } from '@/types';

// Import Layout & Section Components
import { Header } from '@/components/layouts/Header';
import { StatusBar } from '@/components/layouts/StatusBar';
import { KeyPeopleSection } from '@/components/sections/KeyPeopleSection';
import { LocationsSection } from '@/components/sections/LocationsSection';
import { GroupPhotosSection } from '@/components/sections/GroupPhotosSection';
import { PhotoRequestsSection } from '@/components/sections/PhotoRequestsSection';
import { TimelineSection } from '@/components/sections/TimelineSection';

// Import the LIVE project service
import { projectService } from '@/lib/projectService';

const PLANNING_STEPS = [
  { id: 'people', title: 'Step 1: Key People', description: 'Let\'s start by adding the main wedding party and family members.' },
  { id: 'locations', title: 'Step 2: Locations', description: 'Now, tell us about the key places for the day.' },
  { id: 'groups', title: 'Step 3: Group Photos', description: 'Plan your formal group photos. Use our suggestions or create your own.' },
  { id: 'requests', title: 'Step 4: Special Requests', description: 'Add any specific, must-have photo ideas.' },
  { id: 'timeline', title: 'Step 5: Timeline', description: 'Finally, outline the main events of your day.' },
  { id: 'complete', title: 'All Done!', description: 'Thank you! Your photographer will review the details and be in touch.' },
];

function PortalPageContent() {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  
  // Memoize projectId to prevent re-renders if searchParams object changes but value doesn't
  const projectId = React.useMemo(() => searchParams?.get('project'), [searchParams]);

  useEffect(() => {
    // FIX: Access searchParams inside useEffect to ensure it's client-side
    const token = searchParams?.get('token');

    if (!projectId || !token) {
      setError("Invalid or missing portal link.");
      setIsLoading(false);
      return;
    }

    // Authenticate and get initial data
    projectService.getProjectData(projectId, token)
      .then(() => {
        // Set up the real-time listener
        const unsubscribe = projectService.listenToProjectUpdates(projectId, (data) => {
          setProjectData(data);
          setCurrentStep(data.portalStatus?.currentStep || 0);
          setIsLoading(false);
        });
        // Return the unsubscribe function for cleanup
        return () => unsubscribe();
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
        setIsLoading(false);
      });
  }, [projectId, searchParams]);

  const handleStepChange = (newStep: number) => {
    if (!projectId) return;
    projectService.updatePortalStatus(projectId, newStep);
  };

  // --- Handler functions now call the service to update Firestore ---
  const handleAddPerson = (newPerson: Omit<PersonWithRole, 'id'>) => {
    if (projectId) projectService.addPerson(projectId, newPerson);
  };
  const handleAddLocation = (newLocation: Omit<LocationFull, 'id'>) => {
    if (projectId) projectService.addLocation(projectId, newLocation);
  };
  const handleAddCustomGroup = (newGroup: Omit<GroupShot, 'id'>) => {
    if (projectId) projectService.addGroup(projectId, newGroup);
  };
  const handleAddSuggestedGroup = (suggestedGroup: {id: string, name: string, notes?: string}) => {
    const newGroup: Omit<GroupShot, 'id'> = { name: suggestedGroup.name, notes: suggestedGroup.notes, peopleIds: [] };
    if (projectId) projectService.addGroup(projectId, newGroup);
  };
  const handleAddRequest = (newRequest: Omit<PhotoRequest, 'id'>) => {
    if (projectId) projectService.addPhotoRequest(projectId, newRequest);
  };
  const handleAddEvent = (newEvent: Omit<TimelineEvent, 'id'>) => {
    if (projectId) projectService.addTimelineEvent(projectId, newEvent);
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen">Authenticating & Loading Project...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  if (!projectData) return <div className="flex items-center justify-center h-screen">Could not load project data.</div>;

  const activeSection = PLANNING_STEPS[currentStep]?.id;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header 
        projectName={projectData.projectInfo.projectName} 
        photographerName={"Your Photographer"}
      />
      <StatusBar 
        steps={PLANNING_STEPS}
        currentStep={currentStep}
        onNext={() => handleStepChange(currentStep + 1)}
        onPrev={() => handleStepChange(currentStep - 1)}
      />
      <main>
        {activeSection === 'people' && <KeyPeopleSection people={projectData.peopleInfo?.weddingParty || []} onAddPerson={handleAddPerson} />}
        {activeSection === 'locations' && <LocationsSection locations={projectData.locationInfo || []} onAddLocation={handleAddLocation} />}
        {activeSection === 'groups' && <GroupPhotosSection customGroups={projectData.groupShots || []} people={projectData.peopleInfo?.weddingParty || []} onAddCustomGroup={handleAddCustomGroup} onAddSuggestedGroup={handleAddSuggestedGroup} />}
        {activeSection === 'requests' && <PhotoRequestsSection requests={projectData.photoInfo?.photoRequests || []} onAddRequest={handleAddRequest} />}
        {activeSection === 'timeline' && <TimelineSection events={projectData.timeline?.events || []} onAddEvent={handleAddEvent} />}
        {activeSection === 'complete' && (
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-green-600">Thank You!</h2>
            <p className="mt-2 text-gray-700">All your information has been saved. Your photographer will review everything and be in touch soon.</p>
          </div>
        )}
      </main>
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