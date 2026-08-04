import { bn, h2, h3, p, bullet, codeBlock, callout, paramField, divider } from '../../blocks';

export const adminPluginArticle = {
  id: 'admin-plugin',
  title: 'Admin Plugin',
  slug: 'admin-plugin',
  excerpt: 'Server-side user management endpoints — list users, ban/unban, delete, and revoke sessions.',
  category_id: 'plugins',
  is_published: true,
  display_order: 2,
  sidebar_title: null as string | null,
  icon: 'hugeicons:shield-user' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('The admin plugin adds protected management endpoints under /auth/admin/*. All routes require the X-Admin-Key header matching your configured adminSecret — they are designed for server-to-server use only, never called from the browser.'),

    h2('Setup'),
    codeBlock(`import { gatelyAuth } from '@gately/auth-core'
import { adminPlugin } from '@gately/auth-core/plugins'

const auth = gatelyAuth({
  secret: env.AUTH_SECRET,
  db: createD1Adapter(env.AUTH_DB),
  kv: createKVStore(env.AUTH_KV),
  plugins: [
    adminPlugin({
      adminSecret: env.ADMIN_SECRET,
      defaultPageSize: 50,
    }),
  ],
})`, 'typescript'),
    callout('warning', 'Set ADMIN_SECRET as a Wrangler secret (npx wrangler secret put ADMIN_SECRET). Never expose it client-side.'),

    h2('Config options'),
    paramField('adminSecret', 'string', true, 'Secret value required in the X-Admin-Key request header. All admin endpoints return 401 without it.'),
    paramField('defaultPageSize', 'number', false, 'Default number of users returned by the list endpoint. Max 200. Default: 50.'),

    h2('Schema additions'),
    p('The admin plugin adds an accountDisabled boolean field to the user table. It defaults to false. When true, sign-in returns ACCOUNT_DISABLED (403).'),
    codeBlock(`-- Added to ga_users by the admin plugin migration
ALTER TABLE ga_users ADD COLUMN account_disabled INTEGER NOT NULL DEFAULT 0;`, 'sql'),

    h2('Endpoints'),

    h3('GET /auth/admin/users'),
    p('Paginated list of all users, newest first.'),
    codeBlock(`// Headers
X-Admin-Key: your-admin-secret

// Query params
?limit=50&offset=0

// Response (200)
{
  "users": [{ "id": "...", "email": "...", "name": "...", ... }],
  "total": 1234,
  "limit": 50,
  "offset": 0
}`, 'json'),
    codeBlock(`const res = await fetch('https://my-auth.workers.dev/auth/admin/users?limit=50', {
  headers: { 'X-Admin-Key': process.env.ADMIN_SECRET }
})
const { users, total } = await res.json()`, 'typescript'),

    h3('GET /auth/admin/users/:id'),
    codeBlock(`const res = await fetch(\`https://my-auth.workers.dev/auth/admin/users/\${userId}\`, {
  headers: { 'X-Admin-Key': process.env.ADMIN_SECRET }
})
const { user } = await res.json()`, 'typescript'),

    h3('PATCH /auth/admin/users/:id'),
    p('Update allowed user fields: name, image, emailVerified.'),
    codeBlock(`await fetch(\`https://my-auth.workers.dev/auth/admin/users/\${userId}\`, {
  method: 'PATCH',
  headers: {
    'X-Admin-Key': process.env.ADMIN_SECRET,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'New Name', emailVerified: true }),
})`, 'typescript'),

    h3('DELETE /auth/admin/users/:id'),
    p('Permanently deletes the user, all their sessions, and all OAuth account links.'),
    codeBlock(`await fetch(\`https://my-auth.workers.dev/auth/admin/users/\${userId}\`, {
  method: 'DELETE',
  headers: { 'X-Admin-Key': process.env.ADMIN_SECRET },
})`, 'typescript'),

    h3('POST /auth/admin/users/:id/ban'),
    p('Sets accountDisabled = true and immediately revokes all active sessions.'),
    codeBlock(`await fetch(\`https://my-auth.workers.dev/auth/admin/users/\${userId}/ban\`, {
  method: 'POST',
  headers: { 'X-Admin-Key': process.env.ADMIN_SECRET },
})`, 'typescript'),

    h3('POST /auth/admin/users/:id/unban'),
    p('Sets accountDisabled = false. The user can sign in again immediately.'),

    h3('DELETE /auth/admin/users/:id/sessions'),
    p('Revokes all active sessions for a user without banning them.'),
  ]),
};
