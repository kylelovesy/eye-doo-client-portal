'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useAppThemeColors, useTypography } from '@/lib/useAppStyle';
import { ClientPhotoRequestItemFull, PhotoRequestConfig, PhotoRequestType } from '@/types';
import Image from 'next/image';

interface PhotoRequestsSectionProps {
  config: PhotoRequestConfig;
  items: ClientPhotoRequestItemFull[];
  onAddRequest: (request: Omit<ClientPhotoRequestItemFull, 'id'>) => void;
}

export const PhotoRequestsSection = ({ config, items, onAddRequest }: PhotoRequestsSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const colors = useAppThemeColors();
  const t = useTypography();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const newRequest: Omit<ClientPhotoRequestItemFull, 'id'> = {
      description: formData.get('description') as string,
      type: formData.get('type') as PhotoRequestType,
      priority: formData.get('priority') as 'Must Have' | 'Nice to Have',
      imageUrl: previewUrl || undefined,
    };

    onAddRequest(newRequest);
    setIsModalOpen(false);
    setPreviewUrl(null);
  };

  return (
    <section aria-labelledby="requests-heading">
      <div className="text-center mb-6">
        <h2 id="requests-heading" style={t.titleLarge}>Specific Photo Requests</h2>
        <p className="max-w-2xl mx-auto" style={{ ...t.onSurfaceVariant.bodyMedium, marginTop: 8 }}>
          Have a specific photo idea from Pinterest or your imagination? Add it here, and set a priority.
        </p>
        
        {config.finalized ? (
          <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg max-w-md mx-auto">
            <p className="font-semibold">This section has been finalized by your photographer and can no longer be edited.</p>
          </div>
        ) : (
          <Button onClick={() => setIsModalOpen(true)} className="mt-4">Add Request</Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items && items.length > 0 ? (
          items.map(req => (
            <div key={req.id} className="rounded-md shadow-lg group" style={{ backgroundColor: colors.surface }}>
              <div className="w-full overflow-hidden rounded-t-md bg-gray-200 relative" style={{ aspectRatio: '4 / 3' }}>
                <Image 
                  src={req.imageUrl || `https://placehold.co/400x300/E9ECEF/1A1A1A?text=Request`} 
                  alt={req.description}
                  className="w-full h-full object-cover object-center"
                />
                <span className={`absolute top-2 right-2 text-xs font-bold text-white px-2 py-1 rounded-full ${req.priority === 'Must Have' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                  {req.priority}
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold" style={{ color: colors.primary }}>{req.type}</p>
                <p style={{ ...t.onSurfaceVariant.bodyMedium, marginTop: 4 }}>{req.description}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center" style={t.onSurfaceVariant.bodyMedium}>No specific requests added yet.</p>
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
              <input type="file" id="requestImage" name="requestImage" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#D0E4FF] file:text-[#001D36] hover:file:bg-[#b8d6fa]" />
            </div>
            {previewUrl && (
              <div>
                <p className="text-sm font-medium text-gray-700">Image Preview:</p>
                <Image src={previewUrl} alt="Image preview" className="mt-2 rounded-md max-h-40 w-auto" />
              </div>
            )}
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