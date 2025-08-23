'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useAppThemeColors, useTypography } from '@/lib/useAppStyle';
import { ClientPhotoRequestItemFull, PhotoRequestConfig, PhotoRequestType } from '@/types';
import Image from 'next/image';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface PhotoRequestsSectionProps {
  config: PhotoRequestConfig;
  items: ClientPhotoRequestItemFull[];
  onAddRequest: (request: Omit<ClientPhotoRequestItemFull, 'id'>) => void;
  projectId: string; // Add projectId prop for storage path
}

export const PhotoRequestsSection = ({ config, items, onAddRequest, projectId }: PhotoRequestsSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const colors = useAppThemeColors(); // Commented out as unused
  const t = useTypography();

  // Check if section is locked or finalized
  const isSectionLocked = config.finalized || config.status === 'locked' || config.status === 'finalized';

  const handleImageUpload = async (file: File) => {
    const storage = getStorage();
    const storageRef = ref(storage, `photo_requests/${projectId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const newRequest: Omit<ClientPhotoRequestItemFull, 'id'> = {
      description: formData.get('description') as string,
      type: formData.get('type') as PhotoRequestType,
      priority: formData.get('priority') as 'Must Have' | 'Nice to Have',
      imageUrl: undefined, // Will be set after upload if file exists
    };

    // Handle file upload if image was selected
    const fileInput = event.currentTarget.elements.namedItem('requestImage') as HTMLInputElement;
    if (fileInput.files && fileInput.files[0]) {
      try {
        const imageUrl = await handleImageUpload(fileInput.files[0]);
        newRequest.imageUrl = imageUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        // Continue without image if upload fails
      }
    }

    onAddRequest(newRequest);
    setIsModalOpen(false);
  };

  return (
    <section aria-labelledby="requests-heading">
      <div className="text-center mb-6">
        <h2 id="requests-heading" style={t.titleLarge}>
          Specific Photo Requests
          {config.status === 'locked' && <span className="ml-2 text-sm font-normal text-orange-600">(Locked)</span>}
          {config.status === 'finalized' && <span className="ml-2 text-sm font-normal text-green-600">(Finalized)</span>}
        </h2>
        <p className="max-w-2xl mx-auto" style={{ ...t.onSurfaceVariant.bodyMedium, marginTop: 8 }}>
          Have a specific photo idea from Pinterest or your imagination? Add it here, and set a priority.
        </p>
        
        {isSectionLocked ? (
          <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg max-w-md mx-auto">
            <p className="font-semibold">
              {config.status === 'locked' ? 'This section has been locked by your photographer and can no longer be edited.' : 'This section has been finalized by your photographer and can no longer be edited.'}
            </p>
          </div>
        ) : (
          <Button onClick={() => setIsModalOpen(true)} className="mt-4">Add Request</Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items && items.length > 0 ? (
          items.map(req => (
            <div key={req.id} className="rounded-lg shadow-lg overflow-hidden bg-white">
              <div className="w-full h-48 bg-gray-200 relative">
                {req.imageUrl ? (
                  <Image 
                    src={req.imageUrl} 
                    alt={req.description}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-500 text-sm">No Image</span>
                  </div>
                )}
                <span className={`absolute top-2 right-2 text-xs font-bold text-white px-2 py-1 rounded-full ${req.priority === 'Must Have' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                  {req.priority}
                </span>
              </div>
              <div className="p-4">
                <p className="font-bold text-lg">{req.description}</p>
                <p className="text-sm text-gray-600 mt-1">{req.type}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center" style={t.onSurfaceVariant.bodyMedium}>
            No specific requests added yet.
          </p>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Photo Request">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea id="description" name="description" rows={3} required placeholder="e.g., A photo of us with our dog, a recreation of a photo from our first date." className="form-textarea"></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                <select id="type" name="type" required className="form-select">
                  {Object.values(PhotoRequestType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-2">Priority</legend>
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-2">
                    <input className="form-radio" type="radio" name="priority" value="Nice to Have" defaultChecked />
                    <span>Nice to Have</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input className="form-radio" type="radio" name="priority" value="Must Have" />
                    <span>Must Have</span>
                  </label>
                </div>
              </fieldset>
            </div>
            <div>
              <label htmlFor="requestImage" className="block text-sm font-medium text-gray-700">Reference Image (Optional)</label>
              <input type="file" id="requestImage" name="requestImage" accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#D0E4FF] file:text-[#001D36] hover:file:bg-[#b8d6fa]" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Request</Button>
            </div>
          </div>
        </form>
      </Modal>
    </section>
  );
};