import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SaveConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sectionName: string;
  photographerName: string;
  isSaving?: boolean;
}

export const SaveConfirmationDialog: React.FC<SaveConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sectionName,
  photographerName,
  isSaving = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[90vw] max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">
            Complete Section?
          </DialogTitle>
          <DialogDescription className="font-sans text-base mt-2">
            Is this {sectionName} section complete?<br />
            <br />
            Continuing will lock {sectionName} and send it to {photographerName} for review. It can be unlocked for further editing if required.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 w-full">
          <Button
            onClick={onConfirm}
            disabled={isSaving}
            size="sm"
            className="w-full rounded-md shadow-sm text-lg h-8 tracking-wide"
          >
            {isSaving ? 'Saving...' : 'Proceed with Save'}
          </Button>
          <Button
            onClick={onClose}
            disabled={isSaving}
            variant="secondary"
            size="sm"
            className="w-full rounded-md shadow-sm text-lg h-8 tracking-wide"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};