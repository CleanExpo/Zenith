'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatedGradientBackground } from '@/components/ui/animated-gradient-background';
import { AnimatedButton } from '@/components/ui/animated-button';
import { useToast } from '@/components/ui/use-toast';

export function Hero() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to subscribe.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Thanks for subscribing!",
      description: "We'll keep you updated on our latest features.",
      variant: "success",
    });
    
    setEmail('');
  };

  return (
    <AnimatedGradientBackground 
      className="w-full py-20 md:py-32"
      colors={[
        'rgba(59, 130, 246, 0.2)', // blue
        'rgba(139, 92, 246, 0.2)', // purple
        'rgba(236, 72, 153, 0.2)', // pink
        'rgba(59, 130, 246, 0.2)', // blue
      ]}
    >
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto mb-8 space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
              Accelerate Your Research
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Powerful AI tools to streamline your research workflow and boost productivity
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <AnimatedButton 
            size="lg" 
            className="font-semibold"
            glowColor="rgba(139, 92, 246, 0.5)"
            asChild
          >
            <Link href="/dashboard">Get Started</Link>
          </AnimatedButton>
          
          <AnimatedButton 
            size="lg" 
            variant="outline" 
            className="font-semibold"
            glowColor="rgba(59, 130, 246, 0.3)"
            asChild
          >
            <Link href="#features">Learn More</Link>
          </AnimatedButton>
        </div>

        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg border border-input bg-background"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <AnimatedButton 
              type="submit"
              glowColor="rgba(236, 72, 153, 0.4)"
            >
              Subscribe
            </AnimatedButton>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Stay updated with our latest features and announcements
          </p>
        </div>
      </div>
    </AnimatedGradientBackground>
  );
}
