import { useEffect, useRef, useState } from 'react';

const problems = [
  {
    emoji: '😵',
    title: 'Too long',
    desc: 'One link can eat an entire text message before you even say anything.',
  },
  {
    emoji: '😐',
    title: 'Hard to share',
    desc: 'Wraps across lines, breaks in emails, looks wrong everywhere.',
  },
  {
    emoji: '📊',
    title: 'No insight',
    desc: "You share a link and then you're flying blind — no clicks, no data.",
  },
];

function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

export default function Problems() {
  const [ref, inView] = useInView();

  return (
    <section className="relative bg-cream pt-4 pb-28 px-6">
      <div ref={ref} className="max-w-5xl mx-auto text-center">
        <h2 className="font-display font-bold text-3xl sm:text-4xl mb-14">
          Three reasons long links don't work
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <div
              key={p.title}
              className="rounded-[1.75rem] bg-white p-8 shadow-[0_8px_30px_rgba(20,184,166,0.08)] transition-all duration-500"
              style={{
                transitionDelay: `${i * 120}ms`,
                opacity: inView ? 1 : 0,
                transform: inView ? 'translateY(0)' : 'translateY(24px)',
              }}
            >
              <div className="text-4xl mb-4">{p.emoji}</div>
              <h3 className="font-display font-semibold text-lg mb-2">{p.title}</h3>
              <p className="text-sm text-ink-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex items-center justify-center gap-4 sm:gap-8 font-display font-bold text-lg sm:text-2xl flex-wrap">
          <span className="text-mint-600">ShortenLink</span>
          <span className="text-ink-500/40">→</span>
          <span>Shorter</span>
          <span className="text-ink-500/40">·</span>
          <span>Smarter</span>
          <span className="text-ink-500/40">·</span>
          <span>Trackable</span>
        </div>
      </div>
    </section>
  );
}
