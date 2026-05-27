import React, { useEffect } from 'react';
import './Drawer.css';
import { X } from 'lucide-react';

/**
 * MD3 Navigation Drawer / Side Sheet Component
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {'left' | 'right'} props.anchor
 * @param {string} props.title
 */
export default function Drawer({
  children,
  isOpen,
  onClose,
  anchor = 'left',
  title = '',
  className = '',
  ...rest
}) {
  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`md3-drawer-overlay ${isOpen ? 'is-open' : ''}`} onClick={onClose}>
      <div
        className={`md3-drawer md3-drawer--${anchor} ${className}`}
        onClick={(e) => e.stopPropagation()}
        {...rest}
      >
        <div className="md3-drawer__header">
          <h3 className="md3-drawer__title">{title}</h3>
          <button className="md3-drawer__close" onClick={onClose} aria-label="Close panel">
            <X size={20} />
          </button>
        </div>
        
        <div className="md3-drawer__content">
          {children}
        </div>
      </div>
    </div>
  );
}
