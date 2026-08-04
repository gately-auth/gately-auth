import { defineMiddleware } from 'astro:middleware';

// Pages that serve public, cacheable content
const PUBLIC_PAGE_TTL = 60; // 1 minute for rendered pages

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const { pathname } = context.url;

  // Only cache GET requests for public help center pages (not API routes)
  if (
    context.request.method === 'GET' &&
    !pathname.startsWith('/api/')
  ) {
    response.headers.set(
      'Cache-Control',
      `public, max-age=${PUBLIC_PAGE_TTL}, s-maxage=${PUBLIC_PAGE_TTL}, stale-while-revalidate=300`
    );
  }

  return response;
});
