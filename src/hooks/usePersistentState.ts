import { useState, useEffect, useCallback } from 'react';
import { persistentState } from '@/utils/storage';

export interface UsePersistentStateOptions {
  storageKey: string;
  defaultValue: any;
  ttl?: number;
  serialize?: (value: any) => any;
  deserialize?: (value: any) => any;
}

/**
 * Custom hook for persistent state that automatically saves to localStorage
 */
export function usePersistentState<T>(
  storageKey: string,
  defaultValue: T,
  options: { ttl?: number } = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [state, setState] = useState<T>(() => {
    // Load from storage on initialization
    return persistentState.loadAppState(storageKey, defaultValue);
  });

  // Save to storage whenever state changes
  useEffect(() => {
    persistentState.saveAppState(storageKey, state, options.ttl);
  }, [state, storageKey, options.ttl]);

  // Clear function
  const clearState = useCallback(() => {
    persistentState.saveAppState(storageKey, defaultValue, options.ttl);
    setState(defaultValue);
  }, [storageKey, defaultValue, options.ttl]);

  return [state, setState, clearState];
}

/**
 * Hook specifically for form state persistence
 */
export function usePersistentFormState<T>(
  formId: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [state, setState] = useState<T>(() => {
    return persistentState.loadFormState(formId, defaultValue);
  });

  useEffect(() => {
    persistentState.saveFormState(formId, state);
  }, [state, formId]);

  const clearState = useCallback(() => {
    persistentState.clearFormState(formId);
    setState(defaultValue);
  }, [formId, defaultValue]);

  return [state, setState, clearState];
}

/**
 * Hook for user preferences
 */
export function useUserPreference<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    return persistentState.loadUserPreference(key, defaultValue);
  });

  useEffect(() => {
    persistentState.saveUserPreference(key, state);
  }, [state, key]);

  return [state, setState];
}
