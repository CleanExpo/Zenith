"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/common/Button"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative h-10 w-10 overflow-hidden">
              <div className="absolute inset-0 rounded-lg gradient-bg"></div>
              <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl">Z</div>
            </div>
            <span className="ml-2 text-xl font-bold text-foreground">Zenith</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="#features"
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
            >
              Pricing
            </Link>
            <Link
              href="#testimonials"
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
            >
              Testimonials
            </Link>
            <Link
              href="#resources"
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
            >
              Resources
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="outline" className="border-zenith-300 text-zenith-700 hover:bg-zenith-50">
              Log In
            </Button>
            <Button className="gradient-bg text-white hover:opacity-90">Sign Up</Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white border-t mt-3"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              <Link
                href="#features"
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="#pricing"
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="#testimonials"
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Testimonials
              </Link>
              <Link
                href="#resources"
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Resources
              </Link>
              <div className="flex flex-col space-y-3 pt-4 border-t">
                <Button variant="outline" className="border-zenith-300 text-zenith-700 hover:bg-zenith-50 w-full">
                  Log In
                </Button>
                <Button className="gradient-bg text-white hover:opacity-90 w-full">Sign Up</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
