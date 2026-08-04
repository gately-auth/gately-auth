import { bn, h2, h3, p, callout, bullet, codeBlock, tabs, accordion, expandable, cardGroup } from '../../blocks';

export const darkModeThemingArticle = {
  id: 'dark-mode-theming',
  title: 'Dark Mode and Theming in Helio',
  slug: 'dark-mode-theming',
  excerpt: 'How Helio\'s theme system works — system preference detection, localStorage persistence, flash-free switching, and how to customise colors and fonts.',
  category_id: 'blog',
  is_published: true,
  display_order: 5,
  sidebar_title: null as string | null,
  icon: 'hugeicons:paint-brush-01' as string | null,
  created_at: '2024-04-20T00:00:00Z',
  updated_at: '2024-04-20T00:00:00Z',
  content: bn([
    p('Getting dark mode right is harder than it looks. The naive approach — toggling a class on the body — causes a white flash on page load for users who prefer dark mode. Helio solves this with a blocking inline script that reads the user\'s preference before the first paint.'),

    h2('How it works'),
    p('Helio\'s theme system has three layers:'),
    cardGroup(3, [
      { icon: 'hugeicons:moon-02', title: 'Detection', body: 'A blocking inline script in <head> reads localStorage and prefers-color-scheme before the browser paints anything.' },
      { icon: 'hugeicons:database-01', title: 'Persistence', body: 'The user\'s choice is saved to localStorage as help-center-theme and sessionStorage as theme-is-dark for cross-page consistency.' },
      { icon: 'hugeicons:refresh', title: 'Transitions', body: 'Astro\'s View Transitions API preserves the theme across page navigations — no flash between articles.' },
    ]),

    h2('The blocking script'),
    p('This script runs synchronously in <head> before any CSS or React loads. It\'s the key to flash-free dark mode:'),
    codeBlock(
      `(function() {\n  const savedTheme = localStorage.getItem('help-center-theme');\n  const themeMode = 'auto'; // from config\n  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;\n\n  const isDark =\n    savedTheme === 'dark' ||\n    (themeMode === 'dark' && !savedTheme) ||\n    (themeMode === 'auto' && !savedTheme && prefersDark);\n\n  if (isDark) {\n    document.documentElement.classList.add('dark');\n    document.documentElement.style.backgroundColor = '#000000';\n  } else {\n    document.documentElement.classList.remove('dark');\n    document.documentElement.style.backgroundColor = '#ffffff';\n  }\n\n  sessionStorage.setItem('theme-is-dark', isDark ? '1' : '0');\n})();`,
      'javascript'
    ),
    callout('info', 'The script sets background-color directly on the html element before any CSS loads. This prevents the white flash even on slow connections.'),

    h2('Theme modes'),
    tabs([
      {
        label: 'auto (default)',
        body: 'Follows the user\'s OS preference on first visit. Shows a sun/moon toggle button in the header. The user\'s manual choice is saved to localStorage and overrides the OS preference on subsequent visits.',
      },
      {
        label: 'light',
        body: 'Always renders in light mode. The theme toggle button is hidden. Users cannot switch to dark mode.',
      },
      {
        label: 'dark',
        body: 'Always renders in dark mode. The theme toggle button is hidden. Users cannot switch to light mode.',
      },
    ]),
    p('Set your preferred mode in src/data/config.ts:'),
    codeBlock(`theme_mode: 'auto',  // 'light' | 'dark' | 'auto'`, 'typescript'),

    h2('CSS custom properties'),
    p('Colors are defined as HSL CSS custom properties in src/styles/globals.css. The .dark class on the html element switches to the dark palette:'),
    codeBlock(
      `:root {\n  --background: 0 0% 100%;\n  --foreground: 0 0% 3.9%;\n  --muted: 0 0% 96.1%;\n  --muted-foreground: 0 0% 45.1%;\n  --border: 0 0% 93%;\n  --primary: 0 0% 9%;\n  /* ... */\n}\n\n.dark {\n  --background: 0 0% 5%;\n  --foreground: 0 0% 98%;\n  --muted: 0 0% 10%;\n  --muted-foreground: 0 0% 63.9%;\n  --border: 0 0% 15%;\n  --primary: 0 0% 98%;\n  /* ... */\n}`,
      'css'
    ),
    callout('tips', 'All Helio components use these CSS variables — never hardcoded colors. This means changing --background in one place updates the entire UI.'),

    h2('Brand color'),
    p('The primary_color in config.ts is applied as a CSS custom property and used for buttons, links, active sidebar states, callout borders, and the hero gradient:'),
    codeBlock(
      '// In BaseLayout.astro\nconst primaryColor = config.primary_color || \'#3b82f6\';\n\n// Applied as:\n:root {\n  --primary-color: ' + '${primaryColor}' + ';\n}',
      'typescript'
    ),
    p('Components reference it as var(--primary-color) or via the config prop passed down from the page.'),

    h2('Fonts'),
    p('Fonts are applied via CSS custom properties set by the BaseLayout script:'),
    codeBlock(
      `:root {\n  --heading-font: 'Geist Mono', ui-monospace, monospace;\n  --body-font: 'Onest', system-ui, sans-serif;\n}`,
      'css'
    ),
    p('The heading font uses text-transform: uppercase and letter-spacing: 0.04em globally. To change this, edit the h1-h6 rule in src/styles/globals.css.'),

    h2('View Transitions and theme'),
    p('Astro\'s View Transitions API replaces the entire document on navigation. Without special handling, the theme would reset on every page change. Helio handles this with three event listeners:'),
    codeBlock(
      `// Save theme before navigation\ndocument.addEventListener('astro:before-preparation', () => {\n  const isDark = document.documentElement.classList.contains('dark');\n  sessionStorage.setItem('theme-is-dark', isDark ? '1' : '0');\n});\n\n// Apply theme to new document BEFORE swap — prevents flash\ndocument.addEventListener('astro:before-swap', (e) => {\n  const isDark = sessionStorage.getItem('theme-is-dark') === '1';\n  if (isDark) {\n    e.newDocument.documentElement.classList.add('dark');\n    e.newDocument.documentElement.style.backgroundColor = '#000000';\n  }\n});\n\n// Re-apply after swap for persisted elements\ndocument.addEventListener('astro:page-load', () => {\n  applyTheme();\n});`,
      'javascript'
    ),

    accordion('Why does the theme flash on first load sometimes?', 'This can happen if the blocking script is moved below a CSS file in <head>, or if a CDN strips inline scripts. Make sure the theme script is the first thing in <head> and that your CDN/proxy does not modify HTML.'),
    accordion('Can I add more color themes?', 'Yes. Add new CSS variable sets in globals.css and a theme switcher component that applies the right class to the html element. The existing light/dark infrastructure is a good starting point.'),
    accordion('How do I make the code blocks match my brand color?', 'Code block colors are defined by --code-block-bg, --code-block-header-bg, and --code-block-border CSS variables in globals.css. Edit these to match your brand.'),

    expandable('Show all CSS variables used by Helio', '--background, --foreground, --card, --card-foreground, --popover, --popover-foreground, --primary, --primary-foreground, --secondary, --secondary-foreground, --muted, --muted-foreground, --accent, --accent-foreground, --destructive, --destructive-foreground, --border, --input, --ring, --radius, --code-block-bg, --code-block-header-bg, --code-block-border'),
  ]),
};
