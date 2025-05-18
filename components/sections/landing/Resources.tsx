"use client"

import { Button } from "@/components/common/Button"
import { motion } from "framer-motion"
import { useRef } from "react"
import { useInView } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface ResourceCardProps {
  title: string
  description: string
  category: string
  image: string
  link: string
  delay: number
}

function ResourceCard({ title, description, category, image, link, delay }: ResourceCardProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      className="rounded-xl border border-border/40 bg-white overflow-hidden shadow-sm card-hover"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={image || "/placeholder.svg"}
          alt={title}
          className="h-full w-full object-cover transition-transform hover:scale-105"
        />
      </div>
      <div className="p-6">
        <div className="mb-3 inline-block rounded-full bg-zenith-100 px-3 py-1 text-xs font-medium text-zenith-700">
          {category}
        </div>
        <h3 className="mb-2 text-xl font-bold text-foreground">{title}</h3>
        <p className="mb-4 text-muted-foreground">{description}</p>
        <Link
          href={link}
          className="inline-flex items-center text-zenith-600 hover:text-zenith-700 font-medium transition-colors"
        >
          Read More <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  )
}

export default function Resources() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const resources = [
    {
      title: "How AI is Transforming Team Collaboration",
      description: "Discover the ways artificial intelligence is revolutionizing how teams work together.",
      category: "Research",
      image: "/blog/ai-collaboration.jpg",
      link: "/blog/ai-collaboration",
    },
    {
      title: "5 Strategies for Effective Remote Collaboration",
      description: "Learn proven techniques to enhance productivity and communication in distributed teams.",
      category: "Guide",
      image: "/blog/remote-collaboration.jpg",
      link: "/blog/remote-collaboration",
    },
    {
      title: "The Future of Work: AI Assistants and Human Creativity",
      description: "Explore how AI assistants are augmenting human creativity rather than replacing it.",
      category: "Insights",
      image: "/blog/future-of-work.jpg",
      link: "/blog/future-of-work",
    },
  ]

  return (
    <section id="resources" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Latest <span className="gradient-text">resources</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Explore our latest articles, guides, and insights to help you get the most out of Zenith.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {resources.map((resource, index) => (
            <ResourceCard
              key={index}
              title={resource.title}
              description={resource.description}
              category={resource.category}
              image={resource.image}
              link={resource.link}
              delay={0.1 + index * 0.1}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button variant="outline" className="border-zenith-300 text-zenith-700 hover:bg-zenith-50">
            View All Resources <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
