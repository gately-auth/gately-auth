import { bn, h2, h3, p, bullet, codeBlock, callout, paramField, divider } from '../../blocks';

export const usernamePluginArticle = {
  id: 'username-plugin',
  title: 'Username Plugin',
  slug: 'username-plugin',
  excerpt: 'Add a unique username field to sign-up with validation, uniqueness checks, and an availability endpoint.',
  category_id: 'plugins',
  is_published: true,
  display_order: 3,
  sidebar_title: null as string | null,
  icon: 'hugeicons:at' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('The username plugin adds a unique username field to the user table. Usernames are normalised to lowercase, validated against configurable rules, and checked for uniqueness at sign-up. It also adds a public availability check endpoint.'),

    h2('Setup'),
    codeBlock(`import { gatelyAuth } from '@gately/auth-core'
import { usernamePlugin } from '@gately/auth-core/plugins'

const auth = gatelyAuth({
  secret: env.AUTH_SECRET,
  db: createD1Adapter(env.AUTH_DB),
  kv: createKVStore(env.AUTH_KV),
  emailAndPassword: { enabled: true },
  plugins: [
    usernamePlugin({
      minLength: 3,
      maxLength: 20,
      required: true,
    }),
  ],
})`, 'typescript'),

    h2('Config options'),
    paramField('minLength', 'number', false, 'Minimum username length. Default: 3.'),
    paramField('maxLength', 'number', false, 'Maximum username length. Default: 32.'),
    paramField('pattern', 'RegExp', false, 'Regex the username must match. Default: /^[a-zA-Z0-9_-]+$/ (alphanumeric, underscore, hyphen).'),
    paramField('required', 'boolean', false, 'Whether username is required on sign-up. Default: false (optional).'),

    h2('Sign up with username'),
    p('Pass username in the sign-up body alongside email and password:'),
    codeBlock(`// POST /auth/sign-up/email
{
  "email": "user@example.com",
  "password": "secret123",
  "username": "alice_dev"
}`, 'json'),
    codeBlock(`const { data, error } = await authClient.signUp.email({
  email: 'user@example.com',
  password: 'secret123',
  username: 'alice_dev',
})`, 'typescript'),
    p('Usernames are automatically lowercased and trimmed. alice_Dev and alice_dev are treated as the same username.'),

    h2('Check availability'),
    p('GET /auth/username/check — public endpoint, no auth required:'),
    codeBlock(`// GET /auth/username/check?username=alice_dev

// Available
{ "available": true, "username": "alice_dev" }

// Taken
{ "available": false, "username": "alice_dev" }

// Invalid format
{ "available": false, "error": "Username may only contain letters, numbers, underscores, and hyphens" }`, 'json'),
    codeBlock(`// Check availability in your UI
async function checkUsername(username: string) {
  const res = await fetch(\`/auth/username/check?username=\${encodeURIComponent(username)}\`)
  const { available } = await res.json()
  return available
}`, 'typescript'),

    h2('Schema addition'),
    p('The plugin adds a unique username column to the users table:'),
    codeBlock(`ALTER TABLE ga_users ADD COLUMN username TEXT UNIQUE;
CREATE UNIQUE INDEX IF NOT EXISTS ga_users_username ON ga_users (username);`, 'sql'),

    h2('Error codes'),
    bullet('BAD_REQUEST — "Username is required" (when required: true and username omitted)'),
    bullet('BAD_REQUEST — "Username is already taken"'),
    bullet('BAD_REQUEST — Length or pattern validation failure with a descriptive message'),
  ]),
};
