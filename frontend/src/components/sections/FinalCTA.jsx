import { Link } from 'react-router-dom';

export default function FinalCTA() {
  return (
    <section id="register" className="relative bg-mint-500 text-white pt-24 pb-24 px-6 text-center">
      <h2 className="font-display font-bold text-3xl sm:text-4xl mb-3">
        Ready to make URLs simpler?
      </h2>
      <p className="text-white/85 mb-8">Start with five free links. No account required.</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a
          href="#top"
          className="rounded-full bg-white text-mint-600 font-medium px-7 py-3 hover:bg-white/90 transition-colors"
        >
          Shorten a URL
        </a>
        <Link to="/login" className="text-white/85 text-sm hover:text-white transition-colors">
          Already have an account? Login
        </Link>
      </div>
    </section>
  );
}
