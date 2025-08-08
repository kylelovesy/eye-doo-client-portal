'use client';

import { useAppThemeColors, useTypography } from '@/lib/useAppStyle';
import { PersonWithRole, RelationshipToCouple } from '@/types';
import Image from 'next/image';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface KeyPeopleSectionProps {
  people: PersonWithRole[];
  onAddPerson: (person: PersonWithRole) => void;
}

export const KeyPeopleSection = ({ people, onAddPerson }: KeyPeopleSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const colors = useAppThemeColors();
  const t = useTypography();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const newPerson: PersonWithRole = {
      id: `person_${uuidv4()}`, // Use UUID for stable IDs
      fullName: formData.get('fullName') as string,
      role: formData.get('role') as string,
      relationship: formData.get('relationship') as RelationshipToCouple,
      notes: formData.get('notes') as string,
    };

    onAddPerson(newPerson);
    setIsModalOpen(false);
  };

  return (
    <section aria-labelledby="key-people-heading">
      <div className="text-center mb-6">
        <h2 id="key-people-heading" style={t.titleLarge}>The Wedding Party & Family</h2>
        <p className="max-w-2xl mx-auto" style={{ ...t.onSurfaceVariant.bodyMedium, marginTop: 8 }}>
          Please add the key members of your wedding party and immediate family. This helps your photographer identify everyone on the big day!
        </p>
        <Button onClick={() => setIsModalOpen(true)} className="mt-4">Add Person</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {people && people.length > 0 ? (
          people.map(person => (
            <div key={person.id} className="rounded-lg shadow-lg p-5 text-center" style={{ backgroundColor: colors.surface }}>
              <Image
                src={`https://placehold.co/400x400/E9ECEF/1A1A1A?text=${person.fullName.charAt(0)}`}
                alt=""
                className="rounded-full mx-auto mb-4 object-cover"
                width={96}
                height={96}
              />
              <h3 style={t.titleMedium}>{person.fullName}</h3>
              <p style={{ ...t.primary.bodyLarge, fontWeight: 600 }}>{person.role}</p>
              <p style={t.onSurfaceVariant.bodySmall}>{person.relationship}</p>
              {person.notes && (
                <p className="mt-2 p-2 rounded-md" style={{ ...t.onSurfaceVariant.bodySmall, backgroundColor: colors.surfaceVariant }}>“{person.notes}”</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center">No people added yet.</p>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Key Person">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" id="fullName" name="fullName" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
          </div>
          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
            <input type="text" id="role" name="role" required placeholder="e.g., Father of the Bride" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
          </div>
          <div className="mb-4">
            <label htmlFor="relationship" className="block text-sm font-medium text-gray-700">Relationship to Couple</label>
            <select id="relationship" name="relationship" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-select">
              {Object.values(RelationshipToCouple).map(rel => <option key={rel} value={rel}>{rel}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes for Photographer</label>
            <textarea id="notes" name="notes" rows={2} placeholder="e.g., Likes to be called Johnny" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-textarea"></textarea>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Person</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
};