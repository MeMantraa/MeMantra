import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { Mantra, mantraService } from '../services/mantra.service';
import { storage } from '../utils/storage';

type SavedContextType = {
  savedMantras: Mantra[];
  setSavedMantras: React.Dispatch<React.SetStateAction<Mantra[]>>;
  loadSavedMantras: () => Promise<void>;
};

const SavedContext = createContext<SavedContextType | undefined>(undefined);

export const SavedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedMantras, setSavedMantras] = useState<Mantra[]>([]);

  const loadSavedMantras = async () => {
    try {
      const token = await storage.getToken();
      const res = await mantraService.getSavedMantras(token || 'mock-token');
      setSavedMantras(res);
    } catch (err) {
      console.log('Error fetching saved mantras:', err);
    }
  };

  useEffect(() => {
    loadSavedMantras();
  }, []);

  const value = useMemo(
    () => ({ savedMantras, setSavedMantras, loadSavedMantras }),
    [savedMantras],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
};

export const useSavedMantras = () => {
  const context = useContext(SavedContext);
  if (!context) throw new Error('useSavedMantras must be used within SavedProvider');
  return context;
};
