'use client';

// Import necessary React hooks and UI components.
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription, // WHAT: Imported DialogDescription for accessibility.
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// WHY: The interface is updated to include an optional 'description' prop.
// This allows a descriptive text to be passed to the modal, which is important for screen readers.
interface AddEditModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  entity: T | null;
  title: string;
  description?: string; // WHAT: Added optional description prop.
  children: React.ReactNode;
  isLocked: boolean;
}

export function AddEditModal<T>({
  isOpen,
  onClose,
  onSave,
  title,
  description, // WHAT: Destructured the new description prop.
  children,
  isLocked,
}: AddEditModalProps<T>) {
  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLocked) {
      onSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[90vw] max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">{title}</DialogTitle>
          {/* WHY: Conditionally rendering the DialogDescription component when a description is provided.
              This resolves the accessibility warning by associating a description with the dialog. */}
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <fieldset disabled={isLocked} className="space-y-2 pb-4">
            {children}
          </fieldset>
          <DialogFooter className="flex-col md:flex-row gap-2 w-full">
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isLocked}
              className="rounded-md shadow-sm text-lg h-8 tracking-wide"
            >
              Save
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="rounded-md shadow-sm text-lg h-8 tracking-wide"
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';

// interface AddEditModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: () => void;
//   title: string;
//   description?: string; // Optional description for accessibility
//   children: React.ReactNode;
//   isSaving?: boolean;
//   formId: string;
// }

// export function AddEditModal({
//   isOpen,
//   onClose,
//   onSave,
//   title,
//   description,
//   children,
//   isSaving = false,
//   formId,
// }: AddEditModalProps) {
//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[425px]">
//         <DialogHeader>
//           <DialogTitle>{title}</DialogTitle>
//           {description && <DialogDescription>{description}</DialogDescription>}
//         </DialogHeader>
//         {children}
//         <DialogFooter>
//           <Button type="button" variant="outline" onClick={onClose}>
//             Cancel
//           </Button>
//           <Button type="submit" form={formId} disabled={isSaving}>
//             {isSaving ? 'Saving...' : 'Save'}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

// import React from 'react';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';

// interface AddEditModalProps<T> {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: () => void;
//   entity: T | null;
//   title: string;
//   children: React.ReactNode;
//   isLocked: boolean;
// }

// export function AddEditModal<T>({
//   isOpen,
//   onClose,
//   onSave,
//   title,
//   children,
//   isLocked,
// }: AddEditModalProps<T>) {
//   if (!isOpen) {
//     return null;
//   }

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!isLocked) {
//       onSave();
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
//       <DialogContent className="w-[90vw] max-w-md text-center">
//         <DialogHeader>
//           <DialogTitle className="text-2xl font-serif">{title}</DialogTitle>
//         </DialogHeader>
//         <form onSubmit={handleSubmit}>
//           <fieldset disabled={isLocked} className="space-y-2 pb-4">
//             {children}
//           </fieldset>
//           <DialogFooter className="flex-col md:flex-row gap-2 w-full">            
//             <Button variant="default" size="sm" disabled={isLocked} className="rounded-md shadow-sm text-lg h-8 tracking-wide">
//               Save
//             </Button>           
//             <Button variant="secondary" size="sm" onClick={onClose} className="rounded-md shadow-sm text-lg h-8 tracking-wide">
//               Cancel
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

