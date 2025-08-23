// src/components/sections/GroupShotsSection.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SvgIcon } from '@/components/ui/Icon';
import { getGroupCategoryIconSrc, GroupCategoryId } from '@/lib/groupIconMaps';
import { PortalGroupShotData, ClientGroupShotItemFull, ClientKeyPersonFull } from '@/types';

interface GroupShotsSectionProps {
  data: PortalGroupShotData;
  people: ClientKeyPersonFull[];
  onUpdateSelections: (updatedItems: ClientGroupShotItemFull[]) => void;
}

// Interface for accordion sections as specified in the schema
interface AccordionSection {
  id: string;           // Unique identifier for the section
  title: string;        // Category name (from groupShotData.categories)
  items: ClientGroupShotItemFull[]; // Items filtered by category
  isExpanded: boolean;  // UI state for accordion
  selectedCount: number; // Number of checked items in this category
}

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg className={`w-6 h-6 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export const GroupShotsSection = ({ data, people, onUpdateSelections }: GroupShotsSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accordionSections, setAccordionSections] = useState<AccordionSection[]>([]);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState<ClientGroupShotItemFull[]>(data.items);

  // Check if section is locked or finalized (schema-compliant)
  const isSectionLocked = data.config.finalized || data.config.locked;

  // Transform categories into accordion sections (schema implementation guide)
  useEffect(() => {
    const sections = data.categories.map(category => ({
      id: category.toLowerCase().replace(/\s+/g, '-'),
      title: category,
      items: localItems.filter(item => item.category === category),
      isExpanded: false,
      selectedCount: localItems.filter(item => 
        item.category === category && item.checked
      ).length
    }));
    
    setAccordionSections(sections);
    
    // Set first section as open by default
    if (sections.length > 0 && !openAccordion) {
      setOpenAccordion(sections[0].id);
    }
  }, [data.categories, localItems, openAccordion]);

  // Sync local items with data changes
  useEffect(() => {
    setLocalItems(data.items);
  }, [data.items]);

  useEffect(() => {
    return () => {
      onUpdateSelections(localItems);
    };
  }, [localItems, onUpdateSelections]);

  const handleToggleAccordion = (sectionId: string) => {
    if (isSectionLocked) return; // Prevent toggling when locked
    setOpenAccordion((prev) => (prev === sectionId ? null : sectionId));
  };

  const handleCheckboxChange = (itemId: string, isChecked: boolean) => {
    if (isSectionLocked) return; // Prevent changes when locked
    const updatedItems = localItems.map((item) => 
      item.id === itemId ? { ...item, checked: isChecked } : item
    );
    setLocalItems(updatedItems);
  };

  const handleCustomItemSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const selectedPeopleInvolved = Array.from(formData.getAll('peopleInvolved')) as string[];
    
    // Find or use a default custom category (schema expects string categories)
    const customCategory = data.categories.find(c => c.toLowerCase().includes('custom')) || 'Custom';

    const groupTitle = formData.get('groupTitle') as string;
    const notes = (formData.get('notes') as string) || '';

    const newItem: ClientGroupShotItemFull = {
      id: `groupshot_${Date.now()}`, // Schema format
      title: groupTitle, // Schema field name
      category: customCategory, // Schema field name (string)
      peopleInvolved: selectedPeopleInvolved, // Schema field name
      notes: notes,
      time: 5, // Default time for a custom shot
      checked: true,
    };

    setLocalItems(prevItems => [...prevItems, newItem]);
    setIsModalOpen(false);
  };

  // Calculate total time from checked items
  const totalTime = useMemo(() => {
    return localItems.filter(item => item.checked).reduce((sum, item) => sum + (item.time || 0), 0);
  }, [localItems]);

  const handleSave = () => {
    onUpdateSelections(localItems);
    alert("Group shot selections saved!");
  };

  return (
    <section aria-labelledby="group-shots-heading">
      <div className="text-center mb-6">
        <h2 id="group-shots-heading" className="font-serif text-2xl font-bold">
          Group Photo Planner
          {data.config.locked && <span className="ml-2 text-sm font-normal text-orange-600">(Locked)</span>}
          {data.config.finalized && <span className="ml-2 text-sm font-normal text-green-600">(Finalized)</span>}
        </h2>
        <p className="max-w-2xl mx-auto text-gray-600 text-base mt-2">
          Select the group photos you&apos;d like. Your photographer has pre-filled this list with common suggestions.
        </p>
      </div>

      <div className="bg-white rounded-md shadow-md p-4 max-w-3xl mx-auto mb-8 sticky top-4 z-10">
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg text-gray-800">Total Estimated Time:</span>
          <span className="text-2xl font-bold text-[#4A90E2]">{totalTime} minutes</span>
        </div>
      </div>

      {isSectionLocked && (
        <div className="mb-6 p-3 bg-yellow-100 text-yellow-800 rounded-lg max-w-3xl mx-auto text-center">
          <p className="font-semibold">
            {data.config.locked ? 'This section has been locked by your photographer and can no longer be edited.' : 'This section has been finalized by your photographer and can no longer be edited.'}
          </p>
        </div>
      )}

      <div className="space-y-2 max-w-3xl mx-auto">
        {accordionSections.map((section) => (
          <div key={section.id} className="border border-gray-200 rounded-md overflow-hidden bg-white">
            <button
              onClick={() => handleToggleAccordion(section.id)}
              disabled={isSectionLocked}
              className={`w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 focus:outline-none ${isSectionLocked ? 'cursor-not-allowed opacity-60' : ''}`}
              aria-expanded={openAccordion === section.id}
            >
              <div className="flex items-center gap-2">
                <SvgIcon 
                  src={getGroupCategoryIconSrc(section.id as GroupCategoryId)} 
                  size={20} 
                  title={section.title} 
                />
                <h3 className="text-base font-semibold text-gray-800">{section.title}</h3>
                <span className="ml-2 text-sm text-gray-500">({section.selectedCount}/{section.items.length})</span>
              </div>
              <ChevronIcon open={openAccordion === section.id} />
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openAccordion === section.id ? 'max-h-screen' : 'max-h-0'}`}>
              <div className="px-2 py-2 border-t border-gray-200 space-y-1">
                {section.items.map((item) => (
                  <label key={item.id} className={`flex items-center justify-between gap-3 px-2 py-2 rounded-md hover:bg-gray-50 ${isSectionLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      {item.notes && <p className="text-sm text-gray-500">{item.notes}</p>}
                      {item.time && <p className="text-xs text-gray-400">{item.time} min</p>}
                    </div>
                    <input
                      type="checkbox"
                      checked={!!item.checked}
                      onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                      disabled={isSectionLocked}
                      className="h-5 w-5 rounded form-checkbox"
                    />
                  </label>
                ))}
                {section.title.toLowerCase().includes('custom') && !isSectionLocked && (
                  <div className="p-2 pt-4 text-center">
                    <Button type="button" onClick={() => setIsModalOpen(true)}>
                      Add Custom Shot
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {!isSectionLocked && (
        <div className="text-center mt-8">
            <Button onClick={handleSave}>Save Group Shots</Button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add a Custom Group Photo">
        <form onSubmit={handleCustomItemSubmit}>
          <div className="mb-4">
            <label htmlFor="groupTitle" className="block text-sm font-bold text-gray-800 mb-1">
              Group Description
            </label>
            <input
              type="text"
              id="groupTitle"
              name="groupTitle"
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
                    <input type="checkbox" name="peopleInvolved" value={`${person.firstName} ${person.surname || ''}`} className="h-4 w-4 rounded border-gray-300 text-[#4A90E2] focus:ring-2" />
                    <span>
                      {person.firstName} {person.surname} ({person.role})
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
              Notes for Photographer (Optional)
            </label>
            <textarea id="notes" name="notes" rows={2} placeholder="e.g., Meet on the main steps" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-textarea"></textarea>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Shot</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
};