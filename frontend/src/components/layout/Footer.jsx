export default function Footer() {
  return (
    <footer className="bg-ink-900 text-white/70 text-sm px-6 py-10 text-center">
      <p className="font-display font-semibold text-white mb-1">ShortenLink</p>
      <p>Simple links for a complicated internet.</p>
      <p className="mt-4 text-xs text-white/40">Built with ❤️ by Sagar · {new Date().getFullYear()}</p>
    </footer>
  );
}
