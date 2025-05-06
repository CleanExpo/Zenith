"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { useInView } from "framer-motion"

interface FAQItemProps {
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
  delay: number
}

function FAQItem({ question, answer, isOpen, onClick, delay }: FAQItemProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      className="border-b border-border/40 py-5"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
    >
      <button
        className="flex w-full items-center justify-between py-2 text-left font-medium text-foreground"
        onClick={onClick}
      >
        <span className="text-lg">{question}</span>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full ${isOpen ? "gradient-bg text-white" : "bg-muted"} transition-all duration-200`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </button>
      <div
        className={`mt-2 overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <p className="pb-4 text-muted-foreground">{answer}</p>
      </div>
    </motion.div>
  )
}

export default function FAQ() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "What is Zenith?",
      answer:
        "Zenith is an AI-powered collaboration platform that helps teams work together more effectively. It combines real-time collaboration tools with artificial intelligence to enhance research, creation, planning, and analysis tasks.",
    },
    {
      question: "How does the AI assistance work?",
      answer:
        "Zenith's AI understands the context of your work and provides relevant suggestions, summaries, and insights. It can help organize information, identify patterns, generate content, and even spot potential issues or opportunities that might otherwise be missed.",
    },
    {
      question: "Can I use Zenith with my existing tools?",
      answer:
        "Yes! Zenith is designed to integrate with popular productivity tools and platforms. You can connect it to your existing workflow and enhance your team's collaboration without disrupting established processes.",
    },
    {
      question: "Is my data secure on Zenith?",
      answer:
        "Absolutely. Zenith employs enterprise-grade security measures to protect your data. All information is encrypted both in transit and at rest, and we never use your data to train our AI models without explicit permission.",
    },
    {
      question: "How many team members can collaborate simultaneously?",
      answer:
        "Zenith supports real-time collaboration for teams of all sizes. Whether you're working with 5 team members or 50, everyone can contribute simultaneously with minimal latency.",
    },
    {
      question: "Is Zenith suitable for remote teams?",
      answer:
        "Zenith is ideal for remote and distributed teams! Its real-time collaboration features and AI assistance help bridge the gap created by physical distance, making it feel like your team is working side by side even when they&apos;re continents apart.",
    },
  ]

  return (
    <section id="faq" className="py-24 bg-gradient-to-b from-white to-blue-50 w-full">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Everything you need to know about Zenith and how it can transform your team&apos;s collaboration.
          </p>
        </motion.div>

        <div className="mx-auto max-w-5xl bg-white rounded-xl p-6 shadow-sm">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              delay={0.1 + index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
