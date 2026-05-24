export type ListTemplateItem = {
  detail: string;
  id: string;
  name: string;
  quantity: string;
};

export type ListTemplate = {
  description: string;
  id: string;
  items: ListTemplateItem[];
  title: string;
};

export const listTemplates: ListTemplate[] = [
  {
    id: 'weekly-restock',
    title: 'Weekly restock',
    description: 'Everyday staples for topping up the fridge, pantry, and freezer.',
    items: [
      { id: 'template-weekly-milk', name: 'Milk or fil', quantity: '2 cartons', detail: 'Dairy top-up' },
      { id: 'template-weekly-eggs', name: 'Eggs', quantity: '1 dozen', detail: 'Breakfast and baking staple' },
      { id: 'template-weekly-bread', name: 'Bread', quantity: '1 loaf', detail: 'Lunchbox staple' },
      { id: 'template-weekly-fruit', name: 'Fresh fruit', quantity: '1 basket', detail: 'Snacks for the week' },
      { id: 'template-weekly-vegetables', name: 'Fresh vegetables', quantity: '1 bag', detail: 'Dinner prep' },
      { id: 'template-weekly-coffee', name: 'Coffee', quantity: '1 package', detail: 'Morning routine refill' }
    ]
  },
  {
    id: 'breakfast-basics',
    title: 'Breakfast basics',
    description: 'Quick morning staples for cereal, yoghurt bowls, and toast.',
    items: [
      { id: 'template-breakfast-oats', name: 'Oats', quantity: '1 bag', detail: 'Porridge base' },
      { id: 'template-breakfast-yoghurt', name: 'Yoghurt', quantity: '1 tub', detail: 'Bowl base' },
      { id: 'template-breakfast-berries', name: 'Berries', quantity: '1 box', detail: 'Fresh topping' },
      { id: 'template-breakfast-bread', name: 'Bread', quantity: '1 loaf', detail: 'Toast option' },
      { id: 'template-breakfast-juice', name: 'Orange juice', quantity: '1 bottle', detail: 'Breakfast drink' }
    ]
  },
  {
    id: 'party-prep',
    title: 'Party prep',
    description: 'Shareable snacks and drinks for an easy get-together.',
    items: [
      { id: 'template-party-chips', name: 'Chips', quantity: '2 bags', detail: 'Snack table' },
      { id: 'template-party-dip', name: 'Dip', quantity: '2 tubs', detail: 'Pair with chips and vegetables' },
      { id: 'template-party-crackers', name: 'Crackers', quantity: '1 box', detail: 'Cheese board base' },
      { id: 'template-party-cheese', name: 'Cheese', quantity: '2 packs', detail: 'Cheese board' },
      { id: 'template-party-soft-drinks', name: 'Soft drinks', quantity: '4 bottles', detail: 'Guest drinks' },
      { id: 'template-party-dessert', name: 'Dessert', quantity: '1 tray', detail: 'Sweet finish' }
    ]
  }
];
