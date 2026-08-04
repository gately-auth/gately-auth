/**
 * useFolderSync — keeps activeFolderId in sync across all page wrapper components.
 *
 * - On mount: reads from sessionStorage
 * - On folder-change event: updates state + sessionStorage
 * - setFolder: writes to sessionStorage + dispatches event so all listeners update
 */
import { useState, useEffect, useCallback } from 'react';

const SESSION_KEY = 'active-folder-id';
const EVENT_NAME = 'folder-change';

export function useFolderSync(initial?: string | null) {
  const [activeFolderId, setActiveFolderIdState] = useState<string | null>(
    initial ?? null
  );

  // On mount: read from sessionStorage if no initial value provided
  useEffect(() => {
    if (initial) {
      setActiveFolderIdState(initial);
      return;
    }
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setActiveFolderIdState(saved);
  }, [initial]);

  // Listen for folder-change events dispatched by any component
  useEffect(() => {
    const handler = (e: Event) => {
      const folderId = (e as CustomEvent<string | null>).detail;
      setActiveFolderIdState(folderId);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  // Setter: persists + broadcasts
  const setFolder = useCallback((folderId: string | null) => {
    setActiveFolderIdState(folderId);
    if (folderId) {
      sessionStorage.setItem(SESSION_KEY, folderId);
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: folderId }));
  }, []);

  return { activeFolderId, setFolder };
}
