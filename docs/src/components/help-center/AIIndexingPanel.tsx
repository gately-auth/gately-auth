import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { cn } from '@/lib/utils';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.usegately.com/api';

interface IndexingStatus {
  totalArticles: number;
  indexedArticles: number;
  pendingArticles: number;
  indexingPercentage: number;
  lastIndexed?: string;
}

interface AIIndexingPanelProps {
  projectId: string;
  isDark?: boolean;
  primaryColor?: string;
}

export function AIIndexingPanel({ projectId, isDark = false, primaryColor = '#3b82f6' }: AIIndexingPanelProps) {
  const [status, setStatus] = useState<IndexingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/help-center/index/status`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch indexing status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIndex = async () => {
    setIsIndexing(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/help-center/index`, {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Successfully indexed ${result.data.articlesIndexed} articles!` 
        });
        await fetchStatus();
      } else {
        setMessage({ type: 'error', text: 'Indexing failed. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to start indexing.' });
    } finally {
      setIsIndexing(false);
    }
  };

  const handleReindex = async () => {
    if (!confirm('This will regenerate embeddings for all articles. Continue?')) {
      return;
    }

    setIsIndexing(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/help-center/reindex`, {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Successfully re-indexed ${result.data.articlesIndexed} articles!` 
        });
        await fetchStatus();
      } else {
        setMessage({ type: 'error', text: 'Re-indexing failed. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to start re-indexing.' });
    } finally {
      setIsIndexing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [projectId]);

  if (isLoading && !status) {
    return (
      <div className={cn(
        "p-6 rounded-lg border",
        isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
      )}>
        <div className="flex items-center gap-2">
          <Icon icon="hugeicons:loading-03" className="h-5 w-5 animate-spin" style={{ color: primaryColor }} />
          <span className={cn("text-sm", isDark ? "text-zinc-400" : "text-zinc-600")}>
            Loading indexing status...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-6 rounded-lg border",
      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Icon icon="hugeicons:artificial-intelligence-04" className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
        <div>
          <h3 className={cn("font-semibold", isDark ? "text-white" : "text-zinc-900")}>
            AI Content Indexing
          </h3>
          <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-zinc-600")}>
            Manage AI search indexing for your help articles
          </p>
        </div>
      </div>

      {status && (
        <div className="space-y-4">
          {/* Status Overview */}
          <div className={cn(
            "p-4 rounded-lg",
            isDark ? "bg-zinc-800" : "bg-zinc-50"
          )}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className={cn("text-2xl font-bold", isDark ? "text-white" : "text-zinc-900")}>
                  {status.totalArticles}
                </div>
                <div className={cn("text-xs", isDark ? "text-zinc-400" : "text-zinc-600")}>
                  Total Articles
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {status.indexedArticles}
                </div>
                <div className={cn("text-xs", isDark ? "text-zinc-400" : "text-zinc-600")}>
                  Indexed
                </div>
              </div>
              <div>
                <div className={cn(
                  "text-2xl font-bold",
                  status.pendingArticles > 0 ? "text-orange-500" : "text-green-500"
                )}>
                  {status.pendingArticles}
                </div>
                <div className={cn("text-xs", isDark ? "text-zinc-400" : "text-zinc-600")}>
                  Pending
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className={cn("text-xs font-medium", isDark ? "text-zinc-300" : "text-zinc-700")}>
                  Indexing Progress
                </span>
                <span className={cn("text-xs font-medium", isDark ? "text-zinc-300" : "text-zinc-700")}>
                  {status.indexingPercentage}%
                </span>
              </div>
              <div className={cn(
                "h-2 rounded-full overflow-hidden",
                isDark ? "bg-zinc-700" : "bg-zinc-200"
              )}>
                <div 
                  className="h-full transition-all duration-500 rounded-full"
                  style={{ 
                    width: `${status.indexingPercentage}%`,
                    backgroundColor: primaryColor
                  }}
                />
              </div>
            </div>

            {status.lastIndexed && (
              <div className={cn("text-xs mt-2", isDark ? "text-zinc-400" : "text-zinc-600")}>
                Last indexed: {new Date(status.lastIndexed).toLocaleString()}
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className={cn(
              "p-3 rounded-lg text-sm",
              message.type === 'success' 
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            )}>
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleIndex}
              disabled={isIndexing || status.pendingArticles === 0}
              className="flex-1"
              style={{ backgroundColor: primaryColor }}
            >
              {isIndexing ? (
                <>
                  <Icon icon="hugeicons:loading-03" className="h-4 w-4 mr-2 animate-spin" />
                  Indexing...
                </>
              ) : (
                <>
                  <Icon icon="hugeicons:database-sync" className="h-4 w-4 mr-2" />
                  Index Pending ({status.pendingArticles})
                </>
              )}
            </Button>

            <Button
              onClick={handleReindex}
              disabled={isIndexing}
              variant="outline"
              className={cn(
                "flex-1",
                isDark ? "border-zinc-700 hover:bg-zinc-800" : "border-zinc-300 hover:bg-zinc-50"
              )}
            >
              <Icon icon="hugeicons:refresh" className="h-4 w-4 mr-2" />
              Re-index All
            </Button>

            <Button
              onClick={fetchStatus}
              disabled={isIndexing}
              variant="outline"
              size="icon"
              className={cn(
                isDark ? "border-zinc-700 hover:bg-zinc-800" : "border-zinc-300 hover:bg-zinc-50"
              )}
            >
              <Icon icon="hugeicons:refresh" className="h-4 w-4" />
            </Button>
          </div>

          {/* Info */}
          <div className={cn(
            "p-3 rounded-lg text-xs",
            isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"
          )}>
            <div className="flex gap-2">
              <Icon icon="hugeicons:information-circle" className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">About AI Indexing</p>
                <p className="opacity-80">
                  Articles are automatically indexed when published. Use "Index Pending" to index any articles that were missed, 
                  or "Re-index All" to regenerate embeddings after major content updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
