"use client"

import { motion } from "framer-motion"
import { useRef } from "react"
import { useInView } from "framer-motion"

interface TestimonialProps {
  quote: string
  author: string
  role: string
  company: string
  delay: number
  avatar: string
}

function Testimonial({ quote, author, role, company, delay, avatar }: TestimonialProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      className="card-hover rounded-xl border border-border/40 bg-white p-6 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="mb-4 text-zenith-500">
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      </div>
      <p className="mb-6 text-muted-foreground">{quote}</p>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-zenith-100">
          <img src={avatar || "/placeholder.svg"} alt={author} className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="font-medium text-foreground">{author}</p>
          <p className="text-sm text-muted-foreground">
            {role}, {company}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default function Testimonials() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const testimonials = [
    {
      quote:
        "Zenith has transformed how our research team collaborates. The AI suggestions are incredibly helpful and save us hours of work each week.",
      author: "Alex Morgan",
      role: "Research Director",
      company: "Innovate Labs",
      avatar: "/professional-woman-headshot.png",
    },
    {
      quote:
        "The real-time collaboration features in Zenith are unlike anything I&apos;ve seen. Our team's productivity has increased by 40% since we started using it.",
      author: "Jamie Chen",
      role: "Product Manager",
      company: "TechForward",
      avatar: "/asian-professional-man-headshot.png",
    },
    {
      quote:
        "As a creative agency, we need tools that enhance our workflow without getting in the way. Zenith strikes that perfect balance of powerful features and intuitive design.",
      author: "Sam Rodriguez",
      role: "Creative Director",
      company: "Pixel Perfect Design",
      avatar: "/placeholder.svg?key=nv6z6",
    },
  ]

  return (
    <section id="testimonials" className="py-24 relative overflow-hidde w-full">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white opacity-50 w-full"></div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={ref}
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            What people are <span className="gradient-text">saying</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Teams across industries are experiencing the benefits of Zenith&apos;s collaborative power.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Testimonial
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              role={testimonial.role}
              company={testimonial.company}
              avatar={testimonial.avatar}
              delay={0.1 + index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
