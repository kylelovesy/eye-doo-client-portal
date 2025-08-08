'use client';

import { useAppThemeColors, useTypography } from '@/lib/useAppStyle';
import { PhotoRequest } from '@/types';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface PhotoRequestsSectionProps {
  requests: PhotoRequest[];
  onAddRequest: (request: PhotoRequest) => void;
}

export const PhotoRequestsSection = ({ requests, onAddRequest }: PhotoRequestsSectionProps) => {
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

    const newRequest: PhotoRequest = {
      id: `request_${uuidv4()}`, // Use UUID for stable IDs
      request: formData.get('requestDescription') as string,
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
          Have a specific photo idea from Pinterest or your imagination? Add it here. Please provide a description and a reference image if you have one.
        </p>
        <Button onClick={() => setIsModalOpen(true)} className="mt-4">Add Request</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests && requests.length > 0 ? (
          requests.map(req => (
            <div key={req.id} className="rounded-lg shadow-lg group" style={{ backgroundColor: colors.surface }}>
              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200">
                <img
                  src={req.imageUrl || `https://placehold.co/400x300/E9ECEF/1A1A1A?text=Request`}
                  alt={req.request}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <p className="p-4" style={t.bodyMedium}>{req.request}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center">No specific requests added yet.</p>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Photo Request">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="requestDescription" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea id="requestDescription" name="requestDescription" rows={3} required placeholder="e.g., A photo of us with our dog, a recreation of a photo from our first date." className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-textarea"></textarea>
          </div>
          <div className="mb-4">
            <label htmlFor="requestImage" className="block text-sm font-medium text-gray-700">Reference Image (Optional)</label>
            <input
              type="file"
              id="requestImage"
              name="requestImage"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#D0E4FF] file:text-[#001D36] hover:file:bg-[#b8d6fa]"
            />
          </div>
          {previewUrl && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700">Image Preview:</p>
              <img src={previewUrl} alt="Image preview" className="mt-2 rounded-md max-h-40 w-auto" />
            </div>
          )}
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Request</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
};