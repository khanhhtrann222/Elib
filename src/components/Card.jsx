import React from 'react';
import './Card.css';

/**
 * MD3 Elevated / Glassmorphic Card Container
 * @param {Object} props
 * @param {'elevated' | 'filled' | 'outlined' | 'glass'} props.variant
 * @param {boolean} props.hoverable
 * @param {string} props.className
 */
export default function Card({
  children,
  variant = 'outlined',
  hoverable = true,
  className = '',
  onClick,
  ...rest
}) {
  const cardClass = `md3-card md3-card--${variant} ${hoverable ? 'md3-card--hoverable' : ''} ${className}`;

  return (
    <div
      className={cardClass}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      {...rest}
    >
      {children}
    </div>
  );
}
