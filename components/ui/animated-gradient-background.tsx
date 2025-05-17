'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedGradientBackgroundProps {
  className?: string;
  children: React.ReactNode;
  colors?: string[];
  speed?: number;
}

export function AnimatedGradientBackground({
  className,
  children,
  colors = [
    'rgba(238, 174, 202, 0.7)',
    'rgba(148, 187, 233, 0.7)',
    'rgba(174, 238, 213, 0.7)',
    'rgba(238, 174, 202, 0.7)',
  ],
  speed = 15,
}: AnimatedGradientBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let animationFrameId: number;
    let gradientPosition = 0;

    const animate = () => {
      gradientPosition = (gradientPosition + 1) % 360;
      container.style.backgroundImage = `linear-gradient(${gradientPosition}deg, ${colors.join(', ')})`;
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [colors, speed]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-background transition-all duration-500',
        className
      )}
      style={{
        backgroundSize: '400% 400%',
      }}
    >
      {children}
    </div>
  );
}
