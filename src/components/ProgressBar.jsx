import React, { useRef } from 'react';
import './ProgressBar.css';

/**
 * MD3 Custom Progress Bar / Slider-Scrubber
 * @param {Object} props
 * @param {number} props.progress - Value between 0 and 100
 * @param {boolean} props.interactive - If true, permits click-scrubbing
 * @param {(pct: number) => void} props.onChange - Triggered when user scrubs
 */
export default function ProgressBar({
  progress = 0,
  interactive = false,
  onChange,
  className = '',
  ...rest
}) {
  const barRef = useRef(null);

  const cappedProgress = Math.max(0, Math.min(100, progress));

  const handlePointerDown = (e) => {
    if (!interactive || !onChange) return;
    updateProgress(e);
    
    // Support slide dragging
    const handlePointerMove = (moveEvent) => {
      updateProgress(moveEvent);
    };
    
    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
    
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const updateProgress = (e) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const width = rect.width;
    const clientX = e.clientX;
    
    let clickX = clientX - rect.left;
    clickX = Math.max(0, Math.min(width, clickX));
    
    const percentage = (clickX / width) * 100;
    onChange(percentage);
  };

  return (
    <div 
      className={`md3-progress-wrapper ${interactive ? 'md3-progress-wrapper--interactive' : ''} ${className}`}
      onPointerDown={handlePointerDown}
      ref={barRef}
      {...rest}
    >
      <div className="md3-progress-track">
        <div 
          className="md3-progress-fill" 
          style={{ width: `${cappedProgress}%` }}
        />
        {interactive && (
          <div 
            className="md3-progress-thumb" 
            style={{ left: `${cappedProgress}%` }}
          />
        )}
      </div>
    </div>
  );
}
