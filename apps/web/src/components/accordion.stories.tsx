type AccordionItem = {
  title: string;
  content: string;
  defaultOpen?: boolean;
};

type AccordionProps = {
  items: AccordionItem[];
};

function Accordion({ items }: AccordionProps) {
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-slate-900">
      {items.map((item) => (
        <details key={item.title} className="rounded-md border border-slate-200 p-3" open={item.defaultOpen}>
          <summary className="cursor-pointer font-medium">{item.title}</summary>
          <p className="mt-2 text-sm text-slate-600">{item.content}</p>
        </details>
      ))}
    </div>
  );
}

const meta = {
  title: 'Components/Accordion',
  component: Accordion
};

export default meta;

export const Default = {
  args: {
    items: [
      {
        title: 'What is GroceryView?',
        content: 'GroceryView compares grocery prices across nearby stores.'
      }
    ]
  } satisfies AccordionProps
};

export const WithData = {
  args: {
    items: [
      {
        title: 'Willys Odenplan',
        content: 'Open today with high-confidence price coverage.',
        defaultOpen: true
      },
      {
        title: 'Coop Sveavägen',
        content: 'Includes member prices and weekly promotion matches.'
      },
      {
        title: 'Lidl Vasastan',
        content: 'Best for pantry staples in the current basket.'
      }
    ]
  } satisfies AccordionProps
};

export const EdgeCase = {
  args: {
    items: [
      {
        title: 'Very long store and district label that wraps across multiple lines on narrow screens',
        content: 'Handles verbose content, Swedish characters like åäö, and punctuation without breaking layout.',
        defaultOpen: true
      },
      {
        title: 'No current offers',
        content: 'Shows an empty-state explanation when a section has no matching grocery deals.'
      }
    ]
  } satisfies AccordionProps
};
