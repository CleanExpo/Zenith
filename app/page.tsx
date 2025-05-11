import { Hero, Features, HowItWorks, Testimonials, FAQ, CTA } from "@/components/sections/landing";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center">
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <FAQ />
      <CTA />
    </main>
  );
}
