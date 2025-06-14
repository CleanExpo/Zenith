'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  RocketLaunchIcon, 
  CogIcon, 
  ChartBarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const features = [
  {
    icon: RocketLaunchIcon,
    title: 'AI-Powered Automation',
    description: 'Multi-agent system that handles website creation, SEO optimization, and content generation automatically.',
  },
  {
    icon: CogIcon,
    title: 'Smart Orchestration',
    description: 'Intelligent workflow management with dependency tracking and parallel execution for maximum efficiency.',
  },
  {
    icon: ChartBarIcon,
    title: 'Real-time Analytics',
    description: 'Live dashboard with comprehensive metrics, performance tracking, and business insights.',
  },
  {
    icon: BuildingOfficeIcon,
    title: 'Universal Business Support',
    description: 'Supports 25+ business categories with specialized AI agents for each industry type.',
  },
  {
    icon: UserGroupIcon,
    title: 'Team Collaboration',
    description: 'Multi-user support with role-based access control and collaborative workflow management.',
  },
  {
    icon: SparklesIcon,
    title: 'Visual Asset Generation',
    description: 'AI-generated logos, banners, and marketing materials tailored to your brand identity.',
  },
];

const stats = [
  { label: 'Response Time', value: '< 100ms', description: 'Average API response time' },
  { label: 'Uptime', value: '99.99%', description: 'System availability' },
  { label: 'Businesses Served', value: '10,000+', description: 'Active platforms' },
  { label: 'Agent Executions', value: '1M+', description: 'Successful automations' },
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gradient">Zenith Platform</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="btn-outline">
                Sign In
              </Link>
              <Link href="/dashboard" className="btn-primary">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              <span className="text-gradient">AI-Powered</span>
              <br />
              Business Automation
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Universal multi-agent platform that creates, optimizes, and manages your entire digital presence automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard" className="btn-primary text-lg px-8 py-3">
                Start Building →
              </Link>
              <Link href="/demo" className="btn-outline text-lg px-8 py-3">
                View Demo
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary-200 rounded-full opacity-50 animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-success-200 rounded-full opacity-50 animate-pulse-slow animation-delay-500"></div>
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-warning-200 rounded-full opacity-50 animate-pulse-slow animation-delay-300"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-gray-500">
                  {stat.description}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to dominate your local market with AI-powered automation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card p-6 hover:shadow-medium transition-shadow duration-300"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of businesses already using Zenith Platform to automate their digital presence.
            </p>
            <Link href="/dashboard" className="btn bg-white text-primary-600 hover:bg-gray-50 text-lg px-8 py-3">
              Get Started Today →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Zenith Platform</h3>
            <p className="text-gray-400 mb-6">
              AI-Powered Business Automation Platform
            </p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Documentation
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                API Reference
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Support
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                GitHub
              </a>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-500">
              © 2025 Zenith Platform. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}