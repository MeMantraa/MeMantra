import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
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
  const isTestEnv = globalThis?.process?.env?.NODE_ENV === 'test';

  const loadSavedMantras = useCallback(async () => {
    if (typeof mantraService.getSavedMantras !== 'function') {
      return;
    }

    try {
      const token = await storage.getToken();
      const res = await mantraService.getSavedMantras(token || 'mock-token');
      setSavedMantras(res);
    } catch (err) {
      if (!isTestEnv) {
        console.log('Error fetching saved mantras:', err);
      }
      Alert.alert('Error', 'Failed to load saved mantras. Please try again later.');
    }
  }, [isTestEnv]);

  useEffect(() => {
    if (isTestEnv && typeof mantraService.getSavedMantras !== 'function') {
      return;
    }
    void loadSavedMantras();
  }, [isTestEnv, loadSavedMantras]);

  const value = useMemo(
    () => ({ savedMantras, setSavedMantras, loadSavedMantras }),
    [savedMantras, loadSavedMantras],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
};

export const useSavedMantras = () => {
  const context = useContext(SavedContext);
  if (!context) throw new Error('useSavedMantras must be used within SavedProvider');
  return context;
};
