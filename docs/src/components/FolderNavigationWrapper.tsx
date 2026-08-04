import { useState, useEffect } from 'react';
import { FolderNavigation } from './FolderNavigation';

interface Folder {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  is_default: boolean;
  display_order?: number;
}

interface Article {
  id: string;
  slug: string;
  category_id: string | null;
  display_order?: number | null;
}

interface Category {
  id: string;
  folder_id?: string | null;
}

interface FolderNavigationWrapperProps {
  folders: Folder[];
  config: any;
  articles?: Article[];
  categories?: Category[];
}

export default function FolderNavigationWrapper({
  folders,
  config,
  articles = [],
  categories = [],
}: FolderNavigationWrapperProps) {
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Sync with theme changes
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Persist folder selection to URL/sessionStorage
  useEffect(() => {
    const handleFolderChange = (folderId: string | null) => {
      setActiveFolderId(folderId);
      // Store in sessionStorage for persistence across page navigations
      if (folderId) {
        sessionStorage.setItem('active-folder-id', folderId);
      } else {
        sessionStorage.removeItem('active-folder-id');
      }
    };

    // Restore from sessionStorage on mount
    const savedFolderId = sessionStorage.getItem('active-folder-id');
    if (savedFolderId) {
      setActiveFolderId(savedFolderId);
    }
  }, []);

  if (!folders || folders.length === 0) {
    return null;
  }

  return (
    <FolderNavigation
      folders={folders}
      activeFolderId={activeFolderId}
      isDark={isDark}
      primaryColor={config.primary_color || '#3b82f6'}
      articles={articles}
      categories={categories}
      onFolderSelect={(folderId) => {
        setActiveFolderId(folderId);
        if (folderId) {
          sessionStorage.setItem('active-folder-id', folderId);
        } else {
          sessionStorage.removeItem('active-folder-id');
        }
      }}
    />
  );
}
