import { bn, h2, h3, p, bullet, codeBlock, callout, tabs, accordion, expandable } from '../../blocks';

export const heroBlockArticle = {
  id: 'hero-block',
  title: 'Callout Block',
  slug: 'hero-block',
  excerpt: 'Draw attention to important information with 7 callout variants — info, tips, warning, error, success, check, and note.',
  category_id: 'components',
  is_published: true,
  display_order: 2,
  sidebar_title: null as string | null,
  icon: 'hugeicons:layout-top' as string | null,
  created_at: '2024-01-11T00:00:00Z',
  updated_at: '2024-01-11T00:00:00Z',
  content: bn([
    p('The Callout block draws the reader\'s eye to important information. It renders a colored box with an icon on the left and inline text content. There are 7 variants, each with its own color scheme and icon.'),

    h2('All 7 variants'),
    callout('info', 'info — General information, context, or background knowledge the reader should be aware of.'),
    callout('tips', 'tips — Helpful hints, shortcuts, and best practices that make the reader\'s life easier.'),
    callout('warning', 'warning — Something that could go wrong, a gotcha, or something that needs careful attention.'),
    callout('error', 'error — Destructive actions, breaking changes, or critical errors that must not be ignored.'),
    callout('success', 'success — Confirmation that something worked, or a positive outcome to highlight.'),
    callout('check', 'check — Checklists, requirements, or completed steps in a process.'),
    callout('note', 'note — Neutral side notes and supplementary information that is useful but not critical.'),

    h2('Usage'),
    p('Import the callout helper from src/data/blocks.ts and pass the variant name and text:'),
    codeBlock(
      `import { bn, callout } from '../../blocks';\n\ncontent: bn([\n  callout('info', 'This feature requires Node.js 18 or later.'),\n  callout('warning', 'Changing this setting will restart the server.'),\n  callout('tips', 'You can chain multiple methods for a more concise call.'),\n])`,
      'typescript'
    ),

    h2('Variant reference'),
    tabs([
      {
        label: 'info',
        body: 'Border: blue-200 | Background: blue-50 | Icon: hugeicons:information-circle | Icon color: #3b82f6\nDark: border #1e40af | bg rgba(23,37,84,0.4)',
      },
      {
        label: 'warning',
        body: 'Border: yellow-200 | Background: yellow-50 | Icon: hugeicons:alert-02 | Icon color: #eab308\nDark: border #92400e | bg rgba(69,26,3,0.4)',
      },
      {
        label: 'error',
        body: 'Border: red-200 | Background: red-50 | Icon: hugeicons:cancel-circle | Icon color: #ef4444\nDark: border #991b1b | bg rgba(69,10,10,0.4)',
      },
      {
        label: 'success',
        body: 'Border: green-200 | Background: green-50 | Icon: hugeicons:checkmark-circle-01 | Icon color: #22c55e\nDark: border #166534 | bg rgba(5,46,22,0.4)',
      },
    ]),

    h2('Customising callout styles'),
    p('Callout colors are defined in the CALLOUT_STYLES object inside src/components/help-center/viewer-block-specs.tsx. Each variant has light and dark mode values:'),
    codeBlock(
      `const CALLOUT_STYLES = {\n  info:    { border: '#bfdbfe', bg: '#eff6ff', darkBorder: '#1e40af', darkBg: 'rgba(23,37,84,0.4)' },\n  warning: { border: '#fde68a', bg: '#fffbeb', darkBorder: '#92400e', darkBg: 'rgba(69,26,3,0.4)' },\n  success: { border: '#bbf7d0', bg: '#f0fdf4', darkBorder: '#166534', darkBg: 'rgba(5,46,22,0.4)' },\n  error:   { border: '#fecaca', bg: '#fef2f2', darkBorder: '#991b1b', darkBg: 'rgba(69,10,10,0.4)' },\n  tips:    { border: '#e9d5ff', bg: '#faf5ff', darkBorder: '#6b21a8', darkBg: 'rgba(46,16,101,0.4)' },\n  check:   { border: '#99f6e4', bg: '#f0fdfa', darkBorder: '#115e59', darkBg: 'rgba(4,47,46,0.4)' },\n  note:    { border: '#e4e4e7', bg: '#fafafa', darkBorder: '#3f3f46', darkBg: 'rgba(24,24,27,0.4)' },\n};`,
      'typescript'
    ),
    callout('tips', 'To add a new variant, add an entry to CALLOUT_STYLES, CALLOUT_ICON_COLORS, and CALLOUT_ICONS in viewer-block-specs.tsx, then use the new key as the calloutType.'),

    h2('When to use each variant'),
    accordion('When should I use info vs note?', 'Use info when the content is directly relevant to the task at hand. Use note for supplementary context that is useful but not essential.'),
    accordion('When should I use warning vs error?', 'Use warning for things that might cause problems if ignored. Use error for things that will definitely break or cause data loss.'),
    accordion('Can I put code inside a callout?', 'Not directly with the block helper — callout content is plain text. For callouts with code, use a paragraph block followed by a codeBlock, or write the article in HTML mode.'),
  ]),
};
