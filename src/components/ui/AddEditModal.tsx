import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AddEditModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  entity: T | null;
  title: string;
  children: React.ReactNode;
  isLocked: boolean;
}

export function AddEditModal<T>({
  isOpen,
  onClose,
  onSave,
  title,
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
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <fieldset disabled={isLocked} className="space-y-2 pb-4">
            {children}
          </fieldset>
          <DialogFooter className="flex-col md:flex-row gap-2 w-full">            
            <Button variant="default" size="sm" disabled={isLocked} className="rounded-md shadow-sm text-lg h-8 tracking-wide">
              Save
            </Button>           
            <Button variant="secondary" size="sm" onClick={onClose} className="rounded-md shadow-sm text-lg h-8 tracking-wide">
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

