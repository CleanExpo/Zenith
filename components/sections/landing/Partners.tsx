"use client"

import { motion } from "framer-motion"
import { useRef } from "react"
import { useInView } from "framer-motion"

export default function Partners() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const partners = [
    {
      name: "Acme Inc",
      logo: "/logos/acme.svg",
    },
    {
      name: "Globex",
      logo: "/logos/globex.svg",
    },
    {
      name: "Initech",
      logo: "/logos/initech.png",
    },
    {
      name: "Massive Dynamic",
      logo: "/logos/massive-dynamic.png",
    },
    {
      name: "Stark Industries",
      logo: "/logos/stark.png",
    },
    {
      name: "Wayne Enterprises",
      logo: "/logos/wayne.png",
    },
  ]

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-2xl font-bold text-foreground">Trusted by innovative companies</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
          {partners.map((partner, index) => (
            <motion.div
              key={index}
              className="flex items-center justify-center grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 0.7, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            >
              <div className="h-12 w-full flex items-center justify-center">
                <div className="text-xl font-bold text-muted-foreground">{partner.name}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
