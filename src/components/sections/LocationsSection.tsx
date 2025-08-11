'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SvgIcon } from '@/components/ui/Icon';
import { getLocationIconSrc } from '@/lib/iconMaps';
import { useAppThemeColors, useTypography } from '@/lib/useAppStyle';
import { ClientLocationFull, LocationConfig, LocationType } from '@/types';

interface LocationsSectionProps {
  config: LocationConfig;
  items: ClientLocationFull[];
  onAddLocation: (location: Omit<ClientLocationFull, 'id'>) => void;
  onSetMultipleLocations: (multiple: boolean) => void;
}

export const LocationsSection = ({ config, items, onAddLocation, onSetMultipleLocations }: LocationsSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<LocationType>(LocationType.SINGLE_LOCATION);
  // Inline single-location form state
  const [singleForm, setSingleForm] = useState({
    locationName: '',
    locationAddress1: '',
    locationAddress2: '',
    locationPostcode: '',
    locationNotes: '',
  });
  const colors = useAppThemeColors();
  const t = useTypography();

  const showInlineSingleForm = useMemo(() => !config.multipleLocations && (items?.length || 0) === 0, [config.multipleLocations, items]);
  const showMultipleToggle = useMemo(() => !config.multipleLocations && (items?.length || 0) === 0, [config.multipleLocations, items]);
  const isSingleFormValid = useMemo(() => {
    return (
      singleForm.locationName.trim().length > 0 &&
      singleForm.locationAddress1.trim().length > 0 &&
      singleForm.locationPostcode.trim().length > 0
    );
  }, [singleForm]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const newLocation: Omit<ClientLocationFull, 'id'> = {
      locationName: formData.get('locationName') as string,
      locationType: config.multipleLocations 
        ? formData.get('locationType') as LocationType 
        : LocationType.SINGLE_LOCATION,
      locationAddress1: formData.get('locationAddress1') as string,
      locationAddress2: formData.get('locationAddress2') as string,
      locationPostcode: formData.get('locationPostcode') as string,
      locationNotes: formData.get('locationNotes') as string,
      arriveTime: (formData.get('arriveTime') as string) || undefined,
      leaveTime: (formData.get('leaveTime') as string) || undefined,
      nextLocationTravelTimeEstimate: Number(formData.get('travelTime')) || undefined,
      nextLocationTravelArrangements: (formData.get('travelArrangements') as string) || undefined,
    };

    onAddLocation(newLocation);
    setIsModalOpen(false);
  };

  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSingleFormValid) return;
    const newLocation: Omit<ClientLocationFull, 'id'> = {
      locationName: singleForm.locationName.trim(),
      locationType: LocationType.SINGLE_LOCATION,
      locationAddress1: singleForm.locationAddress1.trim(),
      locationAddress2: singleForm.locationAddress2.trim() || undefined,
      locationPostcode: singleForm.locationPostcode.trim(),
      locationNotes: singleForm.locationNotes.trim() || undefined,
    };
    onAddLocation(newLocation);
  };

  return (
    <section aria-labelledby="locations-heading">
      <div className="text-center mb-6">
        <h2 id="locations-heading" style={t.titleLarge}>Wedding Locations</h2>
        <p className="max-w-2xl mx-auto" style={{ ...t.onSurfaceVariant.bodyMedium, marginTop: 8 }}>
          Add the key locations for your wedding day, like the ceremony venue, reception hall, and photo spots.
        </p>
        
        {/* Finalized state */}
        {config.finalized ? (
          <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg max-w-md mx-auto">
            <p className="font-semibold">This section has been finalized by your photographer and can no longer be edited.</p>
          </div>
        ) : (
          <>
            {/* Multiple Locations toggle when allowed */}
            {showMultipleToggle && (
              <div className="mt-3 flex justify-center">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={false}
                    onChange={(e) => onSetMultipleLocations(e.target.checked)}
                  />
                  <span>Multiple Locations</span>
                </label>
              </div>
            )}

            {/* Add button only when multiple locations workflow */}
            {config.multipleLocations && (
              <Button onClick={() => setIsModalOpen(true)} className="mt-4">Add Location</Button>
            )}
          </>
        )}
      </div>
      
      {/* Inline single-location form when multipleLocations=false and none exist */}
      {showInlineSingleForm && !config.finalized && (
        <form onSubmit={handleInlineSubmit} className="max-w-3xl mx-auto space-y-4">
          <div>
            <label htmlFor="single_locationName" className="block text-sm font-medium text-gray-700">Location Name</label>
            <input id="single_locationName" className="form-input" value={singleForm.locationName} onChange={(e) => setSingleForm({ ...singleForm, locationName: e.target.value })} placeholder="e.g., Manor House" />
          </div>
          <div>
            <label htmlFor="single_address1" className="block text-sm font-medium text-gray-700">Address Line 1 (required)</label>
            <input id="single_address1" className="form-input" value={singleForm.locationAddress1} onChange={(e) => setSingleForm({ ...singleForm, locationAddress1: e.target.value })} />
          </div>
          <div>
            <label htmlFor="single_address2" className="block text-sm font-medium text-gray-700">Address Line 2</label>
            <input id="single_address2" className="form-input" value={singleForm.locationAddress2} onChange={(e) => setSingleForm({ ...singleForm, locationAddress2: e.target.value })} />
          </div>
          <div>
            <label htmlFor="single_postcode" className="block text-sm font-medium text-gray-700">Postcode (required)</label>
            <input id="single_postcode" className="form-input" value={singleForm.locationPostcode} onChange={(e) => setSingleForm({ ...singleForm, locationPostcode: e.target.value })} />
          </div>
          <div>
            <label htmlFor="single_notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea id="single_notes" className="form-textarea" rows={2} placeholder="e.g., Parking is at the rear of the building" value={singleForm.locationNotes} onChange={(e) => setSingleForm({ ...singleForm, locationNotes: e.target.value })} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!isSingleFormValid}>Save Location</Button>
          </div>
        </form>
      )}

      <div className="space-y-4 max-w-3xl mx-auto">
        {items && items.length > 0 ? (
          items.map(loc => (
            <div key={loc.id} className="rounded-md shadow-md p-5" style={{ backgroundColor: colors.surface }}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <SvgIcon src={getLocationIconSrc(loc.locationType)} size={28} title={loc.locationType} />
                  <h3 style={t.titleMedium}>{loc.locationName}</h3>
                </div>
                {config.multipleLocations && (
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full" 
                        style={{ backgroundColor: colors.primaryContainer, color: colors.onPrimaryContainer }}>
                    {loc.locationType}
                  </span>
                )}
              </div>
              <p style={{ ...t.onSurfaceVariant.bodyMedium, marginTop: 4 }}>{loc.locationAddress1}</p>
              {loc.locationNotes && (
                <p className="text-sm mt-2" style={t.onSurfaceVariant.bodySmall}>
                  Notes: {loc.locationNotes}
                </p>
              )}
              {config.multipleLocations && (loc.arriveTime || loc.leaveTime) && (
                <div className="flex space-x-4 mt-2 text-sm" style={t.onSurfaceVariant.bodySmall}>
                  {loc.arriveTime && <span>Arrive: <strong>{loc.arriveTime}</strong></span>}
                  {loc.leaveTime && <span>Leave: <strong>{loc.leaveTime}</strong></span>}
                </div>
              )}
              {/* Display Travel Info */}
              {(loc.nextLocationTravelTimeEstimate || loc.nextLocationTravelArrangements) && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.outline }}>
                  <p className="font-semibold" style={t.onSurfaceVariant.bodyMedium}>Travel to Next Location:</p>
                  {loc.nextLocationTravelTimeEstimate && (
                    <p style={t.onSurfaceVariant.bodySmall}>Est. Time: {loc.nextLocationTravelTimeEstimate} minutes</p>
                  )}
                  {loc.nextLocationTravelArrangements && (
                    <p style={t.onSurfaceVariant.bodySmall}>Arrangements: {loc.nextLocationTravelArrangements}</p>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center" style={t.onSurfaceVariant.bodyMedium}>No locations added yet.</p>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Location">
        <form onSubmit={handleSubmit}>
          {/* Location Type first when multiple locations */}
          {config.multipleLocations && (
            <div className="mb-4">
              <label htmlFor="locationType" className="block text-sm font-medium text-gray-700">Location Type</label>
              <div className="flex items-center gap-2">
                <SvgIcon src={getLocationIconSrc(selectedType)} size={20} title={selectedType} />
                <select id="locationType" name="locationType" required className="form-select" onChange={(e)=>setSelectedType(e.target.value as LocationType)}>
                  {Object.values(LocationType).filter(t => t !== LocationType.SINGLE_LOCATION).map(type => 
                    <option key={type} value={type}>{type}</option>
                  )}
                </select>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="locationName" className="block text-sm font-medium text-gray-700">Location Name</label>
            <input type="text" id="locationName" name="locationName" required placeholder="e.g., Manor House" className="form-input" />
          </div>
          
          <div className="mb-4">
            <label htmlFor="locationAddress1" className="block text-sm font-medium text-gray-700">Address Line 1 (required)</label>
            <input type="text" id="locationAddress1" name="locationAddress1" required className="form-input" />
          </div>
          
          <div className="mb-4">
            <label htmlFor="locationAddress2" className="block text-sm font-medium text-gray-700">Address Line 2</label>
            <input type="text" id="locationAddress2" name="locationAddress2" className="form-input" />
          </div>
          
          <div className="mb-4">
            <label htmlFor="locationPostcode" className="block text-sm font-medium text-gray-700">Postcode (required)</label>
            <input type="text" id="locationPostcode" name="locationPostcode" required className="form-input" />
          </div>
          
          {/* Conditionally render Arrive/Leave times */}
          {config.multipleLocations && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="arriveTime" className="block text-sm font-medium text-gray-700">Arrive Time</label>
              <input type="time" id="arriveTime" name="arriveTime" className="form-input" />
              </div>
              <div>
                <label htmlFor="leaveTime" className="block text-sm font-medium text-gray-700">Leave Time</label>
                <input type="time" id="leaveTime" name="leaveTime" className="form-input" />
              </div>
            </div>
          )}
          
          {/* Travel Info Fields */}
          {config.multipleLocations && (
            <>
              <hr className="my-4" />
               <div className="mb-4">
                <label htmlFor="travelTime" className="block text-sm font-medium text-gray-700">Travel Time to Next Location (minutes)</label>
                <input type="number" id="travelTime" name="travelTime" min={0} step={5} placeholder="e.g., 25" className="form-input" />
              </div>
              <div className="mb-4">
                <label htmlFor="travelArrangements" className="block text-sm font-medium text-gray-700">Travel Arrangements</label>
                <textarea id="travelArrangements" name="travelArrangements" rows={2} placeholder="e.g., Guests will drive, couple has a limo" className="form-textarea"></textarea>
              </div>
            </>
          )}
          
          <div className="mb-4">
            <label htmlFor="locationNotes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea id="locationNotes" name="locationNotes" rows={2} placeholder="e.g., Parking is at the rear of the building" className="form-textarea"></textarea>
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
// 'use client';

// import React, { useState } from 'react';
// import { Button } from '../ui/Button';
// import { Modal } from '../ui/Modal';
// import { ClientLocationFull, LocationConfig, LocationType } from '@/types';

// interface LocationsSectionProps {
//   config: LocationConfig;
//   items: ClientLocationFull[];
//   onAddLocation: (location: Omit<ClientLocationFull, 'id'>) => void;
// }

// export const LocationsSection = ({ config, items, onAddLocation }: LocationsSectionProps) => {
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     const formData = new FormData(event.currentTarget);
    
//     const newLocation: Omit<ClientLocationFull, 'id'> = {
//       locationName: formData.get('locationName') as string,
//       locationType: config.multipleLocations 
//         ? formData.get('locationType') as LocationType 
//         : LocationType.SINGLE_LOCATION,
//       locationAddress1: formData.get('locationAddress1') as string,
//       locationAddress2: formData.get('locationAddress2') as string,
//       locationPostcode: formData.get('locationPostcode') as string,
//       locationNotes: formData.get('locationNotes') as string,
//       arriveTime: formData.get('arriveTime') as string,
//       leaveTime: formData.get('leaveTime') as string,
//       nextLocationTravelTimeEstimate: Number(formData.get('travelTime')) || undefined,
//       nextLocationTravelArrangements: formData.get('travelArrangements') as string || undefined,
//     };

//     onAddLocation(newLocation);
//     setIsModalOpen(false);
//   };

//   return (
//     <section aria-labelledby="locations-heading">
//       <div className="text-center mb-6">
//         <h2 id="locations-heading" className="text-2xl font-bold text-gray-800">Wedding Locations</h2>
//         <p className="mt-2 text-gray-600 max-w-2xl mx-auto">Add the key locations for your wedding day, like the ceremony venue, reception hall, and photo spots.</p>
        
//         {/* Show a finalized message or the add button */}
//         {config.finalized ? (
//           <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg max-w-md mx-auto">
//             <p className="font-semibold">This section has been finalized by your photographer and can no longer be edited.</p>
//           </div>
//         ) : (
//           <Button onClick={() => setIsModalOpen(true)} className="mt-4">Add Location</Button>
//         )}
//       </div>
      
//       <div className="space-y-4 max-w-3xl mx-auto">
//         {items && items.length > 0 ? (
//           items.map(loc => (
//             <div key={loc.id} className="bg-white rounded-lg shadow-md p-5">
//               <div className="flex justify-between items-start">
//                 <h3 className="text-xl font-bold text-gray-800">{loc.locationName}</h3>
//                 {config.multipleLocations && (
//                     <span className="text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{loc.locationType}</span>
//                 )}
//               </div>
//               <p className="text-gray-600 mt-1">{loc.locationAddress1}</p>
//               {loc.locationNotes && <p className="text-sm text-gray-500 mt-2">Notes: {loc.locationNotes}</p>}
//               {config.multipleLocations && (loc.arriveTime || loc.leaveTime) && (
//                 <div className="flex space-x-4 mt-2 text-sm text-gray-700">
//                     {loc.arriveTime && <span>Arrive: <strong>{loc.arriveTime}</strong></span>}
//                     {loc.leaveTime && <span>Leave: <strong>{loc.leaveTime}</strong></span>}
//                 </div>
//               )}
//               {/* --- NEW: Display Travel Info --- */}
//               {(loc.nextLocationTravelTimeEstimate || loc.nextLocationTravelArrangements) && (
//                 <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
//                   <p className="font-semibold text-gray-700">Travel to Next Location:</p>
//                   {loc.nextLocationTravelTimeEstimate && <p className="text-gray-600">Est. Time: {loc.nextLocationTravelTimeEstimate} minutes</p>}
//                   {loc.nextLocationTravelArrangements && <p className="text-gray-600">Arrangements: {loc.nextLocationTravelArrangements}</p>}
//                 </div>
//               )}
//             </div>
//           ))
//         ) : (
//           <p className="text-gray-500 text-center">No locations added yet.</p>
//         )}
//       </div>

//       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Location">
//         <form onSubmit={handleSubmit}>
//             <div className="mb-4">
//                 <label htmlFor="locationName" className="block text-sm font-medium text-gray-700">Location Name</label>
//                 <input type="text" id="locationName" name="locationName" required placeholder="e.g., Manor House" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
//             </div>
//             {/* Conditionally render the Location Type dropdown */}
//             {config.multipleLocations && (
//               <div className="mb-4">
//                   <label htmlFor="locationType" className="block text-sm font-medium text-gray-700">Location Type</label>
//                   <select id="locationType" name="locationType" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-select">
//                       {Object.values(LocationType).filter(t => t !== LocationType.SINGLE_LOCATION).map(type => <option key={type} value={type}>{type}</option>)}
//                   </select>
//               </div>
//             )}
//             <div className="mb-4">
//                 <label htmlFor="locationAddress1" className="block text-sm font-medium text-gray-700">Address Line 1 (required)</label>
//                 <input type="text" id="locationAddress1" name="locationAddress1" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
//             </div>
//             <div className="mb-4">
//                 <label htmlFor="locationAddress2" className="block text-sm font-medium text-gray-700">Address Line 2</label>
//                 <input type="text" id="locationAddress2" name="locationAddress2" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
//             </div>
//             <div className="mb-4">
//                 <label htmlFor="locationPostcode" className="block text-sm font-medium text-gray-700">Postcode (required)</label>
//                 <input type="text" id="locationPostcode" name="locationPostcode" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
//             </div>
//             {/* Conditionally render Arrive/Leave times */}
//             {config.multipleLocations && (
//               <div className="grid grid-cols-2 gap-4 mb-4">
//                 <div>
//                   <label htmlFor="arriveTime" className="block text-sm font-medium text-gray-700">Arrive Time</label>
//                   <input type="time" id="arriveTime" name="arriveTime" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
//                 </div>
//                 <div>
//                   <label htmlFor="leaveTime" className="block text-sm font-medium text-gray-700">Leave Time</label>
//                   <input type="time" id="leaveTime" name="leaveTime" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
//                 </div>
//               </div>
//             )}
//             {/* --- NEW: Add Travel Info Fields to Modal --- */}
//             {config.multipleLocations && (
//               <>
//                 <hr className="my-4" />
//                 <div className="mb-4">
//                   <label htmlFor="travelTime" className="block text-sm font-medium text-gray-700">Travel Time to Next Location (minutes)</label>
//                   <input type="number" id="travelTime" name="travelTime" placeholder="e.g., 25" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
//                 </div>
//                 <div className="mb-4">
//                   <label htmlFor="travelArrangements" className="block text-sm font-medium text-gray-700">Travel Arrangements</label>
//                   <textarea id="travelArrangements" name="travelArrangements" rows={2} placeholder="e.g., Guests will drive, couple has a limo" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-textarea"></textarea>
//                 </div>
//               </>
//             )}
//             <div className="mb-4">
//                 <label htmlFor="locationNotes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
//                 <textarea id="locationNotes" name="locationNotes" rows={2} placeholder="e.g., Parking is at the rear of the building" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-textarea"></textarea>
//             </div>
//             <div className="flex justify-end space-x-3 mt-6">
//                 <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
//                 <Button type="submit">Save Location</Button>
//             </div>
//         </form>
//       </Modal>
//     </section>
//   );
// };

// // 'use client';

// // import { SvgIcon } from '@/components/ui/Icon';
// // import { getLocationIconSrc } from '@/lib/iconMaps';
// // import { useAppThemeColors, useTypography } from '@/lib/useAppStyle';
// // import { LocationFull, LocationType } from '@/types';
// // import React, { useState } from 'react';
// // import { v4 as uuidv4 } from 'uuid';
// // import { Button } from '../ui/Button';
// // import { Modal } from '../ui/Modal';
// // // Validation handled inline without external libs

// // interface LocationsSectionProps {
// //   locations: LocationFull[];
// //   onAddLocation: (location: LocationFull) => void;
// // }

// // export const LocationsSection = ({ locations, onAddLocation }: LocationsSectionProps) => {
// //   const [isModalOpen, setIsModalOpen] = useState(false);
// //   const [multipleLocations, setMultipleLocations] = useState(false);
// //   const colors = useAppThemeColors();
// //   const t = useTypography();

// //   const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
// //     event.preventDefault();
// //     const formData = new FormData(event.currentTarget);

// //     // If no existing locations, we are in "single location" quick form mode
// //     if (!locations || locations.length === 0) {
// //       const address1 = String(formData.get('locationAddress1') || '').trim();
// //       const address2 = String(formData.get('locationAddress2') || '').trim();
// //       const postcode = String(formData.get('locationPostcode') || '').trim();
// //       const notes = String(formData.get('locationNotes') || '').trim();

// //       const errors: string[] = [];
// //       if (!address1) errors.push('Address is required');
// //       if (!postcode) errors.push('Postcode is required');
// //       if (errors.length) {
// //         alert(errors.join('\n'));
// //         return;
// //       }

// //       const newLocation: LocationFull = {
// //         id: `location_${uuidv4()}`,
// //         locationType: LocationType.SINGLE_LOCATION,
// //         locationName: 'Single Location',
// //         locationAddress1: `${address1}${address2 ? ', ' + address2 : ''} (${postcode})${notes ? ' - ' + notes : ''}`,
// //       };

// //       onAddLocation(newLocation);
// //     } else {
// //       // Use the existing detailed form
// //       const newLocation: LocationFull = {
// //         id: `location_${uuidv4()}`,
// //         locationName: formData.get('locationName') as string,
// //         locationType: formData.get('locationType') as LocationType,
// //         locationAddress1: formData.get('locationAddress1') as string,
// //       };

// //       onAddLocation(newLocation);
// //     }
// //     setIsModalOpen(false);
// //   };

// //   return (
// //     <section aria-labelledby="locations-heading">
// //       <div className="text-center mb-6">
// //         <h2 id="locations-heading" style={t.titleLarge}>Wedding Locations</h2>
// //         <p className="max-w-2xl mx-auto" style={{ ...t.onSurfaceVariant.bodyMedium, marginTop: 8 }}>
// //           Add the key locations for your wedding day, like the ceremony venue, reception hall, and photo spots.
// //         </p>
// //         <Button onClick={() => setIsModalOpen(true)} className="mt-4">Add Location</Button>
// //       </div>

// //       <div className="space-y-4 max-w-3xl mx-auto">
// //         {locations && locations.length > 0 ? (
// //           locations.map(loc => (
// //             <div key={loc.id} className="rounded-lg shadow-md p-5" style={{ backgroundColor: colors.surface }}>
// //               <div className="flex justify-between items-start">
// //                 <div className="flex items-center gap-3">
// //                   <SvgIcon src={getLocationIconSrc(loc.locationType)} size={28} title={loc.locationType} />
// //                   <h3 style={t.titleMedium}>{loc.locationName}</h3>
// //                 </div>
// //                 <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ backgroundColor: colors.primaryContainer, color: colors.onPrimaryContainer }}>{loc.locationType}</span>
// //               </div>
// //               <p style={{ ...t.onSurfaceVariant.bodyMedium, marginTop: 4 }}>{loc.locationAddress1}</p>
// //             </div>
// //           ))
// //         ) : (
// //           <p className="text-gray-500 text-center">No locations added yet.</p>
// //         )}
// //       </div>

// //       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Location">
// //         <form onSubmit={handleSubmit}>
// //           {/* Multiple Locations toggle at top, initially unchecked */}
// //           <div className="mb-4 flex items-center gap-2">
// //             <input
// //               id="multipleLocations"
// //               name="multipleLocations"
// //               type="checkbox"
// //               checked={multipleLocations}
// //               onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMultipleLocations(e.target.checked)}
// //               className="h-4 w-4 rounded border-gray-300 text-[#4A90E2] focus:ring-[#4A90E2]"
// //             />
// //             <label htmlFor="multipleLocations" className="text-sm font-medium text-gray-700">Multiple Locations</label>
// //           </div>

// //           {/* If no location exists, show the Single Location minimal form */}
// //           {(!locations || locations.length === 0) ? (
// //             <>
// //               <div className="mb-4">
// //                 <label htmlFor="locationAddress1" className="block text-sm font-medium text-gray-700">Address</label>
// //                 <input type="text" id="locationAddress1" name="locationAddress1" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
// //               </div>
// //               <div className="mb-4">
// //                 <label htmlFor="locationAddress2" className="block text-sm font-medium text-gray-700">Address 2 (optional)</label>
// //                 <input type="text" id="locationAddress2" name="locationAddress2" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
// //               </div>
// //               <div className="mb-4">
// //                 <label htmlFor="locationPostcode" className="block text-sm font-medium text-gray-700">Postcode</label>
// //                 <input type="text" id="locationPostcode" name="locationPostcode" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
// //               </div>
// //               <div className="mb-4">
// //                 <label htmlFor="locationNotes" className="block text-sm font-medium text-gray-700">Notes (optional)</label>
// //                 <textarea id="locationNotes" name="locationNotes" rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-textarea"></textarea>
// //               </div>
// //             </>
// //           ) : (
// //             <>
// //               <div className="mb-4">
// //                 <label htmlFor="locationName" className="block text-sm font-medium text-gray-700">Location Name</label>
// //                 <input type="text" id="locationName" name="locationName" required placeholder="e.g., Manor House" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-input" />
// //               </div>
// //               <div className="mb-4">
// //                 <label htmlFor="locationType" className="block text-sm font-medium text-gray-700">Location Type</label>
// //                 <select id="locationType" name="locationType" required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-select">
// //                   {Object.values(LocationType).map(type => <option key={type} value={type}>{type}</option>)}
// //                 </select>
// //               </div>
// //               <div className="mb-4">
// //                 <label htmlFor="locationAddress1" className="block text-sm font-medium text-gray-700">Address / Notes</label>
// //                 <textarea id="locationAddress1" name="locationAddress1" rows={2} required placeholder="e.g., 123 Country Lane, Chepstow" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm form-textarea"></textarea>
// //               </div>
// //             </>
// //           )}

// //           <div className="flex justify-end space-x-3 mt-6">
// //             <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
// //             <Button type="submit">Save Location</Button>
// //           </div>
// //         </form>
// //       </Modal>
// //     </section>
// //   );
// // };