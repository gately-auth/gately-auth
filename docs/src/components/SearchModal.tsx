import { useState, useEffect, useRef } from 'react';
import { cn, getBasePath } from '@/lib/utils';
import { Icon } from './ui/icon';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  categories: Category[];
  isDark: boolean;
  primaryColor: string;
  aiEnabled?: boolean;
  onAskAI?: (query: string) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  articles,
  categories,
  isDark,
  primaryColor,
  aiEnabled,
  onAskAI,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [isRedirectingToAI, setIsRedirectingToAI] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSearch = (searchQuery: string) => {
    const results = articles.filter((article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // If no results found and AI is enabled, automatically ask AI
    if (results.length === 0 && searchQuery.trim() && aiEnabled && onAskAI && !isRedirectingToAI) {
      setIsRedirectingToAI(true);
      // Small delay to show "redirecting to AI" message before switching
      setTimeout(() => {
        // Add query to URL for AI to pick up
        const url = new URL(window.location.href);
        url.searchParams.set('ai_query', searchQuery.trim());
        window.history.pushState({}, '', url.toString());
        
        onAskAI(searchQuery);
        onClose();
        setIsRedirectingToAI(false);
      }, 1200);
    }
    
    return results;
  };

  const filteredArticles = handleSearch(query);

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'General';
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'General';
  };

  const handleAskAI = () => {
    if (query.trim() && onAskAI) {
      // Add query to URL for AI to pick up
      const url = new URL(window.location.href);
      url.searchParams.set('ai_query', query.trim());
      window.history.pushState({}, '', url.toString());
      
      onAskAI(query);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={cn(
        "relative w-full max-w-xl rounded-xl border shadow-2xl overflow-hidden",
        isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
      )}>
        {/* Search Input */}
        <div className={cn(
          "flex items-center gap-3 px-4 border-b",
          isDark ? "border-zinc-800" : "border-zinc-100"
        )}>
          <Icon icon="hugeicons:search-01" className={cn("h-5 w-5", isDark ? "text-zinc-500" : "text-zinc-400")} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search articles or ask AI..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.shiftKey && aiEnabled && query.trim()) {
                e.preventDefault();
                handleAskAI();
              }
            }}
            className={cn(
              "flex-1 py-4 bg-transparent border-0 outline-none text-base",
              isDark ? "text-white placeholder:text-zinc-500" : "text-zinc-900 placeholder:text-zinc-400"
            )}
          />
          {aiEnabled && (
            <button
              onClick={handleAskAI}
              disabled={!query.trim()}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium",
                query.trim()
                  ? "text-white"
                  : isDark ? "bg-zinc-800 text-zinc-500" : "bg-zinc-100 text-zinc-400"
              )}
              style={query.trim() ? { backgroundColor: primaryColor } : {}}
            >
              <Icon icon="hugeicons:magic-wand-01" width={14} height={14} />
              Ask AI
            </button>
          )}
          <kbd className={cn(
            "hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
            isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"
          )}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-auto p-2">
          {query === '' ? (
            <div className={cn("px-3 py-8 text-center", isDark ? "text-zinc-500" : "text-zinc-400")}>
              <Icon icon="hugeicons:search-01" className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Start typing to search articles</p>
              {aiEnabled && (
                <p className="text-xs mt-2">or ask AI for help</p>
              )}
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="space-y-1">
              {/* AI Ask Option at top when enabled */}
              {aiEnabled && query.trim() && (
                <button
                  onClick={handleAskAI}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left mb-2",
                    "border-2 border-dashed",
                    isDark ? "border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600" : "border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300"
                  )}
                >
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <Icon icon="hugeicons:magic-wand-01" width={16} height={16} style={{ color: primaryColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium", isDark ? "text-white" : "text-zinc-900")}>
                      Ask AI: "{query}"
                    </p>
                    <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-zinc-400")}>
                      Get an AI-powered answer
                    </p>
                  </div>
                  <Icon icon="hugeicons:arrow-right-01" className={cn("h-4 w-4 flex-shrink-0", isDark ? "text-zinc-600" : "text-zinc-300")} />
                </button>
              )}
              {filteredArticles.map((article) => (
                <a
                  key={article.id}
                  href={`${getBasePath()}/article/${article.slug}`}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left",
                    isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-50"
                  )}
                >
                  <Icon icon="hugeicons:file-02" width={16} height={16} className={cn("flex-shrink-0", isDark ? "text-zinc-500" : "text-zinc-400")} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium truncate", isDark ? "text-white" : "text-zinc-900")}>
                      {article.title}
                    </p>
                    <p className={cn("text-xs truncate", isDark ? "text-zinc-500" : "text-zinc-400")}>
                      {getCategoryName(article.category_id)}
                    </p>
                  </div>
                  <Icon icon="hugeicons:arrow-right-01" className={cn("h-4 w-4 flex-shrink-0", isDark ? "text-zinc-600" : "text-zinc-300")} />
                </a>
              ))}
            </div>
          ) : (
            <div className={cn("px-3 py-8 text-center", isDark ? "text-zinc-500" : "text-zinc-400")}>
              {isRedirectingToAI ? (
                <>
                  <div className="animate-spin mx-auto mb-3 w-8 h-8 border-2 border-current border-t-transparent rounded-full" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }} />
                  <p className="text-sm font-medium" style={{ color: primaryColor }}>
                    Asking AI about "{query}"...
                  </p>
                  <p className="text-xs mt-1">
                    Redirecting to AI chat
                  </p>
                </>
              ) : (
                <>
                  <Icon icon="hugeicons:file-02" width={32} height={32} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No articles found for "{query}"</p>
                  {aiEnabled && (
                    <button
                      onClick={handleAskAI}
                      className={cn(
                        "mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                      )}
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Icon icon="hugeicons:magic-wand-01" width={16} height={16} />
                      Ask AI instead
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
