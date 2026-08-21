import { useState } from 'react';

const stack = [
  { name: 'React', desc: 'Powers the interface and every interaction on the page.' },
  { name: 'Node.js', desc: 'The JavaScript runtime the whole backend runs on.' },
  { name: 'Express', desc: 'Routes requests and ties the API together.' },
  { name: 'PostgreSQL', desc: 'Persistent storage for users, URLs and analytics.' },
  { name: 'express-rate-limit', desc: 'Throttles OTP requests to prevent spam and abuse.' },
  { name: 'JWT', desc: 'Keeps registered sessions secure and stateless.' },
];

export default function TechStack() {
  const [active, setActive] = useState(null);

  return (
    <section id="stack" className="relative bg-cream pt-4 pb-28 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-display font-bold text-3xl sm:text-4xl mb-3">Built with</h2>
        <p className="text-ink-500 mb-12">Hover a piece to see what it does.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {stack.map((t) => (
            <div
              key={t.name}
              onMouseEnter={() => setActive(t.name)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(t.name)}
              onBlur={() => setActive(null)}
              tabIndex={0}
              className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(20,184,166,0.08)] px-4 py-6 cursor-default focus:outline-none focus:ring-2 focus:ring-mint-400"
            >
              <p className="font-display font-semibold">{t.name}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 min-h-[24px] text-sm text-ink-500">
          {active ? stack.find((t) => t.name === active)?.desc : 'Hover a card above to learn more.'}
        </div>
      </div>
    </section>
  );
}
