// llms.txt — standard path for LLM-readable documentation
// Spec: https://llmstxt.org
// Served at: https://auth.usegately.com/llms.txt

export const prerender = false;

import { getArticles, getCategories } from '../lib/localData';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const [articles, categories] = await Promise.all([getArticles(), getCategories()]);

  const getCategoryName = (id: string | null) =>
    categories.find(c => c.id === id)?.name ?? 'General';

  const stripHtml = (html: string) =>
    html
      .replace(/<\/p>/g, '\n\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/g, (_, level, text) => {
        const hashes = '#'.repeat(Number(level));
        return `\n${hashes} ${text}\n`;
      })
      .replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n')
      .replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`')
      .replace(/<pre[^>]*>(.*?)<\/pre>/gs, (_, code) => `\`\`\`\n${code.replace(/<[^>]*>/g, '')}\n\`\`\``)
      .replace(/<[^>]*>/gm, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  const header = `# gately-auth Documentation

> gately-auth is a production-grade authentication framework for Cloudflare Workers.
> D1 · KV · Workers · Built for the edge. No Node.js required.
>
> Packages: @gately/auth-core · @gately/auth-client · @gately/auth-cli
> Docs: https://auth.usegately.com
> GitHub: https://github.com/gately-auth/gately-auth
> npm: https://www.npmjs.com/package/@gately/auth-core
>
> MCP server: https://mcp.auth.usegately.com/mcp

`;

  const index = categories
    .map(cat => {
      const catArticles = articles.filter(a => a.category_id === cat.id);
      if (!catArticles.length) return '';
      const links = catArticles
        .map(a => `- [${a.title}](https://auth.usegately.com/article/${a.slug})`)
        .join('\n');
      return `## ${cat.name}\n${links}`;
    })
    .filter(Boolean)
    .join('\n\n');

  const fullContent = articles
    .map(a => {
      const category = getCategoryName(a.category_id ?? null);
      return [
        `---`,
        `Title: ${a.title}`,
        `Category: ${category}`,
        `URL: https://auth.usegately.com/article/${a.slug}`,
        `---`,
        '',
        stripHtml(a.content),
      ].join('\n');
    })
    .join('\n\n---\n\n');

  const body = `${header}${index}\n\n---\n\n${fullContent}`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
