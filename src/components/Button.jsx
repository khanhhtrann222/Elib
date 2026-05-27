import React from 'react';
import './Button.css';

/**
 * MD3 Elevated Cinematic Button Component
 * @param {Object} props
 * @param {'filled' | 'tonal' | 'outlined' | 'text'} props.variant
 * @param {React.ReactNode} props.icon
 * @param {boolean} props.disabled
 * @param {string} props.className
 */
export default function Button({
  children,
  variant = 'filled',
  icon,
  disabled = false,
  className = '',
  onClick,
  ...rest
}) {
  const buttonClass = `md3-btn md3-btn--${variant} ${icon ? 'md3-btn--with-icon' : ''} ${className}`;

  return (
    <button
      className={buttonClass}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {icon && <span className="md3-btn__icon">{icon}</span>}
      <span className="md3-btn__label">{children}</span>
    </button>
  );
}
