import { bn, h2, h3, p, bullet, codeBlock, callout, paramField, divider } from '../../blocks';

export const pluginsArticle = {
  id: 'plugins',
  title: 'Plugins',
  slug: 'plugins',
  excerpt: 'How the plugin system works and how to build a custom plugin with extra endpoints, schema fields, and hooks.',
  category_id: 'core-concepts',
  is_published: true,
  display_order: 3,
  sidebar_title: null as string | null,
  icon: 'hugeicons:plug-01' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('Plugins let you extend gately-auth without modifying its core. A plugin is a plain object that can register an email provider, add routes to the /auth handler, extend the database schema, and hook into request lifecycle events.'),

    h2('Using a plugin'),
    p('Pass plugins to the plugins array in gatelyAuth():'),
    codeBlock(`import { gatelyAuth } from '@gately/auth-core'
import { gatelyEmail } from '@gately/auth-core/plugins'

const auth = gatelyAuth({
  secret: env.AUTH_SECRET,
  db: createD1Adapter(env.AUTH_DB),
  kv: createKVStore(env.AUTH_KV),
  plugins: [
    gatelyEmail({ apiKey: env.GATELY_API_KEY }),
  ],
})`, 'typescript'),

    h2('Plugin interface'),
    p('A GatelyAuthPlugin must implement:'),
    paramField('id', 'string', true, 'Unique identifier for the plugin. Used internally to look up plugin config.'),
    paramField('name', 'string', false, 'Human-readable name for logging.'),
    paramField('init', 'function', false, 'Called once when gatelyAuth() is called. Receives the GatelyAuthContext. Use this to register email providers or patch options.'),
    paramField('endpoints', 'Record<string, handler>', false, 'Additional routes mounted under /auth/*. The key is the path (e.g. "/my-plugin/action").'),
    paramField('schema', 'object', false, 'Additional fields to add to the user or session tables. Used by CLI migration generation.'),
    paramField('hooks.before', 'HookEntry[]', false, 'Intercept requests before they are processed.'),
    paramField('hooks.after', 'HookEntry[]', false, 'React to requests after they are processed.'),

    h2('Building a custom plugin'),
    p('Here is a minimal plugin that adds a /auth/ping endpoint and attaches a custom field to the user table:'),
    codeBlock(`import type { GatelyAuthPlugin } from '@gately/auth-core'

export function myPlugin(): GatelyAuthPlugin {
  return {
    id: 'my-plugin',
    name: 'My Plugin',

    // Called on init — patch options, register providers, etc.
    init(ctx) {
      ctx.logger.info('My plugin initialized')
    },

    // Additional schema fields
    schema: {
      user: {
        fields: {
          role: { type: 'string', required: false, defaultValue: 'member' },
        },
      },
    },

    // Custom endpoints mounted at /auth/my-plugin/ping
    endpoints: {
      '/my-plugin/ping': async ({ request, session }) => {
        return Response.json({
          ok: true,
          user: session?.user ?? null,
        })
      },
    },
  }
}`, 'typescript'),

    h2('Lifecycle hooks'),
    p('Hooks let you intercept requests before or after they are handled. Use them to add audit logging, block certain users, or inject extra data.'),
    codeBlock(`hooks: {
  before: [
    {
      matcher: (ctx) => ctx.path === '/sign-in/email',
      handler: async (ctx) => {
        console.log('Sign-in attempt from', ctx.request.headers.get('CF-Connecting-IP'))
      },
    },
  ],
  after: [
    {
      matcher: (ctx) => ctx.path === '/sign-up/email',
      handler: async (ctx) => {
        // e.g. send a welcome email via a separate service
      },
    },
  ],
}`, 'typescript'),

    callout('info', 'The gatelyEmail plugin uses init() to register itself as the emailProvider on the options object. All built-in flows (password reset, magic link, OTP, email verification) then automatically use it.'),
  ]),
};
