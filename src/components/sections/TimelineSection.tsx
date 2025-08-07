'use client';

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { TimelineEvent, TimelineEventType } from '@/types';

interface TimelineSectionProps {
  events: TimelineEvent[];
  onAddEvent: (event: TimelineEvent) => void;
}

export const TimelineSection = ({ events, onAddEvent }: TimelineSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const newEvent: TimelineEvent = {
      id: `event_${uuidv4()}`, // Use UUID for stable IDs
      name: formData.get('eventName') as string,
      type: formData.get('eventType') as TimelineEventType,
      time: formData.get('eventTime') as string,
      notes: formData.get('eventNotes') as string,
    };

    onAddEvent(newEvent);
    setIsModalOpen(false);
  };

  const sortedEvents = [...(events || [])].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <section aria-labelledby="timeline-heading">
      <div className="text-center mb-6">
        <h2 id="timeline-heading" className="text-2xl font-bold text-gray-800">Key Events Timeline</h2>
        <p className="mt-2 text-gray-600 max-w-2xl mx-auto">Provide the main &quot;tentpole&quot; events of your day. Your photographer will use this to build a detailed final schedule.</p>
        <Button onClick={() => setIsModalOpen(true)} className="mt-4">Add Event</Button>
      </div>

      <div className="max-w-3xl mx-auto">
        {sortedEvents && sortedEvents.length > 0 ? (
          sortedEvents.map(event => (
            <div key={event.id} className="flex items-stretch mb-6">
              <div className="flex flex-col items-center mr-4">
                <div className="bg-[#4A90E2] text-white font-bold w-20 text-center py-1 rounded-t-lg">{event.time}</div>
                <div className="w-px flex-grow bg-gray-300"></div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 w-full">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-gray-800">{event.name}</h3>
                  <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-center">{event.type}</span>
                </div>
                {event.notes && <p className="text-gray-600 mt-1">{event.notes}</p>}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">No events added yet.</p>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Timeline Event">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">Event Name</label>
            <input type="text" id="eventName" name="eventName" required placeholder="e.g., Ceremony Begins" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
          </div>
          <div className="mb-4">
            <label htmlFor="eventType" className="block text-sm font-medium text-gray-700">Event Type</label>
            <select id="eventType" name="eventType" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-select">
              {Object.values(TimelineEventType).map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="eventTime" className="block text-sm font-medium text-gray-700">Approximate Time</label>
            <input type="time" id="eventTime" name="eventTime" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
          </div>
          <div className="mb-4">
            <label htmlFor="eventNotes" className="block text-sm font-medium text-gray-700">Location / Notes</label>
            <textarea id="eventNotes" name="eventNotes" rows={2} placeholder="e.g., The Oak Room" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-textarea"></textarea>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Event</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
};