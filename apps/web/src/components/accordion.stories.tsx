type AccordionItem = Readonly<{
  title: string;
  content: string;
  defaultOpen?: boolean;
}>;

type AccordionStoryProps = Readonly<{
  items: readonly AccordionItem[];
  heading: string;
}>;

function AccordionStory({ heading, items }: AccordionStoryProps) {
  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-black tracking-[-0.03em] text-slate-950">{heading}</h2>
      <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
        {items.map((item, index) => (
          <details className="group bg-white p-4 open:bg-orange-50" key={`${item.title}-${index}`} open={item.defaultOpen}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-black text-slate-900 marker:hidden">
              <span>{item.title}</span>
              <span aria-hidden="true" className="rounded-full bg-slate-950 px-2 py-1 text-xs text-white group-open:bg-orange-700">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-700">{item.content}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

const meta = {
  title: 'Components/Accordion',
  component: AccordionStory,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    heading: { control: 'text' },
    items: { control: 'object' }
  }
};

export default meta;

export const Default = {
  name: 'default',
  args: {
    heading: 'Shopping help',
    items: [
      {
        title: 'How are prices compared?',
        content: 'GroceryView normalizes package sizes and unit prices so similar products can be compared across nearby stores.',
        defaultOpen: true
      },
      {
        title: 'Can I save a list?',
        content: 'Signed-in shoppers can save basket ideas and reuse them for future weekly trips.'
      },
      {
        title: 'What stores are supported?',
        content: 'Coverage depends on market availability, catalogue freshness, and store-level price feeds.'
      }
    ]
  }
};

export const WithData = {
  name: 'with-data',
  args: {
    heading: 'Deal quality signals',
    items: [
      {
        title: 'Confidence: high',
        content: 'Matched against current catalogue data, recent shelf observations, and a stable retailer identifier.',
        defaultOpen: true
      },
      {
        title: 'Savings estimate',
        content: 'The basket is currently 14% below its 30-day median, with the biggest savings in pantry staples.'
      },
      {
        title: 'Next refresh',
        content: 'Prices refresh after the next retailer import window or when a verified shopper report is accepted.'
      }
    ]
  }
};

export const EdgeCase = {
  name: 'edge-case',
  args: {
    heading: 'Long copy and empty states',
    items: [
      {
        title: 'A very long accordion title that wraps across multiple lines on compact screens without hiding the disclosure control',
        content:
          'This panel verifies that long labels, wrapped text, and explanatory grocery guidance remain readable inside the accordion container without clipping or layout overflow.',
        defaultOpen: true
      },
      {
        title: 'No current offers',
        content: 'There are no matching offers for this filter yet. Try widening the radius, choosing another category, or checking back after the next catalogue import.'
      },
      {
        title: 'Special characters',
        content: 'Handles Swedish grocery copy such as jämförpris, ekologisk, 2 för 35 kr, and member-only prices.'
      }
    ]
  }
};
