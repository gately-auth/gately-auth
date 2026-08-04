/**
 * Folders group categories into top-level sections shown in the secondary nav bar.
 * The folder with is_default: true is shown on the root page (/).
 * Other folders are accessible via their slug in the top nav.
 *
 * To add a folder:
 *   1. Add an entry here
 *   2. Set folder_id on the categories that belong to it
 *   3. Export it from src/data/index.ts
 */

export const folders = [
  {
    id: 'docs',
    name: 'Docs',
    slug: 'docs',
    icon: 'hugeicons:book-open-01',
    description: 'Guides, configuration, and component documentation.',
    is_default: true,
    display_order: 1,
  },
  {
    id: 'api-reference',
    name: 'API Reference',
    slug: 'api-reference',
    icon: 'hugeicons:code',
    description: 'Full API documentation with request and response examples.',
    is_default: false,
    display_order: 2,
  },
  {
    id: 'blog',
    name: 'Blog',
    slug: 'blog',
    icon: 'hugeicons:quill-write-01',
    description: 'Updates, tutorials, and product news.',
    is_default: false,
    display_order: 3,
  },
];
