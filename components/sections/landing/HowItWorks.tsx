"use client"

import { motion } from "framer-motion"
import { useRef } from "react"
import { useInView } from "framer-motion"

interface StepProps {
  number: number
  title: string
  description: string
  delay: number
}

function Step({ number, title, description, delay }: StepProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      className="flex items-start gap-4"
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full gradient-bg text-white font-bold shadow-md">
        {number}
      </div>
      <div>
        <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  )
}

export default function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const steps = [
    {
      number: 1,
      title: "Start a Collaboration Jam",
      description:
        "Choose the type of jam you want to create—Research, Create, Plan, or Analyze—then invite your team to join.",
    },
    {
      number: 2,
      title: "Work Together in Real-Time",
      description:
        "Collaborate simultaneously with your team while our AI assistant provides suggestions and helps organize information.",
    },
    {
      number: 3,
      title: "Access AI-Powered Insights",
      description: "Get intelligent recommendations, summaries, and analyses based on your collaborative work.",
    },
    {
      number: 4,
      title: "Export and Share Results",
      description: "Turn your collaboration into reports, presentations, or action plans with just a few clicks.",
    },
  ]

  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-b from-white to-blue-50 w-full">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Left column: App mockup */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            ref={ref}
          >
            <div className="relative mx-auto max-w-md">
              <div className="glass-card overflow-hidden rounded-xl shadow-xl">
                <div className="border-b border-border/40 bg-white/90 p-2">
                  <div className="flex items-center">
                    <div className="flex space-x-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="mx-auto text-sm font-medium text-muted-foreground">Create Jam</div>
                  </div>
                </div>
                <div className="p-6 bg-white/60">
                  <div className="mb-6 space-y-2">
                    <h3 className="text-lg font-medium text-foreground">Quarterly Strategy Document</h3>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-2 w-2/3 rounded-full gradient-bg"></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-medium text-sm shadow-sm">
                        AK
                      </div>
                      <div className="rounded-lg bg-muted/70 p-4 text-sm shadow-sm">
                        <p>I&apos;ve drafted the market analysis section. Could someone review it?</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 justify-end">
                      <div className="rounded-lg bg-zenith-600/10 p-4 text-sm shadow-sm">
                        <p>Looking good! I added some competitive insights in the document.</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-sm shadow-sm">
                        TJ
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-white font-semibold shadow-sm">
                        Z
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-zenith-600/20 to-zenith-700/20 p-4 text-sm shadow-sm">
                        <p>
                          I notice your financial projections might be missing some key metrics. Would you like me to
                          suggest a few additional data points to strengthen your analysis?
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-zenith-500/20 blur-3xl"></div>
              <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-zenith-700/20 blur-3xl"></div>
              <div className="absolute -bottom-2 -right-2 h-16 w-16 rounded-full bg-gradient-to-r from-zenith-400 to-zenith-600 opacity-70 blur-xl"></div>
            </div>
          </motion.div>

          {/* Right column: Steps */}
          <div className="w-full lg:w-1/2">
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                How Zenith <span className="gradient-text">transforms</span> collaboration
              </h2>
              <p className="text-lg text-muted-foreground">
                Our intuitive workflow makes it easy to start collaborating effectively, with AI assistance at every
                step.
              </p>
            </motion.div>

            <div className="space-y-8">
              {steps.map((step, index) => (
                <Step
                  key={index}
                  number={step.number}
                  title={step.title}
                  description={step.description}
                  delay={0.2 + index * 0.1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
