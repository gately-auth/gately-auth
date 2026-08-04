import { bn, h2, h3, p, bullet, numbered, codeBlock, callout, tabs, step, accordion, cardGroup } from '../../blocks';

export const codeBlockArticle = {
  id: 'code-block',
  title: 'Steps Block',
  slug: 'code-block',
  excerpt: 'Numbered step blocks with a connecting line — perfect for installation guides, setup flows, and sequential instructions.',
  category_id: 'components',
  is_published: true,
  display_order: 4,
  sidebar_title: null as string | null,
  icon: 'hugeicons:code' as string | null,
  created_at: '2024-01-13T00:00:00Z',
  updated_at: '2024-01-13T00:00:00Z',
  content: bn([
    p('The Step block renders a numbered step with a title, body text, and a vertical connecting line between steps. It\'s ideal for installation guides, onboarding flows, and any sequential process.'),

    h2('Live example'),
    p('Here is a 4-step setup flow rendered with Step blocks:'),

    step(1, 'Create an account', 'Go to app.helio.dev and sign up with your email. You\'ll receive a confirmation email — click the link to verify your address.'),
    step(2, 'Create a project', 'From the dashboard, click New Project. Give it a name and choose a region closest to your users.'),
    step(3, 'Get your API key', 'Go to Settings → API Keys and click Create new key. Copy the key — it won\'t be shown again. Store it in your .env file as API_KEY.'),
    step(4, 'Make your first request', 'Install the SDK and make a test call to confirm everything is working. You should see a 200 response with your project details.'),

    h2('Usage'),
    p('Import step from src/data/blocks.ts. Each step takes a number, a title, and a body string:'),
    codeBlock(
      `import { bn, step } from '../../blocks';\n\ncontent: bn([\n  step(1, 'Install the SDK', 'Run: npm install @helio/sdk'),\n  step(2, 'Configure your key', 'Add API_KEY=sk-... to your .env file.'),\n  step(3, 'Make a request', 'Call client.users.list() to verify the connection.'),\n])`,
      'typescript'
    ),

    h2('Step function signature'),
    codeBlock(
      `step(\n  stepNumber: number,  // the number shown in the circle\n  stepTitle: string,   // bold heading for the step\n  body: string,        // description text below the title\n)`,
      'typescript'
    ),

    callout('tips', 'Step numbers don\'t have to be sequential — you can use 1, 2, 3 or any numbers. The number is just a display value, not an index.'),

    h2('Combining steps with other blocks'),
    p('Steps work best when combined with callouts and code groups. Here\'s a real-world pattern:'),
    codeBlock(
      `content: bn([\n  h2('Installation'),\n  step(1, 'Install dependencies', 'Run the install command for your package manager.'),\n  codeGroup([\n    { label: 'npm',  language: 'bash', code: 'npm install @helio/sdk' },\n    { label: 'yarn', language: 'bash', code: 'yarn add @helio/sdk' },\n    { label: 'pnpm', language: 'bash', code: 'pnpm add @helio/sdk' },\n  ]),\n  step(2, 'Set your API key', 'Create a .env file in your project root.'),\n  codeBlock('API_KEY=sk-your-key-here', 'bash'),\n  callout('warning', 'Never commit your API key to version control.'),\n  step(3, 'Initialise the client', 'Import and create a client instance.'),\n  codeBlock('import { createClient } from \\'@helio/sdk\\';\nconst client = createClient({ apiKey: process.env.API_KEY });', 'typescript'),\n])`,
      'typescript'
    ),

    h2('Styling'),
    p('The Step block renders a circle with the step number, a title, body text, and a vertical line connecting to the next step. The line is hidden on the last step automatically.'),
    p('The circle uses the muted background color and muted foreground text — it adapts to light and dark mode automatically.'),

    accordion('Can I add code inside a step body?', 'The step body is a plain text string. For steps that need code examples, place a codeBlock or codeGroup immediately after the step block.'),
    accordion('Can I nest steps?', 'Not directly. For sub-steps, use a numbered list (numbered() helper) inside the step body, or add indented bullet points after the step.'),
    accordion('How do I remove the connecting line on the last step?', 'The line is rendered as a flex-1 div inside the step. The last step\'s line still renders but has no following step to connect to — it just fades into empty space. This is intentional.'),
  ]),
};
