import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image'; // Import next/image
import { usePortalStore } from '@/store/usePortalStore';
import { ClientGroupShotItem, ActionOn } from '@/types/types';
import { useEntityManagement } from '@/lib/useEntityManagement';
import { AddEditModal } from '@/components/ui/AddEditModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, Clock, CheckCircle, Lock, X } from 'lucide-react';

const emptyCustomShot: Omit<ClientGroupShotItem, 'id' | 'isPredefined' | 'checked' | 'time'> = {
    name: '',
    categoryId: 'group_shot_cat_user', // Set to the custom category ID
    notes: '',
};

export const GroupShotsSection: React.FC = () => {
    const { groupShots, updateGroupShots } = usePortalStore();
    const [formState, setFormState] = useState(emptyCustomShot);
    const [showActionRequired, setShowActionRequired] = useState(true);

    const isLocked = groupShots?.config?.locked || groupShots?.config?.finalized;
    const isFinalized = groupShots?.config?.finalized;
    const actionOn = isLocked ? ActionOn.PHOTOGRAPHER : ActionOn.CLIENT;

    const {
        isModalOpen,
        openAddModal,
        closeModal,
        handleDelete,
        handleSave,
    } = useEntityManagement(groupShots?.items || [], (newItems) => {
        if (groupShots) {
            const newTotalTime = newItems.reduce((sum, item) => item.checked ? sum + item.time : sum, 0);
            updateGroupShots({
                ...groupShots,
                items: newItems,
                config: { ...groupShots.config, totalTimeEstimated: newTotalTime },
            });
        }
    });
    
    useEffect(() => {
        if (!formState.categoryId) {
            setFormState(prev => ({...prev, categoryId: 'group_shot_cat_user'}));
        }
    }, [formState.categoryId]);

    const totalTime = useMemo(() => {
        if (!groupShots?.items) return 0;
        return groupShots.items.reduce((sum, item) => item.checked ? sum + item.time : sum, 0);
    }, [groupShots?.items]);

    const groupedShots = useMemo(() => {
        if (!groupShots?.items) return {};
        return groupShots.items.reduce((acc, item) => {
            (acc[item.categoryId] = acc[item.categoryId] || []).push(item);
            return acc;
        }, {} as Record<string, ClientGroupShotItem[]>);
    }, [groupShots?.items]);

    const categoriesWithItems = useMemo(() => {
        if (!groupShots?.categories || !groupShots?.items) return [];
        return groupShots.categories.filter(category => groupShots.items.some(item => item.categoryId === category.id));
    }, [groupShots?.categories, groupShots?.items]);

    const handleToggleWants = (itemId: string) => {
        if (!groupShots) return;
        const updatedItems = groupShots.items.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
        );
        const newTotalTime = updatedItems.reduce((sum, item) => item.checked ? sum + item.time : sum, 0);
        updateGroupShots({
            ...groupShots,
            items: updatedItems,
            config: { ...groupShots.config, totalTimeEstimated: newTotalTime },
        });
    };
    
    const handleSaveCustomShot = () => {
        const newShotData = {
            ...formState,
            isPredefined: false,
            checked: true,
            time: 5, 
        };
        handleSave(newShotData);
        setFormState(emptyCustomShot);
    };

    if (!groupShots) return <div>Loading group shots...</div>;

    return (
        <div className="max-w-6xl mx-auto px-2">
            {/* Header Section */}
            <div className="text-center mb-4">
                <h1 className="text-3xl md:text-4xl font-serif mb-4">
                    Group Photos
                </h1>
                <p className="text-lg md:text-xl font-sans font-medium mb-4 max-w-lg mx-auto">
                    Select the formal group photos you would like, and add any custom ones.
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
                        <AlertDescription>Please select your group photos.</AlertDescription>
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

            <Alert className="mb-4 flex items-center justify-center pt-1 pb-2">
                <Clock className="h-4 w-4 mr-2" />
                <AlertTitle className="flex items-center pt-1">Estimated Time: <span className="font-bold ml-1">{totalTime} minutes</span></AlertTitle>
            </Alert>

            <Accordion type="single" collapsible className="w-full px-2">
                {categoriesWithItems.map(category => (
                    <AccordionItem key={category.id} value={category.id}>
                        <AccordionTrigger>
                            <div className="flex items-center space-x-3">
                                {category.iconName && <Image src={`/icons/${category.iconName}.svg`} alt="" width={32} height={32} />}
                                <span className="fonts-sans text-lg">{category.displayName}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4">
                                {(groupedShots[category.id] || []).map(item => (
                                    <div key={item.id} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 space-y-1">
                                            <Checkbox 
                                                id={`shot-${item.id}`} 
                                                checked={item.checked} 
                                                onCheckedChange={() => handleToggleWants(item.id)} 
                                                disabled={isLocked}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <label htmlFor={`shot-${item.id}`} className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                    {item.name} ({item.time} mins)
                                                </label>
                                                {/* {item.notes && (
                                                    <p className="text-sm text-muted-foreground italic">&ldquo;{item.notes}&rdquo;</p>
                                                )} */}
                                            </div>
                                        </div>
                                        {!item.isPredefined && (
                                            <Button 
                                                variant="destructive" 
                                                size="icon" 
                                                onClick={() => handleDelete(item.id)}
                                                disabled={isLocked}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            <div className="mt-8 flex justify-center">
                <Button onClick={openAddModal} disabled={isLocked} size="sm" className="w-full text-lg h-8 tracking-wide">
                    Request Custom Shot
                </Button>
            </div>

            <AddEditModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSave={handleSaveCustomShot}
                entity={formState}
                title="Request Group Shot"
                isLocked={isLocked || false}
            >
                <div className="space-y-0.5">
                    <Label htmlFor="customShotName" className="font-sans text-xs text-muted-foreground">Title *</Label>
                    <Input id="customShotName" value={formState.name} onChange={(e) => setFormState({...formState, name: e.target.value})} placeholder="e.g., Bride with University Friends" required />
                </div>
                <div className="space-y-0.5">
                    <Label htmlFor="customShotNotes" className="font-sans text-xs text-muted-foreground">Description</Label>
                    <Textarea
                        id="customShotNotes"
                        value={formState.notes || ''}
                        onChange={(e) => setFormState({...formState, notes: e.target.value})}
                        placeholder="Any additional details about this group shot..."
                    />
                </div>
            </AddEditModal>
        </div>
    );
};
