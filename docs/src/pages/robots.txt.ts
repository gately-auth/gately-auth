import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, url }) => {
  const forwardedHost =
    request.headers.get('X-Forwarded-Host') ||
    request.headers.get('X-Original-Host');
  const baseUrl = forwardedHost
    ? `${url.protocol}//${forwardedHost}`
    : url.origin;

  const robots = `# Helio Help Center
User-agent: *
Allow: /
Disallow: /api/
Disallow: /_helio/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay
Crawl-delay: 1

# Block scrapers
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /`;

  return new Response(robots, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
};
