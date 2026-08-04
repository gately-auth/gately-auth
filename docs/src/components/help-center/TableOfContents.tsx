import { cn } from '@/lib/utils';

interface TableOfContentsProps {
  isDark: boolean;
  primaryColor: string;
  className?: string;
  children?: React.ReactNode;
}

export function TableOfContents({
  isDark,
  primaryColor,
  className,
  children,
}: TableOfContentsProps) {
  return (
    <div 
      className={cn(
        "sticky h-fit max-h-screen overflow-auto",
        isDark ? "text-zinc-400" : "text-zinc-500",
        className
      )}
      style={{ 
        top: '0'
      }}
    >
      <div id="toc-container"></div>
      {children}
    </div>
  );
}
