import React, { useState, useEffect } from 'react';
import { usePortalStore } from '../../store/usePortalStore';
import { ClientTimelineEvent, TimelineEventType, ActionOn } from '../../types/types';
import { useEntityManagement } from '../../lib/useEntityManagement';
import { AddEditModal } from '@/components/ui/AddEditModal';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, ListChecks, CheckCircle, Lock, Pencil, X } from 'lucide-react';
import { timestampToTimeString, timeStringToTimestamp } from '../../lib/utils'; 

const emptyEvent: Omit<ClientTimelineEvent, 'id' | 'startTime'> = {
    title: '',
    type: TimelineEventType.OTHER,
    duration: 30,
    clientNotes: '',
    locationId: '',
};

const EmptyState = () => (
    <div className="text-center py-12 px-6 bg-muted/50 rounded-lg border-2 border-dashed border-border">
        <ListChecks className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-serif text-foreground">No Timeline Events Yet</h3>
        <p className="mt-1 text-sm font-sans text-muted-foreground">Click the &quot;Add Event&quot; button to start building your day&apos;s schedule.</p>
    </div>
);


export const TimelineSection: React.FC = () => {
    const { timeline, updateTimeline } = usePortalStore();
    const [formState, setFormState] = useState(emptyEvent);
    const [startTimeString, setStartTimeString] = useState('');
    const [showActionRequired, setShowActionRequired] = useState(true);

    const isLocked = timeline?.config?.locked || timeline?.config?.finalized;
    const isFinalized = timeline?.config?.finalized;
    const actionOn = isLocked ? ActionOn.PHOTOGRAPHER : ActionOn.CLIENT;

    const {
        isModalOpen,
        editingEntity,
        openAddModal,
        openEditModal,
        closeModal,
        handleDelete,
        handleSave,
    } = useEntityManagement(timeline?.items || [], (newItems) => {
        if (timeline) {
            const sortedItems = newItems.sort((a, b) => (a.startTime?.seconds || 0) - (b.startTime?.seconds || 0));
            updateTimeline({ ...timeline, items: sortedItems });
        }
    });

    useEffect(() => {
        if (editingEntity) {
            setFormState(editingEntity);
            setStartTimeString(timestampToTimeString(editingEntity.startTime));
        } else {
            setFormState(emptyEvent);
            setStartTimeString('');
        }
    }, [editingEntity]);

    const handleSaveWithTimeConversion = () => {
        const eventData = {
            ...formState,
            startTime: timeStringToTimestamp(startTimeString)!,
        };
        handleSave(eventData);
    };

    if (!timeline) return <div>Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto px-2">
            {/* Header Section */}
            <div className="text-center mb-4">
                <h1 className="text-3xl md:text-4xl font-serif mb-4">
                    Timeline
                </h1>
                <p className="text-lg md:text-xl font-sans font-medium mb-4 max-w-lg mx-auto">
                    Outline the main events of your day.
                </p>
                {isFinalized && (
                    <Alert variant="success" className="max-w-3xl mx-auto mb-4">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>This section has been finalized.</AlertTitle>
                        <AlertDescription>
                            Please contact your photographer if further changes are required.
                        </AlertDescription>
                    </Alert>
                )}
                {isLocked && !isFinalized && actionOn === ActionOn.PHOTOGRAPHER && (
                    <Alert variant="warning" className="max-w-3xl mx-auto mb-4">
                        <Lock className="h-4 w-4" />
                        <AlertTitle>This section is locked for review.</AlertTitle>
                        <AlertDescription>
                            Your photographer is reviewing the details. Please contact them if changes are needed.
                        </AlertDescription>
                    </Alert>
                )}
                {actionOn === ActionOn.CLIENT && !isLocked && !isFinalized && showActionRequired && (
                    <Alert variant="default" className="max-w-3xl mx-auto mb-4 relative text-left py-2">
                        {/* <UserCheck className="h-4 w-4" /> */}
                        <AlertTitle>Action Required</AlertTitle>
                        <AlertDescription>Please add your timeline events.</AlertDescription>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 rounded-full"
                            onClick={() => setShowActionRequired(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </Alert>
                )}
            </div>

            <div className="flex justify-center mb-6">
                <Button onClick={openAddModal} disabled={isLocked} size="sm" className="w-full text-lg h-8 tracking-wide">
                    Add Event
                </Button>
            </div>

            {timeline.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {timeline.items.map((event) => (
                        <Card key={event.id} className="relative px-4 py-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-center font-serif text-2xl">{event.title}</CardTitle>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="default"
                                        size="icon"
                                        onClick={() => openEditModal(event)}
                                        disabled={isLocked}
                                        className="w-6 h-6 rounded-full"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleDelete(event.id)}
                                        disabled={isLocked}
                                        className="w-6 h-6 rounded-full"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="py-0 px-0">
                                <CardDescription className="font-sans text-lg font-medium">
                                    {timestampToTimeString(event.startTime)} - {event.type}
                                </CardDescription>
                            </CardContent>
                            <CardFooter className="justify-start px-0">
                                <p className="text-sm font-sans text-muted-foreground">
                                    Duration: {event.duration} minutes
                                </p>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState />
            )}

            <AddEditModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSave={handleSaveWithTimeConversion}
                entity={formState}
                title={editingEntity ? 'Edit Event' : 'Add New Event'}
                isLocked={isLocked || false}
            >
                <div className="space-y-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="title" className="font-sans text-xs text-muted-foreground">Event Title *</Label>
                        <Input id="title" value={formState.title} onChange={(e) => setFormState({ ...formState, title: e.target.value })} required placeholder="Wedding Ceremony" />
                    </div>
                    <div className="space-y-0.5">
                        <Label htmlFor="type" className="font-sans text-xs text-muted-foreground">Event Type *</Label>
                        <Select value={formState.type} onValueChange={(value) => setFormState({ ...formState, type: value as TimelineEventType })}>
                            <SelectTrigger className="w-full"><SelectValue/></SelectTrigger>
                            <SelectContent>{Object.values(TimelineEventType).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">                       
                        <div className="space-y-0.5">
                            <Label htmlFor="startTime" className="font-sans text-xs text-muted-foreground">Start Time *</Label>
                            <Input type="time" id="startTime" value={startTimeString} onChange={(e) => setStartTimeString(e.target.value)} required placeholder="10:00" />
                        </div>
                        <div className="space-y-0.5">
                            <Label htmlFor="duration" className="font-sans text-xs text-muted-foreground">Duration (5 mins) *</Label>
                            <Input type="number" id="duration" min="0" step="5" value={formState.duration} onChange={(e) => setFormState({ ...formState, duration: parseInt(e.target.value, 10) || 0 })} required placeholder="30" />
                        </div>
                    </div>
                    
                    <div className="space-y-0.5">
                        <Label htmlFor="clientNotes" className="font-sans text-xs text-muted-foreground">Notes</Label>
                        <Textarea id="clientNotes" value={formState.clientNotes || ''} onChange={(e) => setFormState({ ...formState, clientNotes: e.target.value })} placeholder="Bride's father is wearing a bow tie" />
                    </div>
                </div>
            </AddEditModal>
        </div>
    );
};

