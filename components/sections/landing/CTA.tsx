"use client"

import { Button } from "@/components/common/Button"
import { motion } from "framer-motion"
import { useRef } from "react"
import { useInView } from "framer-motion"

export default function CTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="cta" className="py-24">
      <div className="container mx-auto px-4" ref={ref}>
        <motion.div
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zenith-600 to-zenith-800 p-10 md:p-16 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/4 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/4 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl"></div>
            <div className="absolute inset-0 bg-[url('/abstract-blue-swirls.png')] bg-cover mix-blend-overlay opacity-10"></div>
          </div>

          <div className="mx-auto max-w-3xl text-center relative z-10">
            <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              Ready to elevate your team&apos;s collaboration?
            </h2>
            <p className="mb-10 text-xl text-white/90">
              Join the Zenith alpha program today and be among the first to experience the future of collaborative work.
            </p>
            <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Button
                size="lg"
                variant="default"
                className="bg-white text-zenith-800 hover:bg-white/90 shadow-lg text-lg px-8 py-6 h-auto"
              >
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white hover:bg-white/10 text-lg px-8 py-6 h-auto"
              >
                Request a Demo
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
