import { type ReactNode } from 'react';
import FolderNavigationWrapper from './FolderNavigationWrapper';

interface LayoutWrapperProps {
  children: ReactNode;
  folders?: any[];
  config: any;
  articles?: any[];
  categories?: any[];
}

export default function LayoutWrapper({ children, folders = [], config, articles = [], categories = [] }: LayoutWrapperProps) {
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Folder Navigation - appears under header */}
      {folders && folders.length > 0 && (
        <>
          <FolderNavigationWrapper
            folders={folders}
            config={config}
            articles={articles}
            categories={categories}
          />
        </>
      )}
      
      {children}
    </div>
  );
}
