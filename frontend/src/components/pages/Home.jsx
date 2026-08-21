import Hero from '../sections/Hero';
import Why from '../sections/Why';
import Problems from '../sections/Problems';
import Features from '../sections/Features';
import HowItWorks from '../sections/HowItWorks';
import Architecture from '../sections/Architecture';
import TechStack from '../sections/TechStack';
import Story from '../sections/Story';
import AboutMe from '../sections/AboutMe';
import FinalCTA from '../sections/FinalCTA';

export default function Home() {
  return (
    <main>
      <Hero />
      <Why />
      <Problems />
      <Features />
      <HowItWorks />
      <Architecture />
      <TechStack />
      <Story />
      <AboutMe />
      <FinalCTA />
    </main>
  );
}
