import { bn, h2, h3, p, bullet, codeBlock, callout, tabs, codeGroup, accordion, responseField } from '../../blocks';

export const apiIntroductionArticle = {
  id: 'api-introduction',
  title: 'API Introduction',
  slug: 'api-introduction',
  excerpt: 'Base URL, versioning, response format, rate limits, and error codes.',
  category_id: 'api-reference',
  is_published: true,
  display_order: 1,
  sidebar_title: null as string | null,
  icon: 'hugeicons:book-open-01' as string | null,
  created_at: '2024-01-30T00:00:00Z',
  updated_at: '2024-01-30T00:00:00Z',
  content: bn([
    p('The REST API lets you programmatically access and manage your data. All requests use HTTPS and return JSON. The API is versioned — breaking changes are released under a new version path.'),

    callout('info', 'All API requests must be authenticated. See the Authentication article for how to obtain and use an API key.'),

    h2('Base URL'),
    codeBlock('https://api.helio.dev/v1', 'bash'),

    h2('Versioning'),
    p('The API version is included in the URL path (/v1). When we make breaking changes, we release a new version (/v2) and maintain the previous version for at least 12 months.'),
    callout('note', 'Non-breaking changes — new fields, new endpoints, new optional parameters — are added to the current version without a version bump.'),

    h2('Response format'),
    p('All responses use a consistent envelope format:'),
    codeBlock(
      `// Success\n{\n  "data": { ... },\n  "error": null,\n  "meta": {\n    "request_id": "req_01hx4k2m3n",\n    "timestamp": "2024-01-15T10:30:00Z"\n  }\n}\n\n// Error\n{\n  "data": null,\n  "error": {\n    "code": "not_found",\n    "message": "The requested resource was not found.",\n    "param": null\n  },\n  "meta": {\n    "request_id": "req_01hx4k2m3n",\n    "timestamp": "2024-01-15T10:30:00Z"\n  }\n}`,
      'json'
    ),

    h2('Response envelope fields'),
    responseField('data', 'object | array | null', false, 'The response payload. null on error.'),
    responseField('error', 'object | null', false, 'Error details. null on success.'),
    responseField('error.code', 'string', false, 'Machine-readable error code — e.g. not_found, unauthorized, rate_limited.'),
    responseField('error.message', 'string', false, 'Human-readable error description.'),
    responseField('error.param', 'string | null', false, 'The request parameter that caused the error, if applicable.'),
    responseField('meta.request_id', 'string', true, 'Unique identifier for this request. Include this when contacting support.'),
    responseField('meta.timestamp', 'string', true, 'ISO 8601 timestamp of when the request was processed.'),

    h2('HTTP status codes'),
    codeBlock(
      `200 OK              — Request succeeded\n201 Created         — Resource created successfully\n204 No Content      — Request succeeded, no body returned\n400 Bad Request     — Invalid request parameters\n401 Unauthorized    — Missing or invalid API key\n403 Forbidden       — Valid key but insufficient permissions\n404 Not Found       — Resource does not exist\n409 Conflict        — Resource already exists\n422 Unprocessable   — Validation error\n429 Too Many Requests — Rate limit exceeded\n500 Internal Error  — Something went wrong on our end`,
      'bash'
    ),

    h2('Rate limits'),
    p('The API is rate-limited per API key:'),
    codeBlock(
      `Limit:       1000 requests per minute\nBurst:       50 requests per second\nHeader:      X-RateLimit-Limit: 1000\n             X-RateLimit-Remaining: 847\n             X-RateLimit-Reset: 1705312260`,
      'bash'
    ),
    callout('warning', 'When you exceed the rate limit, the API returns 429 Too Many Requests with a Retry-After header. Implement exponential backoff in your client.'),

    h2('Pagination'),
    p('List endpoints support cursor-based pagination:'),
    codeGroup([
      {
        label: 'Request',
        language: 'bash',
        code: 'GET /v1/users?limit=20&cursor=usr_01hx4k2m3n',
      },
      {
        label: 'Response',
        language: 'json',
        code: '{\n  "data": [\n    { "id": "usr_01hx4k2m3n", ... },\n    ...\n  ],\n  "meta": {\n    "has_more": true,\n    "next_cursor": "usr_01hx4k9p2q",\n    "total": 142\n  }\n}',
      },
    ]),

    accordion('What is the maximum page size?', 'The maximum limit is 100 items per request. The default is 20. For bulk operations, use the /batch endpoints.'),
    accordion('How do I get all records?', 'Paginate through all pages using the next_cursor from each response until has_more is false. For large datasets, consider using the export endpoints which return a download URL.'),
    accordion('Are there webhooks?', 'Yes. Configure webhooks in your dashboard under Settings → Webhooks. We send POST requests to your endpoint for every event. See the Webhooks article for the full event reference.'),
  ]),
};
