import React, { useState, useEffect } from 'react';
import { usePortalStore } from '../../store/usePortalStore';
import { ClientKeyPerson, KeyPersonRole, KeyPersonInvolvement, ActionOn, PortalStepID } from '../../types/types';
import { useEntityManagement } from '../../lib/useEntityManagement';
import { AddEditModal } from '@/components/ui/AddEditModal';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Users, CheckCircle, Lock, Pencil, X } from 'lucide-react';

const emptyPerson: Omit<ClientKeyPerson, 'id'> = {
    fullName: '',
    role: KeyPersonRole.OTHER,
    notes: '',
    mustPhotograph: false,
    dontPhotograph: false,
    isVIP: false,
    canRallyPeople: false,
    involvement: KeyPersonInvolvement.NONE,
};

const EmptyState = () => (
    <div className="text-center py-12 px-6 bg-muted/50 rounded-lg border-2 border-dashed border-border">
        <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-serif text-foreground">No People Added Yet</h3>
        <p className="mt-1 text-sm font-sans text-muted-foreground">Click the &quot;Add Person&quot; button to get started.</p>
    </div>
);

export const KeyPeopleSection: React.FC = () => {
    const { keyPeople, updateKeyPeople, skipStep, isSaving, project } = usePortalStore();
    const [formState, setFormState] = useState(emptyPerson);
    const [showActionRequired, setShowActionRequired] = useState(true);

    const isLocked = keyPeople?.config?.locked || keyPeople?.config?.finalized;
    const isFinalized = keyPeople?.config?.finalized;
    const actionOn = isLocked ? ActionOn.PHOTOGRAPHER : ActionOn.CLIENT;

    // Check if this step can be skipped
    const currentStepData = project?.portalSteps.find(step => step.id === 'keyPeople');
    const canSkipStep = currentStepData?.requiredStep === false;

    const {
        isModalOpen,
        editingEntity,
        openAddModal,
        openEditModal,
        closeModal,
        handleDelete,
        handleSave,
    } = useEntityManagement(keyPeople?.items || [], (newItems) => {
        if (keyPeople) {
            updateKeyPeople({ ...keyPeople, items: newItems });
        }
    });

    useEffect(() => {
        if (editingEntity) {
            setFormState(editingEntity);
        } else {
            setFormState(emptyPerson);
        }
    }, [editingEntity]);

    if (!keyPeople) return <div>Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto px-2">
            {/* Header Section */}
            <div className="text-center mb-4">
                <h1 className="text-3xl md:text-4xl font-serif mb-4">
                    Key People
                </h1>
                <p className="text-lg md:text-xl font-sans font-medium mb-4 max-w-lg mx-auto">
                    Add the main wedding party and family members.
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
                {actionOn === ActionOn.CLIENT && !isLocked && !isFinalized && currentStepData?.requiredStep !== false && showActionRequired && (
                    <Alert variant="default" className="max-w-3xl mx-auto mb-4 relative text-left py-2">
                        {/* <UserCheck className="h-4 w-4" /> */}
                        <AlertTitle>Action Required</AlertTitle>
                        <AlertDescription>Please add your key people.</AlertDescription>
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

            <div className="flex flex-col md:flex-row justify-center gap-2 mb-4">
                <Button onClick={openAddModal} disabled={isLocked} size="sm" className="text-lg h-8 tracking-wide">
                    Add Person
                </Button>
                {canSkipStep && !isLocked && (
                    <Button
                        onClick={() => skipStep(PortalStepID.KEY_PEOPLE)}
                        disabled={isSaving}
                        variant="outline"
                        size="sm"
                        className="text-lg h-8 tracking-wide"
                    >
                        Skip Step
                    </Button>
                )}
            </div>

            {keyPeople.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {keyPeople.items.map((person) => (
                        <Card key={person.id} className="relative px-4 py-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-center font-serif text-2xl">{person.fullName}</CardTitle>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="default"
                                        size="icon"
                                        onClick={() => openEditModal(person)}
                                        disabled={isLocked}
                                        className="w-6 h-6 rounded-full"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleDelete(person.id)}
                                        disabled={isLocked}
                                        className="w-6 h-6 rounded-full"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="py-0 px-0">
                                <CardDescription className="font-sans text-lg font-medium">
                                    {person.role}
                                </CardDescription>
                            </CardContent>
                            <CardFooter className="justify-start px-0">
                                <div className="flex flex-col gap-1">
                                    {person.involvement !== KeyPersonInvolvement.NONE && (
                                        <p className="text-sm font-sans ">
                                            Involved in: {person.involvement}
                                        </p>
                                    )}
                                    {(person.isVIP || person.canRallyPeople || person.mustPhotograph || person.dontPhotograph) && (
                                        <div className="flex flex-wrap gap-2">
                                            {person.isVIP && (
                                                <span className="inline-flex items-center text-xs font-sans italic text-muted-foreground">
                                                    VIP
                                                </span>
                                            )}
                                            {person.canRallyPeople && (
                                                <span className="inline-flex items-center text-xs font-sans italic text-muted-foreground">
                                                    Can Rally
                                                </span>
                                            )}
                                            {person.mustPhotograph && (
                                                <span className="inline-flex items-center text-xs font-sans italic text-muted-foreground">
                                                    Must Photo
                                                </span>
                                            )}
                                            {person.dontPhotograph && (
                                                <span className="inline-flex items-center text-xs font-sans italic text-muted-foreground">
                                                    Don&apos;t Photo
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
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
                title={editingEntity ? 'Edit Person' : 'Add New Person'}
                isLocked={isLocked || false} 
            >
                <div className="space-y-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="fullName" className="font-sans text-xs text-muted-foreground">Full Name *</Label>
                        <Input id="fullName" value={formState.fullName} onChange={(e) => setFormState({ ...formState, fullName: e.target.value })} required placeholder="e.g., John Doe" />
                    </div>                       
                    <div className="space-y-0.5">
                        <Label htmlFor="role" className="font-sans text-xs text-muted-foreground">Role</Label>
                        <Select value={formState.role} onValueChange={(value) => setFormState({ ...formState, role: value as KeyPersonRole })}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(KeyPersonRole).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-0.5">
                        <Label htmlFor="involvedIn" className="font-sans text-xs text-muted-foreground">Involved In</Label>
                        <Select value={formState.involvement} onValueChange={(value) => setFormState({ ...formState, involvement: value as KeyPersonInvolvement })}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(KeyPersonInvolvement).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>                     
                    <div className="grid grid-cols-2 gap-1">
                        <div className="flex items-center text-left space-x-1">
                            <Checkbox id="isVIP" checked={formState.isVIP} onCheckedChange={(checked) => setFormState({...formState, isVIP: !!checked})}/>
                            <Label htmlFor="isVIP" className="font-sans text-muted-foreground">VIP</Label>
                        </div>
                        <div className="flex items-center text-left space-x-1">
                            <Checkbox id="canRallyPeople" checked={formState.canRallyPeople} onCheckedChange={(checked) => setFormState({...formState, canRallyPeople: !!checked})}/>
                            <Label htmlFor="canRallyPeople" className="font-sans text-muted-foreground">Can Rally People</Label>
                        </div>
                        <div className="flex items-center text-left space-x-1">
                            <Checkbox id="mustPhotograph" checked={formState.mustPhotograph} onCheckedChange={(checked) => setFormState({...formState, mustPhotograph: !!checked})}/>
                            <Label htmlFor="mustPhotograph" className="font-sans text-muted-foreground">Must Photograph</Label>
                        </div>
                        <div className="flex items-center text-left space-x-1">
                            <Checkbox id="dontPhotograph" checked={formState.dontPhotograph} onCheckedChange={(checked) => setFormState({...formState, dontPhotograph: !!checked})}/>
                            <Label htmlFor="dontPhotograph" className="font-sans text-muted-foreground">Don&apos;t Photograph</Label>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="notes" className="font-sans">Notes</Label>
                        <Textarea id="notes" value={formState.notes || ''} onChange={(e) => setFormState({ ...formState, notes: e.target.value })} />
                    </div>
                </div>
            </AddEditModal>

            {/* Saving Overlay */}
            {isSaving && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-lg font-medium">Skipping step...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

