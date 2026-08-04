/**
 * Gately Auth — Help Center & Documentation
 * Edit this file to configure branding, fonts, SEO, and portal settings.
 */
export const helpCenterConfig = {
  // Branding
  portal_name: 'Gately Auth',
  primary_color: '#000000',
  secondary_color: '#000000',
  welcome_title: 'Gately Auth Docs',
  welcome_subtitle: 'Cloudflare-native authentication for Workers. D1 + KV + email in minutes.',
  theme_mode: 'auto' as 'light' | 'dark' | 'auto',
  logo_url: '/Logo-nvc.png' as string | null,
  favicon_url: '/Logo-nvc.png' as string | null,

  // Layout
  show_search: true,
  show_categories: true,
  ai_answer_enabled: false,
  sidebar_style: 'default' as const,

  // Fonts
  heading_font: 'Geist Mono' as string | null,
  body_font: 'Onest' as string | null,

  // Header
  header_links: [
    { label: 'Home', url: '/' },
    { label: 'GitHub', url: 'https://github.com/gately-auth/gately-auth' },
    { label: 'npm', url: 'https://www.npmjs.com/package/@gately/auth-core' },
    { label: 'usegately.com', url: 'https://usegately.com' },
  ],
  show_primary_button: true,
  primary_button_label: 'Get Started',
  primary_button_url: '/article/installation',

  // SEO
  meta_title: 'Gately Auth — Cloudflare-native Authentication',
  meta_description:
    'Production-grade authentication for Cloudflare Workers. D1 database, KV sessions, email/password, magic links, OTP, and OAuth — all in one framework.',
  og_image_url: null as string | null,

  // Misc
  sub_path: null as string | null,
  github_repo: 'https://github.com/gately-auth/gately-auth' as string | null,
};
