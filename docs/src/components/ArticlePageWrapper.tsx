import { useState, useEffect, useRef, useMemo } from 'react';
import { cn, getBasePath } from '@/lib/utils';
import { HelpCenterSidebar } from './HelpCenterSidebar';
import { HelpCenterHeader } from './HelpCenterHeader';
import { ArticleContentViewer, MethodBadge, METHOD_COLORS } from './help-center/ArticleContentViewer';
import { TryItModal } from './help-center/TryItModal';
import { CodeExamplesPanel } from './help-center/CodeExamplesPanel';
import { ArticleFeedback } from './help-center/ArticleFeedback';
import { CopyDropdown } from './help-center/CopyDropdown';
import { Icon } from './ui/icon';
import { useGoogleFonts } from '@/hooks/useGoogleFonts';
import { useFolderSync } from '@/hooks/useFolderSync';
import { NavigationLoadingBar } from './NavigationLoadingBar';
import { BaseLayoutWrapper } from './BaseLayoutWrapper';
import { SearchModal } from './SearchModal';
import { ErrorBoundary } from './ErrorBoundary';

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

interface ArticlePageWrapperProps {
  config: any;
  article: Article;
  articleBlocks?: any[] | null;
  categories: Category[];
  allArticles: Article[];
  categoryName: string;
  articleUrl: string;
  formattedDate: string;
  projectId: string;
  folders?: Folder[];
  /** URL to the project's OpenAPI spec — reserved for future use */
  apiSpecUrl?: string | null;
}

export default function ArticlePageWrapper({
  config,
  article,
  articleBlocks,
  categories,
  allArticles,
  categoryName,
  articleUrl,
  formattedDate,
  projectId,
  folders = [],
  apiSpecUrl,
}: ArticlePageWrapperProps) {
  const [isDark, setIsDark] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const { activeFolderId, setFolder: setActiveFolderId } = useFolderSync();
  const [tryItModalOpen, setTryItModalOpen] = useState(false);

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

  // Get previous and next articles in the same category
  const categoryArticles = allArticles
    .filter(a => a.category_id === article.category_id && a.is_published)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  const currentIndex = categoryArticles.findIndex(a => a.id === article.id);
  const previousArticle = currentIndex > 0 ? categoryArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex < categoryArticles.length - 1 ? categoryArticles[currentIndex + 1] : null;

  // Detect if this is an API reference article:
  // - title starts with HTTP method (GET /path, POST /path, etc.)
  // - OR the article is in a folder named "API Reference"
  const isApiRefArticle = useMemo(() => {
    const methodPattern = /^(GET|POST|PUT|PATCH|DELETE|HEAD)\s+\//i;
    // sidebar_title is set by CLI from `api` frontmatter: "GET /members"
    if (methodPattern.test((article as any).sidebar_title || '')) return true;
    if (methodPattern.test(article.title || '')) return true;
    const cat = categories.find(c => c.id === article.category_id);
    const folder = cat?.folder_id ? folders.find(f => f.id === cat.folder_id) : null;
    return folder?.name?.toLowerCase().includes('api') ?? false;
  }, [article, categories, folders]);

  // Extract HTTP method + path from article title for API reference articles
  const { method, path, hasEndpoint } = useMemo(() => {
    if (!isApiRefArticle) return { method: '', path: '', hasEndpoint: false };
    
    const sources = [(article as any).sidebar_title, article.title, article.excerpt];
    for (const s of sources) {
      const m = s?.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD)\s+(\/\S*)/i);
      if (m) {
        let extractedPath = m[2];
        try {
          const apiBaseUrl = config.api_base_url || 'https://api.usegately.com/api/v1';
          const baseUrlObj = new URL(apiBaseUrl);
          const basePath = baseUrlObj.pathname.replace(/\/$/, '');
          if (basePath && extractedPath.startsWith(basePath)) {
            extractedPath = extractedPath.slice(basePath.length) || '/';
          }
        } catch {
          // If baseUrl is invalid, use path as-is
        }
        return { method: m[1].toUpperCase(), path: extractedPath, hasEndpoint: true };
      }
    }
    return { method: '', path: '', hasEndpoint: false };
  }, [isApiRefArticle, article, config.api_base_url]);

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

  // Handle TOC rendering
  useEffect(() => {
    const handleTocUpdate = (event: any) => {
      const tocItems = event.detail;
      const tocContainer = document.getElementById('toc-container');
      
      if (tocContainer && tocItems && tocItems.length > 0) {
        tocContainer.innerHTML = `
          <p class="text-xs font-semibold uppercase tracking-wider mb-3 ${
            isDark ? 'text-zinc-500' : 'text-zinc-400'
          }">
            On this page
          </p>
          <nav>
            ${tocItems.map((item: any) => `
              <a
                href="#${item.id}"
                data-toc-id="${item.id}"
                class="block w-full text-left text-sm py-1.5 transition-all duration-200 border-l-2 no-underline ${
                  item.level === 1 ? 'pl-3' : item.level === 2 ? 'pl-5' : 'pl-7'
                } ${
                  isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700'
                }"
                style="border-color: var(--border-color, hsl(var(--border) / 0.2));"
              >
                ${item.text}
              </a>
            `).join('')}
          </nav>
        `;

        // Add click handlers for smooth scrolling
        const tocLinks = tocContainer.querySelectorAll('a[data-toc-id]');
        tocLinks.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = link.getAttribute('data-toc-id');
            const element = document.getElementById(id!);
            const container = document.getElementById('article-scroll-container');
            
            if (element && container) {
              let offsetTop = 0;
              let el: any = element;
              while (el && el !== container) {
                offsetTop += el.offsetTop;
                el = el.offsetParent;
              }
              
              container.scrollTo({
                top: Math.max(0, offsetTop - 80),
                behavior: 'smooth'
              });

              window.history.pushState(null, '', `#${id}`);
              
              tocLinks.forEach(l => {
                l.classList.remove('font-medium');
                (l as HTMLElement).style.borderColor = '';
                (l as HTMLElement).style.color = '';
              });
              link.classList.add('font-medium');
              (link as HTMLElement).style.borderColor = isDark ? '#ffffff' : '#000000';
              (link as HTMLElement).style.color = isDark ? '#ffffff' : '#000000';
            }
          });
        });

        // Scroll spy
        const container = document.getElementById('article-scroll-container');
        if (container) {
          const handleScroll = () => {
            let currentId = '';
            for (const item of tocItems) {
              const element = document.getElementById(item.id);
              if (element) {
                let offsetTop = 0;
                let el: any = element;
                while (el && el !== container) {
                  offsetTop += el.offsetTop;
                  el = el.offsetParent;
                }
                
                if (container.scrollTop >= offsetTop - 100) {
                  currentId = item.id;
                }
              }
            }
            
            if (currentId) {
              tocLinks.forEach(link => {
                const isActive = link.getAttribute('data-toc-id') === currentId;
                if (isActive) {
                  link.classList.add('font-medium');
                  (link as HTMLElement).style.borderColor = isDark ? '#ffffff' : '#000000';
                  (link as HTMLElement).style.color = isDark ? '#ffffff' : '#000000';
                } else {
                  link.classList.remove('font-medium');
                  (link as HTMLElement).style.borderColor = '';
                  (link as HTMLElement).style.color = '';
                }
              });
            }
          };
          
          container.addEventListener('scroll', handleScroll);
          return () => container.removeEventListener('scroll', handleScroll);
        }
      }
    };

    window.addEventListener('toc-updated', handleTocUpdate);
    return () => window.removeEventListener('toc-updated', handleTocUpdate);
  }, [isDark, config.primary_color]);

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

  const chatgptLink = config.chatgpt_link || 'https://chatgpt.com';
  const claudeLink = config.claude_link || 'https://claude.ai';

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
      <NavigationLoadingBar primaryColor={isDark ? '#ffffff' : '#000000'} />

      {/* Header - persists across navigation */}
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
          mobileSidebar={
            <HelpCenterSidebar
              config={config}
              categories={filteredCategories}
              articles={allArticles}
              selectedCategory={article.category_id}
              selectedArticle={article}
              isDark={isDark}
              onThemeToggle={handleThemeToggle}
              getArticleCount={(categoryId) => allArticles.filter(a => a.category_id === categoryId).length}
            />
          }
        />
      </div>

      {/* Main Content with Sidebar inside max-width */}
      <div className="flex-1 overflow-hidden">
        <div className="flex mx-auto gap-8 h-full pr-4 md:pr-8" style={{ maxWidth: '1400px' }}>
          {/* Sidebar - Left Column — desktop only */}
          <div data-astro-transition-persist="sidebar" className="hidden lg:block self-start sticky top-0" style={{ height: 'calc(100vh - var(--header-height, 57px))' }}>
            <HelpCenterSidebar
              config={config}
              categories={filteredCategories}
              articles={allArticles}
              selectedCategory={article.category_id}
              selectedArticle={article}
              isDark={isDark}
              onThemeToggle={handleThemeToggle}
              getArticleCount={(categoryId) => allArticles.filter(a => a.category_id === categoryId).length}
            />
          </div>

          {/* Article Content - Center Column - Scrollable */}
          <div className={cn(
            "flex-1 min-w-0 pt-6 md:pt-8 pb-12 overflow-y-auto scrollbar-hide pl-4 lg:pl-0",
            !isApiRefArticle && "max-w-[720px]"
          )} id="article-scroll-container">
            {/* Article Header with Copy Options */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
              {/* Category Badge and Title */}
              <div className="flex-1 min-w-0">
                <span
                  className="inline-block text-xs font-medium px-2.5 py-1 rounded-none mb-3"
                  style={{ backgroundColor: `${isDark ? '#ffffff' : '#000000'}15`, color: isDark ? '#ffffff' : '#000000' }}
                >
                  {categoryName}
                </span>
                <h1
                  className="text-2xl md:text-3xl font-bold mb-2"
                  style={{ fontFamily: config.heading_font || 'system-ui, sans-serif' }}
                >
                  {article.title}
                </h1>
                {article.excerpt && !isApiRefArticle && (
                  <p className={cn("text-base mt-2", isDark ? "text-zinc-400" : "text-zinc-600")}>
                    {article.excerpt}
                  </p>
                )}
              </div>

              {/* Copy as Markdown — always visible */}
              <div className="flex-shrink-0">
                <CopyDropdown
                    article={article}
                    categoryName={categoryName}
                    articleUrl={articleUrl}
                    chatgptLink={chatgptLink}
                    claudeLink={claudeLink}
                    isDark={isDark}
                    primaryColor={isDark ? '#ffffff' : '#000000'}
                    projectId={projectId}
                    allArticles={allArticles}
                    categories={sortedCategories}
                  />
              </div>
            </div>

            {/* API Reference: Show excerpt and Try It button */}
            {isApiRefArticle && article.excerpt && (
              <div className="mb-6">
                <p className={cn(
                  "text-base mb-4",
                  isDark ? "text-zinc-400" : "text-zinc-600"
                )}>
                  {article.excerpt}
                </p>
                {hasEndpoint && (
                  <div className={cn(
                    'flex items-center justify-between gap-3 px-4 py-3 rounded-none font-mono text-sm',
                    isDark ? 'bg-zinc-800/60 border border-zinc-700' : 'bg-zinc-100 border border-zinc-200'
                  )}>
                    <div className="flex items-center gap-2.5">
                      <MethodBadge method={method} />
                      <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>
                        {(() => {
                          try {
                            const apiBaseUrl = config.api_base_url || 'https://api.usegately.com/api/v1';
                            const baseUrlObj = new URL(apiBaseUrl);
                            const basePath = baseUrlObj.pathname.replace(/\/$/, '');
                            return basePath + path;
                          } catch {
                            return path;
                          }
                        })()}
                      </span>
                    </div>
                    <button
                      onClick={() => setTryItModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium text-white transition-all hover:opacity-90 active:scale-95"
                      style={{ backgroundColor: isDark ? '#ffffff' : '#000000' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M1 1l10 5-10 5V1z"/>
                      </svg>
                      Try It
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Article Content */}
            <div className="min-h-[400px]">
              <ErrorBoundary>
                <ArticleContentViewer
                  key={article.id}
                  content={article.content}
                  initialBlocks={articleBlocks}
                  isDark={isDark}
                  primaryColor={isDark ? '#ffffff' : '#000000'}
                  showToc={!isApiRefArticle}
                  articleId={article.id}
                  projectId={projectId}
                  updatedAt={article.updated_at}
                  showFeedback={false}
                  headingFont={config.heading_font}
                  bodyFont={config.body_font}
                  isApiReference={isApiRefArticle}
                  apiBaseUrl={config.api_base_url || 'https://api.usegately.com/api/v1'}
                  article={article}
                />
              </ErrorBoundary>
            </div>

            {/* Feedback Section */}
            <div className="mt-8 pt-6 pb-4 border-b border-border/50">
              <ArticleFeedback
                articleId={article.id}
                projectId={projectId}
                isDark={isDark}
                compact={true}
                horizontal={true}
              />
            </div>

            {/* Edit this page */}
            <div className="pt-4 pb-6 border-b border-border/50">
              <a
                href={`${config.github_repo ?? 'https://github.com/gately-auth/gately-auth'}/edit/main/docs/src/data/articles/${
                  (() => {
                    const cat = categories.find(c => c.id === article.category_id);
                    const catSlug = cat?.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') ?? 'general';
                    return `${catSlug}/${article.slug}.ts`;
                  })()
                }`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs font-medium transition-colors',
                  isDark
                    ? 'text-zinc-500 hover:text-zinc-300'
                    : 'text-zinc-400 hover:text-zinc-700'
                )}
              >
                <Icon icon="hugeicons:pencil-edit-01" className="h-3.5 w-3.5" />
                Edit this page on GitHub
              </a>
            </div>

            {/* Pagination - Previous/Next Articles */}
            {(previousArticle || nextArticle) && (
              <div className="mt-6 pb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Previous Article */}
                  {previousArticle ? (
                    <a
                      href={(() => {
                        const prevCategory = categories.find(c => c.id === previousArticle.category_id);
                        const prevFolder = prevCategory?.folder_id 
                          ? folders.find(f => f.id === prevCategory.folder_id)
                          : null;
                        return prevFolder 
                          ? `${getBasePath()}/${prevFolder.slug}/article/${previousArticle.slug}`
                          : `${getBasePath()}/article/${previousArticle.slug}`;
                      })()}
                      className={cn(
                        "flex flex-col gap-2 p-4 rounded-none border group transition-colors bg-card border-border/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon 
                          icon="hugeicons:arrow-left-01" 
                          className={cn("h-4 w-4 text-muted-foreground")} 
                        />
                        <span className={cn("text-xs font-medium text-muted-foreground")}>
                          Previous
                        </span>
                      </div>
                      <span className={cn(
                        "text-sm font-medium line-clamp-2 group-hover:underline text-foreground"
                      )}>
                        {previousArticle.title}
                      </span>
                    </a>
                  ) : (
                    <div></div>
                  )}

                  {/* Next Article */}
                  {nextArticle && (
                    <a
                      href={(() => {
                        const nextCategory = categories.find(c => c.id === nextArticle.category_id);
                        const nextFolder = nextCategory?.folder_id 
                          ? folders.find(f => f.id === nextCategory.folder_id)
                          : null;
                        return nextFolder 
                          ? `${getBasePath()}/${nextFolder.slug}/article/${nextArticle.slug}`
                          : `${getBasePath()}/article/${nextArticle.slug}`;
                      })()}
                      className={cn(
                        "flex flex-col gap-2 p-4 rounded-none border group transition-colors text-right bg-card border-border/50"
                      )}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <span className={cn("text-xs font-medium text-muted-foreground")}>
                          Next
                        </span>
                        <Icon 
                          icon="hugeicons:arrow-right-01" 
                          className={cn("h-4 w-4 text-muted-foreground")} 
                        />
                      </div>
                      <span className={cn(
                        "text-sm font-medium line-clamp-2 group-hover:underline text-foreground"
                      )}>
                        {nextArticle.title}
                      </span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - TOC for regular articles, Code Examples for API reference */}
          {!isApiRefArticle ? (
            <aside 
              className={cn(
                "hidden lg:block w-64 flex-shrink-0 sticky overflow-auto pt-8",
                isDark ? "text-zinc-400" : "text-zinc-500",
                // Custom scrollbar styles
                "[&::-webkit-scrollbar]:w-1.5",
                "[&::-webkit-scrollbar-track]:bg-transparent",
                isDark 
                  ? "[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:hover:bg-zinc-700" 
                  : "[&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-thumb]:hover:bg-zinc-400",
                "[&::-webkit-scrollbar-thumb]:rounded-none"
              )}
              style={{ 
                minWidth: '16rem', 
                maxWidth: '16rem', 
                top: '0',
                height: '100vh',
                maxHeight: '100vh'
              }}
            >
              <div id="toc-container"></div>
            </aside>
          ) : (
            <aside 
              className={cn(
                "hidden lg:block w-[360px] flex-shrink-0 sticky overflow-auto pt-8 pl-6 border-l",
                isDark ? "border-zinc-800" : "border-zinc-200",
                // Custom scrollbar styles
                "[&::-webkit-scrollbar]:w-1.5",
                "[&::-webkit-scrollbar-track]:bg-transparent",
                isDark 
                  ? "[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:hover:bg-zinc-700" 
                  : "[&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-thumb]:hover:bg-zinc-400",
                "[&::-webkit-scrollbar-thumb]:rounded-none"
              )}
              style={{ 
                minWidth: '360px', 
                maxWidth: '360px', 
                top: '0',
                height: '100vh',
                maxHeight: '100vh'
              }}
            >
              <CodeExamplesPanel
                key={article.id}
                content={article.content}
                isDark={isDark}
                primaryColor={isDark ? '#ffffff' : '#000000'}
              />
            </aside>
          )}
        </div>
      </div>

      </div>
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        articles={allArticles}
        categories={categories}
        isDark={isDark}
        primaryColor={isDark ? '#ffffff' : '#000000'}
        aiEnabled={config.ai_answer_enabled}
      />

      {/* Try It Modal for API reference articles */}
      {isApiRefArticle && hasEndpoint && (
        <TryItModal
          isOpen={tryItModalOpen}
          onClose={() => setTryItModalOpen(false)}
          method={method}
          path={path}
          baseUrl={config.api_base_url || 'https://api.usegately.com/api/v1'}
          primaryColor={isDark ? '#ffffff' : '#000000'}
          isDark={isDark}
          description={article.excerpt}
          headingFont={config.heading_font}
          bodyFont={config.body_font}
          parameters={[]}
        />
      )}

      {/* API Playground — reserved for future use */}
      {/* {apiSpecUrl && <ApiPlayground />} */}
    </BaseLayoutWrapper>
  );
}
