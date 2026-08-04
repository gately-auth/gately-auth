import { bn, h2, h3, p, bullet, numbered, codeBlock, callout, tabs, codeGroup, step, accordion } from '../../blocks';

export const textBlockArticle = {
  id: 'text-block',
  title: 'Code Group Block',
  slug: 'text-block',
  excerpt: 'Multi-tab code blocks that show the same snippet in multiple languages — with syntax highlighting and a copy button.',
  category_id: 'components',
  is_published: true,
  display_order: 3,
  sidebar_title: null as string | null,
  icon: 'hugeicons:text' as string | null,
  created_at: '2024-01-12T00:00:00Z',
  updated_at: '2024-01-12T00:00:00Z',
  content: bn([
    p('The Code Group block renders a tabbed code viewer. Each tab has a label, a language, and a code string. Readers can switch between tabs and copy any snippet with one click.'),

    callout('info', 'Code Group is ideal for SDK examples where you want to show the same operation in TypeScript, Python, Go, and other languages side by side.'),

    h2('Live example'),
    p('Here is a Code Group showing how to initialise a client in four languages:'),
    codeGroup([
      {
        label: 'TypeScript',
        language: 'typescript',
        code: `import { createClient } from '@helio/sdk';\n\nconst client = createClient({\n  apiKey: process.env.API_KEY!,\n  timeout: 10_000,\n});\n\nconst users = await client.users.list({ limit: 20 });`,
      },
      {
        label: 'Python',
        language: 'python',
        code: `import helio\n\nclient = helio.Client(\n    api_key=os.environ["API_KEY"],\n    timeout=10,\n)\n\nusers = client.users.list(limit=20)`,
      },
      {
        label: 'Go',
        language: 'go',
        code: `client := helio.NewClient(\n    helio.WithAPIKey(os.Getenv("API_KEY")),\n    helio.WithTimeout(10*time.Second),\n)\n\nusers, err := client.Users.List(ctx, &helio.ListParams{Limit: 20})`,
      },
      {
        label: 'cURL',
        language: 'bash',
        code: `curl https://api.helio.dev/v1/users?limit=20 \\\n  -H "Authorization: Bearer $API_KEY"`,
      },
    ]),

    h2('Usage'),
    p('Import codeGroup from src/data/blocks.ts and pass an array of tab objects:'),
    codeBlock(
      `import { bn, codeGroup } from '../../blocks';\n\ncontent: bn([\n  codeGroup([\n    {\n      label: 'TypeScript',\n      language: 'typescript',\n      code: 'const x = 1 + 1;',\n    },\n    {\n      label: 'Python',\n      language: 'python',\n      code: 'x = 1 + 1',\n    },\n  ]),\n])`,
      'typescript'
    ),

    h2('Tab object shape'),
    p('Each tab in the array takes three fields:'),
    codeBlock(
      `{\n  label: string;     // tab button text — e.g. 'TypeScript', 'cURL'\n  language: string;  // syntax highlighting language — e.g. 'typescript', 'bash'\n  code: string;      // the raw code string\n}`,
      'typescript'
    ),

    h2('Supported languages'),
    tabs([
      { label: 'Web', body: 'typescript, javascript, tsx, jsx, html, css, json, yaml' },
      { label: 'Backend', body: 'python, go, rust, java, csharp, php, ruby, swift, kotlin' },
      { label: 'Shell', body: 'bash, sh, shell, powershell, cmd' },
      { label: 'Data', body: 'sql, graphql, xml, toml, ini, dockerfile' },
    ]),

    h2('Maximum tabs'),
    p('Code Group supports up to 4 tabs. If you need more, consider splitting the content into multiple Code Group blocks with a heading between them.'),
    callout('note', 'The tab count is not limited in the data model — but the UI renders best with 2 to 4 tabs. More than 4 may overflow on mobile.'),

    h2('Copy button'),
    p('Each Code Group has a copy button in the top-right corner of the code area. It copies the currently active tab\'s code to the clipboard and shows a checkmark for 2 seconds.'),

    h2('Fonts'),
    p('All code in Code Group blocks uses Geist Mono, loaded from the local variable font at public/Geist_Mono/. This ensures consistent rendering even without an internet connection.'),

    accordion('Can I show line numbers?', 'Not currently. Line numbers are not implemented in the Code Group block. If you need them, use a plain codeBlock with manually added line numbers in the code string.'),
    accordion('Can I highlight specific lines?', 'Not in the current implementation. The Code Group renders plain pre/code with Geist Mono. Line highlighting would require extending the codeGroupBlockSpec in viewer-block-specs.tsx.'),
  ]),
};
