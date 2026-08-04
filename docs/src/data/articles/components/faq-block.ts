import { bn, h2, h3, p, bullet, codeBlock, callout, tabs, accordion, expandable, paramField, responseField } from '../../blocks';

export const faqBlockArticle = {
  id: 'faq-block',
  title: 'Tabs & Accordion Block',
  slug: 'faq-block',
  excerpt: 'Tabs for multi-context content and Accordion for collapsible sections — both interactive, no JavaScript setup needed.',
  category_id: 'components',
  is_published: true,
  display_order: 6,
  sidebar_title: null as string | null,
  icon: 'hugeicons:help-circle' as string | null,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  content: bn([
    p('Tabs and Accordion are the two interactive layout blocks in Helio. Tabs show multiple panels in the same space. Accordion hides content until the reader expands it. Both are fully interactive with no extra setup.'),

    h2('Tabs — live example'),
    p('Tabs are great for showing the same concept in multiple contexts — different languages, operating systems, or user roles:'),
    tabs([
      {
        label: 'macOS',
        body: 'Install Homebrew first, then run: brew install node\nVerify: node --version',
      },
      {
        label: 'Windows',
        body: 'Download the installer from nodejs.org/en/download\nRun the .msi installer and follow the prompts.\nVerify: node --version in PowerShell.',
      },
      {
        label: 'Linux',
        body: 'Use your distro\'s package manager:\nUbuntu/Debian: sudo apt install nodejs\nFedora: sudo dnf install nodejs\nArch: sudo pacman -S nodejs',
      },
    ]),

    h2('Tabs — usage'),
    codeBlock(
      `import { bn, tabs } from '../../blocks';\n\ncontent: bn([\n  tabs([\n    { label: 'npm',  body: 'npm install @helio/sdk' },\n    { label: 'yarn', body: 'yarn add @helio/sdk' },\n    { label: 'pnpm', body: 'pnpm add @helio/sdk' },\n  ]),\n])`,
      'typescript'
    ),
    callout('note', 'Tab body is plain text. For code inside tabs, use a codeGroup block instead — it has the same tab UI but with syntax highlighting and a copy button.'),

    h2('Tabs — options'),
    p('The tabs helper accepts 2 to 4 tab objects. Each tab has a label and a body:'),
    codeBlock(
      `tabs([\n  { label: string; body: string },  // up to 4 items\n])`,
      'typescript'
    ),

    h2('Accordion — live example'),
    p('Accordion blocks collapse content until the reader clicks to expand. Use them for FAQs, optional detail, and anything that would clutter the page if always visible:'),
    accordion('What is the difference between tabs and accordion?', 'Tabs show one panel at a time in a fixed space — all options are always visible as tab buttons. Accordion hides content entirely until expanded — only the question/title is visible. Use tabs when readers need to compare options. Use accordion when content is optional or supplementary.'),
    accordion('Can I have multiple accordions open at once?', 'Each accordion block is independent — they don\'t share state. So yes, multiple accordion blocks on the same page can all be open simultaneously.'),
    accordion('Can I put code inside an accordion?', 'The accordion body is a plain text string. For accordions with code, place a codeBlock immediately after the accordion block and use a heading or callout to visually group them.'),
    accordion('How is accordion different from expandable?', 'Accordion is a standalone block with a bold title and full-width border. Expandable is an inline block with a smaller trigger — it\'s designed for nested properties and optional detail within a larger section.'),

    h2('Accordion — usage'),
    codeBlock(
      `import { bn, accordion } from '../../blocks';\n\ncontent: bn([\n  accordion('What Node.js version is required?', 'Node.js 18 or later. We recommend the LTS release.'),\n  accordion('Can I self-host?', 'Yes. Deploy to any static host — Cloudflare Pages, Vercel, Netlify, or your own server.'),\n])`,
      'typescript'
    ),

    h2('Expandable — live example'),
    p('Expandable is a lighter-weight alternative to Accordion. It uses a smaller trigger and is designed for inline use within a larger section:'),
    expandable('Show all supported config fields', 'portal_name, primary_color, secondary_color, welcome_title, welcome_subtitle, theme_mode, logo_url, favicon_url, show_search, show_categories, ai_answer_enabled, sidebar_style, heading_font, body_font, header_links, show_primary_button, primary_button_label, primary_button_url, meta_title, meta_description, og_image_url, sub_path'),

    h2('Expandable — usage'),
    codeBlock(
      `import { bn, expandable } from '../../blocks';\n\ncontent: bn([\n  expandable('Show advanced options', 'These options are rarely needed but available for edge cases...'),\n])`,
      'typescript'
    ),

    h2('Choosing between tabs, accordion, and expandable'),
    tabs([
      { label: 'Use Tabs when', body: 'You have 2-4 parallel options the reader needs to choose between — like different languages, OS, or user roles. All options should be equally important.' },
      { label: 'Use Accordion when', body: 'You have FAQ-style content, optional detail, or supplementary information that would clutter the page if always visible. The question/title should be self-explanatory.' },
      { label: 'Use Expandable when', body: 'You have a small amount of optional detail inline within a larger section — like showing all properties of an object, or advanced options for a config field.' },
    ]),
  ]),
};
