import { useState, useEffect } from 'react';
import { BaseLayoutWrapper } from './BaseLayoutWrapper';
import { HelpCenterHeader } from './HelpCenterHeader';
import { HelpCenterSidebar } from './HelpCenterSidebar';
import { NavigationLoadingBar } from './NavigationLoadingBar';
import { SearchModal } from './SearchModal';
import { CustomApiReference } from './help-center/CustomApiReference';
import { cn } from '@/lib/utils';
import { useGoogleFonts } from '@/hooks/useGoogleFonts';

interface ApiReferencePageWrapperProps {
  config: any;
  specUrl: string;
  primaryColor: string;
  headingFont?: string | null;
  bodyFont?: string | null;
  baseUrl: string;
  projectId: string;
  categories: any[];
  allArticles: any[];
  folders: any[];
}

export function ApiReferencePageWrapper({
  config,
  specUrl,
  primaryColor,
  headingFont,
  bodyFont,
  baseUrl,
  projectId,
  categories,
  allArticles,
  folders = [],
}: ApiReferencePageWrapperProps) {
  const [isDark, setIsDark] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // Get active folder from sessionStorage on mount
  useEffect(() => {
    const savedFolderId = sessionStorage.getItem('active-folder-id');
    if (savedFolderId) {
      setActiveFolderId(savedFolderId);
    }
  }, []);

  // Handle Cmd+K / Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sort categories by display_order
  const sortedCategories = [...categories].sort((a, b) => {
    const orderA = a.display_order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.display_order ?? Number.MAX_SAFE_INTEGER;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    return a.name.localeCompare(b.name);
  });

  // Filter categories by active folder
  const folderCategoryIds = new Set(
    activeFolderId
      ? sortedCategories.filter(cat => cat.folder_id === activeFolderId).map(c => c.id)
      : sortedCategories.filter(cat => !cat.folder_id || cat.folder_id === null).map(c => c.id)
  );
  const filteredCategories = sortedCategories.filter(cat =>
    folderCategoryIds.has(cat.id) ||
    (cat.parent_category_id && cat.parent_category_id !== '' && folderCategoryIds.has(cat.parent_category_id))
  );

  // Load Google Fonts dynamically
  useGoogleFonts(config.heading_font, config.body_font);

  // Handle dark mode with localStorage and sessionStorage
  useEffect(() => {
    const sessionTheme = sessionStorage.getItem('theme-is-dark');
    if (sessionTheme) {
      setIsDark(sessionTheme === '1');
      return;
    }

    const savedTheme = localStorage.getItem('help-center-theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
      return;
    }

    const themeMode = config.theme_mode || 'light';
    if (themeMode === 'dark') {
      setIsDark(true);
    } else if (themeMode === 'auto') {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, [config.theme_mode]);

  const handleThemeToggle = () => {
    const newIsDark = !isDark;
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    setIsDark(newIsDark);
    localStorage.setItem('help-center-theme', newIsDark ? 'dark' : 'light');
    sessionStorage.setItem('theme-is-dark', newIsDark ? '1' : '0');
  };

  const getArticleCountForCategory = (categoryId: string) => {
    return allArticles.filter(a => a.category_id === categoryId).length;
  };

  return (
    <BaseLayoutWrapper
      config={config}
      projectId={projectId}
      isDark={isDark}
      aiChatOpen={aiChatOpen}
      onAiChatToggle={() => setAiChatOpen(!aiChatOpen)}
    >
      <div 
        className={cn(
          "flex flex-col h-screen overflow-hidden bg-background text-foreground"
        )}
        style={{ fontFamily: config.body_font || 'system-ui, sans-serif' }}
      >
        {/* Navigation Loading Bar */}
        <NavigationLoadingBar primaryColor={config.primary_color} />

        {/* Header */}
        <div data-astro-transition-persist="header" style={{ backgroundColor: 'transparent' }}>
          <HelpCenterHeader
            config={config}
            isDark={isDark}
            onThemeToggle={handleThemeToggle}
            onSearchOpen={() => setSearchModalOpen(true)}
            onAIOpen={() => setAiChatOpen(!aiChatOpen)}
            showBackButton={false}
            folders={folders}
            articles={allArticles}
            categories={categories}
          />
        </div>

        {/* Main content area with sidebar */}
        <div className="flex-1 overflow-hidden">
          <div className="flex mx-auto gap-8 h-full" style={{ maxWidth: '1400px' }}>
            {/* Sidebar - Left Column */}
            <div data-astro-transition-persist="sidebar" className="hidden lg:block">
              <HelpCenterSidebar
                config={config}
                categories={filteredCategories}
                articles={allArticles}
                selectedCategory={null}
                selectedArticle={null}
                isDark={isDark}
                onThemeToggle={handleThemeToggle}
                getArticleCount={getArticleCountForCategory}
                folders={folders}
              />
            </div>

            {/* Main content - Center Column - Scrollable */}
            <main 
              className="flex-1 min-w-0 pt-8 pb-12 overflow-y-auto scrollbar-hide"
              id="article-scroll-container"
            >
              <CustomApiReference
                specUrl={specUrl}
                primaryColor={primaryColor}
                isDark={isDark}
                headingFont={headingFont}
                bodyFont={bodyFont}
                baseUrl={baseUrl}
              />
            </main>
          </div>
        </div>

        {/* Search Modal */}
        <SearchModal
          isOpen={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          articles={allArticles}
          categories={categories}
          isDark={isDark}
          primaryColor={config.primary_color}
        />
      </div>
    </BaseLayoutWrapper>
  );
}
