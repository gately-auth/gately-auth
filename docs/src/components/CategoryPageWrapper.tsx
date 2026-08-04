import { useState, useEffect, useRef } from 'react';
import { cn, getBasePath } from '@/lib/utils';
import { HelpCenterSidebar } from './HelpCenterSidebar';
import { HelpCenterHeader } from './HelpCenterHeader';
import { Icon } from './ui/icon';
import { useGoogleFonts } from '@/hooks/useGoogleFonts';
import { useFolderSync } from '@/hooks/useFolderSync';
import { NavigationLoadingBar } from './NavigationLoadingBar';
import { BaseLayoutWrapper } from './BaseLayoutWrapper';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category_id: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  display_order?: number | null;
  folder_id?: string | null;
}

interface Folder {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  is_default: boolean;
  display_order?: number;
}

interface CategoryPageWrapperProps {
  config: any;
  category: Category;
  articles: Article[];
  allCategories: Category[];
  allArticles: Article[];
  projectId: string;
  folders?: Folder[];
}

export default function CategoryPageWrapper({
  config,
  category,
  articles,
  allCategories,
  allArticles,
  projectId,
  folders = [],
}: CategoryPageWrapperProps) {
  const [isDark, setIsDark] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const { activeFolderId, setFolder: setActiveFolderId } = useFolderSync();

  // Sort categories by display_order
  const sortedCategories = [...allCategories].sort((a, b) => {
    const orderA = a.display_order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.display_order ?? Number.MAX_SAFE_INTEGER;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    return a.name.localeCompare(b.name);
  });

  // Filter categories by active folder
  const filteredCategories = activeFolderId
    ? sortedCategories.filter(cat => cat.folder_id === activeFolderId)
    : sortedCategories.filter(cat => !cat.folder_id || cat.folder_id === null);

  // Load Google Fonts dynamically
  useGoogleFonts(config.heading_font, config.body_font);

  // Handle dark mode with localStorage and sessionStorage
  useEffect(() => {
    // Check sessionStorage first (for navigation persistence)
    const sessionTheme = sessionStorage.getItem('theme-is-dark');
    if (sessionTheme !== null) {
      const isDarkMode = sessionTheme === '1';
      setIsDark(isDarkMode);
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return;
    }
    
    // Check localStorage second
    const savedTheme = localStorage.getItem('help-center-theme');
    
    if (savedTheme) {
      const isDarkMode = savedTheme === 'dark';
      setIsDark(isDarkMode);
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      sessionStorage.setItem('theme-is-dark', isDarkMode ? '1' : '0');
    } else if (config.theme_mode === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
      sessionStorage.setItem('theme-is-dark', '1');
    } else if (config.theme_mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      if (prefersDark) document.documentElement.classList.add('dark');
      sessionStorage.setItem('theme-is-dark', prefersDark ? '1' : '0');
    } else {
      sessionStorage.setItem('theme-is-dark', '0');
    }
  }, [config.theme_mode]);

  const handleThemeToggle = () => {
    const newIsDark = !isDark;
    
    // Instantly toggle without transition
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    setIsDark(newIsDark);
    localStorage.setItem('help-center-theme', newIsDark ? 'dark' : 'light');
    sessionStorage.setItem('theme-is-dark', newIsDark ? '1' : '0');
  };

  const renderCategoryIcon = (iconName?: string | null) => {
    const icon = iconName || "hugeicons:folder-01";
    return <Icon icon={icon} className="h-6 w-6" style={{ color: config.primary_color }} />;
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
          "flex flex-col h-screen overflow-hidden",
          isDark ? "bg-background text-white" : "bg-white text-zinc-900"
        )}
        style={{ fontFamily: config.body_font || 'system-ui, sans-serif' }}
      >
      {/* Navigation Loading Bar */}
      <NavigationLoadingBar primaryColor={config.primary_color} />

      {/* Header - persists across navigation */}
      <div data-astro-transition-persist="header">
        <HelpCenterHeader
          config={config}
          isDark={isDark}
          onThemeToggle={handleThemeToggle}
          onSearchOpen={() => {}}
          onAIOpen={() => setAiChatOpen(!aiChatOpen)}
          showBackButton={false}
          folders={folders}
          articles={allArticles}
          categories={allCategories}
          mobileSidebar={
            <HelpCenterSidebar
              config={config}
              categories={filteredCategories}
              articles={allArticles}
              selectedCategory={category.id}
              isDark={isDark}
              onThemeToggle={handleThemeToggle}
              getArticleCount={(categoryId) => allArticles.filter(a => a.category_id === categoryId).length}
              folders={folders}
            />
          }
        />
      </div>

      {/* Main Content with Sidebar inside max-width */}
      <div className="flex-1 overflow-hidden">
        <div className="flex mx-auto gap-8 h-full pr-4 md:pr-8" style={{ maxWidth: '1400px' }}>
          {/* Sidebar - Left Column — desktop only */}
          <div data-astro-transition-persist="sidebar" className="hidden lg:block">
            <HelpCenterSidebar
              config={config}
              categories={filteredCategories}
              articles={allArticles}
              selectedCategory={category.id}
              isDark={isDark}
              onThemeToggle={handleThemeToggle}
              getArticleCount={(categoryId) => allArticles.filter(a => a.category_id === categoryId).length}
              folders={folders}
            />
          </div>

          {/* Main Content - Center Column - Scrollable */}
          <div className="flex-1 min-w-0 pt-6 md:pt-8 pb-12 max-w-3xl overflow-y-auto scrollbar-hide pl-4 lg:pl-0">
            {/* Breadcrumb */}
            <nav className={cn("flex items-center gap-2 text-sm mb-6", isDark ? "text-zinc-400" : "text-zinc-500")}>
              <a href={getBasePath()} className="hover:underline">Home</a>
              <Icon icon="hugeicons:arrow-right-01" className="h-3 w-3" />
              <span className={cn(isDark ? "text-zinc-200" : "text-zinc-900")}>{category.name}</span>
            </nav>

            {/* Category Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                {renderCategoryIcon(category.icon)}
                <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: config.heading_font || 'system-ui, sans-serif' }}>
                  {category.name}
                </h1>
              </div>
              {category.description && (
                <p className={cn("text-base md:text-lg", isDark ? "text-zinc-400" : "text-zinc-600")}>
                  {category.description}
                </p>
              )}
            </div>

            {/* Articles List */}
            <div className="space-y-2">
              {articles.length === 0 ? (
                <p className={cn("text-center py-12", isDark ? "text-zinc-500" : "text-zinc-400")}>
                  No articles found in this category.
                </p>
              ) : (
                articles.map(article => {
                  const articleFolder = category.folder_id 
                    ? folders.find(f => f.id === category.folder_id)
                    : null;
                  const articleUrl = articleFolder 
                    ? `${getBasePath()}/${articleFolder.slug}/article/${article.slug}`
                    : `${getBasePath()}/article/${article.slug}`;
                  
                  return (
                    <a
                      key={article.id}
                      href={articleUrl}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl border text-left group",
                      isDark
                        ? "bg-card border-zinc-800 hover:border-zinc-700"
                        : "bg-white border-zinc-100 hover:border-zinc-200 hover:shadow-sm"
                    )}
                  >
                    <Icon icon="hugeicons:file-02" className={cn("h-4 w-4 flex-shrink-0", isDark ? "text-zinc-500" : "text-zinc-400")} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">{article.title}</h3>
                      {article.excerpt && (
                        <p className={cn("text-xs line-clamp-1 mt-0.5", isDark ? "text-zinc-500" : "text-zinc-400")}>
                          {article.excerpt}
                        </p>
                      )}
                    </div>
                    <Icon icon="hugeicons:arrow-right-01" className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isDark ? "text-zinc-600" : "text-zinc-300"
                    )} />
                  </a>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      </div>
    </BaseLayoutWrapper>
  );
}
