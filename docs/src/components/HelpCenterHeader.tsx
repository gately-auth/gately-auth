import { useEffect, useState } from 'react';
import { cn, getBasePath } from '@/lib/utils';
import { Icon } from './ui/icon';
import { useFolderSync } from '@/hooks/useFolderSync';
import { Sheet, SheetContent } from './ui/sheet';

interface Folder {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  is_default: boolean;
  display_order?: number;
}

interface HelpCenterHeaderProps {
  config: any;
  isDark: boolean;
  onThemeToggle: () => void;
  onSearchOpen?: () => void;
  onAIOpen?: () => void;
  showBackButton?: boolean;
  folders?: Folder[];
  activeFolderId?: string | null;
  onFolderChange?: (folderId: string | null) => void;
  articles?: any[];
  categories?: any[];
  /** Mobile sidebar content — rendered inside the drawer */
  mobileSidebar?: React.ReactNode;
}

export function HelpCenterHeader({
  config,
  isDark,
  onThemeToggle,
  onSearchOpen,
  onAIOpen,
  showBackButton = false,
  folders = [],
  activeFolderId = null,
  onFolderChange,
  articles = [],
  categories = [],
  mobileSidebar,
}: HelpCenterHeaderProps) {
  const { activeFolderId: syncedFolderId, setFolder } = useFolderSync(activeFolderId);
  const localActiveFolderId = syncedFolderId;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (activeFolderId) setFolder(activeFolderId);
  }, [activeFolderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const getFirstArticleInFolder = (folderId: string, isDefault: boolean) => {
    if (isDefault) return null;
    const folderCategories = categories.filter((cat: any) => cat.folder_id === folderId);
    const folderCategoryIds = new Set(folderCategories.map((c: any) => c.id));
    return articles
      .filter((a: any) => a.category_id && folderCategoryIds.has(a.category_id))
      .sort((a: any, b: any) => (a.display_order ?? 999) - (b.display_order ?? 999))[0] || null;
  };

  const handleFolderSelect = (folderId: string | null) => {
    setFolder(folderId);
    if (onFolderChange) onFolderChange(folderId);
    setMobileMenuOpen(false);
  };

  const basePath = getBasePath(config);

  return (
    <>
      {/* ── Main Header ─────────────────────────────────────────────────── */}
      <header className={cn(
        "h-[56px] md:h-[62px] border-b flex items-center flex-shrink-0 backdrop-blur-lg sticky top-0 z-20 px-4 md:px-8",
        isDark ? "border-zinc-800/50" : "border-zinc-100/50"
      )}>
        <div className="flex items-center justify-between w-full" style={{ maxWidth: '1400px', margin: '0 auto' }}>

          {/* Left — hamburger (mobile) + logo */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Hamburger — mobile only */}
            {mobileSidebar && (
              <>
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className={cn(
                    "lg:hidden p-2 rounded-lg -ml-1",
                    isDark ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-100"
                  )}
                  aria-label="Open navigation"
                >
                  <Icon icon="hugeicons:menu-01" className="h-5 w-5" />
                </button>
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetContent
                    side="left"
                    className="p-0 w-[280px] overflow-y-auto"
                  >
                    {mobileSidebar}
                  </SheetContent>
                </Sheet>
              </>
            )}

            {/* Logo */}
            <a
              href={typeof window !== 'undefined' ? window.location.origin : '/'}
              className="flex items-center gap-2 hover:opacity-80 flex-shrink-0"
            >
              {config.logo_url ? (
                <img src={config.logo_url} alt="Logo" className="h-6 w-auto object-contain max-w-[120px]" />
              ) : (
                <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${config.primary_color}15` }}>
                  <Icon icon="hugeicons:book-open-01" className="h-4 w-4" style={{ color: config.primary_color }} />
                </div>
              )}
              <span className="font-semibold text-sm hidden sm:block" style={{ fontFamily: config.heading_font || 'system-ui, sans-serif' }}>
                {config.portal_name}
              </span>
            </a>
          </div>

          {/* Center — search (hidden on mobile, shown md+) */}
          <div className="hidden md:flex items-center justify-center flex-1 gap-2 px-6">
            {showBackButton ? (
              <a href={basePath || '/'} className={cn("flex items-center gap-2 text-sm", isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-600 hover:text-zinc-900")}>
                <Icon icon="hugeicons:arrow-left-01" className="h-4 w-4" />
                Back
              </a>
            ) : config.show_search && onSearchOpen ? (
              <>
                <button
                  onClick={onSearchOpen}
                  className={cn(
                    "flex items-center gap-2 px-2 rounded-xl text-sm w-full max-w-sm border h-[38px] bg-transparent",
                    isDark ? "border-zinc-800/50 text-zinc-400 hover:border-zinc-700/50" : "border-zinc-200 text-zinc-400 hover:border-zinc-300"
                  )}
                >
                  <Icon icon="hugeicons:search-01" className="h-4 w-4" />
                  <span className="flex-1 text-left">Search...</span>
                  <div className="flex items-center gap-1">
                    <kbd className={cn("h-6 w-6 rounded-lg flex items-center justify-center border bg-transparent", isDark ? "border-zinc-700 text-zinc-500" : "border-zinc-300 text-zinc-400")}>
                      <Icon icon="hugeicons:command" className="h-3.5 w-3.5" />
                    </kbd>
                    <kbd className={cn("h-6 w-6 rounded-lg flex items-center justify-center text-xs font-semibold border bg-transparent", isDark ? "border-zinc-700 text-zinc-500" : "border-zinc-300 text-zinc-400")}>
                      K
                    </kbd>
                  </div>
                </button>
                {onAIOpen && (
                  <button
                    onClick={onAIOpen}
                    className={cn(
                      "hidden lg:flex items-center gap-1.5 px-3 rounded-xl text-sm font-medium border flex-shrink-0 h-[38px] transition-colors",
                      isDark ? "border-zinc-800/50 text-zinc-300 hover:border-zinc-700/50 hover:bg-zinc-800/50" : "border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                    )}
                  >
                    <Icon icon="hugeicons:ai-brain-01" className="h-4 w-4" style={{ color: config.primary_color }} />
                    <span>Ask AI</span>
                  </button>
                )}
              </>
            ) : null}
          </div>

          {/* Right — actions */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Search icon — mobile only */}
            {config.show_search && onSearchOpen && (
              <button
                onClick={onSearchOpen}
                className={cn(
                  "md:hidden p-2 rounded-lg",
                  isDark ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-100"
                )}
                aria-label="Search"
              >
                <Icon icon="hugeicons:search-01" className="h-5 w-5" />
              </button>
            )}

            {/* Nav links — desktop only */}
            {config.header_links?.length > 0 && (
              <nav className="hidden md:flex items-center gap-1">
                {config.header_links.slice(0, 3).filter((l: any) => l.label && l.url).map((link: any, i: number) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("px-3 py-1.5 rounded-xl text-sm", isDark ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100")}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            )}

            {/* Primary button — desktop only */}
            {config.show_primary_button && config.primary_button_label && (
              <a
                href={config.primary_button_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-white"
                style={{ backgroundColor: config.primary_color }}
              >
                {config.primary_button_label}
              </a>
            )}

            {/* Theme toggle */}
            <button
              onClick={onThemeToggle}
              className={cn("p-2 rounded-full h-[32px] w-[32px] flex items-center justify-center", isDark ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100")}
            >
              {isDark ? <Icon icon="hugeicons:sun-03" className="h-4 w-4" /> : <Icon icon="hugeicons:moon-02" className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Folder nav bar ───────────────────────────────────────────────── */}
      {folders.length > 0 && (
        <div
          className={cn("flex items-center px-4 md:px-8 overflow-x-auto sticky z-10 border-b folder-nav-scrollbar bg-background border-border/30")}
          style={{ top: '56px', height: '48px', borderBottomWidth: '1px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex items-center gap-1 md:gap-4 w-full h-full" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {folders.map((folder) => {
              const firstArticle = getFirstArticleInFolder(folder.id, folder.is_default);
              const folderHref = folder.is_default
                ? (basePath || '/')
                : firstArticle
                  ? `${basePath}/article/${firstArticle.slug}`
                  : `${basePath}/${folder.slug}`;
              const isActive = localActiveFolderId === folder.id;
              return (
                <a
                  key={folder.id}
                  href={folderHref}
                  data-astro-prefetch="load"
                  onClick={() => handleFolderSelect(folder.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 md:px-0 text-xs md:text-sm font-medium whitespace-nowrap flex-shrink-0 h-full relative transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  style={{ borderBottom: isActive ? `2px solid ${config.primary_color}` : '2px solid transparent' }}
                >
                  <Icon icon={folder.icon || "hugeicons:folder-library"} className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  {folder.name}
                </a>
              );
            })}
          </div>
        </div>
      )}

      <style>{`.folder-nav-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </>
  );
}
