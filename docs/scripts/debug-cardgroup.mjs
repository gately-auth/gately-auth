// Quick debug script to inspect the cardGroup block JSON
const uid = () => Math.random().toString(36).slice(2, 10);

const cardGroup = (columns, cards) => ({
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

const block = cardGroup(2, [
  { icon: 'hugeicons:mail-01', title: 'Email + Password', body: 'Sign up test' },
  { icon: 'hugeicons:magic-wand-01', title: 'Magic Links', body: 'Passwordless test' },
]);

console.log('Block type:', block.type);
console.log('props.columns:', block.props.columns);
console.log('props.cards type:', typeof block.props.cards);
console.log('props.cards value:', block.props.cards);

// Simulate what the renderer does
const parsed = JSON.parse(block.props.cards);
console.log('\nParsed cards:');
parsed.forEach((c, i) => console.log(`  [${i}] title="${c.title}" body="${c.body}" icon="${c.icon}"`));
