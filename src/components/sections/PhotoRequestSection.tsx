import React, { useState, useEffect } from 'react';
import { usePortalStore } from '../../store/usePortalStore';
import { ClientPhotoRequest, PhotoRequestType, PhotoRequestPriority, ActionOn } from '../../types/types';
import { useEntityManagement } from '../../lib/useEntityManagement';
import { AddEditModal } from '@/components/ui/AddEditModal';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from '../../lib/firebase';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Trash2, Camera, Pencil, CheckCircle, Lock, X } from 'lucide-react';

const storage = getStorage(app);

const emptyRequest: Omit<ClientPhotoRequest, 'id'> = {
    title: '',
    description: '',
    priority: PhotoRequestPriority.MEDIUM,
    type: PhotoRequestType.OTHER,
    notes: '',
    imageUrl: '',
};

const EmptyState = () => (
    <div className="text-center py-12 px-6 bg-muted/50 rounded-lg border-2 border-dashed border-border">
        <Camera className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-serif text-foreground">No Special Requests Yet</h3>
        <p className="mt-1 text-sm font-sans text-muted-foreground">Click the &quot;Add Request&quot; button to add a special photo request.</p>
    </div>
);

export const PhotoRequestsSection: React.FC = () => {
    const { photoRequests, updatePhotoRequests, projectId } = usePortalStore();
    const [formState, setFormState] = useState(emptyRequest);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [showActionRequired, setShowActionRequired] = useState(true);

    const isLocked = photoRequests?.config?.locked || photoRequests?.config?.finalized;
    const isFinalized = photoRequests?.config?.finalized;
    const actionOn = isLocked ? ActionOn.PHOTOGRAPHER : ActionOn.CLIENT;

    const {
        isModalOpen,
        editingEntity,
        openAddModal,
        openEditModal,
        closeModal,
        handleDelete,
        handleSave,
    } = useEntityManagement(photoRequests?.items || [], (newItems) => {
        if (photoRequests) {
            updatePhotoRequests({ ...photoRequests, items: newItems });
        }
    });

    useEffect(() => {
        if (editingEntity) {
            setFormState(editingEntity);
        } else {
            setFormState(emptyRequest);
        }
        setSelectedFile(null);
        setUploadProgress(null);
    }, [editingEntity, isModalOpen]);

    const handleSubmitWithUpload = async () => {
        if (!projectId) return;
        
        let imageUrl = editingEntity?.imageUrl || '';

        if (selectedFile) {
            const storageRef = ref(storage, `projects/${projectId}/photo_requests/${Date.now()}_${selectedFile.name}`);
            const uploadTask = uploadBytesResumable(storageRef, selectedFile);

            await new Promise<void>((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                    (error) => { console.error("Upload failed:", error); reject(error); },
                    async () => {
                        imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve();
                    }
                );
            });
        }
        
        handleSave({ ...formState, imageUrl });
    };

    const hasReachedLimit = photoRequests ? photoRequests.items.length >= 5 : false;

    if (!photoRequests) return <div>Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto px-2">
            {/* Header Section */}
            <div className="text-center mb-4">
                <h1 className="text-3xl md:text-4xl font-serif mb-4">
                    Special Photo Requests
                </h1>
                <p className="text-lg md:text-xl font-sans font-medium mb-4 max-w-lg mx-auto">
                    Add any specific, must-have photo ideas. You can add up to 5 requests.
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
                        <AlertDescription>Please add your photo requests.</AlertDescription>
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
                <Button onClick={openAddModal} disabled={hasReachedLimit || isLocked} size="sm" variant="default" className="w-full text-lg h-8 tracking-wide">
                    {hasReachedLimit ? 'Request Limit Reached' : 'Add Request'}
                </Button>
            </div>

            {photoRequests.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {photoRequests.items.map(req => (
                        <Card key={req.id} className="relative px-4 py-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-center font-serif text-2xl">{req.title}</CardTitle>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="default"
                                        size="icon"
                                        onClick={() => openEditModal(req)}
                                        disabled={isLocked}
                                        className="w-6 h-6 rounded-full"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleDelete(req.id)}
                                        disabled={isLocked}
                                        className="w-6 h-6 rounded-full"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="py-0 px-0">
                                <CardDescription className="font-sans text-lg font-medium">
                                    {req.type} - {req.priority}
                                </CardDescription>
                            </CardContent>
                            <CardFooter className="justify-start px-0">
                                {req.description && (
                                    <p className="text-sm font-sans text-muted-foreground line-clamp-2">
                                        {req.description}
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
                onSave={handleSubmitWithUpload}
                entity={formState}
                title={editingEntity ? 'Edit Request' : 'Add New Request'}
                isLocked={isLocked || false}
            >
                <div className="space-y-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="title" className="font-sans text-xs text-muted-foreground">Title *</Label>
                        <Input id="title" value={formState.title} onChange={(e) => setFormState({ ...formState, title: e.target.value })} required placeholder="Groom & dog" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                            <Label htmlFor="type" className="font-sans text-xs text-muted-foreground">Type</Label>
                            <Select value={formState.type} onValueChange={(value) => setFormState({ ...formState, type: value as PhotoRequestType })}>
                                <SelectTrigger className="w-full"><SelectValue/></SelectTrigger>
                                <SelectContent>{Object.values(PhotoRequestType).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-0.5">
                            <Label htmlFor="priority" className="font-sans text-xs text-muted-foreground">Priority *</Label>
                            <Select value={formState.priority} onValueChange={(value) => setFormState({ ...formState, priority: value as PhotoRequestPriority })}>
                                <SelectTrigger className="w-full"><SelectValue/></SelectTrigger>
                                <SelectContent>{Object.values(PhotoRequestPriority).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <Label htmlFor="description" className="font-sans text-xs text-muted-foreground">Description *</Label>
                        <Textarea id="description" value={formState.description || ''} onChange={(e) => setFormState({ ...formState, description: e.target.value })} placeholder="Groom kissing brides dog" />
                    </div>
                    <div className="space-y-0.5">
                        <Label htmlFor="imageUpload" className="font-sans text-xs text-muted-foreground">Reference Image</Label>
                        <Input id="imageUpload" type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
                        {uploadProgress !== null && <Progress value={uploadProgress} className="mt-2" />}
                    </div>
                    {/* <div>
                        <Label htmlFor="notes" className="font-sans">Notes</Label>
                        <Textarea id="notes" value={formState.notes || ''} onChange={(e) => setFormState({ ...formState, notes: e.target.value })} />
                    </div> */}
                </div>
            </AddEditModal>
        </div>
    );
};

