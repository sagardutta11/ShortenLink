import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import Logo from '../ui/Logo';

const links = [
  { label: 'Why Shorten', href: '#why' },
  { label: 'How It Works', href: '#howitworks' },
  { label: 'Tech Stack', href: '#stack' },
  { label: 'About Me', href: '#about-me' },
];

export default function Navbar() {
  const { user } = useAuth();

  const scrollToTop = (e) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Desktop floating pill navbar */}
      <header className="hidden md:block fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[min(920px,90vw)]">
        <nav className="flex items-center justify-between rounded-full bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_8px_30px_rgba(20,184,166,0.12)] px-6 py-3">
          <Link to="/" onClick={scrollToTop} className="flex items-center gap-2 font-display font-bold text-ink-900">
            <Logo size={32} />
            ShortenLink
          </Link>
          <ul className="flex items-center gap-6 text-sm text-ink-500">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="hover:text-ink-900 transition-colors">{l.label}</a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <Link
                to="/dashboard"
                className="rounded-full bg-mint-500 hover:bg-mint-600 text-white px-4 py-2 font-medium transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-ink-500 hover:text-ink-900 transition-colors">Login</Link>
                <Link
                  to="/register"
                  className="rounded-full bg-mint-500 hover:bg-mint-600 text-white px-4 py-2 font-medium transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Mobile top bar (logo only) */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 py-4 bg-cream/80 backdrop-blur-md">
        <Link to="/" onClick={scrollToTop} className="flex items-center gap-2 font-display font-bold text-ink-900">
          <Logo size={28} />
          ShortenLink
        </Link>
        <Link
          to={user ? '/dashboard' : '/register'}
          className="rounded-full bg-mint-500 text-white text-sm px-4 py-1.5 font-medium"
        >
          {user ? 'Dashboard' : 'Start'}
        </Link>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92vw] rounded-full bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgba(20,184,166,0.18)] px-2 py-2 flex justify-between items-center">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="flex-1 text-center text-[11px] text-ink-500 py-1.5 rounded-full hover:bg-mint-50 hover:text-mint-600 transition-colors"
          >
            {l.label}
          </a>
        ))}
      </nav>
    </>
  );
}