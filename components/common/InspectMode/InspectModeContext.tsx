import { createContext, useContext, useState, useCallback } from 'react';

type InspectModeContextType = {
  inspectMode: boolean;
  toggleInspectMode: () => void;
};

const InspectModeContext = createContext<InspectModeContextType>({
  inspectMode: false,
  toggleInspectMode: () => {}
});

export function InspectModeProvider({ children }: { children: React.ReactNode }) {
  const [inspectMode, setInspectMode] = useState(false);
  const toggleInspectMode = useCallback(() => setInspectMode(v => !v), []);

  return (
    <InspectModeContext.Provider value={{ inspectMode, toggleInspectMode }}>{children}</InspectModeContext.Provider>
  );
}

export function useInspectMode() {
  return useContext(InspectModeContext);
}
