import {
  TerminalDealVerdict,
  TerminalMarketSwitcher,
  TerminalMethodologyLinks,
  TerminalQuoteTable,
  TerminalSourceCitations,
  TerminalStatePanel,
  TerminalTickerCard
} from './terminal-surface';
import {
  terminalDealVerdictFixture,
  terminalMarketSwitcherFixture,
  terminalMethodologyLinksFixture,
  terminalQuoteTableFixture,
  terminalSourceCitationsFixture,
  terminalStateFixtures,
  terminalTickerCardFixtures
} from './terminal-surface.fixtures';

function TerminalSurfaceShowcase() {
  return (
    <main className="grid gap-5 bg-[#f5f1e8] p-5 text-slate-950">
      <TerminalMarketSwitcher {...terminalMarketSwitcherFixture} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Terminal ticker card fixtures">
        {terminalTickerCardFixtures.map((card) => (
          <TerminalTickerCard {...card} key={card.label} />
        ))}
      </section>
      <TerminalQuoteTable {...terminalQuoteTableFixture} />
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <TerminalDealVerdict {...terminalDealVerdictFixture} />
        <TerminalSourceCitations {...terminalSourceCitationsFixture} />
      </div>
      <TerminalMethodologyLinks {...terminalMethodologyLinksFixture} />
    </main>
  );
}

const meta = {
  title: 'Components/TerminalSurface',
  component: TerminalSurfaceShowcase
};

export default meta;

export const Library = {};

export const LoadingState = {
  render: () => <TerminalStatePanel {...terminalStateFixtures[0]} />
};

export const EmptyState = {
  render: () => <TerminalStatePanel {...terminalStateFixtures[1]} />
};

export const PartialCoverageState = {
  render: () => <TerminalStatePanel {...terminalStateFixtures[2]} />
};

export const StaleState = {
  render: () => <TerminalStatePanel {...terminalStateFixtures[3]} />
};

export const ErrorState = {
  render: () => <TerminalStatePanel {...terminalStateFixtures[4]} />
};

export const BlockedSourceState = {
  render: () => <TerminalStatePanel {...terminalStateFixtures[5]} />
};
