import { bn, h2, h3, p, callout, bullet, codeBlock, codeGroup, step, accordion, tabs } from '../../blocks';

export const buildingDocsWithBlocksArticle = {
  id: 'building-docs-with-blocks',
  title: 'Building Documentation with Content Blocks',
  slug: 'building-docs-with-blocks',
  excerpt: 'How to use Helio\'s composable block system to write rich, interactive documentation without a CMS.',
  category_id: 'blog',
  is_published: true,
  display_order: 2,
  sidebar_title: null as string | null,
  icon: 'hugeicons:building-01' as string | null,
  created_at: '2024-03-15T00:00:00Z',
  updated_at: '2024-03-15T00:00:00Z',
  content: bn([
    p('One of the most common questions we get is: "How do I write rich documentation without a visual editor?" The answer is Helio\'s block system — a set of TypeScript helper functions that compose into fully interactive content.'),

    h2('The problem with plain HTML'),
    p('Most static documentation tools use Markdown or HTML for content. That works fine for simple text, but falls apart when you need interactive elements — tabs for multi-language code examples, collapsible sections for optional detail, or callout boxes for warnings.'),
    p('You end up either writing raw HTML with inline styles, or reaching for a CMS that adds complexity and cost.'),

    h2('The block approach'),
    p('Helio takes a different approach. Content is composed from typed TypeScript functions that generate BlockNote JSON. The viewer renders this JSON using React components — the same ones you\'d build yourself, but already done.'),

    codeBlock(
      `import { bn, h2, p, callout, step, codeGroup } from '../blocks';\n\nexport const myArticle = {\n  content: bn([\n    h2('Installation'),\n    callout('info', 'Requires Node.js 18+'),\n    step(1, 'Install', 'npm install @my/sdk'),\n    step(2, 'Configure', 'Add your API key to .env'),\n    codeGroup([\n      { label: 'TypeScript', language: 'typescript', code: 'const client = new Client({ apiKey });' },\n      { label: 'Python',     language: 'python',     code: 'client = Client(api_key=api_key)' },\n    ]),\n  ]),\n};`,
      'typescript'
    ),

    h2('What this gives you'),
    bullet('Type safety — TypeScript catches missing required fields at compile time'),
    bullet('Refactorability — rename a block helper and every article using it updates'),
    bullet('No visual editor needed — the content is just data'),
    bullet('Version control — every content change is a git diff'),
    bullet('No CMS lock-in — the content is yours, in your repo'),

    h2('Real-world patterns'),
    tabs([
      {
        label: 'SDK docs',
        body: 'Use codeGroup for multi-language examples, step for setup flows, paramField for API parameters, and callout(\'warning\') for deprecation notices.',
      },
      {
        label: 'Guides',
        body: 'Use step for sequential instructions, callout(\'tips\') for shortcuts, accordion for FAQs at the end, and cardGroup for "next steps" navigation.',
      },
      {
        label: 'API reference',
        body: 'Use paramField and responseField for request/response schemas, codeGroup for request examples in multiple languages, and expandable for nested object properties.',
      },
    ]),

    h2('Adding a new block type'),
    p('If the built-in blocks don\'t cover your use case, you can add a new one in three steps:'),
    step(1, 'Define the block spec', 'Add a new createReactBlockSpec in src/components/help-center/viewer-block-specs.tsx'),
    step(2, 'Register it in the schema', 'Add it to the viewerSchema blockSpecs object in ArticleContentViewer.tsx'),
    step(3, 'Add a helper function', 'Add a typed helper to src/data/blocks.ts so articles can use it'),

    callout('tips', 'The block system is just BlockNote under the hood. Any custom block you can build in BlockNote works in Helio.'),

    accordion('Do I need to know BlockNote to use Helio?', 'No. The helper functions in src/data/blocks.ts abstract away all the BlockNote JSON. You just call h2(), callout(), step() etc. and the JSON is generated for you.'),
    accordion('Can I mix HTML and blocks in the same article?', 'Yes. If the content string doesn\'t contain a <script data-bn> tag, the viewer falls back to parsing it as HTML. You can use plain HTML for simple articles and blocks for rich ones.'),
  ]),
};
