const steps = [
  { label: 'Paste', desc: 'Drop in any long URL' },
  { label: 'Shorten', desc: 'Get a clean link instantly' },
  { label: 'Share', desc: 'Send it anywhere' },
  { label: 'Track', desc: 'Watch the clicks roll in' },
];

export default function HowItWorks() {
  return (
    <section id="howitworks" className="relative bg-cream pt-4 pb-28 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-display font-bold text-3xl sm:text-4xl mb-14">How it works</h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-4">
              <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(20,184,166,0.08)] px-6 py-5 text-center min-w-[130px]">
                <p className="font-display font-semibold">{s.label}</p>
                <p className="text-xs text-ink-500 mt-1">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <span className="hidden sm:block text-mint-400 text-xl">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}