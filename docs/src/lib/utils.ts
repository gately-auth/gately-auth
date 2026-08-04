import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// The helpcenter is deployed at root on Cloudflare Pages.
// Sub-path proxying is handled by a Cloudflare Worker on a custom domain.
// Sub-path is ONLY used when sub_path_domain is set.
// Always call getBasePath() as a function — never cache as a constant.
export function getBasePath(config?: { sub_path?: string | null; sub_path_domain?: string | null }): string {
  if (typeof window !== 'undefined') {
    const ctx = (window as any).__projectContext;

    // use sub-path if configured on a custom domain
    if (ctx?.subPathDomain || config?.sub_path_domain) {
      const subPath = ctx?.subPath || config?.sub_path || '';
      if (subPath) {
        return subPath.startsWith('/') ? subPath : `/${subPath}`;
      }
    }

    return '';
  }

  // SSR: only apply sub-path if sub_path_domain is configured
  if (config?.sub_path_domain && config?.sub_path) {
    const subPath = config.sub_path;
    return subPath.startsWith('/') ? subPath : `/${subPath}`;
  }

  return '';
}

// Keep BASE_PATH as a getter function call for legacy imports
export const BASE_PATH = '';

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}
