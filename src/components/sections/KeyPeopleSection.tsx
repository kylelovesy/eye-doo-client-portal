'use client';

import React, { useState } from 'react';
import { useAppThemeColors, useTypography } from '@/lib/useAppStyle'; // Added from previous code
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ClientKeyPersonFull, KeyPeopleConfig, KeyPersonActions, KeyPersonRole } from '@/types';

interface KeyPeopleSectionProps {
  config: KeyPeopleConfig;
  items: ClientKeyPersonFull[];
  onAddPerson: (person: Omit<ClientKeyPersonFull, 'id'>) => void;
}

export const KeyPeopleSection = ({ config, items, onAddPerson }: KeyPeopleSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const colors = useAppThemeColors(); // Added from previous code
  const t = useTypography(); // Added from previous code

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

    onAddPerson(newPerson);
    setIsModalOpen(false);
  };

  // Helper to create styled tags for person attributes
  const renderTag = (label: string, key: string) => (
    <p key={key} className="p-2 rounded-md" style={{ ...t.onSurfaceVariant.bodySmall, backgroundColor: colors.surfaceVariant }}>
      {label}
    </p>
  );

  return (
    <section aria-labelledby="key-people-heading">
      <div className="text-center mb-6">
        <h2 id="key-people-heading" style={t.titleLarge}>The Wedding Party & Family</h2>
        <p className="max-w-2xl mx-auto" style={{ ...t.onSurfaceVariant.bodyMedium, marginTop: 8 }}>
          Please add the key members of your wedding party and immediate family. This helps your photographer identify everyone on the big day!
        </p>
        
        {config.finalized ? (
          <div className="mt-4 p-3 rounded-lg max-w-md mx-auto" style={{ backgroundColor: colors.tertiaryContainer, color: colors.onTertiaryContainer }}>
            <p className="font-semibold">This section has been finalized by your photographer and can no longer be edited.</p>
          </div>
        ) : (
          <Button onClick={() => setIsModalOpen(true)} className="mt-4">Add Person</Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items && items.length > 0 ? (
          items.map(person => (
            <div key={person.id} className="rounded-lg shadow-lg p-5 text-center" style={{ backgroundColor: colors.surface }}>             
              <h3 style={t.titleMedium}>{person.fullName}</h3>
              <p style={{ ...t.primary.bodyLarge, fontWeight: 600 }}>{person.role}</p>
              
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {person.isVIP && renderTag('VIP', 'vip')}
                  {person.canRallyPeople && renderTag('Can Rally People', 'rally')}
                  {person.mustPhotograph && renderTag('Must Photograph', 'must')}
                  {person.dontPhotograph && renderTag("Don't Photograph", 'dont')}
                  {person.involvedIn && person.involvedIn.map(action => renderTag(action.type, action.type))}
              </div>

              {person.notes && (
                <p className="mt-4 p-2 rounded-md" style={{ ...t.onSurfaceVariant.bodySmall, backgroundColor: colors.surfaceVariant }}>
                  “{person.notes}”
                </p>
              )}
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
          <div className="space-y-4 mb-4 border p-3 rounded-md">
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
// 'use client';

// import React, { useState } from 'react';
// import { Button } from '../ui/Button';
// import { Modal } from '../ui/Modal';
// import { ClientKeyPersonFull, KeyPeopleConfig, KeyPersonActions, KeyPersonRole } from '@/types';

// interface KeyPeopleSectionProps {
//   config: KeyPeopleConfig;
//   items: ClientKeyPersonFull[];
//   onAddPerson: (person: Omit<ClientKeyPersonFull, 'id'>) => void;
// }

// export const KeyPeopleSection = ({ config, items, onAddPerson }: KeyPeopleSectionProps) => {
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     const formData = new FormData(event.currentTarget);
    
//     const newPerson: Omit<ClientKeyPersonFull, 'id'> = {
//       fullName: formData.get('fullName') as string,
//       role: formData.get('role') as KeyPersonRole,
//       notes: formData.get('notes') as string,
//       mustPhotograph: formData.get('mustPhotograph') === 'true',
//       dontPhotograph: formData.get('dontPhotograph') === 'true',
//       isVIP: formData.get('isVIP') === 'true',
//       canRallyPeople: formData.get('canRallyPeople') === 'true',
//       involvedIn: formData.get('involvedIn') ? [{ type: formData.get('involvedIn') as KeyPersonActions }] : [],
//     };

//     onAddPerson(newPerson);
//     setIsModalOpen(false);
//   };

//   return (
//     <section aria-labelledby="key-people-heading">
//       <div className="text-center mb-6">
//         <h2 id="key-people-heading" className="text-2xl font-bold text-gray-800">The Wedding Party & Family</h2>
//         <p className="mt-2 text-gray-600 max-w-2xl mx-auto">Please add the key members of your wedding party and immediate family. This helps your photographer identify everyone on the big day!</p>
        
//         {config.finalized ? (
//           <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg max-w-md mx-auto">
//             <p className="font-semibold">This section has been finalized by your photographer and can no longer be edited.</p>
//           </div>
//         ) : (
//           <Button onClick={() => setIsModalOpen(true)} className="mt-4">Add Person</Button>
//         )}
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//         {items && items.length > 0 ? (
//           items.map(person => (
//             <div key={person.id} className="bg-white rounded-lg shadow-lg p-5 text-center">              
//               <h3 className="text-xl font-bold text-gray-800">{person.fullName}</h3>
//               <p className="text-[#4A90E2] font-semibold">{person.role}</p>
//               {person.isVIP && <p className="text-sm text-gray-600 mt-2 bg-gray-100 p-2 rounded-md">VIP</p>}
//               {person.canRallyPeople && <p className="text-sm text-gray-600 mt-2 bg-gray-100 p-2 rounded-md">Can Rally People</p>}  
//               {person.mustPhotograph && <p className="text-sm text-gray-600 mt-2 bg-gray-100 p-2 rounded-md">Must Photograph</p>}
//               {person.dontPhotograph && <p className="text-sm text-gray-600 mt-2 bg-gray-100 p-2 rounded-md">Don&apos;t Photograph</p>}  
//               {person.involvedIn && person.involvedIn.map(action => <p key={action.type} className="text-sm text-gray-600 mt-2 bg-gray-100 p-2 rounded-md">{action.type}</p>)}
//               {person.notes && <p className="text-sm text-gray-600 mt-2 bg-gray-100 p-2 rounded-md">“{person.notes}”</p>}
//             </div>
//           ))
//         ) : (
//           <p className="text-gray-500 col-span-full text-center">No people added yet.</p>
//         )}
//       </div>

//       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Key Person">
//         <form onSubmit={handleSubmit}>
//           <div className="mb-4">
//             <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
//             <input type="text" id="fullName" name="fullName" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
//           </div>
//           <div className="mb-4">
//             <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
//             <select id="role" name="role" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-select">
//               {Object.values(KeyPersonRole).map(role => <option key={role} value={role}>{role}</option>)}
//             </select>
//           </div>
//           <div className="mb-4">
//             <label htmlFor="isVIP" className="block text-sm font-medium text-gray-700">VIP</label>
//             <input type="checkbox" id="isVIP" name="isVIP" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-checkbox" />
//           </div>
//           <div className="mb-4">
//             <label htmlFor="canRallyPeople" className="block text-sm font-medium text-gray-700">Can Rally People</label>
//             <input type="checkbox" id="canRallyPeople" name="canRallyPeople" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-checkbox" />
//           </div>
//           <div className="mb-4">
//             <label htmlFor="mustPhotograph" className="block text-sm font-medium text-gray-700">Must Photograph</label>
//             <input type="checkbox" id="mustPhotograph" name="mustPhotograph" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-checkbox" />
//           </div>
//           <div className="mb-4">
//             <label htmlFor="dontPhotograph" className="block text-sm font-medium text-gray-700">Don&apos;t Photograph</label>
//             <input type="checkbox" id="dontPhotograph" name="dontPhotograph" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-checkbox" />
//           </div>
//           <div className="mb-4">
//             <label htmlFor="involvedIn" className="block text-sm font-medium text-gray-700">Involved In</label>
//             <select id="involvedIn" name="involvedIn" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-select">
//               {Object.values(KeyPersonActions).map(action => <option key={action} value={action}>{action}</option>)}
//             </select>
//           </div>
//           <div className="mb-4">
//             <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes for Photographer (Optional)</label>
//             <textarea id="notes" name="notes" rows={2} placeholder="e.g., Likes to be called Johnny" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-textarea"></textarea>
//           </div>
//           <div className="flex justify-end space-x-3 mt-6">
//             <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
//             <Button type="submit">Save Person</Button>
//           </div>
//         </form>
//       </Modal>
//     </section>
//   );
// };

// // 'use client';

// // import { useAppThemeColors, useTypography } from '@/lib/useAppStyle';
// // import { PersonWithRole, RelationshipToCouple } from '@/types';
// // import Image from 'next/image';
// // import React, { useState } from 'react';
// // import { v4 as uuidv4 } from 'uuid';
// // import { Button } from '../ui/Button';
// // import { Modal } from '../ui/Modal';

// // interface KeyPeopleSectionProps {
// //   people: PersonWithRole[];
// //   onAddPerson: (person: PersonWithRole) => void;
// // }

// // export const KeyPeopleSection = ({ people, onAddPerson }: KeyPeopleSectionProps) => {
// //   const [isModalOpen, setIsModalOpen] = useState(false);
// //   const colors = useAppThemeColors();
// //   const t = useTypography();

// //   const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
// //     event.preventDefault();
// //     const formData = new FormData(event.currentTarget);

// //     const newPerson: PersonWithRole = {
// //       id: `person_${uuidv4()}`, // Use UUID for stable IDs
// //       fullName: formData.get('fullName') as string,
// //       role: formData.get('role') as string,
// //       relationship: formData.get('relationship') as RelationshipToCouple,
// //       notes: formData.get('notes') as string,
// //     };

// //     onAddPerson(newPerson);
// //     setIsModalOpen(false);
// //   };

// //   return (
// //     <section aria-labelledby="key-people-heading">
// //       <div className="text-center mb-6">
// //         <h2 id="key-people-heading" style={t.titleLarge}>The Wedding Party & Family</h2>
// //         <p className="max-w-2xl mx-auto" style={{ ...t.onSurfaceVariant.bodyMedium, marginTop: 8 }}>
// //           Please add the key members of your wedding party and immediate family. This helps your photographer identify everyone on the big day!
// //         </p>
// //         <Button onClick={() => setIsModalOpen(true)} className="mt-4">Add Person</Button>
// //       </div>

// //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
// //         {people && people.length > 0 ? (
// //           people.map(person => (
// //             <div key={person.id} className="rounded-lg shadow-lg p-5 text-center" style={{ backgroundColor: colors.surface }}>
// //               {/* <Image
// //                 src={`https://placehold.co/400x400/E9ECEF/1A1A1A?text=${person.fullName.charAt(0)}`}
// //                 alt=""
// //                 className="rounded-full mx-auto mb-4 object-cover"
// //                 width={96}
// //                 height={96}
// //               /> */}
// //               <h3 style={t.titleMedium}>{person.fullName}</h3>
// //               <p style={{ ...t.primary.bodyLarge, fontWeight: 600 }}>{person.role}</p>
// //               <p style={t.onSurfaceVariant.bodySmall}>{person.relationship}</p>
// //               {person.notes && (
// //                 <p className="mt-2 p-2 rounded-md" style={{ ...t.onSurfaceVariant.bodySmall, backgroundColor: colors.surfaceVariant }}>“{person.notes}”</p>
// //               )}
// //             </div>
// //           ))
// //         ) : (
// //           <p className="text-gray-500 col-span-full text-center">No people added yet.</p>
// //         )}
// //       </div>

// //       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Key Person">
// //         <form onSubmit={handleSubmit}>
// //           <div className="mb-4">
// //             <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
// //             <input type="text" id="fullName" name="fullName" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
// //           </div>
// //           <div className="mb-4">
// //             <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
// //             <input type="text" id="role" name="role" required placeholder="e.g., Father of the Bride" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
// //           </div>
// //           <div className="mb-4">
// //             <label htmlFor="relationship" className="block text-sm font-medium text-gray-700">Relationship to Couple</label>
// //             <select id="relationship" name="relationship" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-select">
// //               {Object.values(RelationshipToCouple).map(rel => <option key={rel} value={rel}>{rel}</option>)}
// //             </select>
// //           </div>
// //           <div className="mb-4">
// //             <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes for Photographer</label>
// //             <textarea id="notes" name="notes" rows={2} placeholder="e.g., Likes to be called Johnny" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-textarea"></textarea>
// //           </div>
// //           <div className="flex justify-end space-x-3 mt-6">
// //             <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
// //             <Button type="submit">Save Person</Button>
// //           </div>
// //         </form>
// //       </Modal>
// //     </section>
// //   );
// // };