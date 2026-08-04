import { cn } from '@/lib/utils';
import { Icon } from './ui/icon';

interface Folder {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  is_default: boolean;
}

interface Article {
  id: string;
  slug: string;
  category_id: string | null;
  display_order?: number | null;
}

interface Category {
  id: string;
  folder_id?: string | null;
}

interface FolderNavigationProps {
  folders: Folder[];
  activeFolderId: string | null;
  isDark: boolean;
  primaryColor: string;
  onFolderSelect: (folderId: string | null) => void;
  articles?: Article[];
  categories?: Category[];
}

export function FolderNavigation({
  folders,
  activeFolderId,
  isDark,
  primaryColor,
  onFolderSelect,
  articles = [],
  categories = [],
}: FolderNavigationProps) {
  if (folders.length === 0) {
    return null;
  }

  // Get first article in a folder
  const getFirstArticleInFolder = (folderId: string, isDefault: boolean) => {
    // Default folder should go to root, not first article
    if (isDefault) {
      return null;
    }
    
    // Get categories in this folder
    const folderCategories = categories.filter(cat => cat.folder_id === folderId);
    const folderCategoryIds = new Set(folderCategories.map(c => c.id));
    
    // Get articles in these categories, sorted by display_order
    const folderArticles = articles
      .filter(article => article.category_id && folderCategoryIds.has(article.category_id))
      .sort((a, b) => {
        const orderA = a.display_order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.display_order ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
    
    return folderArticles[0] || null;
  };

  const handleFolderClick = (folder: Folder) => {
    // Default folder goes to root
    if (folder.is_default) {
      window.location.href = '/';
      return;
    }
    
    const firstArticle = getFirstArticleInFolder(folder.id, folder.is_default);
    
    if (firstArticle) {
      // Redirect to first article in folder
      window.location.href = `/article/${firstArticle.slug}`;
    } else {
      // No articles, just select the folder
      onFolderSelect(folder.id);
    }
  };

  return (
    <div
      className={cn(
        "h-[50px] border-b flex items-center px-8 gap-2 overflow-x-auto custom-scrollbar-thin sticky top-[62px] z-10",
        isDark ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-100"
      )}
    >
      {/* All Articles button */}
      <button
        onClick={() => onFolderSelect(null)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
          activeFolderId === null
            ? isDark
              ? "bg-zinc-800 text-white"
              : "bg-white text-zinc-900 border border-zinc-200"
            : isDark
            ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
        )}
      >
        <Icon icon="hugeicons:folder-01" className="h-4 w-4" />
        All Articles
      </button>

      {/* Folder buttons */}
      {folders.map((folder) => (
        <button
          key={folder.id}
          onClick={() => handleFolderClick(folder)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
            activeFolderId === folder.id
              ? isDark
                ? "bg-zinc-800 text-white"
                : "bg-white text-zinc-900 border border-zinc-200"
              : isDark
              ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
          )}

        >
          <Icon
            icon={folder.icon || "hugeicons:folder-library"}
            className="h-4 w-4"
          />
          {folder.name}
        </button>
      ))}
    </div>
  );
}
