'use client';

export default function Tilt3DCard({
  children,
  className = '',
  borderRadius = '12px',
  style = {},
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`transition-all duration-200 hover:-translate-y-0.5 ${className}`}
      style={{
        borderRadius,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
