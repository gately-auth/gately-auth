export const faqs = [
  {
    id: 'faq-1',
    question: 'Does gately-auth work with Node.js?',
    answer: 'gately-auth is designed for the Cloudflare Workers runtime. It uses D1 and KV bindings that do not exist in Node.js. For local development, use wrangler dev which provides a local Workers runtime.',
    is_published: true,
  },
  {
    id: 'faq-2',
    question: 'What does the free Cloudflare plan include?',
    answer: 'D1 includes 5 GB storage and 25 million reads/day. KV includes 100,000 reads/day and 1,000 writes/day. Workers free tier gives 100,000 requests/day. That covers most early-stage applications at no cost.',
    is_published: true,
  },
  {
    id: 'faq-3',
    question: 'Can I use my own email provider?',
    answer: 'Yes. Implement the EmailProvider interface with a send() method and pass it as emailProvider in gatelyAuth(). The gatelyEmail plugin is optional — it just provides a pre-built integration with Gately\'s email platform.',
    is_published: true,
  },
  {
    id: 'faq-4',
    question: 'How do I add custom fields to the user table?',
    answer: 'Use the additionalUserFields option in gatelyAuth(). Fields defined there are included in the generated migration SQL and accepted as input on sign-up.',
    is_published: true,
  },
  {
    id: 'faq-5',
    question: 'Is gately-auth compatible with Better Auth?',
    answer: 'The client SDK mirrors the Better Auth createAuthClient API intentionally, so switching requires minimal changes. The server-side config is Cloudflare-specific — D1 and KV replace the database and Redis adapters.',
    is_published: true,
  },
  {
    id: 'faq-6',
    question: 'How are sessions stored?',
    answer: 'Sessions are stored as rows in your D1 database. The session token is a random 32-byte value, not a JWT. Revoking a session immediately invalidates it with no expiry window to wait for.',
    is_published: true,
  },
];
