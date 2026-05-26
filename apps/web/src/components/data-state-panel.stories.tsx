import { DataStatePanel, dataStateKinds } from './data-state-panel';

export default {
  title: 'Components/DataStatePanel',
  component: DataStatePanel
};

export function AllStates() {
  return (
    <div className="grid gap-4 bg-[#f5f1e8] p-6 md:grid-cols-2">
      {dataStateKinds.map((kind) => (
        <DataStatePanel
          confidenceLabel={kind === 'loading' ? undefined : 'visible source confidence'}
          freshnessLabel={kind === 'loading' ? undefined : 'labelled freshness'}
          kind={kind}
          key={kind}
          sourceLabel="example source"
        />
      ))}
    </div>
  );
}
