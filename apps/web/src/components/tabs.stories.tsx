type TabItem = {
  id: string;
  label: string;
  content: string;
};

type DemoTabsProps = {
  activeId: string;
  tabs: TabItem[];
};

function DemoTabs({ activeId, tabs }: DemoTabsProps) {
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Demo tabs">
        {tabs.map((tab) => (
          <button
            aria-selected={tab.id === activeTab?.id}
            className={tab.id === activeTab?.id ? 'rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white' : 'rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700'}
            key={tab.id}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700" role="tabpanel">
        {activeTab?.content ?? 'No tab content available.'}
      </div>
    </section>
  );
}

const meta = {
  title: 'Components/Tabs',
  component: DemoTabs
};

export default meta;

export const Default = {
  args: {
    activeId: 'overview',
    tabs: [
      { id: 'overview', label: 'Overview', content: 'Quick price intelligence summary.' },
      { id: 'history', label: 'History', content: 'Recent basket and price changes.' }
    ]
  }
};

export const WithData = {
  args: {
    activeId: 'savings',
    tabs: [
      { id: 'savings', label: 'Savings', content: 'Projected savings: 83 kr this week.' },
      { id: 'stores', label: 'Stores', content: 'Willys, Hemköp, and ICA all have current rows.' },
      { id: 'alerts', label: 'Alerts', content: 'Three active price alerts are watching this basket.' }
    ]
  }
};

export const EdgeCase = {
  args: {
    activeId: 'missing',
    tabs: [
      { id: 'very-long', label: 'Very long grocery preference label', content: 'Long labels wrap without hiding the selected state.' }
    ]
  }
};
