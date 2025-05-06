import type { Metadata } from "next"
import Hero from "@/components/sections/landing/Hero"
import Features from "@/components/sections/landing/Features"
import HowItWorks from "@/components/sections/landing/HowItWorks"
import Stats from "@/components/sections/landing/Stats"
import Partners from "@/components/sections/landing/Partners"
import Pricing from "@/components/sections/landing/Pricing"
import Testimonials from "@/components/sections/landing/Testimonials"
import Resources from "@/components/sections/landing/Resources"
import FAQ from "@/components/sections/landing/FAQ"
import CTA from "@/components/sections/landing/CTA"
import Navbar from "@/components/common/Navbar"
import Footer from "@/components/common/Footer"

export const metadata: Metadata = {
  title: "Zenith - AI-Powered Collaboration Platform",
  description:
    "Reach the pinnacle of collaboration with Zenith, an AI-powered platform for research, creation, planning, and analysis.",
}

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-col items-center justify-center w-full overflow-hidden pt-20">
        <Hero />
        <Partners />
        <Features />
        <Stats />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <Resources />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
