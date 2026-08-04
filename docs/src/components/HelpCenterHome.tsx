import { useState, useEffect, useRef } from 'react';
import { cn, getBasePath } from '@/lib/utils';
import { Icon } from './ui/icon';
import { SearchModal } from './SearchModal';
import { HelpCenterHeader } from './HelpCenterHeader';
import { HelpCenterSidebar } from './HelpCenterSidebar';
import { NavigationLoadingBar } from './NavigationLoadingBar';
import { BaseLayoutWrapper } from './BaseLayoutWrapper';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { useGoogleFonts } from '@/hooks/useGoogleFonts';
import { useFolderSync } from '@/hooks/useFolderSync';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category_id: string | null;
  is_published: boolean;
  display_order?: number | null;
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
  parent_category_id?: string | null;
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

interface Faq {
  id: string;
  question: string;
  answer: string;
  is_published: boolean;
}

interface HelpCenterConfig {
  portal_name: string;
  primary_color: string;
  welcome_title: string;
  welcome_subtitle: string;
  theme_mode: 'light' | 'dark' | 'auto';
  logo_url?: string | null;
  show_search?: boolean;
  show_categories?: boolean;
  ai_answer_enabled?: boolean;
  subdomain_url?: string | null;
  sidebar_style?: 'default' | 'minimal' | 'compact' | 'cards' | 'modern' | 'floating' | 'bordered' | 'gradient' | 'icon-only' | 'underline' | 'accordion';
  header_links?: { label: string; url: string }[];
  show_primary_button?: boolean;
  primary_button_label?: string;
  primary_button_url?: string;
  heading_font?: string | null;
  body_font?: string | null;
  sub_path?: string | null;
}

interface HelpCenterHomeProps {
  config: HelpCenterConfig;
  articles: Article[];
  categories: Category[];
  folders?: Folder[];
  faqs: Faq[];
  projectId: string;
  initialFolderId?: string;
}

export default function HelpCenterHome({
  config,
  articles,
  categories,
  folders = [],
  faqs,
  projectId,
  initialFolderId,
}: HelpCenterHomeProps) {
  const [isDark, setIsDark] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { activeFolderId, setFolder: setActiveFolderId } = useFolderSync(initialFolderId);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [clientCategories, setClientCategories] = useState(categories);
  const [clientArticles, setClientArticles] = useState(articles);
  const hasFetchedRef = useRef(false);
  
  // activeFolderId is managed by useFolderSync — synced via custom event across all components

  // Sort categories by display_order (nulls last), then by name
  const sortedCategories = [...clientCategories].sort((a, b) => {
    const orderA = a.display_order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.display_order ?? Number.MAX_SAFE_INTEGER;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    return a.name.localeCompare(b.name);
  });

  // Filter categories by active folder — include subcategories whose parent belongs to the folder
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

  // Client-side fallback: refetch only if SSR data came back empty, and only once
  useEffect(() => {
    if (hasFetchedRef.current) return;
    if (clientCategories.length > 0 && clientArticles.length > 0) return;

    hasFetchedRef.current = true;

    const timer = setTimeout(async () => {
      try {
        const needsArticles = clientArticles.length === 0;
        const needsCategories = clientCategories.length === 0;

        const [articlesResponse, categoriesResponse] = await Promise.all([
          needsArticles ? fetch(`/api/public/projects/${projectId}/help-articles`) : Promise.resolve(null),
          needsCategories ? fetch(`/api/public/projects/${projectId}/help-article-categories`) : Promise.resolve(null),
        ]);

        if (articlesResponse?.ok) {
          const articlesData = await articlesResponse.json();
          const fetchedArticles = articlesData.data?.articles || articlesData.articles || articlesData.data || [];
          if (Array.isArray(fetchedArticles) && fetchedArticles.length > 0) {
            setClientArticles(fetchedArticles);
          }
        }

        if (categoriesResponse?.ok) {
          const categoriesData = await categoriesResponse.json();
          const fetchedCategories = categoriesData.data?.categories || categoriesData.categories || categoriesData.data || [];
          if (Array.isArray(fetchedCategories) && fetchedCategories.length > 0) {
            setClientCategories(fetchedCategories);
          }
        }
      } catch {
        // Silent fail
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle dark mode
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

  const searchResults = searchQuery
    ? clientArticles.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'General';
    return clientCategories.find(c => c.id === categoryId)?.name || 'General';
  };

  const handleArticleClick = (article: Article) => {
    const articleCategory = clientCategories.find(c => c.id === article.category_id);
    const articleFolder = articleCategory?.folder_id 
      ? folders.find(f => f.id === articleCategory.folder_id)
      : null;
    
    // Default folder → no folder prefix in URL
    const url = (articleFolder && !articleFolder.is_default)
      ? `${getBasePath()}/${articleFolder.slug}/article/${article.slug}`
      : `${getBasePath()}/article/${article.slug}`;
    
    window.location.href = url;
  };

  const getArticlesForCategory = (categoryId: string) => {
    return clientArticles.filter(a => a.category_id === categoryId);
  };

  const renderCategoryIcon = (iconName?: string | null) => {
    const icon = iconName || "hugeicons:folder-01";
    return <Icon icon={icon} className="h-8 w-8" style={{ color: config.primary_color }} />;
  };

  const sidebarStyle = config.sidebar_style || 'default';

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
          onSearchOpen={() => setSearchModalOpen(true)}
          onAIOpen={() => setAiChatOpen(!aiChatOpen)}
          folders={folders}
          activeFolderId={activeFolderId}
          onFolderChange={setActiveFolderId}
          articles={clientArticles}
          categories={clientCategories}
          mobileSidebar={
            <HelpCenterSidebar
              config={config}
              categories={filteredCategories}
              articles={clientArticles}
              selectedCategory={selectedCategory}
              isDark={isDark}
              onCategorySelect={setSelectedCategory}
              onThemeToggle={handleThemeToggle}
              getArticleCount={(categoryId) => getArticlesForCategory(categoryId).length}
              folders={folders}
            />
          }
        />
      </div>

      {/* Main Content with Sidebar inside max-width */}
      <div className="flex-1 overflow-y-scroll custom-scrollbar-always">
        <div className="flex mx-auto gap-8 pr-4 md:pr-8" style={{ maxWidth: '1400px' }}>
          {/* Sidebar - Left Column — desktop only */}
          <div data-astro-transition-persist="sidebar" className="hidden lg:block">
            <HelpCenterSidebar
              config={config}
              categories={filteredCategories}
              articles={clientArticles}
              selectedCategory={selectedCategory}
              isDark={isDark}
              onCategorySelect={setSelectedCategory}
              onThemeToggle={handleThemeToggle}
              getArticleCount={(categoryId) => getArticlesForCategory(categoryId).length}
              folders={folders}
            />
          </div>

          {/* Main Content - Center Column */}
          <div className="flex-1 min-w-0 pt-6 pb-12 pl-4 lg:pl-0">
            <div className="flex gap-8">
              {/* Center Content */}
              <div className="flex-1 max-w-3xl">
                {selectedCategory ? (
              /* Category Articles */
              <>
                {(() => {
                  const category = clientCategories.find(c => c.id === selectedCategory);
                  const categoryArticles = getArticlesForCategory(selectedCategory);
                  
                  return (
                    <>
                      <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                          {renderCategoryIcon(category?.icon)}
                          <h1 className="text-3xl font-bold" style={{ fontFamily: config.heading_font || 'system-ui, sans-serif' }}>{category?.name}</h1>
                        </div>
                        {category?.description && (
                          <p className={cn("text-lg", isDark ? "text-zinc-400" : "text-zinc-600")}>
                            {category.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {categoryArticles.map(article => (
                          <button
                            key={article.id}
                            onClick={() => handleArticleClick(article)}
                            className={cn(
                              "w-full flex items-center gap-4 p-4 rounded-xl border text-left group transition-all",
                              isDark
                                ? "bg-transparent backdrop-blur-sm border-zinc-800 hover:border-zinc-700 hover:shadow-sm"
                                : "bg-transparent backdrop-blur-sm border-zinc-100 hover:border-zinc-200 hover:shadow-sm"
                            )}
                          >
                            <Icon icon="hugeicons:file-02" className={cn("h-5 w-5", isDark ? "text-zinc-500" : "text-zinc-400")} />
                            <span className="flex-1 font-medium">{article.title}</span>
                            <Icon icon="hugeicons:arrow-right-01" className={cn(
                              "h-5 w-5 transition-transform group-hover:translate-x-1",
                              isDark ? "text-zinc-600" : "text-zinc-300"
                            )} />
                          </button>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </>
            ) : (
              /* Home View */
              <>
                {/* Hero Section */}
                <div className="py-8 md:py-12">
                  <div className="max-w-2xl text-left">
                    <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: config.heading_font || 'system-ui, sans-serif' }}>
                      {config.welcome_title}
                    </h1>
                    <p className={cn("text-lg mb-6", isDark ? "text-zinc-400" : "text-zinc-600")}>
                      {config.welcome_subtitle}
                    </p>

                    {/* Search Bar with AI Button */}
                    <div className="relative">
                      <button
                        onClick={() => setSearchModalOpen(true)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left group transition-all",
                          isDark
                            ? "bg-transparent backdrop-blur-sm border-zinc-800 hover:border-zinc-700"
                            : "bg-transparent backdrop-blur-sm border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
                        )}
                      >
                        <Icon icon="hugeicons:magic-wand-01" className={cn("h-5 w-5", isDark ? "text-zinc-500" : "text-zinc-400")} />
                        <span className={cn("flex-1 text-base", isDark ? "text-zinc-500" : "text-zinc-400")}>
                          Ask, search, or explain...
                        </span>
                        <Icon icon="hugeicons:arrow-right-01" className={cn(
                          "h-5 w-5 transition-transform group-hover:translate-x-1",
                          isDark ? "text-zinc-600" : "text-zinc-400"
                        )} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Categories Grid - 2 columns to account for right panel */}
                {(config.show_categories ?? true) && filteredCategories.length > 0 && (
                  <div className="mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredCategories.filter(c => getArticlesForCategory(c.id).length > 0).slice(0, 6).map(category => {
                        const categoryArticles = getArticlesForCategory(category.id);
                        const categoryFolder = category.folder_id 
                          ? folders.find(f => f.id === category.folder_id)
                          : null;
                        const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-');
                        const categoryUrl = (categoryFolder && !categoryFolder.is_default)
                          ? `/${categoryFolder.slug}/${categorySlug}`
                          : `/${categorySlug}`;
                        const base = getBasePath(config);

                        return (
                          <a
                            key={category.id}
                            href={`${base}${categoryUrl}`}
                            className={cn(
                              "group flex flex-col items-start gap-4 p-5 rounded-2xl border text-left min-h-[160px] transition-all",
                              isDark
                                ? "bg-transparent backdrop-blur-sm border-zinc-800 hover:border-zinc-700 hover:shadow-md"
                                : "bg-transparent backdrop-blur-sm border-zinc-100 hover:border-zinc-200 hover:shadow-md"
                            )}
                          >
                            {renderCategoryIcon(category.icon)}
                            <div className="flex-1 w-full">
                              <h3 className="font-semibold text-base mb-1.5" style={{ color: isDark ? '#fafafa' : '#18181b' }}>
                                {category.name}
                              </h3>
                              {category.description && (
                                <p className={cn("text-sm line-clamp-2", isDark ? "text-zinc-400" : "text-zinc-500")}>
                                  {category.description}
                                </p>
                              )}
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Frequently Asked Questions Section */}
                {faqs.length > 0 && (
                  <div className="mb-8">
                    <h2
                      className="font-semibold mb-4 text-xl"
                      style={{ color: isDark ? '#fafafa' : '#18181b', fontFamily: config.heading_font || 'system-ui, sans-serif' }}
                    >
                      Frequently Asked Questions
                    </h2>
                    <Accordion type="single" collapsible className="space-y-2">
                      {faqs.slice(0, 5).map((faq) => (
                        <AccordionItem
                          key={faq.id}
                          value={faq.id}
                          className={cn(
                            "rounded-xl border px-4 transition-all",
                            isDark ? "bg-transparent backdrop-blur-sm border-zinc-800" : "bg-transparent backdrop-blur-sm border-zinc-100"
                          )}
                        >
                          <AccordionTrigger
                            className="py-4 hover:no-underline text-base"
                          >
                            <span
                              className="font-medium text-left"
                              style={{ color: isDark ? '#fafafa' : '#18181b' }}
                            >
                              {faq.question}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <div className={cn("text-sm", isDark ? "text-zinc-300" : "text-zinc-600")}>
                              {faq.answer}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </>
            )}
              </div>


            </div>
          </div>


        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        articles={clientArticles}
        categories={clientCategories}
        isDark={isDark}
        primaryColor={config.primary_color}
        aiEnabled={config.ai_answer_enabled}
        onAskAI={(query) => {
          // Add query to URL for AI to pick up
          const url = new URL(window.location.href);
          url.searchParams.set('ai_query', query.trim());
          window.history.pushState({}, '', url.toString());
          
          setAiChatOpen(true);
        }}
      />
      </div>
    </BaseLayoutWrapper>
  );
}
