import SectionWave from '../ui/SectionWave';

const bubbles = [
  { label: 'Custom aliases', pos: 'md:top-0 md:left-0' },
  { label: 'Analytics', pos: 'md:top-0 md:right-0' },
  { label: 'Expiration', pos: 'md:bottom-0 md:right-4' },
  { label: 'Rate limiting', pos: 'md:bottom-0 md:left-4' },
];

export default function Features() {
  return (
    <section className="relative bg-mint-50 pt-28 pb-32 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h2 className="font-display font-bold text-3xl sm:text-4xl">What can you do with ShortenLink?</h2>
        <p className="text-ink-500 mt-3">More than a redirect — a small control panel for every link.</p>
      </div>

      <div className="relative max-w-md mx-auto md:h-[420px] flex flex-col md:block items-center gap-4">
        {/* Central floating card */}
        <div className="relative z-10 w-full max-w-xs rounded-[1.75rem] bg-white shadow-[0_16px_50px_rgba(20,184,166,0.18)] p-6 mx-auto md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
          <p className="text-xs text-ink-500 mb-1">ShortenLink</p>
          <p className="font-semibold">My Portfolio</p>
          <p className="font-mono text-sm text-mint-600 mb-4">shortenlink.project/sagar</p>
          <p className="text-xs text-ink-500 mb-4">1,284 clicks</p>
          <div className="flex gap-2">
            <button className="flex-1 text-xs rounded-full bg-mint-500 text-white py-2 font-medium">
              Analytics
            </button>
            <button className="flex-1 text-xs rounded-full bg-mint-50 text-mint-600 py-2 font-medium">
              Copy
            </button>
          </div>
        </div>

        {/* Orbiting feature bubbles */}
        {bubbles.map((b) => (
          <div
            key={b.label}
            className={`md:absolute ${b.pos} rounded-full bg-white shadow-sm px-5 py-2.5 text-sm font-medium text-ink-900 z-0`}
          >
            {b.label}
          </div>
        ))}
      </div>

      <SectionWave fill="#F7FAF9" />
    </section>
  );
}
