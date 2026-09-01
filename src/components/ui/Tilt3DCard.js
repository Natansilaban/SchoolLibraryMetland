'use client';

import { useState, useRef, useCallback } from 'react';

export default function Tilt3DCard({
  children,
  className = '',
  maxTilt = 14,
  scale = 1.03,
  perspective = 800,
  glare = true,
  borderRadius = '16px',
  style = {},
  onClick,
}) {
  const cardRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState({
    transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
    transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  });
  const [glareStyle, setGlareStyle] = useState({
    opacity: 0,
    background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 65%)',
  });

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Mouse coordinates relative to card center (-1 to 1)
    const mouseX = (e.clientX - rect.left - width / 2) / (width / 2);
    const mouseY = (e.clientY - rect.top - height / 2) / (height / 2);

    // Calculate 3D tilt angles (inverted Y for intuitive depression effect)
    const rotateX = -mouseY * maxTilt;
    const rotateY = mouseX * maxTilt;

    // Dynamic 3D shadow shifting opposite to cursor
    const shadowX = -mouseX * 16;
    const shadowY = -mouseY * 16 + 12;
    const shadowBlur = 24;

    setTransformStyle({
      transform: `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`,
      transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
      boxShadow: `${shadowX.toFixed(1)}px ${shadowY.toFixed(1)}px ${shadowBlur}px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)`,
    });

    if (glare) {
      const glareX = ((e.clientX - rect.left) / width) * 100;
      const glareY = ((e.clientY - rect.top) / height) * 100;

      setGlareStyle({
        opacity: 0.7,
        background: `radial-gradient(circle at ${glareX.toFixed(1)}% ${glareY.toFixed(1)}%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.05) 50%, transparent 80%)`,
      });
    }
  }, [maxTilt, scale, perspective, glare]);

  const handleMouseEnter = () => {
    setTransformStyle(prev => ({
      ...prev,
      transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
    }));
  };

  const handleMouseLeave = () => {
    setTransformStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    });

    if (glare) {
      setGlareStyle(prev => ({
        ...prev,
        opacity: 0,
      }));
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative select-none ${className}`}
      style={{
        ...style,
        ...transformStyle,
        borderRadius,
        transformStyle: 'preserve-3d',
        willChange: 'transform, box-shadow',
      }}
    >
      {/* 3D Child container with subtle elevation */}
      <div style={{ transform: 'translateZ(10px)', height: '100%' }}>
        {children}
      </div>

      {/* Dynamic Specular Glare / Shine layer */}
      {glare && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-20"
          style={{
            ...glareStyle,
            borderRadius,
          }}
        />
      )}
    </div>
  );
}
