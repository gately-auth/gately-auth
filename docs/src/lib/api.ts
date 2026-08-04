/**
 * Legacy API integration — kept for reference if switching to a remote data source.
 * In local mode, src/lib/localData.ts is used instead.
 */

import { getCached } from './cache';

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') return '/api';
  try {
    return import.meta.env.PUBLIC_API_URL || 'https://api.example.com/api';
  } catch {
    return 'https://api.example.com/api';
  }
}

function cfFetch(url: string, ttl: number, signal?: AbortSignal): Promise<Response> {
  const opts: RequestInit & { cf?: Record<string, unknown> } = {
    signal,
    headers: { 'User-Agent': 'Helio-HelpCenter/1.0' },
    cf: { cacheTtl: ttl, cacheEverything: true },
  };
  return fetch(url, opts);
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category_id: string | null;
  is_published: boolean;
  display_order?: number | null;
  sidebar_title?: string | null;
  icon?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  display_order?: number | null;
  folder_id?: string | null;
  parent_category_id?: string | null;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  is_published: boolean;
}

/**
 * Fetch all published articles for a project
 */
export async function getArticles(projectId: string): Promise<Article[]> {
  const startTime = Date.now();
  
  return getCached(`articles-${projectId}`, async () => {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10s
      
      const response = typeof window === 'undefined'
        ? await cfFetch(`${API_BASE_URL}/public/projects/${projectId}/help-articles?limit=500`, 120, controller.signal)
        : await fetch(`${API_BASE_URL}/public/projects/${projectId}/help-articles?limit=500`, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Gately-HelpCenter/1.0' }
          });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`[API] ❌ Failed to fetch articles: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const data = await response.json();
      
      const allArticles = data.data?.articles || data.articles || data.data || [];
      const published = allArticles.filter((a: Article) => a.is_published);
      return published;
    } catch (error) {
      console.error(`[API] ❌ Error fetching articles after ${Date.now() - startTime}ms:`, error);
      return [];
    }
  });
}

/**
 * Fetch all categories for a project, with retry on empty/failed responses
 */
export async function getCategories(projectId: string): Promise<Category[]> {
  const startTime = Date.now();
  
  const cacheKey = `categories-${projectId}`;

  const fetchCategories = async (): Promise<Category[]> => {
    const API_BASE_URL = getApiBaseUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10s

    try {
      const response = typeof window === 'undefined'
        ? await cfFetch(`${API_BASE_URL}/public/projects/${projectId}/help-article-categories`, 120, controller.signal)
        : await fetch(`${API_BASE_URL}/public/projects/${projectId}/help-article-categories`, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Gately-HelpCenter/1.0' }
          });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`[API] Categories fetch failed: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      let categories: Category[] = [];
      if (data.data?.categories) {
        categories = data.data.categories;
      } else if (data.categories) {
        categories = data.categories;
      } else if (Array.isArray(data.data)) {
        categories = data.data;
      } else if (Array.isArray(data)) {
        categories = data;
      }

      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // Try up to 2 times before giving up
  const MAX_RETRIES = 2;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const attemptStart = Date.now();
    
    try {
      const result = await fetchCategories();

      // Don't cache an empty result — it may be a transient API failure
      if (result.length === 0) {
        console.warn(`[API] ⚠️ Categories returned empty on attempt ${attempt}/${MAX_RETRIES}`);
        if (attempt < MAX_RETRIES) continue;
        // On final attempt return empty without caching so next request retries
        return [];
      }

      // Got real data — store in cache and return
      return getCached(cacheKey, () => Promise.resolve(result));
    } catch (error) {
      lastError = error;
      console.error(`[API] ❌ Categories fetch attempt ${attempt}/${MAX_RETRIES} failed after ${Date.now() - attemptStart}ms:`, error);
    }
  }

  console.error(`[API] ❌ All category fetch attempts failed (total time: ${Date.now() - startTime}ms):`, lastError);
  return [];
}

/**
 * Fetch a single article by slug
 */
export async function getArticleBySlug(
  projectId: string,
  slug: string
): Promise<Article | null> {
  try {
    const articles = await getArticles(projectId);
    return articles.find(article => article.slug === slug) || null;
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

/**
 * Fetch help center configuration
 */
export async function getHelpCenterConfig(projectId: string) {
  try {
    const API_BASE_URL = getApiBaseUrl();
    const response = typeof window === 'undefined'
      ? await cfFetch(`${API_BASE_URL}/public/projects/${projectId}/help-center-config`, 300)
      : await fetch(`${API_BASE_URL}/public/projects/${projectId}/help-center-config`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // The API returns { data: { config: {...}, categories: [...] } }
    // We only want the config part
    return data.data?.config || data.config || data.data || null;
  } catch (error) {
    console.error('Error fetching help center config:', error);
    return null;
  }
}

/**
 * Fetch all FAQs for a project
 */
export async function getFaqs(projectId: string): Promise<Faq[]> {
  try {
    const API_BASE_URL = getApiBaseUrl();
    const response = typeof window === 'undefined'
      ? await cfFetch(`${API_BASE_URL}/public/projects/${projectId}/faqs`, 300)
      : await fetch(`${API_BASE_URL}/public/projects/${projectId}/faqs`);
    
    if (!response.ok) {
      console.error(`Failed to fetch FAQs: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data = await response.json();
    const allFaqs = data.data?.faqs || data.faqs || data.data || [];
    const published = allFaqs.filter((f: Faq) => f.is_published);
    return published;
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return [];
  }
}

/**
 * Fetch the OpenAPI spec uploaded by the project via CLI.
 * Returns the raw spec string (JSON or YAML) or null if not set.
 */
export async function getOpenApiSpec(projectId: string): Promise<string | null> {
  try {
    const API_BASE_URL = getApiBaseUrl();
    const response = typeof window === 'undefined'
      ? await cfFetch(`${API_BASE_URL}/public/projects/${projectId}/openapi`, 60)
      : await fetch(`${API_BASE_URL}/public/projects/${projectId}/openapi`);

    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}
