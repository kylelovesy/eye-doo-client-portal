import React, { useState, useEffect } from 'react';
import { usePortalStore } from '@/store/usePortalStore';
import { ClientLocation, LocationType, ActionOn } from '@/types/types';
import { useEntityManagement } from '@/lib/useEntityManagement';
import { AddEditModal } from '@/components/ui/AddEditModal';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, MapPin, Pencil, CheckCircle, Lock, X } from 'lucide-react';
import { timestampToTimeString, timeStringToTimestamp } from '@/lib/utils';

/**
 * LocationsSection Component
 *
 * Uses the new combined portal activity functions:
 * - updateClientPortalActivity: Handles all client-side portal interactions
 * - logPortalActivity: Tracks user behavior for analytics
 *
 * Benefits: Reduced function calls, better performance, centralized logging
 */ 

const emptyLocation: Omit<ClientLocation, 'id'> = {
    locationName: '',
    locationType: LocationType.MAIN_VENUE,
    locationAddress1: '',
    locationPostcode: '',
    locationNotes: '',
    arriveTime: null,
    leaveTime: null,
    nextLocationTravelTimeEstimate: 0,
    nextLocationTravelArrangements: '',
};

const EmptyState = () => (
    <div className="text-center py-12 px-6 bg-muted/50 rounded-lg border-2 border-dashed border-border">
        <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-serif text-foreground">No Locations Added Yet</h3>
        <p className="mt-1 text-sm font-sans text-muted-foreground">Click the &quot;Add Location&quot; button to get started.</p>
    </div>
);

export const LocationsSection: React.FC = () => {
    const {
        locations,
        updateLocations,
        project,
        isSaving,
        showSaveConfirmation,
        logAnalyticsEvent // New: Analytics logging function
    } = usePortalStore();
    const [formState, setFormState] = useState(emptyLocation);
    const [showActionRequired, setShowActionRequired] = useState(true);

    const isLocked = locations?.config?.locked || locations?.config?.finalized;
    const isFinalized = locations?.config?.finalized;
    const actionOn = isLocked ? ActionOn.PHOTOGRAPHER : ActionOn.CLIENT;
    
    const {
        isModalOpen,
        editingEntity,
        openAddModal,
        openEditModal,
        closeModal,
        handleDelete,
        handleSave,
    } = useEntityManagement(locations?.items ?? [], (newItems) => {
        if (locations) {
            updateLocations({ ...locations, items: newItems });
        }
    });

    const isMultiLocation = locations?.config?.multipleLocations ?? false;

    useEffect(() => {
        if (editingEntity) {
            setFormState({
                ...editingEntity,
                nextLocationTravelTimeEstimate: editingEntity.nextLocationTravelTimeEstimate || 0,
                nextLocationTravelArrangements: editingEntity.nextLocationTravelArrangements || '',
            });

            // Analytics: Track location editing
            logAnalyticsEvent('location_edited', {
                locationId: editingEntity.id,
                locationType: editingEntity.locationType,
                locationName: editingEntity.locationName
            });
        } else {
            setFormState(emptyLocation);
        }
    }, [editingEntity, logAnalyticsEvent]);

    // Analytics: Track component view
    useEffect(() => {
        logAnalyticsEvent('locations_section_viewed', {
            totalLocations: locations?.items?.length || 0,
            isMultiLocation,
            isLocked,
            isFinalized
        });
    }, [logAnalyticsEvent, locations?.items?.length, isMultiLocation, isLocked, isFinalized]);

    if (!locations) return <div>Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto px-2">
            {/* Header Section */}
            <div className="text-center mb-4">
                <h1 className="text-3xl md:text-4xl font-serif mb-4">
                    Locations
                </h1>
                <p className="text-lg md:text-xl font-sans font-medium mb-4 max-w-lg mx-auto">
                    Add the key locations for your wedding day.
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
                    <Alert variant="default" className="max-w-3xl mx-auto mb-4 text-left relative py-2">
                        {/* <UserCheck className="h-4 w-4" /> */}
                        <AlertTitle>Action Required</AlertTitle>
                        <AlertDescription>Please add your locations.</AlertDescription>
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
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="multipleLocations"
                            checked={isMultiLocation}
                            onCheckedChange={(checked) => updateLocations({ ...locations, config: { ...locations.config, multipleLocations: !!checked }})}
                            disabled={isLocked}
                        />
                        <Label htmlFor="multipleLocations" className="font-sans">Multiple locations</Label>
                    </div>
                    <Button
                        onClick={openAddModal}
                        disabled={isLocked || (!isMultiLocation && (locations?.items ?? []).length >= 1)}
                        size="sm"
                        className="text-lg h-8 tracking-wide"
                    >
                        {!isMultiLocation && (locations?.items ?? []).length >= 1 ? 'Location Added' : 'Add Location'}
                    </Button>
                </div>
            </div>

            {(locations.items ?? []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(locations.items ?? []).map((location) => (
                        <Card key={location.id} className="relative px-4 py-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-center font-serif text-2xl">{location.locationName}</CardTitle>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="default"
                                        size="icon"
                                        onClick={() => openEditModal(location)}
                                        disabled={isLocked}
                                        className="w-6 h-6 rounded-full"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleDelete(location.id)}
                                        disabled={isLocked}
                                        className="w-6 h-6 rounded-full"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="py-0 px-0">
                                <CardDescription className="font-sans text-lg font-medium">
                                    {location.locationType}
                                </CardDescription>
                            </CardContent>
                            <CardFooter className="justify-start px-0">
                                {location.locationAddress1 && (
                                    <p className="text-sm font-sans text-muted-foreground">
                                        {location.locationAddress1}
                                    </p>
                                )}
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
                onSave={() => handleSave(formState)}
                entity={formState}
                title={editingEntity ? 'Edit Location' : 'Add New Location'}
                isLocked={isLocked || false}
                description="Provide the location details including name, address, and type for your wedding day."
            >
                <div className="space-y-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="locationType" className="font-sans text-xs text-muted-foreground">Location Type *</Label>
                        <Select value={formState.locationType} onValueChange={(value) => setFormState({ ...formState, locationType: value as LocationType })}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(LocationType).map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-0.5">
                        <Label htmlFor="locationName" className="font-sans text-xs text-muted-foreground">Location Name *</Label>
                        <Input id="locationName" value={formState.locationName} onChange={(e) => setFormState({ ...formState, locationName: e.target.value })} required placeholder="Wedding Venue" />
                    </div>                        
                    <div className="space-y-0.5">
                        <Label htmlFor="locationAddress1" className="font-sans text-xs text-muted-foreground">Address *</Label>
                        <Input id="locationAddress1" value={formState.locationAddress1} onChange={(e) => setFormState({ ...formState, locationAddress1: e.target.value })} required placeholder="123 Main Street" />
                    </div>
                    <div className="space-y-0.5">
                        <Label htmlFor="locationPostcode" className="font-sans text-xs text-muted-foreground">Postcode *</Label>
                        <Input id="locationPostcode" value={formState.locationPostcode} onChange={(e) => setFormState({ ...formState, locationPostcode: e.target.value })} required placeholder="SW1A 1AA" />
                    </div>

                    {isMultiLocation && (
                        <>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-0.5">
                                    <Label htmlFor="arriveTime" className="font-sans text-xs text-muted-foreground">Arrive Time *</Label>
                                    <Input type="time" id="arriveTime" value={timestampToTimeString(formState.arriveTime)} onChange={(e) => setFormState({ ...formState, arriveTime: timeStringToTimestamp(e.target.value) })} />
                                </div>
                                <div className="space-y-0.5">
                                    <Label htmlFor="leaveTime" className="font-sans text-xs text-muted-foreground">Leave Time *</Label>
                                    <Input type="time" id="leaveTime" value={timestampToTimeString(formState.leaveTime)} onChange={(e) => setFormState({ ...formState, leaveTime: timeStringToTimestamp(e.target.value) })} />
                                </div>
                                <div className="space-y-0.5">
                                    <Label htmlFor="nextLocationTravelTimeEstimate" className="font-sans text-xs text-muted-foreground">Travel Time</Label>
                                    <Input type="number" id="nextLocationTravelTimeEstimate" value={formState.nextLocationTravelTimeEstimate} onChange={(e) => setFormState({ ...formState, nextLocationTravelTimeEstimate: parseInt(e.target.value, 10) || 0 })} placeholder="e.g., 30" />
                                </div>
                            </div>
                            
                            <div className="space-y-0.5">
                                <Label htmlFor="nextLocationTravelArrangements" className="font-sans text-xs text-muted-foreground">Travel Arrangements</Label>
                                <Textarea id="nextLocationTravelArrangements" value={formState.nextLocationTravelArrangements} onChange={(e) => setFormState({ ...formState, nextLocationTravelArrangements: e.target.value })} placeholder="Walking distance" />
                            </div>
                        </>
                    )}

                    {/* <div className="space-y-0.5">
                        <Label htmlFor="locationNotes" className="font-sans text-xs text-muted-foreground">Notes</Label>
                        <Textarea id="locationNotes" value={formState.locationNotes || ''} onChange={(e) => setFormState({ ...formState, locationNotes: e.target.value })} placeholder="e.g., Parking instructions" />
                    </div> */}
                </div>
            </AddEditModal>

            {/* Enhanced Saving Overlay */}
            {isSaving && showSaveConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm mx-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-lg font-medium">Completing section...</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Locking Locations and sending to {project?.photographerName || 'photographer'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

