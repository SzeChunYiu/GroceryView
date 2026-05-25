import {
  connectorManagementConfigs,
  connectorManagementSummary,
  getDuplicateConflictAlerts,
  type ConnectorManagementConfig,
} from "../../../lib/source-health";

const severityStyles = {
  critical: "border-red-200 bg-red-50 text-red-900",
  watch: "border-amber-200 bg-amber-50 text-amber-900",
};

const statusStyles = {
  enabled: "bg-emerald-100 text-emerald-900",
  paused: "bg-slate-200 text-slate-800",
  watch: "bg-amber-100 text-amber-900",
};

function ConnectorEditorCard({ connector }: { connector: ConnectorManagementConfig }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-admin-source-connector={connector.id}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{connector.upstream}</p>
          <h2 className="mt-2 text-xl font-black text-slate-950">{connector.name}</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusStyles[connector.status]}`}>
          {connector.status}
        </span>
      </div>

      <form className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Connector metadata owner
          <input className="rounded-xl border border-slate-300 px-3 py-2 font-semibold text-slate-950" defaultValue={connector.metadataOwner} name={`${connector.id}-metadata-owner`} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Escalation owner
          <input className="rounded-xl border border-slate-300 px-3 py-2 font-semibold text-slate-950" defaultValue={connector.escalationOwner} name={`${connector.id}-escalation-owner`} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Freshness threshold hours
          <input className="rounded-xl border border-slate-300 px-3 py-2 font-semibold text-slate-950" defaultValue={connector.freshnessThresholdHours} min="1" name={`${connector.id}-freshness-hours`} type="number" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Connector status
          <select className="rounded-xl border border-slate-300 px-3 py-2 font-semibold text-slate-950" defaultValue={connector.status} name={`${connector.id}-status`}>
            <option value="enabled">enabled</option>
            <option value="watch">watch</option>
            <option value="paused">paused</option>
          </select>
        </label>
        <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
          <legend className="px-1 text-sm font-black text-slate-700">Enabled markets</legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {["SE", "NO", "DK", "FI"].map((market) => (
              <label className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-bold text-slate-700" key={market}>
                <input defaultChecked={connector.enabledMarkets.includes(market)} name={`${connector.id}-market-${market}`} type="checkbox" />
                {market}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="grid gap-2 text-sm font-bold text-slate-700 lg:col-span-2">
          Change reason
          <textarea className="min-h-24 rounded-xl border border-slate-300 px-3 py-2 font-semibold text-slate-950" defaultValue={connector.changeReason} name={`${connector.id}-change-reason`} />
        </label>
      </form>

      <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700 md:grid-cols-3">
        <p>Last edited {connector.lastEditedAt}</p>
        <p>{connector.enabledMarkets.join(", ")} markets enabled</p>
        <p>{connector.freshnessThresholdHours}h freshness threshold</p>
      </div>
    </article>
  );
}

export default function AdminSourcesPage() {
  const alerts = getDuplicateConflictAlerts();
  const summary = connectorManagementSummary();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin source management</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950">Retailer connector editor</h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Operators can review connector metadata, freshness thresholds, enabled markets, and escalation owners before
        routine source changes require code edits. Controls are rendered from source-health configuration seeds.
      </p>

      <section className="mt-8 grid gap-4 md:grid-cols-4" aria-label="Connector management summary">
        <div className="rounded-2xl bg-slate-950 p-5 text-white">
          <p className="text-sm font-semibold text-slate-300">Connectors</p>
          <p className="mt-2 text-3xl font-black">{summary.total}</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-5 text-emerald-950">
          <p className="text-sm font-semibold">Enabled</p>
          <p className="mt-2 text-3xl font-black">{summary.enabled}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-5 text-amber-950">
          <p className="text-sm font-semibold">Watch</p>
          <p className="mt-2 text-3xl font-black">{summary.watch}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-5 text-slate-950">
          <p className="text-sm font-semibold">Markets</p>
          <p className="mt-2 text-3xl font-black">{summary.markets.join(", ")}</p>
        </div>
      </section>

      <section className="mt-8 grid gap-5" aria-label="Connector metadata editor">
        {connectorManagementConfigs.map((connector) => (
          <ConnectorEditorCard connector={connector} key={connector.id} />
        ))}
      </section>

      <section className="mt-8 grid gap-4" aria-label="Duplicate conflict alerts">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Source health</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Duplicate conflict alerts</h2>
        </div>
        {alerts.map((alert) => (
          <article
            key={`${alert.source}-${alert.sampledAt}`}
            className={`rounded-2xl border p-5 shadow-sm ${severityStyles[alert.severity]}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide">
                  {alert.severity === "critical" ? "Critical spike" : "Watch spike"}
                </p>
                <h3 className="mt-1 text-xl font-semibold">{alert.source}</h3>
              </div>
              <span className="rounded-full bg-white/70 px-3 py-1 text-sm font-semibold">
                {alert.spikeRatio.toFixed(1)}× baseline
              </span>
            </div>
            <p className="mt-4">{alert.message}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
