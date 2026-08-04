export const prerender = false;

import { getArticles, getCategories } from '../lib/localData';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const [articles, categories] = await Promise.all([getArticles(), getCategories()]);

  if (!articles.length) return new Response('No articles found', { status: 404 });

  const getCategoryName = (id: string | null) =>
    categories.find(c => c.id === id)?.name || 'Uncategorized';

  const stripHtml = (html: string) =>
    html
      .replace(/<\/p>/g, '\n\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g, '\n## $1\n')
      .replace(/<[^>]*>?/gm, '');

  const body = articles
    .map(a => `---\nTitle: ${a.title}\nCategory: ${getCategoryName(a.category_id)}\n---\n\n${stripHtml(a.content)}\n`)
    .join('\n---\n\n');

  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
