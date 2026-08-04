export const prerender = false;

import { getArticles, getCategories } from '../../lib/localData';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, url }) => {
  const { slug } = params;

  const [allArticles, categories] = await Promise.all([getArticles(), getCategories()]);
  const article = allArticles.find(a => a.slug === slug);

  if (!article) return new Response('Article not found', { status: 404 });

  const categoryName =
    categories.find(c => c.id === article.category_id)?.name || 'Uncategorized';

  const stripHtml = (html: string) =>
    html
      .replace(/<\/p>/g, '\n\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g, '\n## $1\n')
      .replace(/<[^>]*>?/gm, '');

  const markdown = `---
URL: ${url.origin}/article/${article.slug}
Title: ${article.title}
Category: ${categoryName}
---

${stripHtml(article.content)}`;

  return new Response(markdown, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
