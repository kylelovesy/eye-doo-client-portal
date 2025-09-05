'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePortalStore } from '@/store/usePortalStore';
import { PortalStepID } from '@/types/types';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon, ArrowLeftIcon, ArrowRightIcon, CheckCircle2, HomeIcon } from 'lucide-react';

// Import ShadCN UI Components
// import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Import Section Components
import { LandingPageSection } from '@/components/sections/LandingPageSection';
import { WelcomeSection } from '@/components/sections/WelcomeSection';
import { KeyPeopleSection } from '@/components/sections/KeyPeopleSection';
import { LocationsSection } from '@/components/sections/LocationsSection';
import { GroupShotsSection } from '@/components/sections/GroupShotsSection';
import { PhotoRequestsSection } from '@/components/sections/PhotoRequestSection';
import { TimelineSection } from '@/components/sections/TimelineSection';
// import { Header } from '../components/layouts/Header';
import { OnboardingModal } from '@/components/ui/OnboardingModal';
import useUnsavedChangesPrompt from '@/lib/useUnsavedChangesPrompt';

const CompleteSection = () => (
    <Card className="text-center py-8">
        <CardHeader>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle className="text-3xl font-bold mt-4 text-green-600">Thank you!</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">Your planning is complete. We have everything we need for now.</p>
        </CardContent>
    </Card>
);

// const ThemeToggle = () => {
//     const { theme, setTheme } = useTheme();
//     return (
//         <Button 
//             variant="outline" 
//             size="icon" 
//             onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
//             className="absolute top-1 right-1 size-6"
//         >
//             <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
//             <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
//             <span className="sr-only">Toggle theme</span>
//         </Button>
//     );
// };

const PortalPageContent: React.FC = () => {
    const {
        isLoading,
        isSaving,
        error,
        project,
        currentStep,
        initialize,
        setStep,
        saveCurrentStep,
        isDirty
    } = usePortalStore();

    useUnsavedChangesPrompt(isDirty);

    const searchParams = useSearchParams();
    const projectId = useMemo(() => searchParams?.get('project') || '', [searchParams]);
    const token = useMemo(() => searchParams?.get('token') || '', [searchParams]);
    
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [portalStarted, setPortalStarted] = useState(false);

    useEffect(() => {
        initialize(projectId, token);
    }, [projectId, token, initialize]);

    const handleLaunchOnboarding = () => setShowOnboarding(true);
    const handleCloseOnboarding = () => {
        localStorage.setItem('hasVisitedPortal', 'true');
        setShowOnboarding(false);
    };

    const handleStartPlanning = () => setPortalStarted(true);

    const renderCurrentStep = () => {
        switch (currentStep) {
            case PortalStepID.WELCOME: return <WelcomeSection />;
            case PortalStepID.KEY_PEOPLE: return <KeyPeopleSection />;
            case PortalStepID.LOCATIONS: return <LocationsSection />;
            case PortalStepID.GROUP_SHOTS: return <GroupShotsSection />;
            case PortalStepID.PHOTO_REQUESTS: return <PhotoRequestsSection />;
            case PortalStepID.TIMELINE: return <TimelineSection />;
            case PortalStepID.THANK_YOU: return <CompleteSection />;
            default: return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>Unknown step selected. Please refresh the page.</AlertDescription></Alert>;
        }
    };

    const handleStepChange = (direction: 'next' | 'prev') => {
        const steps = [
            PortalStepID.WELCOME, PortalStepID.KEY_PEOPLE, PortalStepID.LOCATIONS,
            PortalStepID.GROUP_SHOTS, PortalStepID.PHOTO_REQUESTS, PortalStepID.TIMELINE,
            PortalStepID.THANK_YOU
        ];
        const currentIndex = steps.indexOf(currentStep);
        let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

        // Find the next/previous step that is unlocked or in progress
        while (targetIndex >= 0 && targetIndex < steps.length) {
            const targetStepId = steps[targetIndex];
            const targetStep = project?.portalSteps.find(step => step.id === targetStepId);

            if (targetStep && (targetStep.stepStatus === 'unlocked' || targetStep.stepStatus === 'inProgress')) {
                setStep(targetStepId);
                return;
            }

            // Move to next/previous step
            targetIndex = direction === 'next' ? targetIndex + 1 : targetIndex - 1;
        }
    };

    // Find the first step that is unlocked or in progress
    const getFirstAvailableStep = () => {
        if (!project?.portalSteps) return null;

        const availableSteps = [
            PortalStepID.KEY_PEOPLE,
            PortalStepID.LOCATIONS,
            PortalStepID.GROUP_SHOTS,
            PortalStepID.PHOTO_REQUESTS,
            PortalStepID.TIMELINE
        ];

        for (const stepId of availableSteps) {
            const step = project.portalSteps.find(s => s.id === stepId);
            if (step && (step.stepStatus === 'unlocked' || step.stepStatus === 'inProgress')) {
                return step;
            }
        }
        return null;
    };

    // Count available steps (unlocked or in progress)
    const getAvailableStepsCount = () => {
        if (!project?.portalSteps) return 0;

        return project.portalSteps.filter(step =>
            step.stepStatus === 'unlocked' || step.stepStatus === 'inProgress'
        ).length;
    };

    // Get first and last available step indices
    const getFirstLastAvailableSteps = () => {
        if (!project?.portalSteps) return { first: -1, last: -1 };

        const steps = [
            PortalStepID.WELCOME, PortalStepID.KEY_PEOPLE, PortalStepID.LOCATIONS,
            PortalStepID.GROUP_SHOTS, PortalStepID.PHOTO_REQUESTS, PortalStepID.TIMELINE,
            PortalStepID.THANK_YOU
        ];

        let first = -1;
        let last = -1;

        for (let i = 0; i < steps.length; i++) {
            const step = project.portalSteps.find(s => s.id === steps[i]);
            if (step && (step.stepStatus === 'unlocked' || step.stepStatus === 'inProgress')) {
                if (first === -1) first = i;
                last = i;
            }
        }

        return { first, last };
    };

    if (isLoading && !project) {
        return <div className="flex items-center justify-center min-h-screen">Loading your portal...</div>;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>Could not load project data. The link may be invalid or expired.</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!portalStarted) {
        return (
            <>                
                {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} onStartPlanning={handleStartPlanning} />}
                <LandingPageSection 
                    clientNames={`${project.personA.firstName} & ${project.personB.firstName}`}
                    onStartPlanning={handleStartPlanning}
                    onLaunchOnboarding={handleLaunchOnboarding}                    
                />
            </>
        );
    }

    return (
        <>
        {/* <ThemeToggle />         */}
        <div className="container mx-auto p-2 sm:p-4 min-h-screen flex flex-col">           
            
            <main className="my-2 sm:my-4 flex-grow">
                {renderCurrentStep()}
            </main>
            
            {currentStep !== PortalStepID.WELCOME && currentStep !== PortalStepID.THANK_YOU && (() => {
                const availableStepsCount = getAvailableStepsCount();
                const showNavigationButtons = availableStepsCount >= 2;
                const { first, last } = getFirstLastAvailableSteps();

                const steps = [
                    PortalStepID.WELCOME, PortalStepID.KEY_PEOPLE, PortalStepID.LOCATIONS,
                    PortalStepID.GROUP_SHOTS, PortalStepID.PHOTO_REQUESTS, PortalStepID.TIMELINE,
                    PortalStepID.THANK_YOU
                ];
                const currentIndex = steps.indexOf(currentStep);
                const isFirstAvailable = currentIndex === first;
                const isLastAvailable = currentIndex === last;

                return (
                    <footer className="mt-8 mx-auto max-w-4xl">
                        {/* Save Changes Button - Top Row */}
                        {/* <div className="flex justify-center mb-4">
                            <Button
                            size="sm"
                            className="w-full text-lg h-8 tracking-wide"
                            onClick={saveCurrentStep}
                            disabled={!isDirty || isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div> */}

                        {/* Navigation Buttons - Bottom Row */}
                        <div className="flex flex-row justify-center items-center gap-2">
                            {/* <Button variant="outline" size="sm" onClick={() => setStep(PortalStepID.WELCOME)} className="rounded-md">
                                <HomeIcon className="h-6 w-6" />
                            </Button> */}

                            {showNavigationButtons && (
                                <>
                                    {/* <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleStepChange('prev')}
                                        disabled={isFirstAvailable}
                                        className="flex-1 rounded-md sm:flex-none min-w-[120px]"
                                    >
                                        <ArrowLeftIcon className="h-4 w-4 mr-1" />
                                        Previous
                                    </Button> */}

                                    {/* <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleStepChange('next')}
                                        disabled={isLastAvailable}
                                        className="flex-1 rounded-md sm:flex-none min-w-[120px]"
                                    >
                                        Next
                                        <ArrowRightIcon className="h-4 w-4 ml-1" />
                                    </Button> */}
                                </>
                            )}
                        </div>
                    </footer>
                );
            })()}

            {currentStep === PortalStepID.WELCOME && (() => {
                const firstAvailableStep = getFirstAvailableStep();
                return firstAvailableStep ? (
                    <div className="my-4 px-2 text-center">
                        {/* <Button
                        size="sm"
                        className="w-full text-lg font-semibold tracking-wide"
                        onClick={() => setStep(firstAvailableStep.id)}
                        >
                            Proceed To {firstAvailableStep.stepTitle}
                            <ArrowRightIcon className="h-3 w-3 ml-2" />
                        </Button> */}
                    </div>
                ) : null;
            })()}
        </div>
        </>
    );
};

export default function PortalPage() {
    return (
        <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <PortalPageContent />
        </React.Suspense>
    );
}

