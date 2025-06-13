import { useEffect } from 'react';

// prompt the user if they try and leave with unsaved changes
export function usePreventReload(enablePrevention: boolean) {
  const warningText = 'You have unsaved changes. Please confirm changes.';
  useEffect(() => {
    const handleWindowClose = (e: BeforeUnloadEvent) => {
      console.log('handleWindowClose', enablePrevention);
      if (!enablePrevention) return;
      e.preventDefault();
      (e || window.event).returnValue = warningText;
      return warningText;
    };
    window.addEventListener('beforeunload', handleWindowClose);
    return () => {
      window.removeEventListener('beforeunload', handleWindowClose);
    };
  }, [enablePrevention]);
}
