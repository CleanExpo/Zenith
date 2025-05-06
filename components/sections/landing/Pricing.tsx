"use client"

import { Button } from "@/components/common/Button"
import { motion } from "framer-motion"
import { useRef, useState } from "react"
import { useInView } from "framer-motion"
import { Check } from "lucide-react"

interface PricingCardProps {
  title: string
  price: string
  description: string
  features: string[]
  buttonText: string
  isPopular?: boolean
  delay: number
}

function PricingCard({ title, price, description, features, buttonText, isPopular, delay }: PricingCardProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      className={`relative rounded-xl border ${
        isPopular ? "border-zenith-400 shadow-lg" : "border-border/40"
      } bg-white p-6 shadow-sm card-hover`}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full gradient-bg px-4 py-1 text-sm font-medium text-white shadow-sm">
          Most Popular
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <div className="mt-4 flex items-baseline">
          <span className="text-4xl font-bold text-foreground">{price}</span>
          {price !== "Custom" && <span className="ml-1 text-muted-foreground">/month</span>}
        </div>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
      <ul className="mb-8 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="mr-2 h-5 w-5 shrink-0 text-zenith-500" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        className={`w-full ${
          isPopular ? "gradient-bg text-white hover:opacity-90" : "bg-zenith-100 text-zenith-700 hover:bg-zenith-200"
        }`}
      >
        {buttonText}
      </Button>
    </motion.div>
  )
}

export default function Pricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")

  const pricingPlans = [
    {
      title: "Starter",
      price: billingCycle === "monthly" ? "$19" : "$15",
      description: "Perfect for individuals and small teams just getting started.",
      features: [
        "Up to 5 team members",
        "Basic AI assistance",
        "Real-time collaboration",
        "5GB storage",
        "Email support",
      ],
      buttonText: "Get Started",
      isPopular: false,
    },
    {
      title: "Professional",
      price: billingCycle === "monthly" ? "$49" : "$39",
      description: "Ideal for growing teams that need more power and features.",
      features: [
        "Up to 20 team members",
        "Advanced AI assistance",
        "Real-time collaboration",
        "25GB storage",
        "Priority email support",
        "Advanced analytics",
        "Custom integrations",
      ],
      buttonText: "Get Started",
      isPopular: true,
    },
    {
      title: "Enterprise",
      price: "Custom",
      description: "For organizations that need ultimate scalability and support.",
      features: [
        "Unlimited team members",
        "Premium AI assistance",
        "Real-time collaboration",
        "Unlimited storage",
        "24/7 phone & email support",
        "Advanced analytics",
        "Custom integrations",
        "Dedicated account manager",
        "Custom training",
      ],
      buttonText: "Contact Sales",
      isPopular: false,
    },
  ]

  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-blue-50 to-white w-full">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Simple, transparent <span className="gradient-text">pricing</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Choose the plan that's right for your team. All plans include a 14-day free trial.
          </p>

          <div className="mt-8 inline-flex items-center rounded-full border border-border/40 p-1 bg-white">
            <button
              className={`rounded-full px-6 py-2 text-sm font-medium ${
                billingCycle === "monthly" ? "gradient-bg text-white" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </button>
            <button
              className={`rounded-full px-6 py-2 text-sm font-medium ${
                billingCycle === "annual" ? "gradient-bg text-white" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setBillingCycle("annual")}
            >
              Annual <span className="text-xs font-normal opacity-80">(Save 20%)</span>
            </button>
          </div>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {pricingPlans.map((plan, index) => (
            <PricingCard
              key={index}
              title={plan.title}
              price={plan.price}
              description={plan.description}
              features={plan.features}
              buttonText={plan.buttonText}
              isPopular={plan.isPopular}
              delay={0.1 + index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
