'use client';

import React, { useState, useCallback } from 'react';
import { useAppThemeColors, useTypography } from '@/lib/useAppStyle'; // Added from previous code
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ClientKeyPersonFull, KeyPeopleConfig, KeyPersonRole, KeyPersonActions } from '@/types';

// Debounce utility function
function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  } as T;
}

interface KeyPeopleSectionProps {
  config: KeyPeopleConfig;
  items: ClientKeyPersonFull[];
  onAddPerson: (person: Omit<ClientKeyPersonFull, 'id'>) => void;
  onUpdate: (people: ClientKeyPersonFull[]) => void;
  onSave: (people: ClientKeyPersonFull[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const KeyPeopleSection = ({ config, items, onUpdate, onSave, onEdit, onDelete }: KeyPeopleSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const colors = useAppThemeColors();
  const t = useTypography();

  const debouncedSave = useCallback(
    () => debounce(onSave, 1000), 
    [onSave]
  );

  // Check if section is locked or finalized
  const isSectionLocked = config.finalized || config.locked;

  const handleAddPerson = (person: Omit<ClientKeyPersonFull, 'id'>) => {
    // Generate a temporary ID for the new person
    const newPerson: ClientKeyPersonFull = {
      ...person,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    const newPeople = [...items, newPerson];
    onUpdate(newPeople);
    debouncedSave()(newPeople);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // This logic is from the latest code to handle the new data structure
    const newPerson: Omit<ClientKeyPersonFull, 'id'> = {
      fullName: formData.get('fullName') as string,
      role: formData.get('role') as KeyPersonRole,
      notes: formData.get('notes') as string,
      mustPhotograph: formData.get('mustPhotograph') === 'on',
      dontPhotograph: formData.get('dontPhotograph') === 'on',
      isVIP: formData.get('isVIP') === 'on',
      canRallyPeople: formData.get('canRallyPeople') === 'on',
      involvedIn: formData.get('involvedIn') ? [{ type: formData.get('involvedIn') as KeyPersonActions }] : [],
    };

    handleAddPerson(newPerson);
    setIsModalOpen(false);
  };

  // Helper to create styled tags for person attributes
  // const renderTag = (label: string, key: string) => (
  //   <p key={key} className="p-2 rounded-md" style={{ ...t.onSurfaceVariant.bodySmall, backgroundColor: colors.surfaceVariant }}>
  //     {label}
  //   </p>
  // );

  return (
    <section aria-labelledby="key-people-heading">
      <div className="text-center mb-6">
        <h2 id="key-people-heading" style={t.titleLarge}>
          The Wedding Party & Family
          {config.status === 'locked' && <span className="ml-2 text-sm font-normal text-orange-600">(Locked)</span>}
          {config.status === 'finalized' && <span className="ml-2 text-sm font-normal text-green-600">(Finalized)</span>}
        </h2>
        <p className="max-w-2xl mx-auto" style={{ ...t.onSurfaceVariant.bodyMedium, marginTop: 8 }}>
          Please add the key members of your wedding party and immediate family. This helps your photographer identify everyone on the big day!
        </p>
        
        {isSectionLocked ? (
          <div className="mt-4 p-3 rounded-lg max-w-md mx-auto" style={{ backgroundColor: colors.tertiaryContainer, color: colors.onTertiaryContainer }}>
            <p className="font-semibold">
              {config.status === 'locked' ? 'This section has been locked by your photographer and can no longer be edited.' : 'This section has been finalized by your photographer and can no longer be edited.'}
            </p>
          </div>
        ) : (
          <Button onClick={() => setIsModalOpen(true)} className="mt-4">Add Person</Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items && items.length > 0 ? (
          items.map(person => (
            <div key={person.id} className="rounded-lg shadow-md p-5 text-left bg-white flex flex-col justify-between">
              <div>
                <p className="font-bold text-lg text-primary">{person.fullName}</p>
                <p className="text-md text-gray-600">{person.role}</p>
                {person.notes && <p className="text-sm text-gray-500 mt-2">&ldquo;{person.notes}&rdquo;</p>}
              </div>
              <div className="flex justify-end mt-4">
                {!isSectionLocked && (
                  <>
                    <Button variant="secondary" onClick={() => onEdit(person.id)} className="mr-2">Edit</Button>
                    <Button variant="secondary" onClick={() => onDelete(person.id)}>Delete</Button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center" style={t.onSurfaceVariant.bodyMedium}>
            No people added yet.
          </p>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Key Person">
        <form onSubmit={handleSubmit}>
          {/* The form structure is from the latest code to ensure all new fields are included */}
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" id="fullName" name="fullName" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
          </div>
          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
            <select id="role" name="role" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-select">
              <option value="" disabled>Select a role...</option>
              {Object.values(KeyPersonRole).map(role => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
          <div className="space-y-3 mb-4 border p-3 rounded-md">
             <div className="flex items-center">
               <input type="checkbox" id="isVIP" name="isVIP" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 form-checkbox" />
               <label htmlFor="isVIP" className="ml-3 block text-sm text-gray-800">VIP</label>
            </div>
             <div className="flex items-center">
               <input type="checkbox" id="canRallyPeople" name="canRallyPeople" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 form-checkbox" />
               <label htmlFor="canRallyPeople" className="ml-3 block text-sm text-gray-800">Can Rally People for Photos</label>
            </div>
             <div className="flex items-center">
               <input type="checkbox" id="mustPhotograph" name="mustPhotograph" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 form-checkbox" />
               <label htmlFor="mustPhotograph" className="ml-3 block text-sm text-gray-800">Must Photograph</label>
            </div>
             <div className="flex items-center">
               <input type="checkbox" id="dontPhotograph" name="dontPhotograph" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 form-checkbox" />
               <label htmlFor="dontPhotograph" className="ml-3 block text-sm text-gray-800">Do Not Photograph</label>
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="involvedIn" className="block text-sm font-medium text-gray-700">Involved In (Optional)</label>
            <select id="involvedIn" name="involvedIn" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-select">
              <option value="">None</option>
              {Object.values(KeyPersonActions).map(action => <option key={action} value={action}>{action}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes for Photographer (Optional)</label>
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
