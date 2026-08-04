/**
 * Helio — Help Center & Documentation Template
 * Edit this file to configure branding, fonts, SEO, and portal settings.
 */
export const helpCenterConfig = {
  // Branding
  portal_name: 'Helio',
  primary_color: '#ea4e1e',
  secondary_color: '#c43d10',
  welcome_title: 'How can we help you?',
  welcome_subtitle: 'Search our documentation or browse categories below.',
  theme_mode: 'auto' as 'light' | 'dark' | 'auto',
  logo_url: '/Helio_logo.png' as string | null,
  favicon_url: '/Helio_logo.png' as string | null,

  // Layout
  show_search: true,
  show_categories: true,
  ai_answer_enabled: false,
  sidebar_style: 'default' as const,

  // Fonts — Geist Mono (uppercase) for headings, Onest for body
  heading_font: 'Geist Mono' as string | null,
  body_font: 'Onest' as string | null,

  // Header
  header_links: [
    { label: 'Home', url: '/' },
    { label: 'GitHub', url: 'https://github.com' },
    { label: 'Website', url: 'https://usegately.com' },
  ],
  show_primary_button: true,
  primary_button_label: 'Get Template',
  primary_button_url: 'https://kayodedcreative.lemonsqueezy.com/checkout/buy/2311f738-7bd3-40de-8924-0c6cdcb4d474',

  // SEO
  meta_title: 'Helio — Help Center & Documentation Template',
  meta_description:
    'Helio is a modern help center and documentation template built with Astro for startups, SaaS products, and developers who want a fast, clean, and professional support site.',
  og_image_url: null as string | null,

  // Misc
  sub_path: null as string | null,
};
