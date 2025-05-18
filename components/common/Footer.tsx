import Link from "next/link"
import { Button } from "@/components/common/Button"
import { Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-blue-50 to-white border-t border-border/40 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <div className="relative h-10 w-10 overflow-hidden">
                <div className="absolute inset-0 rounded-lg gradient-bg"></div>
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl">Z</div>
              </div>
              <span className="ml-2 text-xl font-bold text-foreground">Zenith</span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-md">
              Zenith is an AI-powered collaboration platform that helps teams work together more effectively through
              research, creation, planning, and analysis.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="h-10 w-10 rounded-full bg-zenith-100 flex items-center justify-center text-zenith-600 hover:bg-zenith-200 transition-colors"
              >
                <Facebook size={20} />
                <span className="sr-only">Facebook</span>
              </a>
              <a
                href="#"
                className="h-10 w-10 rounded-full bg-zenith-100 flex items-center justify-center text-zenith-600 hover:bg-zenith-200 transition-colors"
              >
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </a>
              <a
                href="#"
                className="h-10 w-10 rounded-full bg-zenith-100 flex items-center justify-center text-zenith-600 hover:bg-zenith-200 transition-colors"
              >
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </a>
              <a
                href="#"
                className="h-10 w-10 rounded-full bg-zenith-100 flex items-center justify-center text-zenith-600 hover:bg-zenith-200 transition-colors"
              >
                <Linkedin size={20} />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a
                href="#"
                className="h-10 w-10 rounded-full bg-zenith-100 flex items-center justify-center text-zenith-600 hover:bg-zenith-200 transition-colors"
              >
                <Github size={20} />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-zenith-600 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-zenith-600 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-zenith-600 transition-colors">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-zenith-600 transition-colors">
                  Changelog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-zenith-600 transition-colors">
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-zenith-600 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-zenith-600 transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-zenith-600 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-zenith-600 transition-colors">
                  Press
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-zenith-600 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
            <p className="text-muted-foreground mb-4">
              Subscribe to our newsletter to get the latest updates and news.
            </p>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2 rounded-md bg-white border border-zenith-200 focus:border-zenith-500 focus:outline-none focus:ring-1 focus:ring-zenith-500"
              />
              <Button className="w-full gradient-bg text-white hover:opacity-90">Subscribe</Button>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Zenith. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="#" className="text-muted-foreground hover:text-zenith-600 transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-zenith-600 transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-zenith-600 transition-colors">
                Cookie Policy
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-zenith-600 transition-colors">
                Security
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
