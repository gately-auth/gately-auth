/**
 * BlockNote JSON block builder helpers.
 * Use these to compose article content using the actual viewer block specs.
 *
 * Usage:
 *   import { bn, h2, p, callout, codeBlock, tabs, accordion, step, card, cardGroup, codeGroup, expandable } from '../blocks';
 *   content: bn([ h2('Title'), p('Body text'), callout('info', 'Watch out!') ])
 */

const uid = () => Math.random().toString(36).slice(2, 10);
const t = (str: string) => [{ type: 'text', text: str, styles: {} }];

// Wrap a blocks array into the script tag the viewer expects
export const bn = (blocks: any[]): string =>
  `<script data-bn type="application/json">${JSON.stringify(blocks)}</script>`;

// ─── Primitive blocks ─────────────────────────────────────────────────────────

export const h1 = (text: string) => ({
  id: uid(), type: 'heading',
  props: { level: 1, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
  content: t(text), children: [],
});

export const h2 = (text: string) => ({
  id: uid(), type: 'heading',
  props: { level: 2, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
  content: t(text), children: [],
});

export const h3 = (text: string) => ({
  id: uid(), type: 'heading',
  props: { level: 3, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
  content: t(text), children: [],
});

export const p = (text: string) => ({
  id: uid(), type: 'paragraph',
  props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
  content: [{ type: 'text', text, styles: {} }], children: [],
});

export const bullet = (text: string) => ({
  id: uid(), type: 'bulletListItem',
  props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
  content: [{ type: 'text', text, styles: {} }], children: [],
});

export const numbered = (text: string) => ({
  id: uid(), type: 'numberedListItem',
  props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
  content: [{ type: 'text', text, styles: {} }], children: [],
});

export const divider = () => ({
  id: uid(), type: 'divider',
  props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
  content: [], children: [],
});

export const quote = (text: string) => ({
  id: uid(), type: 'quote',
  props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
  content: [{ type: 'text', text, styles: {} }], children: [],
});

export const checkItem = (text: string, checked = false) => ({
  id: uid(), type: 'checkListItem',
  props: { checked, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
  content: [{ type: 'text', text, styles: {} }], children: [],
});

export const codeBlock = (code: string, language = 'typescript') => ({
  id: uid(), type: 'codeBlock',
  props: { language, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
  content: [{ type: 'text', text: code, styles: {} }], children: [],
});

// ─── Custom blocks ────────────────────────────────────────────────────────────

/** calloutType: 'info' | 'warning' | 'success' | 'error' | 'tips' | 'check' | 'note' */
export const callout = (calloutType: string, text: string) => ({
  id: uid(), type: 'callout',
  props: { calloutType, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
  content: [{ type: 'text', text, styles: {} }], children: [],
});

export const accordion = (accordionTitle: string, accordionBody: string) => ({
  id: uid(), type: 'accordion',
  props: { accordionTitle, accordionBody, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
  content: [], children: [],
});

export const step = (stepNumber: number, stepTitle: string, body: string) => ({
  id: uid(), type: 'step',
  props: { stepNumber, stepTitle, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
  content: [{ type: 'text', text: body, styles: {} }], children: [],
});

export const card = (opts: { icon?: string; cardTitle: string; cardBody: string; href?: string; imageUrl?: string }) => ({
  id: uid(), type: 'card',
  props: {
    icon: opts.icon || 'hugeicons:file-01',
    cardTitle: opts.cardTitle,
    cardBody: opts.cardBody,
    href: opts.href || '',
    imageUrl: opts.imageUrl || '',
    textColor: 'default', backgroundColor: 'default', textAlignment: 'left',
  },
  content: [], children: [],
});

export const tabs = (tabList: { label: string; body: string }[]) => ({
  id: uid(), type: 'tabs',
  props: {
    tabCount: tabList.length,
    tab0label: tabList[0]?.label || 'Tab 1', tab0body: tabList[0]?.body || '',
    tab1label: tabList[1]?.label || 'Tab 2', tab1body: tabList[1]?.body || '',
    tab2label: tabList[2]?.label || 'Tab 3', tab2body: tabList[2]?.body || '',
    tab3label: tabList[3]?.label || 'Tab 4', tab3body: tabList[3]?.body || '',
    textColor: 'default', backgroundColor: 'default', textAlignment: 'left',
  },
  content: [], children: [],
});

export const codeGroup = (tabList: { label: string; language: string; code: string }[]) => ({
  id: uid(), type: 'codeGroup',
  props: {
    tabs: tabList,
    textColor: 'default', backgroundColor: 'default', textAlignment: 'left',
  },
  content: [], children: [],
});

export const cardGroup = (columns: 2 | 3, cards: { icon?: string; title: string; body: string; href?: string; imageUrl?: string }[]) => ({
  id: uid(), type: 'cardGroup',
  props: {
    columns,
    cards: JSON.stringify(cards.map(c => ({
      icon: c.icon || '',
      title: c.title,
      body: c.body,
      href: c.href || '',
      imageUrl: c.imageUrl || '',
    }))),
    textColor: 'default', backgroundColor: 'default', textAlignment: 'left',
  },
  content: [], children: [],
});

export const expandable = (title: string, body: string) => ({
  id: uid(), type: 'expandable',
  props: { title, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
  content: [{ type: 'text', text: body, styles: {} }], children: [],
});

export const paramField = (paramName: string, paramType: string, required: boolean, description: string, location = 'body') => ({
  id: uid(), type: 'paramField',
  props: { paramName, paramType, required, location, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
  content: [{ type: 'text', text: description, styles: {} }], children: [],
});

export const responseField = (fieldName: string, fieldType: string, required: boolean, description: string) => ({
  id: uid(), type: 'responseField',
  props: { fieldName, fieldType, required, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
  content: [{ type: 'text', text: description, styles: {} }], children: [],
});
