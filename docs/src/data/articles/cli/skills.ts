import { bn, h2, p, bullet, codeBlock, callout, divider } from '../../blocks';

export const skillsArticle = {
  id: 'skills',
  title: 'Agent Skills',
  slug: 'skills',
  excerpt: 'Install gately-auth agent skills so your coding assistant follows library conventions and patterns.',
  category_id: 'cli',
  is_published: true,
  display_order: 3,
  sidebar_title: null as string | null,
  icon: 'hugeicons:sparkles' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('Agent skills are portable instruction files (SKILL.md) that teach your coding agent gately-auth conventions, safe patterns, and where to look in the docs. Install the gately-auth skill pack into your editor once and every agent session knows how to set up authentication correctly.'),

    h2('Install'),
    p('Use the skills CLI — no global install required:'),
    codeBlock('npx skills add gately-auth/skills', 'bash'),
    p('This installs the skill files into your project\'s configured skills directory. Your editor or agent picks them up automatically on the next session.'),

    h2('What gets installed'),
    bullet('SKILL.md — core patterns: setup, Worker entry, bindings, CLI workflow, error codes, conventions'),
    bullet('SKILL.recipes.md — common recipes: OAuth, magic links, OTP, React hooks, Hono middleware, admin plugin'),
    callout('info', 'After installing, restart your agent or reload skills if your tool requires it (Kiro, Cursor, GitHub Copilot Workspace, Claude Code).'),

    h2('What the skill teaches'),
    bullet('Never instantiate gatelyAuth() at module level — always inside a createAuth(env) factory'),
    bullet('Required wrangler.toml bindings: AUTH_DB (D1) and AUTH_KV (KV namespace)'),
    bullet('AUTH_SECRET must be set via wrangler secret put, not in wrangler.toml'),
    bullet('basePath defaults to /auth — all auth routes are handled automatically'),
    bullet('Sessions are in D1 — revoking is instant, no JWT expiry to wait for'),
    bullet('All 16 auth routes and their request/response shapes'),

    h2('MCP server'),
    p('For richer doc access in your agent, also connect the gately-auth MCP server:'),
    codeBlock('# Cursor — add to ~/.cursor/mcp.json\n{\n  "gately-auth": {\n    "url": "https://mcp.g-a.usegately.com/mcp"\n  }\n}', 'json'),
    codeBlock('# Claude Code\nclaude mcp add gately-auth https://mcp.g-a.usegately.com/mcp', 'bash'),

    h2('Source'),
    p('The skill files live in the gately-auth monorepo at packages/skills/ and are versioned alongside the library.'),
    codeBlock('https://github.com/gately-auth/gately-auth/tree/main/packages/skills', 'bash'),
  ]),
};
