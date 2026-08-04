/**
 * Local data layer — replaces the Gately API
 * Exports the same function signatures as src/lib/api.ts so pages
 * can swap imports without changing anything else.
 */

import { articles as rawArticles, categories as rawCategories, folders as rawFolders } from '@/data/index';
import { faqs as rawFaqs } from '@/data/faqs';
import { helpCenterConfig } from '@/data/config';

export type { Article, Category, Faq } from './api';

// Re-export types so callers can use either import
export type HelpCenterConfig = typeof helpCenterConfig;

/** Returns all published articles */
export async function getArticles(_projectId?: string) {
  return rawArticles.filter((a) => a.is_published);
}

/** Returns all categories */
export async function getCategories(_projectId?: string) {
  return [...rawCategories].sort(
    (a, b) => (a.display_order ?? 999) - (b.display_order ?? 999)
  );
}

/** Returns a single article by slug */
export async function getArticleBySlug(_projectId: string, slug: string) {
  return rawArticles.find((a) => a.slug === slug && a.is_published) ?? null;
}

/** Returns the help center config (ignores projectId — config is local) */
export async function getHelpCenterConfig(_projectId?: string) {
  return helpCenterConfig;
}

/** Returns all published FAQs */
export async function getFaqs(_projectId?: string) {
  return rawFaqs.filter((f) => f.is_published);
}

/** Returns all folders */
export async function getFolders(_projectId?: string) {
  return [...rawFolders].sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
}

/** No OpenAPI spec in local mode — returns null */
export async function getOpenApiSpec(_projectId?: string) {
  return null;
}
