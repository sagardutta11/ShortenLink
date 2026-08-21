import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { shortenUrl, getGuestLinksRemaining } from '../../lib/api';

const LONG_URL =
  'https://example.com/products/category/software/development/tools/best-tools-for-developers/2026';

const messages = ['Too long.', 'Too ugly.', 'Too hard to remember.'];

export default function Hero() {
  const [phase, setPhase] = useState(0); // 0: typing long url, 1: messages, 2: compressed, 3: settled
  const [typed, setTyped] = useState('');
  const [msgIndex, setMsgIndex] = useState(0);
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [freeLeft, setFreeLeft] = useState(getGuestLinksRemaining());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (phase !== 0) return;
    if (typed.length < LONG_URL.length) {
      const t = setTimeout(() => setTyped(LONG_URL.slice(0, typed.length + 1)), 18);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPhase(1), 500);
    return () => clearTimeout(t);
  }, [phase, typed]);

  useEffect(() => {
    if (phase !== 1) return;
    if (msgIndex < messages.length) {
      const t = setTimeout(() => setMsgIndex(msgIndex + 1), 650);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPhase(2), 500);
    return () => clearTimeout(t);
  }, [phase, msgIndex]);

  useEffect(() => {
    if (phase !== 2) return;
    const t = setTimeout(() => setPhase(3), 900);
    return () => clearTimeout(t);
  }, [phase]);

  const handleShorten = async (e) => {
    e.preventDefault();
    if (!url || freeLeft <= 0) return;
    setError('');
    setSubmitting(true);
    try {
      const link = await shortenUrl({ longUrl: url });
      setResult(link.shortUrl);
      setFreeLeft(getGuestLinksRemaining());
      setUrl('');
    } catch (err) {
      if (err.code === 'GUEST_LIMIT_REACHED') {
        setFreeLeft(0);
      } else {
        setError(err.message || 'Could not shorten that URL. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="top"
      className="relative pt-32 md:pt-44 pb-28 md:pb-36 px-6 overflow-hidden bg-mint-50"
    >
      {/* ambient blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-mint-100/70 blur-2xl" />
      <div className="pointer-events-none absolute top-40 -left-32 w-80 h-80 rounded-full bg-white/60 blur-2xl" />

      <div className="relative max-w-3xl mx-auto text-center">
        <p className="text-sm font-medium text-mint-600 mb-4 tracking-wide uppercase">
          Do you also face this problem?
        </p>

        {/* Animated URL -> short URL */}
        <div className="min-h-[64px] flex items-center justify-center mb-6">
          {phase < 2 && (
            <p className="font-mono text-[13px] sm:text-base text-ink-500 break-all px-4">
              {typed}
              <span className="inline-block w-[2px] h-4 bg-mint-500 ml-0.5 animate-pulse align-middle" />
            </p>
          )}
          {phase >= 2 && (
            <div className="flex items-center gap-3 font-display text-2xl sm:text-3xl font-bold">
              <span className="text-ink-500 line-through decoration-mint-400/60 text-sm sm:text-base font-normal">
                example.com/…
              </span>
              <span>→</span>
              <span className="text-mint-600">ShortenLink.project/7Kx9</span>
            </div>
          )}
        </div>

        {phase === 1 && (
          <p key={msgIndex} className="text-lg font-medium text-ink-900 animate-in fade-in mb-6">
            {messages[msgIndex]}
          </p>
        )}

        <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl leading-tight mt-6">
          Meet <span className="text-mint-600">ShortenLink.</span>
        </h1>
        <p className="mt-4 text-ink-500 text-lg">
          Simple links for a complicated internet.
        </p>

        {/* Guest limit reached — shown ABOVE the input so it's clear before typing */}
        {freeLeft <= 0 && (
          <div className="mt-10 mx-auto max-w-xl bg-white rounded-[2rem] shadow-[0_12px_40px_rgba(20,184,166,0.15)] px-6 py-6 flex flex-col items-center gap-3 text-center">
            <p className="font-semibold">You've used your free links.</p>
            <p className="text-sm text-ink-500">Create a free account to keep shortening URLs.</p>
            <div className="flex gap-3 mt-1">
              <Link to="/register" className="rounded-full bg-mint-500 text-white text-sm px-5 py-2 font-medium hover:bg-mint-600 transition-colors">
                Create Account
              </Link>
              <Link to="/login" className="rounded-full border border-mint-500 text-mint-600 text-sm px-5 py-2 font-medium hover:bg-mint-50 transition-colors">
                Login
              </Link>
            </div>
          </div>
        )}

        {/* Shorten interaction */}
        <form
          onSubmit={handleShorten}
          className={`mx-auto max-w-xl bg-white rounded-[2rem] shadow-[0_12px_40px_rgba(20,184,166,0.15)] p-2 flex flex-col sm:flex-row gap-2 ${
            freeLeft <= 0 ? 'mt-6 opacity-60' : 'mt-10'
          }`}
        >
          <input
            type="url"
            required
            disabled={freeLeft <= 0}
            placeholder="Paste your long URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-transparent px-5 py-3 text-sm outline-none placeholder:text-ink-500/60 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={freeLeft <= 0 || submitting}
            className="rounded-full bg-mint-500 hover:bg-mint-600 disabled:bg-ink-500/30 disabled:cursor-not-allowed text-white font-medium px-6 py-3 transition-colors inline-flex items-center justify-center gap-2"
          >
            {submitting && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
            )}
            {submitting ? 'Shortening…' : 'Shorten URL'}
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-500 bg-red-50 inline-block rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-6 mx-auto max-w-xl flex flex-col items-center gap-2 bg-white rounded-2xl px-6 py-4 shadow-sm">
            <p className="text-sm text-ink-500">🎉 Your short URL is ready</p>
            <div className="flex items-center gap-3">
              <span className="font-mono font-semibold text-mint-600">{result}</span>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(`http://${result}`)}
                className="text-xs rounded-full bg-mint-50 text-mint-600 px-3 py-1.5 hover:bg-mint-100 transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-ink-500 mt-1">Free links remaining: {freeLeft} / 5</p>
          </div>
        )}
      </div>

      {/* wave divider into next section */}
      <svg
        className="absolute bottom-0 left-0 w-full text-cream"
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M0,40 C360,100 1080,0 1440,50 L1440,100 L0,100 Z" />
      </svg>
    </section>
  );
}
