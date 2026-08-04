import { cn, getBasePath } from '@/lib/utils';
import { Icon } from './ui/icon';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── HTTP method badge for API reference articles ──────────────────────────────

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET:    { bg: '#22c55e1a', text: '#16a34a' },
  POST:   { bg: '#3b82f61a', text: '#2563eb' },
  PUT:    { bg: '#f59e0b1a', text: '#d97706' },
  PATCH:  { bg: '#f973161a', text: '#ea580c' },
  DELETE: { bg: '#ef44441a', text: '#dc2626' },
};

function SidebarMethodBadge({ method }: { method: string }) {
  const colors = METHOD_COLORS[method] || { bg: '#6b72801a', text: '#4b5563' };
  return (
    <span
      className="inline-flex items-center justify-center px-1.5 rounded text-[9px] font-bold tracking-wider font-mono shrink-0 h-4"
      style={{ background: colors.bg, color: colors.text }}
    >
      {method}
    </span>
  );
}

// Parse API method from sidebar_title and extract clean title
function parseApiTitle(article: Article): { method?: string; displayTitle: string } {
  const sidebarTitle = article.sidebar_title?.trim();
  
  // Check if sidebar_title has HTTP method prefix
  const sidebarMatch = sidebarTitle?.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD)\s+(\/\S*)/i);
  if (sidebarMatch) {
    const method = sidebarMatch[1].toUpperCase();
    
    // If article.title is NOT just the API path format, use it as the display title
    const titleIsNotPath = !article.title?.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD)\s+(\/\S*)/i);
    if (titleIsNotPath && article.title && article.title.trim()) {
      return {
        method,
        displayTitle: article.title.trim(),
      };
    }
    
    // Otherwise, extract a clean title from the path
    const path = sidebarMatch[2];
    // Get the segments and filter out parameters like {id}, :id, etc.
    const segments = path.split('/').filter(segment => {
      if (!segment) return false;
      // Skip path parameters
      if (segment.startsWith('{') || segment.startsWith(':') || segment.startsWith('[')) return false;
      return true;
    });
    
    // Get the last meaningful segment
    const lastSegment = segments[segments.length - 1] || 'API';
    
    // Convert kebab-case or snake_case to Title Case
    const cleanTitle = lastSegment
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return {
      method,
      displayTitle: cleanTitle,
    };
  }
  
  // Check if the title itself looks like a path (starts with /)
  const titleMatch = article.title?.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD)\s+(\/\S*)/i);
  if (titleMatch) {
    const path = titleMatch[2];
    const segments = path.split('/').filter(segment => {
      if (!segment) return false;
      // Skip path parameters
      if (segment.startsWith('{') || segment.startsWith(':') || segment.startsWith('[')) return false;
      return true;
    });
    
    const lastSegment = segments[segments.length - 1] || 'API';
    const cleanTitle = lastSegment
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return {
      method: titleMatch[1].toUpperCase(),
      displayTitle: cleanTitle,
    };
  }
  
  return { displayTitle: sidebarTitle || article.title };
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category_id: string | null;
  is_published: boolean;
  display_order?: number | null;
  sidebar_title?: string | null;
  icon?: string | null;
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

interface HelpCenterSidebarProps {
  config: any;
  categories: Category[];
  articles: Article[];
  selectedCategory: string | null;
  selectedArticle?: Article | null;
  isDark: boolean;
  onCategorySelect?: (categoryId: string | null) => void;
  onArticleSelect?: (article: Article) => void;
  onThemeToggle: () => void;
  getArticleCount: (categoryId: string) => number;
  folders?: Folder[];
}

function sortByOrder<T extends { display_order?: number | null; name?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const orderA = a.display_order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.display_order ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return (a.name ?? '').localeCompare(b.name ?? '');
  });
}

export function HelpCenterSidebar({
  config,
  categories,
  articles,
  selectedCategory,
  selectedArticle,
  isDark,
  onCategorySelect,
  onArticleSelect,
  onThemeToggle,
  getArticleCount,
  folders = [],
}: HelpCenterSidebarProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const sidebarStyle = config?.sidebar_style || 'default';
  const headerLinks = config?.header_links?.slice(0, 3) || [];

  const toggleCollapse = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  };

  const getArticlesForCategory = (categoryId: string): Article[] => {
    const raw = articles.filter(a => a.category_id === categoryId);
    return sortByOrder(raw);
  };

  const getSubCategories = (parentId: string): Category[] => {
    const subs = categories.filter(c => c.parent_category_id === parentId && c.parent_category_id !== '');
    return sortByOrder(subs);
  };

  // Top-level categories: no parent (null, undefined, or empty string), sorted
  const topLevelCategories = sortByOrder(
    categories.filter(c => !c.parent_category_id || c.parent_category_id === '')
  );

  const renderCategoryIcon = (iconName?: string | null, size: 'sm' | 'md' = 'md') => (
    <Icon icon={iconName || 'hugeicons:folder-01'} className={cn('flex-shrink-0', size === 'md' ? 'h-5 w-5' : 'h-4 w-4')} />
  );

  const getArticleUrl = (article: Article): string => {
    const cat = categories.find(c => c.id === article.category_id);
    const folder = cat?.folder_id ? folders.find(f => f.id === cat.folder_id) : null;
    const base = getBasePath(config);
    return folder && !folder.is_default
      ? `${base}/${folder.slug}/article/${article.slug}`
      : `${base}/article/${article.slug}`;
  };

  // ── Render a subcategory nested inside a parent's guide-line block ───────
  // Subcategories share the parent's vertical guide line; they get their own
  // collapsible block with a secondary guide line for their own articles.
  const renderSubCategory = (category: Category) => {
    const isSelected = selectedCategory === category.id;
    const isCollapsed = collapsedCategories.has(category.id);
    const categoryArticles = getArticlesForCategory(category.id);
    const hasContent = categoryArticles.length > 0;

    if (!hasContent) return null;

    return (
      <div key={category.id}>
        {/* Sub-category header */}
        <div className="flex items-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              onCategorySelect?.(category.id);
            }}
            className={cn(
              'flex-1 flex items-center gap-2 py-1.5 text-sm font-medium text-left min-w-0',
              isSelected && !selectedArticle
                ? ''
                : isDark
                ? 'text-zinc-200 hover:text-zinc-100'
                : 'text-zinc-800 hover:text-zinc-900'
            )}
            style={isSelected && !selectedArticle ? { color: config.primary_color } : {}}
          >
            {renderCategoryIcon(category.icon, 'sm')}
            <span className="truncate">{category.name}</span>
          </button>
          <motion.button
            onClick={(e) => { e.preventDefault(); toggleCollapse(category.id); }}
            className={cn(
              'ml-1 p-1 rounded-md w-5 h-5 flex items-center justify-center flex-shrink-0',
              isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 90 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <Icon icon="hugeicons:arrow-right-01" className="h-3 w-3" />
            </motion.div>
          </motion.button>
        </div>

        {/* Sub-category articles */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.04, 0.62, 0.23, 0.98] }}
              className="overflow-hidden"
            >
              <div className="relative pl-[18px]">
                <div className={cn(
                  'absolute left-[9px] top-0 bottom-0 w-px',
                  isDark ? 'bg-zinc-700/60' : 'bg-zinc-200/80'
                )} />
                {categoryArticles.map((article, i) => {
                  const isActive = selectedArticle?.id === article.id;
                  const url = getArticleUrl(article);
                  const { method, displayTitle } = parseApiTitle(article);
                  return (
                    <motion.a
                      key={article.id}
                      href={url}
                      initial={{ x: -6, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.03, duration: 0.15, ease: 'easeOut' }}
                      onClick={(e) => {
                        if (onArticleSelect) {
                          e.preventDefault();
                          onArticleSelect(article);
                        }
                      }}
                      className={cn(
                        'flex items-center gap-1.5 py-1.5 pr-1 text-sm transition-colors min-w-0',
                        isActive
                          ? 'font-medium'
                          : isDark
                          ? 'text-zinc-400 hover:text-zinc-200'
                          : 'text-zinc-500 hover:text-zinc-800'
                      )}
                      style={isActive ? { color: config.primary_color } : {}}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {method ? (
                        <SidebarMethodBadge method={method} />
                      ) : (
                        <Icon icon={article.icon || 'hugeicons:file-02'} className="h-[18px] w-[18px] flex-shrink-0 opacity-70" />
                      )}
                      <span className="truncate">{displayTitle}</span>
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ── Render a category row + its collapsible children ─────────────────────
  // Each category is self-contained; subcategories are rendered inside the
  // parent's collapsible block with a left indent so they visually nest.
  const renderCategory = (category: Category, depth = 0) => {
    const isSelected = selectedCategory === category.id;
    const isCollapsed = collapsedCategories.has(category.id);
    const categoryArticles = getArticlesForCategory(category.id);
    const subCategories = getSubCategories(category.id);
    const hasContent = categoryArticles.length > 0 || subCategories.length > 0;

    if (!hasContent) return null;

    if (sidebarStyle === 'default') {
      return (
        <div key={category.id}>
          {/* Category header row — sticky as user scrolls */}
          <div
            className={cn(
              'flex items-center sticky top-0 z-30 -mx-1 px-1',
            )}
            style={{
              background: isDark
                ? 'linear-gradient(to bottom, #0D0D0D 70%, transparent 100%)'
                : 'linear-gradient(to bottom, hsl(var(--background)) 70%, transparent 100%)',
              paddingBottom: '6px',
            }}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                onCategorySelect?.(category.id);
              }}
              className={cn(
                'flex-1 flex items-center gap-2 py-1.5 text-sm font-medium text-left min-w-0 uppercase',
                isSelected && !selectedArticle
                  ? ''
                  : isDark
                  ? 'text-zinc-400 hover:text-zinc-300'
                  : 'text-zinc-600 hover:text-zinc-700'
              )}
              style={isSelected && !selectedArticle ? { color: config.primary_color } : {}}
            >
              <span className="truncate">{category.name}</span>
            </button>
          </div>

          {/* Children — always visible */}
          <div>

            {/* Articles directly in this category */}
            {categoryArticles.map((article, i) => {
              const isActive = selectedArticle?.id === article.id;
              const url = getArticleUrl(article);
              const { method, displayTitle } = parseApiTitle(article);
              return (
                <motion.a
                  key={article.id}
                  href={url}
                  initial={{ x: -6, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.03, duration: 0.15, ease: 'easeOut' }}
                  onClick={(e) => {
                    if (onArticleSelect) {
                      e.preventDefault();
                      onArticleSelect(article);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-1.5 py-1.5 pr-1 text-sm transition-colors min-w-0',
                    isActive
                      ? 'font-medium'
                      : isDark
                      ? 'text-zinc-400 hover:text-zinc-200'
                      : 'text-zinc-500 hover:text-zinc-800'
                  )}
                  style={isActive ? { color: config.primary_color } : {}}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {method ? (
                    <SidebarMethodBadge method={method} />
                  ) : (
                    <Icon icon={article.icon || 'hugeicons:file-02'} className="h-[18px] w-[18px] flex-shrink-0 opacity-70" />
                  )}
                  <span className="truncate">{displayTitle}</span>
                </motion.a>
              );
            })}

            {/* Sub-categories */}
            {subCategories.length > 0 && (
              <div className="mt-0.5 space-y-0.5">
                {subCategories.map(sub => renderSubCategory(sub))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Non-default styles — flat category button
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      onCategorySelect?.(category.id);
    };

    return (
      <a
        key={category.id}
        href="/"
        onClick={handleClick}
        className={cn(
          'flex items-center gap-2 text-sm font-medium',
          depth > 0 && 'ml-3',
          sidebarStyle === 'compact' ? 'px-2 py-1.5 rounded-lg' : 'px-3 py-2 rounded-xl',
          sidebarStyle === 'modern' && 'rounded-full',
          sidebarStyle === 'cards' && 'rounded-xl shadow-sm border border-border/50',
          sidebarStyle === 'floating' && 'rounded-xl shadow-md border border-border/50 bg-card',
          sidebarStyle === 'bordered' && 'rounded-none border-l-2 border-transparent',
          sidebarStyle === 'underline' && 'rounded-none border-b-2 border-transparent pb-3',
          isSelected
            ? sidebarStyle === 'bordered'
              ? isDark ? 'border-l-zinc-500 text-zinc-200' : 'border-l-zinc-400 text-zinc-900'
              : sidebarStyle === 'underline'
              ? isDark ? 'border-b-zinc-500 text-zinc-200' : 'border-b-zinc-400 text-zinc-900'
              : isDark ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900'
            : isDark
            ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
            : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
        )}
      >
        {renderCategoryIcon(category.icon)}
        <span className={cn('flex-1 text-left truncate', sidebarStyle === 'compact' && 'text-xs')}>
          {category.name}
        </span>
      </a>
    );
  };

  return (
    <aside className={cn(
      'w-full lg:w-64 flex-shrink-0 flex flex-col lg:border-r overflow-hidden sticky top-0',
      'border-border/50 bg-transparent'
    )}
    style={{ height: '100vh' }}
    >
      {/* Top fade overlay */}
      <div
        className="absolute left-0 right-0 top-0 h-12 pointer-events-none z-20"
        style={{
          background: isDark
            ? 'linear-gradient(to bottom, #0D0D0D 40%, transparent 100%)'
            : 'linear-gradient(to bottom, hsl(var(--background)) 40%, transparent 100%)',
        }}
      />
      <div
        className="flex-1 overflow-y-auto pt-2 pb-24 pr-3 custom-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: isDark ? 'rgb(63 63 70) transparent' : 'rgb(212 212 216) transparent',
          height: '100%',
        }}
      >
        {/* Top navigation links */}
        {headerLinks.length > 0 && (
          <div className="border-b py-4 mb-4 border-border/50">
            <div className="space-y-0.5">
              {headerLinks.map((link: any, index: number) => {
                // Use different icons for each link position
                const defaultIcons = [
                  'hugeicons:github',
                  'hugeicons:clock-03',
                  'hugeicons:checkmark-circle-02'
                ];
                const iconToUse = link.icon || defaultIcons[index] || 'hugeicons:link-01';
                
                return (
                  <a
                    key={index}
                    href={link.url}
                    target={link.url.startsWith('http') ? '_blank' : undefined}
                    rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 py-2 text-sm font-medium transition-colors',
                      isDark ? 'text-zinc-300 hover:text-zinc-100' : 'text-zinc-700 hover:text-zinc-900'
                    )}
                  >
                    <div className={cn(
                      'flex items-center justify-center h-8 w-8 rounded-lg border flex-shrink-0',
                      isDark ? 'border-zinc-700/60 bg-zinc-800/40' : 'border-zinc-200/80 bg-zinc-50/40'
                    )}>
                      <Icon icon={iconToUse} className="h-4 w-4" />
                    </div>
                    <span className="flex-1 truncate">{link.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div className={cn(sidebarStyle === 'compact' ? 'pr-1' : 'pr-2')}>
          {/* Home link (non-default styles) */}
          {sidebarStyle !== 'default' && (
            <a
              href="/"
              className={cn(
                'flex items-center gap-3 text-sm font-medium mb-4',
                sidebarStyle === 'compact' ? 'px-2 py-1.5 rounded-lg' : 'px-3 py-2 rounded-xl',
                sidebarStyle === 'modern' && 'rounded-full',
                sidebarStyle === 'cards' && 'rounded-xl shadow-sm border border-border/50',
                sidebarStyle === 'floating' && 'rounded-xl shadow-md border border-border/50 bg-card',
                sidebarStyle === 'bordered' && 'rounded-none border-l-2 border-transparent',
                sidebarStyle === 'underline' && 'rounded-none border-b-2 border-transparent pb-3',
                !selectedCategory
                  ? sidebarStyle === 'bordered'
                    ? isDark ? 'border-l-zinc-500 text-zinc-200' : 'border-l-zinc-400 text-zinc-900'
                    : sidebarStyle === 'underline'
                    ? isDark ? 'border-b-zinc-500 text-zinc-200' : 'border-b-zinc-400 text-zinc-900'
                    : isDark ? 'bg-zinc-800/50 text-zinc-200' : 'bg-zinc-100 text-zinc-900'
                  : isDark
                  ? 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              )}
            >
              <Icon icon="hugeicons:home-01" className={sidebarStyle === 'compact' ? 'h-4 w-4' : 'h-5 w-5'} />
              <span className={sidebarStyle === 'compact' ? 'text-xs' : ''}>Home</span>
            </a>
          )}

          {/* Categories */}
          {(config.show_categories ?? true) && topLevelCategories.length > 0 && (
            <div className={cn(sidebarStyle === 'compact' ? 'mt-3' : '')}>
              {sidebarStyle !== 'minimal' &&
                sidebarStyle !== 'icon-only' &&
                sidebarStyle !== 'underline' &&
                sidebarStyle !== 'default' && (
                  <p className={cn(
                    'px-3 mb-2 text-xs font-medium uppercase tracking-wider',
                    isDark ? 'text-zinc-500' : 'text-zinc-400'
                  )}>
                    Categories
                  </p>
                )}
              {/* Outer relative wrapper */}
              <div className={cn(
                sidebarStyle === 'cards' || sidebarStyle === 'floating' ? 'space-y-2' : 'space-y-4',
              )}>
                {topLevelCategories.map(category => renderCategory(category, 0))}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
