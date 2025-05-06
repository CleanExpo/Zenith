"use client"

import { Button } from "@/components/common/Button"
import { motion } from "framer-motion"
import Link from "next/link"

export default function Hero() {
  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-b from-white to-blue-50 py-24 md:py-32">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -right-[40%] h-[80%] w-[80%] rounded-full bg-zenith-500/10 blur-3xl" />
        <div className="absolute -bottom-[40%] -left-[40%] h-[80%] w-[80%] rounded-full bg-zenith-700/10 blur-3xl" />
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-zenith-400/10 blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-zenith-300/10 blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute inset-0 opacity-30 bg-[url('/abstract-blue-swirls.png')] bg-cover mix-blend-overlay" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center justify-between gap-12 lg:flex-row">
          {/* Left column: Text content */}
          <motion.div
            className="max-w-xl text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center rounded-full border border-zenith-600/20 bg-zenith-600/10 px-4 py-1.5 text-sm font-medium text-zenith-600 shadow-sm">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-zenith-500 animate-pulse"></span>
              Now in Alpha • Limited Access
            </div>
            <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              Reach the <span className="gradient-text">pinnacle</span> of collaboration
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              Zenith transforms how teams work together using AI-powered collaboration. Research, create, plan, and
              analyze —all in one powerful platform.
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Button size="lg" className="gradient-bg text-white hover:opacity-90 shadow-lg">
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" className="border-zenith-300 text-zenith-700 hover:bg-zenith-50">
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </motion.div>

          {/* Right column: App preview */}
          <motion.div
            className="relative w-full max-w-lg"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="glass-card overflow-hidden rounded-xl shadow-xl">
              <div className="border-b border-border/40 bg-white/90 p-2">
                <div className="flex items-center">
                  <div className="flex space-x-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="mx-auto text-sm font-medium text-muted-foreground">Research Jam</div>
                </div>
              </div>
              <div className="p-6 bg-white/60">
                <div className="grid gap-4">
                  {/* First message */}
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-white font-semibold shadow-sm">
                      Z
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-sm shadow-sm">
                      <p>Let me help you research the impact of AI on collaboration tools.</p>
                    </div>
                  </div>

                  {/* Second message */}
                  <div className="flex items-start gap-3 justify-end">
                    <div className="rounded-lg bg-zenith-600/10 p-4 text-sm shadow-sm">
                      <p>Can you find the latest studies on AI productivity gains?</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold shadow-sm">
                      U
                    </div>
                  </div>

                  {/* Third message */}
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-white font-semibold shadow-sm">
                      Z
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-sm shadow-sm">
                      <p>
                        I found 3 recent studies showing AI tools increase productivity by 25-40% for creative and
                        research tasks.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <span className="inline-flex items-center rounded-full bg-zenith-100 px-2.5 py-0.5 text-xs font-medium text-zenith-800">
                          McKinsey
                        </span>
                        <span className="inline-flex items-center rounded-full bg-zenith-100 px-2.5 py-0.5 text-xs font-medium text-zenith-800">
                          Stanford AI
                        </span>
                        <span className="inline-flex items-center rounded-full bg-zenith-100 px-2.5 py-0.5 text-xs font-medium text-zenith-800">
                          MIT Tech
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-zenith-500 opacity-20 blur-2xl"></div>
            <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-zenith-700 opacity-20 blur-2xl"></div>
            <div className="absolute -bottom-2 -right-2 h-16 w-16 rounded-full bg-gradient-to-r from-zenith-400 to-zenith-600 opacity-70 blur-xl"></div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
