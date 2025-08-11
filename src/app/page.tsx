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

const PLANNING_STEPS = [
  { id: 'people', title: 'Step 1: Key People', description: "Let's start by adding the main wedding party and family members." },
  { id: 'locations', title: 'Step 2: Locations', description: 'Now, tell us about the key places for the day.' },
  { id: 'groups', title: 'Step 3: Group Photos', description: 'Plan your formal group photos. Use our suggestions or create your own.' },
  { id: 'requests', title: 'Step 4: Special Requests', description: 'Add any specific, must-have photo ideas.' },
  { id: 'timeline', title: 'Step 5: Timeline', description: 'Finally, outline the main events of your day.' },
  { id: 'complete', title: 'All Done!', description: 'Thank you! Your photographer will review the details and be in touch.' },
];

function PortalPageContent() {
  const [projectHeader, setProjectHeader] = useState<Pick<ProjectData, 'projectInfo' | 'photographerName' | 'portalStatus'> | null>(null);
  const [locationData, setLocationData] = useState<PortalLocationData | null>(null);
  const [keyPeopleData, setKeyPeopleData] = useState<PortalKeyPeopleData | null>(null);
  const [groupShotData, setGroupShotData] = useState<PortalGroupShotData | null>(null);
  const [photoRequestData, setPhotoRequestData] = useState<PortalPhotoRequestData | null>(null);
  const [timelineData, setTimelineData] = useState<PortalTimelineData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const projectId = useMemo(() => searchParams?.get('project') || '', [searchParams]);

  useEffect(() => {
    const token = searchParams?.get('token') || '';
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
        setProjectHeader({
          projectInfo: project.projectInfo,
          photographerName: project.photographerName,
          portalStatus: project.portalStatus,
        });

        unsubLocations = projectService.listenToLocationUpdates(projectId, setLocationData);
        unsubPeople = projectService.listenToKeyPeopleUpdates(projectId, setKeyPeopleData);
        unsubGroupShots = projectService.listenToGroupShotData(projectId, setGroupShotData);
        unsubPhotoRequests = projectService.listenToPhotoRequestUpdates(projectId, setPhotoRequestData);
        unsubTimeline = projectService.listenToTimelineUpdates(projectId, setTimelineData);
        unsubProject = projectService.listenToProjectUpdates(projectId, (data) => {
          setProjectHeader((prev) => ({
            projectInfo: data.projectInfo,
            photographerName: data.photographerName,
            portalStatus: data.portalStatus ?? prev?.portalStatus,
          }));
        });

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
  }, [projectId, searchParams]);

  const currentStep = projectHeader?.portalStatus?.currentStep || 0;

  const handleStepChange = (newStep: number) => {
    if (projectId) projectService.updatePortalStatus(projectId, newStep);
  };

  const handleAddLocation = (newLocation: Omit<ClientLocationFull, 'id'>) => {
    if (projectId) projectService.addLocation(projectId, newLocation);
  };

  const handleAddPerson = (newPerson: Omit<ClientKeyPersonFull, 'id'>) => {
    if (projectId) projectService.addKeyPerson(projectId, newPerson);
  };

  const handleUpdateGroupShots = (updatedItems: ClientGroupShotItemFull[]) => {
    if (projectId) projectService.updateGroupShotSelections(projectId, updatedItems);
  };

  const handleAddCustomGroup = (input: { name: string; peopleIds: string[]; notes?: string }) => {
    if (!projectId || !groupShotData) return;
    const othersCat = groupShotData.categories.find((c) => c.id === 'group_shot_cat_others')?.id || groupShotData.categories[0]?.id;
    const newItem: ClientGroupShotItemFull = {
      id: `group_${Date.now()}`,
      name: input.name,
      notes: input.notes,
      categoryId: othersCat,
      time: 3, // default estimated minutes
      checked: true,
    };
    const updated = [...groupShotData.items, newItem];
    projectService.updateGroupShotSelections(projectId, updated);
  };

  const handleAddRequest = (newRequest: Omit<ClientPhotoRequestItemFull, 'id'>) => {
    if (projectId) projectService.addPhotoRequest(projectId, newRequest);
  };

  const handleAddEvent = (newEvent: Omit<ClientTimelineEventFull, 'id'>) => {
    if (projectId) projectService.addTimelineEvent(projectId, newEvent);
  };

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading Portal...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  if (!projectHeader) return <div className="flex items-center justify-center h-screen">Could not load project data.</div>;

  const activeSection = PLANNING_STEPS[currentStep]?.id;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header projectName={projectHeader.projectInfo.projectName} photographerName={projectHeader.photographerName} />
      <StatusBar
        steps={PLANNING_STEPS}
        currentStep={currentStep}
        onNext={() => handleStepChange(currentStep + 1)}
        onPrev={() => handleStepChange(currentStep - 1)}
      />
      <main className="space-y-10">
        {activeSection === 'people' && keyPeopleData && (
          <KeyPeopleSection config={keyPeopleData.config} items={keyPeopleData.items} onAddPerson={handleAddPerson} />
        )}
        {activeSection === 'locations' && locationData && (
          <LocationsSection config={locationData.config} items={locationData.items} onAddLocation={handleAddLocation} />
        )}
        {activeSection === 'groups' && groupShotData && (
          <GroupShotsSection
            data={groupShotData}
            people={keyPeopleData?.items || []}
            onUpdateSelections={handleUpdateGroupShots}
            onAddCustomGroup={handleAddCustomGroup}
          />
        )}
        {activeSection === 'requests' && photoRequestData && (
          <PhotoRequestsSection config={photoRequestData.config} items={photoRequestData.items} onAddRequest={handleAddRequest} />
        )}
        {activeSection === 'timeline' && timelineData && (
          <TimelineSection config={timelineData.config} items={timelineData.items} onAddEvent={handleAddEvent} />
        )}
        {activeSection === 'complete' && (
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-green-600">Thank You!</h2>
            <p className="mt-2 text-gray-700">All information has been saved.</p>
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
