import { useState, useEffect } from 'react';
import { cn, getBasePath } from '@/lib/utils';
import { Icon } from './ui/icon';
import { HelpCenterHeader } from './HelpCenterHeader';
import { HelpCenterSidebar } from './HelpCenterSidebar';
import { NavigationLoadingBar } from './NavigationLoadingBar';
import { BaseLayoutWrapper } from './BaseLayoutWrapper';
import { useGoogleFonts } from '@/hooks/useGoogleFonts';

interface NotFoundPageProps {
  config: any;
  articles?: any[];
  categories?: any[];
  folders?: any[];
  projectId: string;
}

export default function NotFoundPage({
  config,
  articles = [],
  categories = [],
  folders = [],
  projectId,
}: NotFoundPageProps) {
  const [isDark, setIsDark] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  useGoogleFonts(config.heading_font, config.body_font);

  useEffect(() => {
    const savedFolderId = sessionStorage.getItem('active-folder-id');
    if (savedFolderId) setActiveFolderId(savedFolderId);
  }, []);

  useEffect(() => {
    const sessionTheme = sessionStorage.getItem('theme-is-dark');
    if (sessionTheme !== null) {
      const dark = sessionTheme === '1';
      setIsDark(dark);
      document.documentElement.classList.toggle('dark', dark);
      return;
    }
    const saved = localStorage.getItem('help-center-theme');
    if (saved) {
      const dark = saved === 'dark';
      setIsDark(dark);
      document.documentElement.classList.toggle('dark', dark);
      sessionStorage.setItem('theme-is-dark', dark ? '1' : '0');
    } else if (config.theme_mode === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
      sessionStorage.setItem('theme-is-dark', '1');
    } else if (config.theme_mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
      sessionStorage.setItem('theme-is-dark', prefersDark ? '1' : '0');
    } else {
      sessionStorage.setItem('theme-is-dark', '0');
    }
  }, [config.theme_mode]);

  const handleThemeToggle = () => {
    const newDark = !isDark;
    document.documentElement.classList.toggle('dark', newDark);
    setIsDark(newDark);
    localStorage.setItem('help-center-theme', newDark ? 'dark' : 'light');
    sessionStorage.setItem('theme-is-dark', newDark ? '1' : '0');
  };

  const sortedCategories = [...categories].sort((a, b) => {
    const orderA = a.display_order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.display_order ?? Number.MAX_SAFE_INTEGER;
    return orderA !== orderB ? orderA - orderB : a.name.localeCompare(b.name);
  });

  const filteredCategories = activeFolderId
    ? sortedCategories.filter(c => c.folder_id === activeFolderId)
    : sortedCategories.filter(c => !c.folder_id);

  return (
    <BaseLayoutWrapper
      config={config}
      projectId={projectId}
      isDark={isDark}
      aiChatOpen={aiChatOpen}
      onAiChatToggle={() => setAiChatOpen(!aiChatOpen)}
    >
      <div
        className={cn('flex flex-col h-screen overflow-hidden bg-background text-foreground')}
        style={{ fontFamily: config.body_font || 'system-ui, sans-serif' }}
      >
        <NavigationLoadingBar primaryColor={config.primary_color} />

        <div data-astro-transition-persist="header">
          <HelpCenterHeader
            config={config}
            isDark={isDark}
            onThemeToggle={handleThemeToggle}
            onSearchOpen={() => {}}
            onAIOpen={() => setAiChatOpen(!aiChatOpen)}
            folders={folders}
            activeFolderId={activeFolderId}
            onFolderChange={setActiveFolderId}
            articles={articles}
            categories={categories}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex mx-auto gap-8 h-full" style={{ maxWidth: '1400px' }}>
            {/* Sidebar */}
            <div data-astro-transition-persist="sidebar" className="hidden lg:block">
              <HelpCenterSidebar
                config={config}
                categories={filteredCategories}
                articles={articles}
                selectedCategory={null}
                isDark={isDark}
                onThemeToggle={handleThemeToggle}
                getArticleCount={(id) => articles.filter(a => a.category_id === id).length}
                folders={folders}
              />
            </div>

            {/* 404 Content */}
            <div className="flex-1 min-w-0 flex items-center justify-center pt-8 pb-12">
              <div className="text-center max-w-md">
                <div className="mb-6">
                  <Icon
                    icon="hugeicons:sad-dizzy"
                    className="h-20 w-20 mx-auto text-muted-foreground/30"
                  />
                </div>
                <h1
                  className="text-4xl font-bold mb-3"
                  style={{ fontFamily: config.heading_font || 'system-ui, sans-serif' }}
                >
                  Page Not Found
                </h1>
                <p className="text-muted-foreground mb-8">
                  Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
                </p>
                <a
                  href={getBasePath()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:bg-accent text-sm font-medium transition-colors"
                >
                  <Icon icon="hugeicons:arrow-left-01" className="h-4 w-4" />
                  Go back home
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseLayoutWrapper>
  );
}
