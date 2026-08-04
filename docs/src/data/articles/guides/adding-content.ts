export const addingContentArticle = {
  id: 'adding-content',
  title: 'Adding Articles & Categories',
  slug: 'adding-content',
  excerpt: 'How to add new articles and categories to your local help center.',
  category_id: 'guides',
  is_published: true,
  display_order: 3,
  sidebar_title: null as string | null,
  icon: 'hugeicons:file-add' as string | null,
  created_at: '2024-01-22T00:00:00Z',
  updated_at: '2024-01-22T00:00:00Z',
  content: `
<h2>Adding a new category</h2>
<ol>
  <li>Create a new file in <code>src/data/categories/</code>, e.g. <code>my-category.ts</code></li>
  <li>Export a category object:</li>
</ol>

<pre><code class="language-ts">// src/data/categories/my-category.ts
export const myCategoryCategory = {
  id: 'my-category',
  name: 'My Category',
  description: 'What this category covers.',
  icon: 'hugeicons:star',
  display_order: 6,
  folder_id: null,
  parent_category_id: null,
};</code></pre>

<ol start="3">
  <li>Register it in <code>src/data/index.ts</code>:</li>
</ol>

<pre><code class="language-ts">import { myCategoryCategory } from './categories/my-category';

export const categories = [
  // ...existing categories
  myCategoryCategory,
];</code></pre>

<h2>Adding a new article</h2>
<ol>
  <li>Create a folder under <code>src/data/articles/</code> matching your category id if it doesn't exist</li>
  <li>Create a new file, e.g. <code>src/data/articles/my-category/my-article.ts</code></li>
  <li>Export an article object:</li>
</ol>

<pre><code class="language-ts">export const myArticle = {
  id: 'my-article',
  title: 'My Article',
  slug: 'my-article',          // used in the URL: /article/my-article
  excerpt: 'Short description.',
  category_id: 'my-category',  // must match a category id
  is_published: true,
  display_order: 1,
  sidebar_title: null,
  icon: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  content: \`
&lt;h2&gt;My heading&lt;/h2&gt;
&lt;p&gt;My content here.&lt;/p&gt;
  \`.trim(),
};</code></pre>

<ol start="4">
  <li>Register it in <code>src/data/index.ts</code> inside the <code>articles</code> array.</li>
</ol>

<h2>Hiding content</h2>
<p>Set <code>is_published: false</code> on any article or FAQ to hide it without deleting it.</p>

<h2>Ordering</h2>
<p>Use <code>display_order</code> (lower = first) to control the order articles appear in the sidebar and category pages.</p>
  `.trim(),
};
