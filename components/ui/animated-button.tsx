'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends React.ComponentProps<typeof Button> {
  glowColor?: string;
  hoverScale?: number;
  children: React.ReactNode;
}

export function AnimatedButton({
  className,
  glowColor = 'rgba(148, 187, 233, 0.7)',
  hoverScale = 1.05,
  children,
  ...props
}: AnimatedButtonProps) {
  return (
    <Button
      className={cn(
        'relative overflow-hidden transition-all duration-300 ease-in-out',
        'before:absolute before:inset-0 before:z-0 before:opacity-0 before:transition-opacity',
        'hover:before:opacity-100 hover:shadow-lg',
        'active:scale-95',
        className
      )}
      style={{
        '--glow-color': glowColor,
        '--hover-scale': hoverScale.toString(),
      } as React.CSSProperties}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center">
        {children}
      </span>
      <style jsx>{`
        button:hover {
          transform: scale(var(--hover-scale));
          box-shadow: 0 0 15px var(--glow-color);
        }
        button:before {
          content: '';
          background: radial-gradient(
            circle at center,
            var(--glow-color) 0%,
            transparent 70%
          );
        }
        button:active {
          box-shadow: 0 0 5px var(--glow-color);
        }
      `}</style>
    </Button>
  );
}
