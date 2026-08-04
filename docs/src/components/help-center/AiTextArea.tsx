import { useRef, useEffect } from 'react';
import { Icon } from '../ui/icon';
import { cn } from '@/lib/utils';

interface AiTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  title?: string;
  primaryColor?: string;
  disabled?: boolean;
  className?: string;
  minRows?: number;
  maxRows?: number;
  compact?: boolean;
  variant?: 'light' | 'auto';
  isDark?: boolean;
}

export function AiTextArea({
  value,
  onChange,
  onSubmit,
  placeholder = 'Ask, search, explain...',
  title = 'Ask our assistant anything',
  primaryColor = '#3b82f6',
  disabled = false,
  className,
  minRows = 1,
  maxRows = 4,
  compact = false,
  variant = 'light',
  isDark,
}: AiTextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    const lineHeight = 20;
    const minHeight = lineHeight * minRows;
    const maxHeight = lineHeight * maxRows;
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [value, minRows, maxRows]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  return (
    <div className={cn(
      "rounded-2xl shadow-sm overflow-hidden border border-border bg-card",
      className
    )}>
      <div className={cn(
        "px-3 flex items-center gap-2 bg-muted/50",
        compact ? "py-1.5" : "py-2",
      )}>
        <Icon 
          icon="hugeicons:magic-wand-01" 
          className="text-muted-foreground"
          style={{ width: compact ? '14px' : '16px', height: compact ? '14px' : '16px' }}
        />
        <span className={cn(
          compact ? "text-xs" : "text-sm",
          "font-medium text-foreground"
        )}>{title}</span>
      </div>
      
      <div className="relative border-t border-border rounded-t-xl -mx-px -mb-px bg-card">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={minRows}
          className={cn(
            "w-full resize-none border-0 bg-transparent text-sm text-foreground",
            "focus:outline-none focus:ring-0 placeholder:text-muted-foreground",
            compact ? "px-3 py-2.5 pr-16 min-h-[60px]" : "px-4 py-4 pr-20 min-h-[100px]",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          style={{ lineHeight: '20px' }}
        />
        {value.trim() && (
          <button
            onClick={onSubmit}
            disabled={disabled}
            className={cn(
              "absolute right-3 rounded-full transition-all flex items-center justify-center px-3 py-1.5",
              "hover:scale-105 active:scale-95 text-white text-xs font-medium",
              compact ? "bottom-2" : "bottom-3",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ backgroundColor: primaryColor }}
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
