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
    description: 'Installation, configuration, and core concepts.',
    is_default: true,
    display_order: 1,
  },
  {
    id: 'api-reference',
    name: 'API Reference',
    slug: 'api-reference',
    icon: 'hugeicons:code',
    description: 'Full reference for every package, option, and method.',
    is_default: false,
    display_order: 2,
  },
  {
    id: 'guides',
    name: 'Guides',
    slug: 'guides',
    icon: 'hugeicons:quill-write-01',
    description: 'Framework integrations, deployment, and recipes.',
    is_default: false,
    display_order: 3,
  },
];
