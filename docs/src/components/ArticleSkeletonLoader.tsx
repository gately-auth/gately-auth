import { cn } from '@/lib/utils';

interface ArticleSkeletonLoaderProps {
  isDark?: boolean;
}

export function ArticleSkeletonLoader({ isDark = false }: ArticleSkeletonLoaderProps) {
  return (
    <div className={cn(
      "flex h-screen overflow-hidden",
      isDark ? "bg-[#121212] text-white" : "bg-white text-zinc-900"
    )}>
      {/* Sidebar Skeleton */}
      <aside className={cn(
        "flex-shrink-0 flex flex-col border-r w-72",
        isDark ? "bg-transparent border-zinc-800" : "bg-zinc-50/50 border-zinc-100"
      )}>
        {/* Header */}
        <div className={cn(
          "h-14 border-b flex items-center px-4",
          isDark ? "border-zinc-800" : "border-zinc-100"
        )}>
          <div className={cn(
            "h-7 w-32 rounded animate-pulse",
            isDark ? "bg-zinc-800" : "bg-zinc-200"
          )} />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-auto p-3 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <div className={cn(
                "h-8 rounded-lg animate-pulse",
                isDark ? "bg-zinc-800" : "bg-zinc-200"
              )} />
              <div className="ml-6 pl-3 space-y-1">
                <div className={cn(
                  "h-6 rounded animate-pulse",
                  isDark ? "bg-zinc-800/50" : "bg-zinc-100"
                )} />
                <div className={cn(
                  "h-6 rounded animate-pulse",
                  isDark ? "bg-zinc-800/50" : "bg-zinc-100"
                )} />
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={cn(
          "border-t p-3",
          isDark ? "border-zinc-800" : "border-zinc-100"
        )}>
          <div className={cn(
            "h-6 w-32 mx-auto rounded animate-pulse",
            isDark ? "bg-zinc-800" : "bg-zinc-200"
          )} />
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={cn(
          "h-14 border-b flex items-center justify-between px-8",
          isDark ? "border-zinc-800 bg-[#121212]" : "border-zinc-100 bg-white"
        )}>
          <div className={cn(
            "h-8 w-20 rounded-xl animate-pulse",
            isDark ? "bg-zinc-800" : "bg-zinc-200"
          )} />
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-8 w-20 rounded-xl animate-pulse",
              isDark ? "bg-zinc-800" : "bg-zinc-200"
            )} />
            <div className={cn(
              "h-8 w-8 rounded-xl animate-pulse",
              isDark ? "bg-zinc-800" : "bg-zinc-200"
            )} />
          </div>
        </header>

        {/* Article Content */}
        <div className="flex-1 overflow-auto">
          <div className="flex max-w-7xl mx-auto px-8 py-6 gap-8">
            {/* Article */}
            <div className="flex-1 min-w-0 max-w-[720px] space-y-4">
              {/* Breadcrumb */}
              <div className={cn(
                "h-4 w-64 rounded animate-pulse",
                isDark ? "bg-zinc-800" : "bg-zinc-200"
              )} />

              {/* Category badge */}
              <div className={cn(
                "h-6 w-24 rounded-full animate-pulse",
                isDark ? "bg-zinc-800" : "bg-zinc-200"
              )} />

              {/* Title */}
              <div className={cn(
                "h-10 w-full rounded animate-pulse",
                isDark ? "bg-zinc-800" : "bg-zinc-200"
              )} />

              {/* Date */}
              <div className={cn(
                "h-4 w-32 rounded animate-pulse",
                isDark ? "bg-zinc-800" : "bg-zinc-200"
              )} />

              {/* Content lines */}
              <div className="space-y-3 pt-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-4 rounded animate-pulse",
                      i % 3 === 0 ? "w-3/4" : "w-full",
                      isDark ? "bg-zinc-800" : "bg-zinc-200"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* TOC Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0 space-y-2">
              <div className={cn(
                "h-4 w-24 rounded animate-pulse",
                isDark ? "bg-zinc-800" : "bg-zinc-200"
              )} />
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-3 rounded animate-pulse",
                    i % 2 === 0 ? "w-3/4" : "w-full",
                    isDark ? "bg-zinc-800" : "bg-zinc-200"
                  )}
                />
              ))}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
