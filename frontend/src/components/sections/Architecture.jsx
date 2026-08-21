import SectionWave from '../ui/SectionWave';

export default function Architecture() {
  return (
    <section id="stack-preview" className="relative bg-mint-50 pt-28 pb-32 px-6 overflow-hidden">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h2 className="font-display font-bold text-3xl sm:text-4xl">
          There's more happening behind one click.
        </h2>
        <p className="text-ink-500 mt-3">
          Every redirect passes through a few real systems working together.
        </p>
      </div>

      <div className="max-w-md mx-auto flex flex-col items-center gap-3">
        <Node label="User" sub="clicks a short link" />
        <Arrow />
        <Node label="Express.js" sub="handles the request" accent />
        <Arrow />
        <div className="flex gap-4 w-full justify-center">
          <Node label="PostgreSQL" sub="looks up the mapping" small />
          <Node label="Click log" sub="records device & referrer" small />
        </div>
        <Arrow />
        <Node label="Redirect" sub="user lands on the real page" accent />
      </div>

      <SectionWave fill="#F7FAF9" />
    </section>
  );
}

function Node({ label, sub, accent, small }) {
  return (
    <div
      className={`rounded-2xl bg-white shadow-[0_8px_30px_rgba(20,184,166,0.1)] px-6 py-4 text-center ${
        small ? 'flex-1' : 'w-full max-w-xs'
      } ${accent ? 'border border-mint-200' : ''}`}
    >
      <p className="font-display font-semibold text-sm">{label}</p>
      <p className="text-xs text-ink-500 mt-1">{sub}</p>
    </div>
  );
}

function Arrow() {
  return <span className="text-mint-400 text-lg leading-none">↓</span>;
}