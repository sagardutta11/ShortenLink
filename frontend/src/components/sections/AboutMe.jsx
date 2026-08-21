export default function AboutMe() {
  return (
    <section id="about-me" className="relative bg-cream pt-4 pb-28 px-6">
      <div className="max-w-md mx-auto text-center">
        <div className="w-20 h-20 rounded-full bg-mint-100 mx-auto mb-5 grid place-items-center text-2xl font-display font-bold text-mint-600">
          
        </div>
        <h2 className="font-display font-bold text-2xl">Sagar Dutta</h2>
        <p className="text-sm text-ink-500 mt-1">Computer Science Student · Backend Developer</p>
        <p className="text-ink-500 mt-4 leading-relaxed">
          Interested in building reliable and scalable backend systems — ShortenLink is where that
          interest turned into a real project.
        </p>
        <div className="flex justify-center gap-4 mt-6 text-sm">
          <a
            href="https://github.com/sagardutta11"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-mint-200 px-4 py-2 hover:bg-mint-50 transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/sagardutta11"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-mint-200 px-4 py-2 hover:bg-mint-50 transition-colors"
          >
            LinkedIn
          </a>
          <a href="#" className="rounded-full border border-mint-200 px-4 py-2 hover:bg-mint-50 transition-colors">
            Resume
          </a>
        </div>
      </div>
    </section>
  );
}
