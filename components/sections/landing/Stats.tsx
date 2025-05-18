"use client"

import { motion } from "framer-motion"
import { useRef } from "react"
import { useInView } from "framer-motion"

interface StatProps {
  value: string
  label: string
  delay: number
}

function Stat({ value, label, delay }: StatProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="text-4xl font-bold gradient-text mb-2">{value}</div>
      <div className="text-muted-foreground">{label}</div>
    </motion.div>
  )
}

export default function Stats() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const stats = [
    {
      value: "10,000+",
      label: "Active Users",
    },
    {
      value: "500+",
      label: "Companies",
    },
    {
      value: "35%",
      label: "Productivity Increase",
    },
    {
      value: "24/7",
      label: "Support",
    },
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-white to-blue-50 w-full">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Trusted by teams <span className="gradient-text">worldwide</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Zenith is helping teams across the globe collaborate more effectively and achieve better results.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <Stat key={index} value={stat.value} label={stat.label} delay={0.1 + index * 0.1} />
          ))}
        </div>
      </div>
    </section>
  )
}
