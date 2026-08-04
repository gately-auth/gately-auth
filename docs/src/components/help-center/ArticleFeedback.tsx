import { useState, useEffect } from 'react';
import { Icon } from '../ui/icon';
import { cn } from '@/lib/utils';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.usegately.com/api';

interface ArticleFeedbackProps {
  articleId: string;
  projectId: string;
  isDark?: boolean;
  compact?: boolean;
  horizontal?: boolean;
}

export function ArticleFeedback({
  articleId,
  projectId,
  isDark = false,
  compact = false,
  horizontal = false,
}: ArticleFeedbackProps) {
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFeedback(null);
    setSubmitted(false);
    setIsSubmitting(false);
    
    const storedFeedback = localStorage.getItem(`article_feedback_${articleId}`);
    if (storedFeedback) {
      setFeedback(storedFeedback as 'helpful' | 'not_helpful');
      setSubmitted(true);
    }
  }, [articleId]);

  useEffect(() => {
    if (!articleId || !projectId) return;
    
    const viewKey = `article_view_${articleId}`;
    if (sessionStorage.getItem(viewKey)) return;
    
    fetch(`${API_BASE_URL}/public/projects/${projectId}/help-articles/${articleId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(console.error);
    
    sessionStorage.setItem(viewKey, 'true');
  }, [articleId, projectId]);

  const handleFeedback = async (isHelpful: boolean) => {
    if (submitted || isSubmitting) return;
    
    setIsSubmitting(true);
    const feedbackType = isHelpful ? 'helpful' : 'not_helpful';
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/public/projects/${projectId}/help-articles/${articleId}/feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ helpful: isHelpful }),
        }
      );
      
      if (response.ok) {
        setFeedback(feedbackType);
        setSubmitted(true);
        localStorage.setItem(`article_feedback_${articleId}`, feedbackType);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (compact) {
    if (horizontal) {
      return (
        <div className="flex items-center justify-between w-full gap-3">
          <p className={cn(
            "text-xs font-medium whitespace-nowrap",
            isDark ? "text-zinc-400" : "text-zinc-500"
          )}>
            Was this helpful?
          </p>
          {submitted ? (
            <div className="flex items-center gap-1.5">
              <Icon icon="hugeicons:checkmark-01" className="h-3.5 w-3.5 text-green-500" />
              <span className={cn(
                "text-xs whitespace-nowrap",
                isDark ? "text-zinc-400" : "text-zinc-500"
              )}>
                Thanks!
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFeedback(true)}
                disabled={isSubmitting}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs",
                  isDark 
                    ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300" 
                    : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600",
                  isSubmitting && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon icon="hugeicons:thumbs-up" className="h-3.5 w-3.5" />
                Yes
              </button>
              <button
                onClick={() => handleFeedback(false)}
                disabled={isSubmitting}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs",
                  isDark 
                    ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300" 
                    : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600",
                  isSubmitting && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon icon="hugeicons:thumbs-down" className="h-3.5 w-3.5" />
                No
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <p className={cn(
          "text-xs font-medium mb-3",
          isDark ? "text-zinc-400" : "text-zinc-500"
        )}>
          Was this helpful?
        </p>
        {submitted ? (
          <div className="flex items-center gap-1.5">
            <Icon icon="hugeicons:checkmark-01" className="h-3.5 w-3.5 text-green-500" />
            <span className={cn(
              "text-xs",
              isDark ? "text-zinc-400" : "text-zinc-500"
            )}>
              Thanks!
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFeedback(true)}
              disabled={isSubmitting}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs",
                isDark 
                  ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300" 
                  : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
            >
              <Icon icon="hugeicons:thumbs-up" className="h-3.5 w-3.5" />
              Yes
            </button>
            <button
              onClick={() => handleFeedback(false)}
              disabled={isSubmitting}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs",
                isDark 
                  ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300" 
                  : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
            >
              <Icon icon="hugeicons:thumbs-down" className="h-3.5 w-3.5" />
              No
            </button>
          </div>
        )}
      </div>
    );
  }

  if (horizontal) {
    return (
      <div className={cn(
        "mt-8 pt-6 border-t",
        isDark ? "border-zinc-700" : "border-zinc-200"
      )}>
        <div className="flex items-center justify-between w-full">
          {submitted ? (
            <div className="flex items-center gap-2">
              <Icon icon="hugeicons:checkmark-01" className="h-4 w-4 text-green-500" />
              <span className={cn(
                "text-sm",
                isDark ? "text-zinc-400" : "text-zinc-600"
              )}>
                Thanks for your feedback!
              </span>
            </div>
          ) : (
            <>
              <p className={cn(
                "text-sm font-medium flex items-center",
                isDark ? "text-zinc-300" : "text-zinc-700"
              )}>
                Was this article helpful?
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFeedback(true)}
                  disabled={isSubmitting}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border",
                    isDark 
                      ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300" 
                      : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700",
                    isSubmitting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon icon="hugeicons:thumbs-up" className="h-4 w-4" />
                  <span className="text-sm">Yes</span>
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  disabled={isSubmitting}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border",
                    isDark 
                      ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300" 
                      : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700",
                    isSubmitting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon icon="hugeicons:thumbs-down" className="h-4 w-4" />
                  <span className="text-sm">No</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "mt-8 pt-6 border-t",
      isDark ? "border-zinc-700" : "border-zinc-200"
    )}>
      <div className="flex flex-col gap-3">
        {submitted ? (
          <div className="flex items-center gap-2">
            <Icon icon="hugeicons:checkmark-01" className="h-4 w-4 text-green-500" />
            <span className={cn(
              "text-sm",
              isDark ? "text-zinc-400" : "text-zinc-600"
            )}>
              Thanks for your feedback!
            </span>
          </div>
        ) : (
          <>
            <p className={cn(
              "text-sm font-medium",
              isDark ? "text-zinc-300" : "text-zinc-700"
            )}>
              Was this article helpful?
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFeedback(true)}
                disabled={isSubmitting}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border",
                  isDark 
                    ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300" 
                    : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700",
                  isSubmitting && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon icon="hugeicons:thumbs-up" className="h-4 w-4" />
                <span className="text-sm">Yes</span>
              </button>
              <button
                onClick={() => handleFeedback(false)}
                disabled={isSubmitting}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border",
                  isDark 
                    ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300" 
                    : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700",
                  isSubmitting && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon icon="hugeicons:thumbs-down" className="h-4 w-4" />
                <span className="text-sm">No</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
