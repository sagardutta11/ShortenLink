import SectionWave from '../ui/SectionWave';

const arc = ['Simple idea', 'Real backend', 'Real users', 'Real problems'];

export default function Story() {
  return (
    <section id="story" className="relative bg-mint-50 pt-28 pb-32 px-6 overflow-hidden">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-display font-bold text-3xl sm:text-4xl mb-6">
          I wanted to build beyond tutorials.
        </h2>
        <p className="text-ink-500 leading-relaxed">
          I started with a simple idea — shorten a URL. But instead of stopping there, I wanted
          to understand what a real application needs once it has actual users: authentication,
          persistence, analytics, caching, and protection against abuse.
        </p>

        <div className="mt-12 flex items-center justify-center gap-3 sm:gap-6 flex-wrap font-display font-semibold text-sm sm:text-base">
          {arc.map((step, i) => (
            <div key={step} className="flex items-center gap-3 sm:gap-6">
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">{step}</span>
              {i < arc.length - 1 && <span className="text-mint-400">↓</span>}
            </div>
          ))}
        </div>
      </div>

      <SectionWave fill="#F7FAF9" />
    </section>
  );
}
