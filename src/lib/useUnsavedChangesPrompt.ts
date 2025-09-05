// src/lib/useUnsavedChangesPrompt.ts
import { useEffect } from 'react';

const useUnsavedChangesPrompt = (isDirty: boolean) => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        // Modern browsers show a generic message, but this is required for legacy support.
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
};

export default useUnsavedChangesPrompt;