'use client';

import { SvgIcon } from '@/components/ui/Icon';
import { getLocationIconSrc } from '@/lib/iconMaps';
import { useAppThemeColors, useTypography } from '@/lib/useAppStyle';
import { LocationFull, LocationType } from '@/types';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface LocationsSectionProps {
  locations: LocationFull[];
  onAddLocation: (location: LocationFull) => void;
}

export const LocationsSection = ({ locations, onAddLocation }: LocationsSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const colors = useAppThemeColors();
  const t = useTypography();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const newLocation: LocationFull = {
      id: `location_${uuidv4()}`, // Use UUID for stable IDs
      locationName: formData.get('locationName') as string,
      locationType: formData.get('locationType') as LocationType,
      locationAddress1: formData.get('locationAddress1') as string,
    };

    onAddLocation(newLocation);
    setIsModalOpen(false);
  };

  return (
    <section aria-labelledby="locations-heading">
      <div className="text-center mb-6">
        <h2 id="locations-heading" style={t.titleLarge}>Wedding Locations</h2>
        <p className="max-w-2xl mx-auto" style={{ ...t.onSurfaceVariant.bodyMedium, marginTop: 8 }}>
          Add the key locations for your wedding day, like the ceremony venue, reception hall, and photo spots.
        </p>
        <Button onClick={() => setIsModalOpen(true)} className="mt-4">Add Location</Button>
      </div>

      <div className="space-y-4 max-w-3xl mx-auto">
        {locations && locations.length > 0 ? (
          locations.map(loc => (
            <div key={loc.id} className="rounded-lg shadow-md p-5" style={{ backgroundColor: colors.surface }}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <SvgIcon src={getLocationIconSrc(loc.locationType)} size={28} color={colors.primary} title={loc.locationType} />
                  <h3 style={t.titleMedium}>{loc.locationName}</h3>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ backgroundColor: colors.primaryContainer, color: colors.onPrimaryContainer }}>{loc.locationType}</span>
              </div>
              <p style={{ ...t.onSurfaceVariant.bodyMedium, marginTop: 4 }}>{loc.locationAddress1}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">No locations added yet.</p>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Location">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="locationName" className="block text-sm font-medium text-gray-700">Location Name</label>
            <input type="text" id="locationName" name="locationName" required placeholder="e.g., Manor House" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
          </div>
          <div className="mb-4">
            <label htmlFor="locationType" className="block text-sm font-medium text-gray-700">Location Type</label>
            <select id="locationType" name="locationType" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-select">
              {Object.values(LocationType).map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="locationAddress1" className="block text-sm font-medium text-gray-700">Address / Notes</label>
            <textarea id="locationAddress1" name="locationAddress1" rows={2} required placeholder="e.g., 123 Country Lane, Chepstow" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-textarea"></textarea>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Location</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
};