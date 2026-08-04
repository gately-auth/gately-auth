/**
 * Central data registry
 * Import categories, articles, and folders from their individual files.
 * localData.ts consumes these exports.
 *
 * To add content:
 *   1. Create a file in src/data/categories/, src/data/articles/<category>/, or src/data/folders.ts
 *   2. Import and add it to the arrays below
 */

// ─── Folders ──────────────────────────────────────────────────────────────────
export { folders } from './folders';

// ─── Categories ──────────────────────────────────────────────────────────────
import { gettingStartedCategory } from './categories/getting-started';
import { componentsCategory } from './categories/components';
import { guidesCategory } from './categories/guides';
import { apiReferenceCategory } from './categories/api-reference';
import { troubleshootingCategory } from './categories/troubleshooting';
import { blogCategory } from './categories/blog';

export const categories = [
  gettingStartedCategory,
  componentsCategory,
  guidesCategory,
  apiReferenceCategory,
  troubleshootingCategory,
  blogCategory,
];

// ─── Articles: Getting Started ────────────────────────────────────────────────
import { welcomeArticle } from './articles/getting-started/welcome';
import { installationArticle } from './articles/getting-started/installation';
import { quickStartArticle } from './articles/getting-started/quick-start';

// ─── Articles: Template Components ───────────────────────────────────────────
import { componentsOverviewArticle } from './articles/components/overview';
import { heroBlockArticle } from './articles/components/hero-block';
import { textBlockArticle } from './articles/components/text-block';
import { codeBlockArticle } from './articles/components/code-block';
import { ctaBlockArticle } from './articles/components/cta-block';
import { faqBlockArticle } from './articles/components/faq-block';
import { sidebarBlockArticle } from './articles/components/sidebar-block';
import { searchBlockArticle } from './articles/components/search-block';

// ─── Articles: Guides ─────────────────────────────────────────────────────────
import { configurationArticle } from './articles/guides/configuration';
import { themingArticle } from './articles/guides/theming';
import { addingContentArticle } from './articles/guides/adding-content';

// ─── Articles: API Reference ──────────────────────────────────────────────────
import { apiIntroductionArticle } from './articles/api-reference/introduction';
import { apiAuthenticationArticle } from './articles/api-reference/authentication';

// ─── Articles: Troubleshooting ────────────────────────────────────────────────
import { commonErrorsArticle } from './articles/troubleshooting/common-errors';
import { performanceArticle } from './articles/troubleshooting/performance';

// ─── Articles: Blog ───────────────────────────────────────────────────────────
import { introducingHelioArticle } from './articles/blog/introducing-helio';
import { buildingDocsWithBlocksArticle } from './articles/blog/building-docs-with-blocks';
import { seoForDocsArticle } from './articles/blog/seo-for-docs';
import { deployingToCloudflareArticle } from './articles/blog/deploying-to-cloudflare';
import { darkModeThemingArticle } from './articles/blog/dark-mode-theming';
import { writingGreatDocsArticle } from './articles/blog/writing-great-docs';

export const articles = [
  // Getting Started
  welcomeArticle,
  installationArticle,
  quickStartArticle,
  // Template Components
  componentsOverviewArticle,
  heroBlockArticle,
  textBlockArticle,
  codeBlockArticle,
  ctaBlockArticle,
  faqBlockArticle,
  sidebarBlockArticle,
  searchBlockArticle,
  // Guides
  configurationArticle,
  themingArticle,
  addingContentArticle,
  // API Reference
  apiIntroductionArticle,
  apiAuthenticationArticle,
  // Troubleshooting
  commonErrorsArticle,
  performanceArticle,
  // Blog
  introducingHelioArticle,
  buildingDocsWithBlocksArticle,
  seoForDocsArticle,
  deployingToCloudflareArticle,
  darkModeThemingArticle,
  writingGreatDocsArticle,
];
