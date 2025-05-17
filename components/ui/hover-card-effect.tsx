'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface HoverCardEffectProps {
  className?: string;
  children: React.ReactNode;
  glowColor?: string;
  borderColor?: string;
  intensity?: number;
}

export function HoverCardEffect({
  className,
  children,
  glowColor = 'rgba(148, 187, 233, 0.5)',
  borderColor = 'rgba(255, 255, 255, 0.2)',
  intensity = 1.5,
}: HoverCardEffectProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative rounded-xl overflow-hidden transition-all duration-300 bg-card',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        boxShadow: isHovering 
          ? `0 0 30px ${glowColor}, 0 0 10px rgba(0, 0, 0, 0.1)` 
          : '0 0 10px rgba(0, 0, 0, 0.1)',
        transform: isHovering ? 'translateY(-5px)' : 'translateY(0)',
        border: `1px solid ${borderColor}`,
      }}
    >
      {isHovering && (
        <div 
          className="absolute pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            opacity: 0.6 * intensity,
            left: position.x - 75,
            top: position.y - 75,
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
            mixBlendMode: 'soft-light',
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
