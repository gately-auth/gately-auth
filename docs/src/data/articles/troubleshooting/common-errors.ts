import { bn, h2, h3, p, bullet, codeBlock, callout, tabs, accordion, step, codeGroup } from '../../blocks';

export const commonErrorsArticle = {
  id: 'common-errors',
  title: 'Common Errors',
  slug: 'common-errors',
  excerpt: 'Solutions to the most frequently encountered errors — 401, 403, 404, 429, 500, and network errors.',
  category_id: 'troubleshooting',
  is_published: true,
  display_order: 1,
  sidebar_title: null as string | null,
  icon: 'hugeicons:bug-01' as string | null,
  created_at: '2024-02-01T00:00:00Z',
  updated_at: '2024-02-01T00:00:00Z',
  content: bn([
    p('This article covers the most common errors you\'ll encounter when integrating with the API, and how to fix each one.'),

    h2('401 Unauthorized'),
    callout('error', 'Your API key is missing, malformed, or has been revoked.'),
    p('Checklist:'),
    bullet('The Authorization header is present and formatted as: Bearer YOUR_KEY'),
    bullet('The key has not been revoked in Settings → API Keys'),
    bullet('There is no extra whitespace or newline in the key value'),
    bullet('You are using the correct key for the environment (staging vs production)'),
    codeBlock(
      `// Wrong\nAuthorization: YOUR_KEY\nAuthorization: Token YOUR_KEY\n\n// Correct\nAuthorization: Bearer YOUR_KEY`,
      'bash'
    ),

    h2('403 Forbidden'),
    callout('error', 'Your key is valid but does not have permission for this operation.'),
    p('This means the key exists and is active, but it lacks the required scope. Go to Settings → API Keys, find the key, and check its assigned scopes.'),
    codeBlock(
      `// Response body\n{\n  "error": {\n    "code": "forbidden",\n    "message": "This key does not have the write:users scope."\n  }\n}`,
      'json'
    ),
    callout('tips', 'The error message tells you exactly which scope is missing. Add that scope to the key or create a new key with the correct scopes.'),

    h2('404 Not Found'),
    callout('warning', 'The resource you requested does not exist.'),
    bullet('Double-check the ID or slug in the URL'),
    bullet('The resource may have been deleted'),
    bullet('Check for typos — IDs are case-sensitive'),
    bullet('Confirm you are hitting the correct environment (staging vs production)'),

    h2('422 Unprocessable Entity'),
    callout('warning', 'The request body failed validation.'),
    p('The error response includes a param field identifying which field failed:'),
    codeBlock(
      `{\n  "error": {\n    "code": "validation_error",\n    "message": "email must be a valid email address.",\n    "param": "email"\n  }\n}`,
      'json'
    ),
    p('Common causes:'),
    bullet('Missing required fields'),
    bullet('Wrong data type — e.g. passing a string where a number is expected'),
    bullet('Value out of allowed range — e.g. limit > 100'),
    bullet('Invalid enum value — e.g. role: "superadmin" when only admin, member, viewer are valid'),

    h2('429 Too Many Requests'),
    callout('error', 'You have exceeded the rate limit of 1000 requests per minute.'),
    p('The response includes a Retry-After header with the number of seconds to wait:'),
    codeBlock(
      `HTTP/1.1 429 Too Many Requests\nRetry-After: 14\nX-RateLimit-Limit: 1000\nX-RateLimit-Remaining: 0\nX-RateLimit-Reset: 1705312260`,
      'bash'
    ),
    p('Implement exponential backoff in your client:'),
    codeBlock(
      `async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {\n  const response = await fetch(url, options);\n\n  if (response.status === 429 && retries > 0) {\n    const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);\n    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));\n    return fetchWithRetry(url, options, retries - 1);\n  }\n\n  return response;\n}`,
      'typescript'
    ),

    h2('500 Internal Server Error'),
    callout('error', 'Something went wrong on our end.'),
    step(1, 'Check the status page', 'Visit status.helio.dev to see if there is an ongoing incident.'),
    step(2, 'Retry with backoff', 'Wait 1 second and retry. Most 500 errors are transient.'),
    step(3, 'Contact support', 'If the error persists, open a support ticket and include the request_id from the response meta field.'),

    h2('Network errors'),
    callout('warning', 'The request never reached the server — a network or DNS issue.'),
    tabs([
      { label: 'ECONNREFUSED', body: 'The server actively refused the connection. Check that you are using the correct base URL (https://api.helio.dev/v1) and that your network allows outbound HTTPS on port 443.' },
      { label: 'ETIMEDOUT', body: 'The request timed out. Increase your client timeout (recommended: 10 seconds). Check your network connection and the status page for latency issues.' },
      { label: 'ENOTFOUND', body: 'DNS resolution failed. Check that api.helio.dev resolves correctly from your environment. In some corporate networks, external DNS may be blocked.' },
    ]),

    accordion('How do I find the request_id for a failed request?', 'Every API response includes a meta.request_id field. Log this value in your error handler and include it when contacting support. It allows us to look up the exact request in our logs.'),
    accordion('Why am I getting 401 even though my key looks correct?', 'The most common cause is trailing whitespace or a newline character in the key value. This happens when copying from a terminal or text editor. Trim the key value before using it: apiKey.trim()'),
    accordion('I am getting 403 but my key has admin scope — why?', 'Some endpoints require the request to come from a specific IP range or require MFA verification. Check the endpoint documentation for any additional requirements.'),
  ]),
};
