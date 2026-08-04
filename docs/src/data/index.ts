/**
 * Gately Auth — Central data registry
 */

// ─── Folders ──────────────────────────────────────────────────────────────────
export { folders } from './folders';

// ─── Categories ──────────────────────────────────────────────────────────────
import { gettingStartedCategory } from './categories/getting-started';
import { coreConceptsCategory } from './categories/core-concepts';
import { authMethodsCategory } from './categories/auth-methods';
import { clientSdkCategory } from './categories/client-sdk';
import { cliCategory } from './categories/cli';
import { apiReferenceCategory } from './categories/api-reference';
import { integrationsCategory } from './categories/integrations';
import { deploymentCategory } from './categories/deployment';

export const categories = [
  gettingStartedCategory,
  coreConceptsCategory,
  authMethodsCategory,
  clientSdkCategory,
  cliCategory,
  apiReferenceCategory,
  integrationsCategory,
  deploymentCategory,
];

// ─── Articles: Getting Started ────────────────────────────────────────────────
import { introductionArticle } from './articles/getting-started/introduction';
import { installationArticle } from './articles/getting-started/installation';
import { quickStartArticle } from './articles/getting-started/quick-start';

// ─── Articles: Core Concepts ──────────────────────────────────────────────────
import { howItWorksArticle } from './articles/core-concepts/how-it-works';
import { configurationArticle } from './articles/core-concepts/configuration';
import { pluginsArticle } from './articles/core-concepts/plugins';

// ─── Articles: Auth Methods ───────────────────────────────────────────────────
import { emailPasswordArticle } from './articles/auth-methods/email-password';
import { magicLinksArticle } from './articles/auth-methods/magic-links';
import { emailOtpArticle } from './articles/auth-methods/email-otp';
import { oauthSocialArticle } from './articles/auth-methods/oauth-social';

// ─── Articles: Client SDK ─────────────────────────────────────────────────────
import { clientOverviewArticle } from './articles/client-sdk/overview';
import { reactHooksArticle } from './articles/client-sdk/react-hooks';

// ─── Articles: CLI ────────────────────────────────────────────────────────────
import { cliOverviewArticle } from './articles/cli/cli-overview';

// ─── Articles: API Reference ──────────────────────────────────────────────────
import { coreApiArticle } from './articles/api-reference/core-api';
import { clientApiArticle } from './articles/api-reference/client-api';
import { errorCodesArticle } from './articles/api-reference/error-codes';

// ─── Articles: Integrations ───────────────────────────────────────────────────
import { nextjsArticle } from './articles/integrations/nextjs';
import { honoArticle } from './articles/integrations/hono';

// ─── Articles: Deployment ─────────────────────────────────────────────────────
import { deployToCloudflareArticle } from './articles/deployment/deploy-to-cloudflare';
import { environmentVariablesArticle } from './articles/deployment/environment-variables';

export const articles = [
  // Getting Started
  introductionArticle,
  installationArticle,
  quickStartArticle,
  // Core Concepts
  howItWorksArticle,
  configurationArticle,
  pluginsArticle,
  // Auth Methods
  emailPasswordArticle,
  magicLinksArticle,
  emailOtpArticle,
  oauthSocialArticle,
  // Client SDK
  clientOverviewArticle,
  reactHooksArticle,
  // CLI
  cliOverviewArticle,
  // API Reference
  coreApiArticle,
  clientApiArticle,
  errorCodesArticle,
  // Integrations
  nextjsArticle,
  honoArticle,
  // Deployment
  deployToCloudflareArticle,
  environmentVariablesArticle,
];
