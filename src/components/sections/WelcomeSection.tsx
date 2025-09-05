import React, { useState } from 'react';
import Image from 'next/image';
import { usePortalStore } from '@/store/usePortalStore';
import { SectionStatus, PortalStepID, ActionOn, PortalStep } from '@/types/types';

// Import ShadCN UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lock, Check, ChevronRight } from 'lucide-react';

// Progress Indicator Component using ShadCN Badge
const ProgressIndicator = ({ status }: { status: SectionStatus }) => {
  const getVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case SectionStatus.FINALIZED: return 'default';
      case SectionStatus.LOCKED: return 'secondary';
      case SectionStatus.IN_PROGRESS: return 'outline';
      default: return 'secondary';
    }
  };

  const getLabel = (status: SectionStatus) => {
    switch (status) {
      case SectionStatus.FINALIZED: return 'Complete';
      case SectionStatus.LOCKED: return 'Pending Review';
      case SectionStatus.IN_PROGRESS: return 'In Progress';
      default: return 'Not Started';
    }
  };

  return <Badge variant={getVariant()}>{getLabel(status)}</Badge>;
};

// Progress Summary Component
const ProgressSummary = ({ steps }: { steps: PortalStep[] }) => {
    const totalSteps = steps.length;
    const completedSteps = steps.filter(step => step.stepStatus === SectionStatus.FINALIZED).length;
    const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return (
        <Card className="mb-8 bg-muted/50 border-primary/20">
            <CardHeader className="text-center">
                <CardTitle className="font-serif">Planning Progress</CardTitle>
                <CardDescription className="font-sans">{completedSteps} of {totalSteps} sections completed</CardDescription>
            </CardHeader>
            <CardContent>
                <Progress value={progressPercentage} className="mb-4" />
                <div className="text-3xl font-bold text-primary text-center">{progressPercentage}%</div>
            </CardContent>
        </Card>
    );
};

export const WelcomeSection: React.FC = () => {
    const { project, setStep, keyPeople, locations, groupShots, photoRequests, timeline } = usePortalStore();
    const [completedStepDialog, setCompletedStepDialog] = useState<PortalStep | null>(null);
    const [lockedStepDialog, setLockedStepDialog] = useState<PortalStep | null>(null);

    if (!project) {
        return <div>Loading project details...</div>;
    }

    const planningSteps = project.portalSteps.filter(
        step => step.id !== PortalStepID.WELCOME && step.id !== PortalStepID.THANK_YOU
    );

    const getItemsCount = (stepId: PortalStepID): number => {
        switch (stepId) {
            case PortalStepID.KEY_PEOPLE:
                return keyPeople?.items?.length || 0;
            case PortalStepID.LOCATIONS:
                return locations?.items?.length || 0;
            case PortalStepID.GROUP_SHOTS:
                return groupShots?.items?.length || 0;
            case PortalStepID.PHOTO_REQUESTS:
                return photoRequests?.items?.length || 0;
            case PortalStepID.TIMELINE:
                return timeline?.items?.length || 0;
            default:
                return 0;
        }
    };

    const getItemName = (stepTitle: string, isPlural: boolean): string => {
        // Special case for Timeline
        if (stepTitle === 'Timeline') {
            return isPlural ? 'events' : 'event';
        }

        // Remove trailing 's' if present, then apply plural logic
        const baseName = stepTitle.endsWith('s') ? stepTitle.slice(0, -1) : stepTitle;
        return isPlural ? `${baseName}s` : baseName;
    };

    return (
        <div className="max-w-6xl mx-auto px-2">
            {/* Header Section */}
            <div className="text-center mb-4">
                <h1 className="text-3xl md:text-4xl font-serif mb-4">
                    Welcome, {project.personA.firstName} & {project.personB.firstName}!
                </h1>
                <p className="text-lg md:text-xl font-sans font-medium mb-4 max-w-lg mx-auto">
                    Let&apos;s start planning your perfect day. Select a section below to begin.
                </p>
                {project.portalMessage && project.portalMessage.length > 0 && (
                    <Alert className="mb-4 flex items-center justify-center pt-1 pb-2">
                        <AlertDescription className="text-center mx-auto italic font-sans text-lg font-medium font-error">
                            &quot;{project.portalMessage}&quot;
                        </AlertDescription>
                    </Alert>
                )}
            </div>

            {/* <ProgressSummary steps={planningSteps} /> */}

            {/* Planning Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {planningSteps.map(step => {
                    const isClickable = step.stepStatus !== SectionStatus.LOCKED || step.actionOn === ActionOn.CLIENT;
                    const isCompleted = step.stepStatus === SectionStatus.FINALIZED;

                    const handleCardClick = () => {
                        if (isCompleted) {
                            setCompletedStepDialog(step);
                        } else if (step.stepStatus === SectionStatus.LOCKED && step.actionOn === ActionOn.PHOTOGRAPHER) {
                            setLockedStepDialog(step);
                        } else if (isClickable) {
                            setStep(step.id);
                        }
                    };

                    return (
                        <button
                            key={step.id}
                            onClick={handleCardClick}
                            disabled={!isClickable && !isCompleted && !(step.stepStatus === SectionStatus.LOCKED && step.actionOn === ActionOn.PHOTOGRAPHER)}
                            className="w-full text-left rounded-lg transition-all duration-300 transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none"
                        >
                            <Card
                                className={`relative w-full h-full py-2 transition-all duration-300 ${isClickable ? 'hover:shadow-xl hover:-translate-y-1 hover:border-primary' : ''} ${!isClickable ? 'opacity-60' : ''}`}
                                style={
                                    isCompleted
                                        ? { borderColor: 'var(--success)' }
                                        : (step.stepStatus === SectionStatus.LOCKED && step.actionOn === ActionOn.PHOTOGRAPHER)
                                        ? { borderColor: 'var(--warning)' }
                                        : {}
                                }
                            >
                                <CardHeader className="relative px-4">
                                    {/* {!isCompleted && (
                                        <div className="absolute -top-4 -right-4">
                                            <ProgressIndicator status={step.stepStatus} />
                                        </div>
                                    )} */}
                                    <div className="flex items-center justify-between">                                        
                                        <CardTitle className="text-center font-serif text-2xl">{step.stepTitle}</CardTitle>
                                        <Image src={step.stepIcon || '/icons/generic.svg'} alt={`${step.stepTitle} icon`} width={48} height={48} />
                                    </div>                                    
                                </CardHeader>
                                <CardContent className="py-0">
                                    <CardDescription className="font-sans text-lg font-medium">
                                        {getItemsCount(step.id) === 0
                                            ? `Add ${step.stepTitle}`
                                            : `${getItemsCount(step.id)} ${getItemName(step.stepTitle, getItemsCount(step.id) !== 1)} added`
                                        }
                                    </CardDescription>
                                </CardContent>
                                <CardFooter className="justify-start px-4 pt-1">
                                    {isCompleted ? (
                                        <span className="font-sans font-medium text-success text-lg text-center">
                                            Section completed
                                        </span>
                                    ) : (
                                        <span className={`font-sans font-medium text-lg text-center ${step.actionOn === ActionOn.CLIENT ? 'text-primary' : 'text-warning'}`}>
                                            Awaiting {step.actionOn === ActionOn.CLIENT ? 'Your Input' : 'Photographer'}
                                        </span>
                                    )}
                                </CardFooter>
                                {/* Status Icon */}
                                <div className="absolute bottom-2 right-2">
                                    {isCompleted ? (
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--success)' }}>
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    ) : step.stepStatus === SectionStatus.LOCKED ? (
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--warning)' }}>
                                            <Lock className="w-4 h-4 text-white" />
                                        </div>
                                    ) : (step.stepStatus === SectionStatus.UNLOCKED || step.stepStatus === SectionStatus.IN_PROGRESS) ? (
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
                                            <ChevronRight className="w-4 h-4 text-white" />
                                        </div>
                                    ) : null}
                                </div>
                                {step.stepStatus === SectionStatus.LOCKED && step.actionOn === ActionOn.CLIENT && (
                                    <div className="absolute inset-0 bg-white bg-opacity-80 rounded-xl flex items-center justify-center">
                                        <div className="text-center">
                                            <Lock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                            <p className="text-sm font-medium text-muted-foreground">Awaiting Your Input</p>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </button>
                    );
                })}
            </div>

            {/* Completion Dialog */}
            <Dialog open={!!completedStepDialog} onOpenChange={() => setCompletedStepDialog(null)}>
                <DialogContent className="w-[90vw] max-w-md text-center">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif">Section Completed</DialogTitle>
                        <DialogDescription className="min-h-[80px] font-sans text-md mt-2 tracking-wide">
                            {completedStepDialog?.stepTitle} section has been completed. Please contact {project.photographerName} to make further changes.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col items-center px-2">
                        <Button
                            onClick={() => setCompletedStepDialog(null)}
                            size="sm"
                            className="w-full text-lg h-8 tracking-wide"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Locked Dialog */}
            <Dialog open={!!lockedStepDialog} onOpenChange={() => setLockedStepDialog(null)}>
                <DialogContent className="w-[90vw] max-w-md text-center">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif">Awaiting Review</DialogTitle>
                        <DialogDescription className="min-h-[80px] font-sans text-md mt-2 tracking-wide">
                            {lockedStepDialog?.stepTitle} section is awaiting review. Please contact {project.photographerName} if you have any questions.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col items-center px-2">
                        <Button
                            onClick={() => setLockedStepDialog(null)}
                            size="sm"
                            className="w-full text-lg h-8 tracking-wide"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};