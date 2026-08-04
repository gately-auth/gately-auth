import { bn, h2, h3, p, bullet, codeBlock, callout, tabs, accordion, expandable, step, codeGroup } from '../../blocks';

export const searchBlockArticle = {
  id: 'search-block',
  title: 'Expandable Block',
  slug: 'search-block',
  excerpt: 'Inline expandable sections for nested properties, optional parameters, and extra detail — without breaking the reading flow.',
  category_id: 'components',
  is_published: true,
  display_order: 8,
  sidebar_title: null as string | null,
  icon: 'hugeicons:search-01' as string | null,
  created_at: '2024-01-17T00:00:00Z',
  updated_at: '2024-01-17T00:00:00Z',
  content: bn([
    p('The Expandable block is a lightweight collapsible section. Unlike Accordion, it uses a small inline trigger with an arrow icon — designed to sit inside a larger section without breaking the reading flow.'),

    h2('Live example'),
    p('Here is an expandable showing optional configuration fields:'),
    expandable('Show optional config fields', 'secondary_color (string) — secondary brand color used for hover states.\nheading_font (string | null) — Google Font name for headings. Defaults to Onest.\nbody_font (string | null) — Google Font name for body text. Defaults to Onest.\nfavicon_url (string | null) — path or URL to your favicon.\nog_image_url (string | null) — Open Graph image for social sharing.\nmeta_title (string) — HTML title tag content.\nmeta_description (string) — HTML meta description.'),

    p('And here is one showing nested API response fields:'),
    expandable('Show metadata object fields', 'The metadata object can contain any key-value pairs. Keys must be strings. Values can be strings, numbers, or booleans. Maximum 50 keys per object. Maximum key length: 64 characters. Maximum value length: 512 characters.'),

    h2('Usage'),
    codeBlock(
      `import { bn, expandable } from '../../blocks';\n\ncontent: bn([\n  expandable(\n    'Show advanced options',           // trigger text\n    'These options are rarely needed...',  // body text (shown when expanded)\n  ),\n])`,
      'typescript'
    ),

    h2('Function signature'),
    codeBlock(
      `expandable(\n  title: string,   // the clickable trigger text\n  body: string,    // plain text shown when expanded\n)`,
      'typescript'
    ),

    callout('note', 'Expandable body is plain text. For expandables with code or structured content, use an Accordion block instead — it has a larger, more prominent UI that better suits rich content.'),

    h2('When to use expandable vs accordion'),
    tabs([
      {
        label: 'Use Expandable',
        body: '• Nested object properties in API docs\n• Optional config fields\n• Advanced options that most readers won\'t need\n• Supplementary detail within a larger section\n• When you want a subtle, inline disclosure',
      },
      {
        label: 'Use Accordion',
        body: '• FAQ sections\n• Standalone question/answer pairs\n• Content that deserves its own visual weight\n• When the trigger text is a full question\n• When you want a prominent, bordered disclosure',
      },
    ]),

    h2('Styling'),
    p('The Expandable block renders with a left border accent and a small arrow icon that rotates 90° when expanded. The trigger text uses muted foreground color and transitions to foreground on hover.'),
    p('The left border uses the CSS border-border variable, so it adapts to light and dark mode automatically.'),

    h2('Combining with Param Field'),
    p('A common pattern in API docs is to use Expandable after a Param Field to show nested object properties:'),
    codeBlock(
      `import { bn, paramField, expandable } from '../../blocks';\n\ncontent: bn([\n  paramField('metadata', 'object', false, 'Arbitrary key-value pairs.', 'body'),\n  expandable('Show metadata constraints', 'Keys: string, max 64 chars.\\nValues: string | number | boolean, max 512 chars.\\nMax 50 keys per object.'),\n\n  paramField('address', 'object', false, 'Billing address.', 'body'),\n  expandable('Show address fields', 'line1 (string, required)\\nline2 (string, optional)\\ncity (string, required)\\nstate (string, required)\\npostal_code (string, required)\\ncountry (string, required) — ISO 3166-1 alpha-2'),\n])`,
      'typescript'
    ),

    accordion('Can I have multiple expandables open at once?', 'Yes. Each expandable block manages its own open/closed state independently. Multiple expandables on the same page can all be open simultaneously.'),
    accordion('Can I nest expandables?', 'Not directly — the expandable body is a plain text string. For deeply nested structures, use multiple expandable blocks at the same level with descriptive trigger text.'),
  ]),
};
