import { bn, h2, h3, p, bullet, codeBlock, callout, tabs, codeGroup, accordion, step, paramField } from '../../blocks';

export const apiAuthenticationArticle = {
  id: 'api-authentication',
  title: 'Authentication',
  slug: 'api-authentication',
  excerpt: 'How to authenticate API requests using Bearer tokens, key scopes, and best practices for key management.',
  category_id: 'api-reference',
  is_published: true,
  display_order: 2,
  sidebar_title: null as string | null,
  icon: 'hugeicons:key-01' as string | null,
  created_at: '2024-01-31T00:00:00Z',
  updated_at: '2024-01-31T00:00:00Z',
  content: bn([
    p('All API requests must be authenticated using an API key passed as a Bearer token in the Authorization header. Keys are scoped — each key can be restricted to specific operations.'),

    callout('warning', 'Never expose API keys in client-side code, public repositories, or logs. Always use environment variables.'),

    h2('Getting your API key'),
    step(1, 'Log in to your dashboard', 'Go to app.helio.dev and sign in with your account.'),
    step(2, 'Open API Keys', 'Navigate to Settings → API Keys in the left sidebar.'),
    step(3, 'Create a new key', 'Click Create new key. Give it a descriptive name — e.g. "Production server" or "CI/CD pipeline".'),
    step(4, 'Copy the key', 'The key is shown once. Copy it immediately and store it securely. You cannot retrieve it again.'),

    h2('Making authenticated requests'),
    codeGroup([
      {
        label: 'cURL',
        language: 'bash',
        code: `curl https://api.helio.dev/v1/users \\\n  -H "Authorization: Bearer $API_KEY"`,
      },
      {
        label: 'TypeScript',
        language: 'typescript',
        code: `const response = await fetch('https://api.helio.dev/v1/users', {\n  headers: {\n    Authorization: \`Bearer \${process.env.API_KEY}\`,\n    'Content-Type': 'application/json',\n  },\n});\n\nconst { data } = await response.json();`,
      },
      {
        label: 'Python',
        language: 'python',
        code: `import httpx\nimport os\n\nclient = httpx.Client(\n    headers={"Authorization": f"Bearer {os.environ['API_KEY']}"}\n)\n\nresponse = client.get("https://api.helio.dev/v1/users")\ndata = response.json()["data"]`,
      },
      {
        label: 'Go',
        language: 'go',
        code: `req, _ := http.NewRequest("GET", "https://api.helio.dev/v1/users", nil)\nreq.Header.Set("Authorization", "Bearer "+os.Getenv("API_KEY"))\n\nclient := &http.Client{}\nresp, err := client.Do(req)`,
      },
    ]),

    h2('Key scopes'),
    p('Each API key can be restricted to specific scopes. Assign the minimum scopes needed for each key:'),
    codeBlock(
      `read:users       — List and retrieve users\nwrite:users      — Create, update, and delete users\nread:articles    — List and retrieve articles\nwrite:articles   — Create, update, and delete articles\nread:analytics   — Access analytics data\nadmin            — Full access to all endpoints`,
      'bash'
    ),
    callout('tips', 'Use separate keys for different environments and services. A key used by your CI/CD pipeline should only have the scopes it needs — not admin access.'),

    h2('Environment variables'),
    p('Store your API key in a .env file and load it with your framework\'s env handling:'),
    codeBlock('# .env\nAPI_KEY=sk_live_your_key_here\n\n# Never commit this file to version control\n# Add .env to your .gitignore', 'bash'),
    codeGroup([
      {
        label: 'Node.js',
        language: 'typescript',
        code: `// process.env.API_KEY is available automatically in Node.js\nconst client = createClient({ apiKey: process.env.API_KEY! });`,
      },
      {
        label: 'Astro',
        language: 'typescript',
        code: `// In Astro, use import.meta.env for server-side env vars\nconst apiKey = import.meta.env.API_KEY;`,
      },
      {
        label: 'Next.js',
        language: 'typescript',
        code: `// Server-side only — do not use NEXT_PUBLIC_ prefix for secret keys\nconst apiKey = process.env.API_KEY;`,
      },
    ]),

    h2('Error responses'),
    codeBlock(
      `// 401 Unauthorized — missing or invalid key\n{\n  "error": {\n    "code": "unauthorized",\n    "message": "No API key provided. Pass your key in the Authorization header."\n  }\n}\n\n// 403 Forbidden — valid key but wrong scope\n{\n  "error": {\n    "code": "forbidden",\n    "message": "This key does not have the write:users scope required for this operation."\n  }\n}`,
      'json'
    ),

    accordion('My key stopped working — what happened?', 'Keys can be revoked manually from the dashboard, or automatically if suspicious activity is detected. Go to Settings → API Keys to check the key status and create a new one if needed.'),
    accordion('Can I rotate a key without downtime?', 'Yes. Create a new key first, update your application to use the new key, deploy, then revoke the old key. This ensures zero downtime during rotation.'),
    accordion('How do I use different keys for staging and production?', 'Create separate keys for each environment and store them in environment-specific .env files (.env.staging, .env.production). Never use a production key in development or CI.'),
    accordion('Are there IP allowlists?', 'Yes — available on the Pro plan. Go to Settings → API Keys → Edit key to add allowed IP ranges in CIDR notation.'),
  ]),
};
