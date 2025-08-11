// src/components/sections/GroupShotsSection.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SvgIcon } from '@/components/ui/Icon';
import { getGroupCategoryIconSrc, GroupCategoryId } from '@/lib/groupIconMaps';
import { PortalGroupShotData, ClientGroupShotItemFull, ClientKeyPersonFull } from '@/types';

interface GroupShotsSectionProps {
  data: PortalGroupShotData;
  people: ClientKeyPersonFull[];
  onUpdateSelections: (updatedItems: ClientGroupShotItemFull[]) => void;
  onAddCustomGroup: (group: { name: string; peopleIds: string[]; notes?: string }) => void;
}

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg className={`w-6 h-6 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export const GroupShotsSection = ({ data, people, onUpdateSelections, onAddCustomGroup }: GroupShotsSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(data.categories[0]?.id || null);

  const { config, categories, items } = data;

  const handleToggleAccordion = (categoryId: string) => {
    setOpenAccordion((prev) => (prev === categoryId ? null : categoryId));
  };

  const handleCheckboxChange = (itemId: string, isChecked: boolean) => {
    if (config.finalized) return;
    const updatedItems = items.map((item) => (item.id === itemId ? { ...item, checked: isChecked } : item));
    onUpdateSelections(updatedItems);
  };

  const handleCustomGroupSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const selectedPeopleIds = Array.from(formData.getAll('peopleIds')) as string[];
    const newGroup = {
      name: formData.get('groupName') as string,
      peopleIds: selectedPeopleIds,
      notes: (formData.get('notes') as string) || undefined,
    };
    onAddCustomGroup(newGroup);
    setIsModalOpen(false);
  };

  const itemsByCategory = useMemo(() => {
    const grouped: { [key: string]: ClientGroupShotItemFull[] } = {};
    items.forEach((item) => {
      if (!grouped[item.categoryId]) grouped[item.categoryId] = [];
      grouped[item.categoryId].push(item);
    });
    return grouped;
  }, [items]);

  return (
    <section aria-labelledby="group-shots-heading">
      <div className="text-center mb-6">
        <h2 id="group-shots-heading" className="font-serif text-2xl font-bold">
          Group Photo Planner
        </h2>
        <p className="max-w-2xl mx-auto text-gray-600 text-base mt-2">
          Select the group photos you&apos;d like. Your photographer has pre-filled this list with common suggestions.
        </p>
      </div>

      <div className="bg-white rounded-md shadow-md p-4 max-w-3xl mx-auto mb-8 sticky top-4 z-10">
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg text-gray-800">Total Estimated Time:</span>
          <span className="text-2xl font-bold text-[#4A90E2]">{config.totalTimeEstimated} minutes</span>
        </div>
      </div>

      {config.finalized && (
        <div className="mb-6 p-3 bg-yellow-100 text-yellow-800 rounded-lg max-w-3xl mx-auto text-center">
          <p className="font-semibold">This section has been finalized by your photographer and can no longer be edited.</p>
        </div>
      )}

      <div className="space-y-2 max-w-3xl mx-auto">
        {categories.map((category) => (
          <div key={category.id} className="border border-gray-200 rounded-md overflow-hidden bg-white">
            <button
              onClick={() => handleToggleAccordion(category.id)}
              className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 focus:outline-none"
              aria-expanded={openAccordion === category.id}
            >
              <div className="flex items-center gap-2">
                <SvgIcon src={getGroupCategoryIconSrc(category.id as GroupCategoryId)} size={20} title={category.displayName} />
                <h3 className="text-base font-semibold text-gray-800">{category.displayName}</h3>
              </div>
              <ChevronIcon open={openAccordion === category.id} />
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openAccordion === category.id ? 'max-h-screen' : 'max-h-0'}`}>
              <div className="px-2 py-2 border-t border-gray-200 space-y-1">
                {itemsByCategory[category.id]?.map((item) => (
                  <label key={item.id} className="flex items-center justify-between gap-3 px-2 py-2 rounded-md hover:bg-gray-50 cursor-pointer">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      {item.notes && <p className="text-sm text-gray-500">{item.notes}</p>}
                    </div>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                      disabled={config.finalized}
                      className="h-5 w-5 rounded form-checkbox"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <hr className="my-8 border-gray-300" />

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-700">Your Custom Group List</h3>
        {!config.finalized && (
          <Button onClick={() => setIsModalOpen(true)} className="mt-2">
            Create Custom Group
          </Button>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Custom Group">
        <form onSubmit={handleCustomGroupSubmit}>
          <div className="mb-4">
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
              Group Name
            </label>
            <input
              type="text"
              id="groupName"
              name="groupName"
              required
              placeholder="e.g., Bride's University Friends"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Who is in this photo?</label>
              <div className="mt-2 max-h-48 overflow-y-auto space-y-2 p-2 border rounded-md bg-gray-50">
              {people.length > 0 ? (
                people.map((person) => (
                  <label key={person.id} className="flex items-center space-x-3">
                    <input type="checkbox" name="peopleIds" value={person.id} className="h-4 w-4 rounded border-gray-300 text-[#4A90E2] focus:ring-2" />
                    <span>
                      {person.fullName} ({person.role})
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500">Please add people in the &quot;Key People&quot; tab first.</p>
              )}
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <textarea id="notes" name="notes" rows={2} placeholder="e.g., Meet on the main steps" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-textarea"></textarea>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Group</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
};