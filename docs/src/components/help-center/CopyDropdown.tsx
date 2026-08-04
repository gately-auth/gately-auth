import { useState } from 'react';
import { Icon } from '../ui/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn, getBasePath } from '@/lib/utils';

interface CopyDropdownProps {
  article: {
    title: string;
    content: string;
    category_id: string | null;
    slug?: string;
  };
  categoryName: string;
  articleUrl: string;
  chatgptLink: string;
  claudeLink: string;
  isDark: boolean;
  primaryColor: string;
  projectId: string;
  allArticles?: Array<{
    id: string;
    title: string;
    content: string;
    category_id: string | null;
    slug: string;
  }>;
  categories?: Array<{
    id: string;
    name: string;
  }>;
}

export function CopyDropdown({
  article,
  categoryName,
  articleUrl,
  chatgptLink,
  claudeLink,
  isDark,
  primaryColor,
  projectId,
  allArticles = [],
  categories = [],
}: CopyDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const isMounted = true;

  const stripHtml = (html: string) => {
    return html
      .replace(/<\/p>/g, '\n\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g, '\n## $1\n')
      .replace(/<[^>]*>?/gm, '');
  };

  const copyAsMarkdown = () => {
    const title = article.title;
    const category = categoryName;
    const url = articleUrl;
    const cleanContent = stripHtml(article.content);
    const markdown = `---\nURL: ${url}\nTitle: ${title}\nCategory: ${category}\n---\n\n${cleanContent}`;
    navigator.clipboard.writeText(markdown);
    setShowToast(true);
    setIsOpen(false);
    setTimeout(() => setShowToast(false), 2000);
  };

  const viewFullPageMarkdown = () => {
    // Navigate to .txt version of the article
    const slug = article.slug || 'page';
    window.open(`${getBasePath()}/article/${slug}.txt`, '_blank');
    setIsOpen(false);
  };

  const viewAllArticlesMarkdown = () => {
    // Navigate to all articles .txt file
    window.open('/articles.txt', '_blank');
    setIsOpen(false);
  };

  if (!isMounted) return null;

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex items-center h-[30px] rounded-xl border text-xs font-semibold shadow-sm hover:bg-accent focus:outline-none",
              isDark
                ? 'bg-background border-border/50 text-foreground'
                : 'bg-card border-border/50 text-foreground'
            )}
          >
            {/* Left: direct copy action */}
            <div
              className="flex items-center gap-2 px-3 h-full hover:bg-accent/60 rounded-l-xl transition-colors"
              onClick={(e) => { e.stopPropagation(); copyAsMarkdown(); }}
            >
              {showToast
                ? <Icon icon="hugeicons:checkmark-01" className="h-3.5 w-3.5 text-green-500" />
                : <Icon icon="hugeicons:copy-01" className="h-3.5 w-3.5" />
              }
              <span>{showToast ? 'Copied!' : 'Copy as Markdown'}</span>
            </div>
            {/* Right: open dropdown */}
            <div className="border-l px-2 h-full flex items-center border-border/50 hover:bg-accent/60 rounded-r-xl transition-colors">
              <Icon icon="hugeicons:arrow-down-01" className="h-3 w-3" />
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuItem onClick={copyAsMarkdown} className="flex items-center gap-2 p-1.5 cursor-pointer">
            <div className="w-[30px] h-[30px] rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Icon icon="hugeicons:copy-01" className="h-4 w-4" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">Copy page</p>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={viewFullPageMarkdown} className="flex items-center gap-2 p-1.5 cursor-pointer">
            <div className="w-[30px] h-[30px] rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Icon icon="hugeicons:file-view" className="h-4 w-4" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">View as Markdown</p>
            </div>
          </DropdownMenuItem>

          {allArticles.length > 0 && (
            <DropdownMenuItem onClick={viewAllArticlesMarkdown} className="flex items-center gap-2 p-1.5 cursor-pointer">
              <div className="w-[30px] h-[30px] rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Icon icon="hugeicons:file-02" className="h-4 w-4" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">View all articles</p>
              </div>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => {
              window.open(chatgptLink, '_blank');
              setIsOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 cursor-pointer"
          >
            <div className="w-[30px] h-[30px] rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Icon icon="simple-icons:openai" className="h-4 w-4" />
            </div>
            <div className="flex-1 text-left flex items-center justify-between">
              <p className="font-medium text-sm">Open in ChatGPT</p>
              <Icon icon="hugeicons:arrow-up-right-01" className="h-3 w-3 opacity-50" />
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              window.open(claudeLink, '_blank');
              setIsOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 cursor-pointer"
          >
            <div className="w-[30px] h-[30px] rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Icon icon="hugeicons:claude" className="h-4 w-4" />
            </div>
            <div className="flex-1 text-left flex items-center justify-between">
              <p className="font-medium text-sm">Open in Claude</p>
              <Icon icon="hugeicons:arrow-up-right-01" className="h-3 w-3 opacity-50" />
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Toast for dropdown-triggered copy */}
      {showToast && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 ${
          isDark ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-900 border border-zinc-200'
        }`}>
          Copied as Markdown ✓
        </div>
      )}
    </>
  );
}
