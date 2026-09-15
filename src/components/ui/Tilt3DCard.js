'use client';

import { useRef, useCallback, useEffect } from 'react';

export default function Tilt3DCard({
  children,
  className = '',
  maxTilt = 12,
  scale = 1.025,
  perspective = 800,
  glare = true,
  borderRadius = '16px',
  style = {},
  onClick,
}) {
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const rafRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const mouseX = (e.clientX - rect.left - width / 2) / (width / 2);
      const mouseY = (e.clientY - rect.top - height / 2) / (height / 2);

      const rotateX = (-mouseY * maxTilt).toFixed(2);
      const rotateY = (mouseX * maxTilt).toFixed(2);

      const shadowX = (-mouseX * 14).toFixed(1);
      const shadowY = (-mouseY * 14 + 10).toFixed(1);

      card.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
      card.style.boxShadow = `${shadowX}px ${shadowY}px 22px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)`;

      if (glare && glareRef.current) {
        const glareX = (((e.clientX - rect.left) / width) * 100).toFixed(1);
        const glareY = (((e.clientY - rect.top) / height) * 100).toFixed(1);
        glareRef.current.style.opacity = '0.7';
        glareRef.current.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.05) 50%, transparent 80%)`;
      }
    });
  }, [maxTilt, scale, perspective, glare]);

  const handleMouseEnter = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transition = 'transform 0.15s ease-out, box-shadow 0.15s ease-out';
  };

  const handleMouseLeave = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    const card = cardRef.current;
    if (!card) return;

    card.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
    card.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';

    if (glare && glareRef.current) {
      glareRef.current.style.opacity = '0';
    }
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative select-none transform-gpu ${className}`}
      style={{
        borderRadius,
        transformStyle: 'preserve-3d',
        transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        willChange: 'transform, box-shadow',
        ...style,
      }}
    >
      <div style={{ transform: 'translateZ(10px)', height: '100%' }}>
        {children}
      </div>

      {glare && (
        <div
          ref={glareRef}
          className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-20"
          style={{
            borderRadius,
            opacity: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 65%)',
          }}
        />
      )}
    </div>
  );
}
