'use client';

import { SvgIcon } from '@/components/ui/Icon';
import { GENERIC_GROUP_ICON, getGroupCategoryIconSrc } from '@/lib/groupIconMaps';
import { DEFAULT_GROUP_SHOT_CATEGORIES } from '@/lib/groupShotMasterData';
import { useAppThemeColors, useTypography } from '@/lib/useAppStyle';
import { GroupShot, PersonWithRole } from '@/types';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface GroupPhotosSectionProps {
  customGroups: GroupShot[];
  people: PersonWithRole[];
  onAddCustomGroup: (group: GroupShot) => void;
  onAddSuggestedGroup: (group: { id: string; name: string; notes?: string }) => void;
}

export const GroupPhotosSection = ({ customGroups, people, onAddCustomGroup, onAddSuggestedGroup }: GroupPhotosSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const colors = useAppThemeColors();
  const t = useTypography();

  const categories = DEFAULT_GROUP_SHOT_CATEGORIES;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const selectedPeopleIds = Array.from(formData.getAll('peopleIds')) as string[];

    const newGroup: GroupShot = {
      id: `group_${uuidv4()}`, // Use UUID for stable IDs
      name: formData.get('groupName') as string,
      peopleIds: selectedPeopleIds,
      notes: '',
    };

    onAddCustomGroup(newGroup);
    setIsModalOpen(false);
  };

  return (
    <section aria-labelledby="group-photos-heading">
      <div className="text-center mb-6">
        <h2 id="group-photos-heading" style={t.titleLarge}>Requested Group Photos</h2>
        <p className="max-w-2xl mx-auto" style={{ ...t.onSurfaceVariant.bodyMedium, marginTop: 8 }}>
          Here are some common group photos. Click "Add to my list" to use them, or create your own custom groups below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-4xl mx-auto">
        {categories.map(cat => (
          <div key={cat.id} className="rounded-lg shadow p-4" style={{ backgroundColor: colors.surface }}>
            <div className="flex items-center gap-3">
              <SvgIcon src={getGroupCategoryIconSrc(cat.id as any)} size={22} color={colors.primary} title={cat.displayName} />
              <h4 style={t.titleMedium}>{cat.displayName}</h4>
            </div>
          </div>
        ))}
      </div>

      <hr className="my-8 border-gray-300" />

      <div className="text-center mb-6">
        <h3 style={t.titleMedium}>Your Custom Group List (Others)</h3>
        <Button onClick={() => setIsModalOpen(true)} className="mt-2">Create Custom Group</Button>
      </div>

      <div className="space-y-4 max-w-3xl mx-auto">
        {customGroups && customGroups.length > 0 ? (
          customGroups.map(group => (
            <div key={group.id} className="rounded-lg shadow-md p-5" style={{ backgroundColor: colors.surface }}>
              <div className="flex items-center gap-3 mb-2">
                <SvgIcon src={GENERIC_GROUP_ICON} size={22} color={colors.primary} title={group.name} />
                <h4 style={t.titleMedium}>{group.name}</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.peopleIds.map(personId => {
                  const person = people.find(p => p.id === personId);
                  return person ? (
                    <span
                      key={personId}
                      className="inline-block rounded-full px-3 py-1 text-sm font-semibold"
                      style={{ backgroundColor: colors.surfaceVariant, color: colors.onSurface }}
                    >
                      {person.fullName}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">No custom groups created yet.</p>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Custom Group">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">Group Name</label>
            <input type="text" id="groupName" name="groupName" required placeholder="e.g., Bride's University Friends" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Who is in this photo?</label>
            <div className="mt-2 max-h-48 overflow-y-auto space-y-2 p-2 border rounded-md bg-gray-50">
              {people.length > 0 ? (
                people.map(person => (
                  <label key={person.id} className="flex items-center space-x-3">
                    <input type="checkbox" name="peopleIds" value={person.id} className="h-4 w-4 rounded border-gray-300 text-[#4A90E2] focus:ring-[#4A90E2]" />
                    <span>{person.fullName} ({person.role})</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500" role="alert" aria-live="polite">Please add people in the &quot;Key People&quot; tab first.</p>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Group</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
};