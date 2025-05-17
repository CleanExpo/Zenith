'use client';

import { HoverCardEffect } from '@/components/ui/hover-card-effect';
import { 
  Beaker, 
  Brain, 
  FileText, 
  LineChart, 
  Share2, 
  Shield 
} from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  glowColor?: string;
}

function FeatureCard({ title, description, icon, glowColor }: FeatureCardProps) {
  return (
    <HoverCardEffect 
      className="p-6 h-full"
      glowColor={glowColor}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </HoverCardEffect>
  );
}

export function Features() {
  const features = [
    {
      title: 'AI-Powered Analysis',
      description: 'Leverage advanced AI to analyze research data and extract meaningful insights automatically.',
      icon: <Brain className="w-6 h-6" />,
      glowColor: 'rgba(59, 130, 246, 0.5)'
    },
    {
      title: 'Collaborative Research',
      description: 'Work seamlessly with your team in real-time, sharing findings and collaborating on projects.',
      icon: <Share2 className="w-6 h-6" />,
      glowColor: 'rgba(139, 92, 246, 0.5)'
    },
    {
      title: 'Advanced Visualization',
      description: 'Transform complex data into clear, interactive visualizations that tell a compelling story.',
      icon: <LineChart className="w-6 h-6" />,
      glowColor: 'rgba(236, 72, 153, 0.5)'
    },
    {
      title: 'Automated Documentation',
      description: 'Generate comprehensive research documentation and reports with a single click.',
      icon: <FileText className="w-6 h-6" />,
      glowColor: 'rgba(16, 185, 129, 0.5)'
    },
    {
      title: 'Experiment Tracking',
      description: 'Keep detailed records of all experiments, ensuring reproducibility and transparency.',
      icon: <Beaker className="w-6 h-6" />,
      glowColor: 'rgba(245, 158, 11, 0.5)'
    },
    {
      title: 'Secure Data Storage',
      description: 'Store your valuable research data with enterprise-grade security and encryption.',
      icon: <Shield className="w-6 h-6" />,
      glowColor: 'rgba(220, 38, 38, 0.5)'
    }
  ];

  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
              Powerful Features
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to accelerate your research workflow and achieve breakthrough results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              glowColor={feature.glowColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
