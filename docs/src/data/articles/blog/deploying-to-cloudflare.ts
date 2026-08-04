import { bn, h2, h3, p, callout, bullet, codeBlock, codeGroup, step, accordion, tabs } from '../../blocks';

export const deployingToCloudflareArticle = {
  id: 'deploying-to-cloudflare',
  title: 'Deploying Helio to Cloudflare Pages',
  slug: 'deploying-to-cloudflare',
  excerpt: 'A complete guide to deploying your Helio help center to Cloudflare Pages — manual deploy, GitHub integration, custom domains, and environment setup.',
  category_id: 'blog',
  is_published: true,
  display_order: 4,
  sidebar_title: null as string | null,
  icon: 'hugeicons:cloud' as string | null,
  created_at: '2024-04-10T00:00:00Z',
  updated_at: '2024-04-10T00:00:00Z',
  content: bn([
    p('Cloudflare Pages is the recommended deployment target for Helio. It\'s free for most use cases, deploys globally to 300+ edge locations, and supports Astro\'s server-side rendering via Cloudflare Workers. This guide covers everything from first deploy to custom domains.'),

    callout('info', 'Helio uses Astro\'s Cloudflare adapter in directory mode. This means each page is a separate Worker function — fast cold starts and no shared state between requests.'),

    h2('Option 1 — Manual deploy'),
    p('The fastest way to get live. Run these commands from your project root:'),
    step(1, 'Build the project', 'Run the Astro build command. This compiles your TypeScript, bundles assets, and outputs to the dist/ folder.'),
    codeBlock('npm run build', 'bash'),
    step(2, 'Deploy to Cloudflare Pages', 'The deploy script runs the build and pushes dist/ to Cloudflare Pages using Wrangler.'),
    codeBlock('npm run deploy\n# or manually:\nnpx wrangler pages deploy dist', 'bash'),
    step(3, 'Open your site', 'Wrangler prints the deployment URL — something like https://helio.your-account.pages.dev. Open it in your browser.'),
    callout('success', 'Your site is live. Every subsequent npm run deploy pushes a new deployment in under 30 seconds.'),

    h2('Option 2 — GitHub integration (recommended)'),
    p('Connect your repo to Cloudflare Pages for automatic deploys on every push to main.'),
    step(1, 'Push your repo to GitHub', 'Create a new GitHub repository and push your Helio project to it.'),
    codeBlock('git remote add origin https://github.com/your-org/helio.git\ngit push -u origin main', 'bash'),
    step(2, 'Create a Pages project', 'Go to dash.cloudflare.com → Workers & Pages → Create application → Pages → Connect to Git.'),
    step(3, 'Configure the build', 'Select your repository and set the build configuration:'),
    codeBlock('Framework preset:  Astro\nBuild command:     npm run build\nBuild output dir:  dist\nNode.js version:   18', 'bash'),
    step(4, 'Deploy', 'Click Save and Deploy. Cloudflare clones your repo, runs the build, and deploys. Future pushes to main trigger automatic deploys.'),

    h2('Custom domain'),
    p('Add your own domain to the Pages project:'),
    step(1, 'Open Custom Domains', 'In your Pages project, go to Settings → Custom Domains → Set up a custom domain.'),
    step(2, 'Enter your domain', 'Type your domain — e.g. docs.your-company.com — and click Continue.'),
    step(3, 'Update DNS', 'Add a CNAME record pointing to your Pages URL:'),
    codeBlock('Type:   CNAME\nName:   docs\nTarget: helio.your-account.pages.dev', 'bash'),
    step(4, 'Wait for propagation', 'DNS propagation takes 1–5 minutes if your domain is on Cloudflare, or up to 48 hours on other registrars. Cloudflare provisions an SSL certificate automatically.'),
    callout('tips', 'If your domain is already on Cloudflare, DNS propagation is near-instant and the SSL certificate is provisioned in under a minute.'),

    h2('Preview deployments'),
    p('Every pull request gets its own preview URL automatically. This is great for reviewing content changes before merging:'),
    bullet('Push a branch to GitHub'),
    bullet('Cloudflare Pages builds and deploys it to a unique URL'),
    bullet('The URL is posted as a comment on the pull request'),
    bullet('Merge the PR and the preview is promoted to production'),

    h2('Environment variables'),
    p('Helio runs on local data and requires no environment variables. But if you extend it with external services, set variables in the Pages dashboard:'),
    codeBlock('Workers & Pages → your project → Settings → Environment Variables', 'bash'),
    tabs([
      { label: 'Production', body: 'Variables set here are available in production deployments only. Use for live API keys and secrets.' },
      { label: 'Preview', body: 'Variables set here are available in preview deployments (pull requests). Use for staging API keys.' },
    ]),
    callout('warning', 'Never commit secrets to your repository. Use Cloudflare\'s environment variables for anything sensitive.'),

    h2('Wrangler config'),
    p('The wrangler.toml in the project root configures the Cloudflare deployment:'),
    codeBlock(
      `name = "helio"\ncompatibility_date = "2024-01-01"\npages_build_output_dir = "dist"\n\n[vars]\n# Add non-secret environment variables here`,
      'toml'
    ),

    h2('Build times'),
    p('Helio builds fast. Typical build times on Cloudflare Pages:'),
    bullet('Cold build (no cache): ~45 seconds'),
    bullet('Warm build (with cache): ~20 seconds'),
    bullet('Deploy after build: ~5 seconds'),

    accordion('Can I deploy to Vercel or Netlify instead?', 'Yes, but you\'ll need to swap the Cloudflare adapter for the Vercel or Netlify adapter in astro.config.mjs. The rest of the project works the same. See the Astro docs for adapter-specific setup.'),
    accordion('How do I roll back a deployment?', 'In the Cloudflare Pages dashboard, go to Deployments and click the three-dot menu on any previous deployment. Select Rollback to instantly revert to that version.'),
    accordion('Can I use a subdirectory path like /docs?', 'Yes. Set sub_path: \'/docs\' in src/data/config.ts and configure your Cloudflare Worker or reverse proxy to strip the prefix before forwarding to Pages.'),
  ]),
};
