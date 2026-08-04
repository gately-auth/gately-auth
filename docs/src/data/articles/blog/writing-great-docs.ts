import { bn, h2, h3, p, callout, bullet, numbered, codeBlock, tabs, accordion, step, cardGroup, expandable } from '../../blocks';

export const writingGreatDocsArticle = {
  id: 'writing-great-docs',
  title: 'Writing Great Documentation',
  slug: 'writing-great-docs',
  excerpt: 'Practical principles for writing documentation that developers actually read — structure, tone, examples, and the most common mistakes to avoid.',
  category_id: 'blog',
  is_published: true,
  display_order: 6,
  sidebar_title: null as string | null,
  icon: 'hugeicons:pencil-edit-01' as string | null,
  created_at: '2024-05-01T00:00:00Z',
  updated_at: '2024-05-01T00:00:00Z',
  content: bn([
    p('Most documentation fails not because the writer doesn\'t know the product, but because they write for themselves instead of the reader. Good docs answer the question the reader has right now — not the question the writer thinks they should have.'),
    p('Here are the principles we use when writing Helio\'s own documentation.'),

    h2('Start with the reader\'s goal'),
    p('Every article should answer one question: what is the reader trying to accomplish? Write that down before you write a single word of content. If you can\'t state the reader\'s goal in one sentence, the article is probably trying to do too much.'),
    callout('tips', 'The article title should be the reader\'s goal, not a feature name. "Authentication" is a feature. "How to authenticate API requests" is a goal.'),

    h2('Structure every article the same way'),
    p('Readers scan before they read. A consistent structure lets them find what they need without reading everything:'),
    step(1, 'One-sentence overview', 'What does this article cover? What will the reader be able to do after reading it?'),
    step(2, 'Prerequisites or context', 'What does the reader need to know or have set up before starting? A callout(\'info\') works well here.'),
    step(3, 'The main content', 'Steps, code examples, tables, and explanations. Use h2 for major sections, h3 for subsections.'),
    step(4, 'Common questions', 'An accordion section at the end for FAQs. These often rank well in search because they match how people phrase questions.'),

    h2('Show, don\'t tell'),
    p('Every concept should have a code example. Every code example should be complete enough to copy and run. Partial examples that require the reader to fill in the blanks are frustrating.'),
    tabs([
      {
        label: 'Bad example',
        body: 'To authenticate, pass your API key in the Authorization header.\n\n// Example:\nAuthorization: Bearer <your-key>',
      },
      {
        label: 'Good example',
        body: 'Pass your API key as a Bearer token in the Authorization header:\n\ncurl https://api.helio.dev/v1/users \\\n  -H "Authorization: Bearer sk_live_abc123"\n\nReplace sk_live_abc123 with your actual key from Settings → API Keys.',
      },
    ]),

    h2('Use the right callout for the right situation'),
    callout('info', 'info — Background context the reader should know. Not urgent, but useful.'),
    callout('tips', 'tips — A shortcut or best practice that makes the reader\'s life easier.'),
    callout('warning', 'warning — Something that could cause problems if ignored. The reader should pause and read this.'),
    callout('error', 'error — Something that will definitely break or cause data loss. Use sparingly — if everything is an error callout, nothing is.'),

    h2('Write short sentences'),
    p('Long sentences are hard to scan. If a sentence has more than two clauses, split it. If a paragraph has more than four sentences, split it. White space is not wasted space — it makes content easier to read.'),
    callout('note', 'Read your docs out loud. If you run out of breath before the end of a sentence, it\'s too long.'),

    h2('Use tables for reference content'),
    p('Configuration options, API parameters, error codes — anything with a consistent structure belongs in a table. Tables are faster to scan than prose and easier to update.'),
    codeBlock(
      `// Instead of:\n// The timeout option accepts a number in milliseconds. The default is 5000.\n// The retries option accepts a number. The default is 3.\n\n// Use a table:\n| Option   | Type   | Default | Description                    |\n|----------|--------|---------|--------------------------------|\n| timeout  | number | 5000    | Request timeout in ms          |\n| retries  | number | 3       | Number of retry attempts       |`,
      'markdown'
    ),

    h2('Version your docs with your code'),
    p('Documentation that lives in the same repository as the code gets updated when the code changes. Documentation in a separate CMS gets out of date. Helio\'s file-based approach makes this easy — a PR that changes an API also changes the docs.'),
    callout('tips', 'Add a docs: update label to your PR template. Make it a team norm that every feature PR includes a docs update.'),

    h2('The most common documentation mistakes'),
    cardGroup(2, [
      { icon: 'hugeicons:cancel-circle', title: 'Assuming knowledge', body: 'Linking to a concept without explaining it. "Configure your webhook endpoint" — but where? How? What format?' },
      { icon: 'hugeicons:cancel-circle', title: 'Burying the example', body: 'Three paragraphs of explanation before the first code example. Show the code first, then explain it.' },
      { icon: 'hugeicons:cancel-circle', title: 'Outdated screenshots', body: 'Screenshots go out of date faster than text. Use them sparingly and update them with every UI change.' },
      { icon: 'hugeicons:cancel-circle', title: 'No error guidance', body: 'Documenting the happy path but not what to do when things go wrong. Every guide should have a troubleshooting section.' },
    ]),

    h2('Measuring documentation quality'),
    p('Good documentation reduces support tickets. Track these metrics:'),
    bullet('Support ticket volume for topics that have docs — should decrease over time'),
    bullet('Search queries with no results — these are gaps in your docs'),
    bullet('Time on page — very short means the reader didn\'t find what they needed'),
    bullet('Article feedback (thumbs up/down) — Helio includes this widget on every article'),

    accordion('How long should an article be?', 'As long as it needs to be to fully answer the reader\'s question — no longer. A quick reference article might be 200 words. A setup guide might be 1500 words. Don\'t pad for length, and don\'t truncate for brevity.'),
    accordion('Should I use first or second person?', 'Second person (you, your) is warmer and more direct. "You can configure the timeout" reads better than "The timeout can be configured". Avoid first person plural (we, our) unless you\'re writing a blog post.'),
    accordion('How do I handle deprecated features?', 'Add a callout(\'warning\') at the top of the article noting the deprecation and linking to the replacement. Keep the article published — people still search for deprecated features. Remove it only after the feature is fully removed.'),

    expandable('Show documentation checklist', '[ ] Title states the reader\'s goal\n[ ] First paragraph answers: what will I be able to do after reading this?\n[ ] Prerequisites are listed upfront\n[ ] Every concept has a code example\n[ ] Code examples are complete and runnable\n[ ] Tables used for reference content\n[ ] Callouts used for warnings and tips\n[ ] FAQ accordion at the end\n[ ] excerpt field is a complete sentence describing the article\n[ ] Article is linked from related articles'),
  ]),
};
