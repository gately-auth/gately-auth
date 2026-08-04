import { bn, h2, h3, p, bullet, codeBlock, callout, tabs, accordion, expandable, paramField, responseField } from '../../blocks';

export const sidebarBlockArticle = {
  id: 'sidebar-block',
  title: 'Param & Response Field Block',
  slug: 'sidebar-block',
  excerpt: 'API parameter and response field blocks with type badges, required indicators, and inline descriptions.',
  category_id: 'components',
  is_published: true,
  display_order: 7,
  sidebar_title: null as string | null,
  icon: 'hugeicons:sidebar-left' as string | null,
  created_at: '2024-01-16T00:00:00Z',
  updated_at: '2024-01-16T00:00:00Z',
  content: bn([
    p('The Param Field and Response Field blocks are designed for API reference documentation. They render a parameter name in orange monospace, a type badge, an optional required indicator, and a description.'),

    h2('Param Field — live example'),
    p('Here are the parameters for a hypothetical POST /users endpoint:'),

    paramField('email', 'string', true, 'The user\'s email address. Must be a valid email format. Used as the login identifier.', 'body'),
    paramField('password', 'string', true, 'The user\'s password. Minimum 8 characters. Stored as a bcrypt hash — never stored in plain text.', 'body'),
    paramField('name', 'string', false, 'The user\'s display name. Defaults to the email prefix if not provided.', 'body'),
    paramField('role', 'string', false, 'The user\'s role. One of: admin, member, viewer. Defaults to member.', 'body'),
    paramField('metadata', 'object', false, 'Arbitrary key-value pairs you can attach to the user. Useful for storing app-specific data.', 'body'),

    h2('Param Field — usage'),
    codeBlock(
      `import { bn, paramField } from '../../blocks';\n\ncontent: bn([\n  paramField(\n    'email',          // parameter name\n    'string',         // type\n    true,             // required\n    'The user\\'s email address.',  // description\n    'body',           // location: 'body' | 'query' | 'header' | 'path'\n  ),\n])`,
      'typescript'
    ),

    h2('Param Field — function signature'),
    codeBlock(
      `paramField(\n  paramName: string,   // shown in orange monospace\n  paramType: string,   // shown in a muted badge\n  required: boolean,   // shows a red 'required' badge if true\n  description: string, // plain text description\n  location?: string,   // 'body' | 'query' | 'header' | 'path' (default: 'body')\n)`,
      'typescript'
    ),

    callout('info', 'The location field is stored in the block props but not currently rendered in the UI. It\'s available for future use or custom styling.'),

    h2('Response Field — live example'),
    p('Here are the fields returned by GET /users/:id:'),

    responseField('id', 'string', true, 'Unique identifier for the user. UUID v4 format.'),
    responseField('email', 'string', true, 'The user\'s email address.'),
    responseField('name', 'string', false, 'The user\'s display name. May be null if not set.'),
    responseField('role', 'string', true, 'The user\'s role. One of: admin, member, viewer.'),
    responseField('created_at', 'string', true, 'ISO 8601 timestamp of when the user was created.'),
    responseField('updated_at', 'string', true, 'ISO 8601 timestamp of the last update.'),
    responseField('metadata', 'object', false, 'Arbitrary key-value pairs attached to the user. May be null.'),

    h2('Response Field — usage'),
    codeBlock(
      `import { bn, responseField } from '../../blocks';\n\ncontent: bn([\n  responseField(\n    'id',             // field name\n    'string',         // type\n    true,             // always present in response\n    'UUID v4 identifier.',  // description\n  ),\n])`,
      'typescript'
    ),

    h2('Building a full API reference article'),
    p('Here\'s a complete pattern for an API endpoint article combining multiple block types:'),
    codeBlock(
      `import { bn, h2, h3, p, callout, codeGroup, paramField, responseField } from '../../blocks';\n\nexport const createUserArticle = {\n  id: 'create-user',\n  title: 'POST /users',\n  slug: 'create-user',\n  category_id: 'api-reference',\n  content: bn([\n    p('Creates a new user account.'),\n    callout('info', 'Requires an API key with write:users scope.'),\n\n    h2('Request body'),\n    paramField('email', 'string', true, 'User email address.', 'body'),\n    paramField('password', 'string', true, 'Password — min 8 chars.', 'body'),\n    paramField('name', 'string', false, 'Display name.', 'body'),\n\n    h2('Example request'),\n    codeGroup([\n      { label: 'cURL', language: 'bash', code: 'curl -X POST https://api.helio.dev/v1/users \\\\\\n  -H "Authorization: Bearer $API_KEY" \\\\\\n  -d \'{"email":"user@example.com","password":"secret123"}\'' },\n      { label: 'TypeScript', language: 'typescript', code: 'const user = await client.users.create({ email, password });' },\n    ]),\n\n    h2('Response'),\n    responseField('id', 'string', true, 'UUID of the created user.'),\n    responseField('email', 'string', true, 'The user\\'s email.'),\n    responseField('created_at', 'string', true, 'ISO 8601 creation timestamp.'),\n  ]),\n};`,
      'typescript'
    ),

    accordion('Can I show nested object fields?', 'Use the expandable block after a responseField to show nested properties. The expandable trigger text can say "Show nested fields" and the body lists the sub-fields.'),
    accordion('Can I show enum values for a field?', 'Add the enum values to the description string — e.g. "One of: admin, member, viewer". There is no dedicated enum block currently.'),
    accordion('How do I show a deprecated field?', 'Add "(deprecated)" to the field name or description. There is no dedicated deprecated styling currently, but you can add a callout(\'warning\', ...) before the field.'),
  ]),
};
