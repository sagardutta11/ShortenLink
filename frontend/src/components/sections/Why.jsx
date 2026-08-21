import SectionWave from '../ui/SectionWave';

export default function Why() {
  return (
    <section id="why" className="relative bg-mint-50 pt-24 pb-32 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Illustration side */}
        <div className="relative">
          <div className="rounded-[2rem] bg-white shadow-[0_12px_40px_rgba(20,184,166,0.12)] p-8">
            <p className="text-xs text-ink-500 mb-3">Before</p>
            <p className="font-mono text-xs text-ink-500 leading-relaxed break-all border border-dashed border-mint-200 rounded-xl p-3">
              https://example.com/products/category/software/
              development/tools/best-tools-for-developers/2026
            </p>
            <div className="flex items-center justify-center my-4 text-mint-500">↓</div>
            <p className="text-xs text-ink-500 mb-3">After</p>
            <p className="font-mono text-sm font-semibold text-mint-600 bg-mint-50 rounded-xl p-3 inline-block">
              shortenlink.project/7Kx9
            </p>
          </div>
          <span className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-mint-100/80 -z-10" />
          <span className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/70 -z-10" />
        </div>

        {/* Copy side */}
        <div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl mb-6">Why shorten?</h2>
          <div className="space-y-5 text-ink-500">
            <p>
              <span className="text-ink-900 font-semibold">Long URLs are messy.</span> They break
              across lines, get mangled in messages, and nobody wants to type one out loud.
            </p>
            <p>
              <span className="text-ink-900 font-semibold">Short URLs are easier.</span> Cleaner
              to share, simpler to remember, easier to manage in one place.
            </p>
            <p>
              <span className="text-ink-900 font-semibold">And sometimes you need more.</span>{' '}
              Custom aliases, click analytics, and expiry dates give you real control over every
              link you share.
            </p>
          </div>
        </div>
      </div>

      <SectionWave fill="#F7FAF9" />
    </section>
  );
}
