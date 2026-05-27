import React, { useState } from 'react';
import './TextField.css';

/**
 * MD3 Outlined Text Field
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.value
 * @param {string} props.helperText
 * @param {boolean} props.error
 * @param {React.ReactNode} props.icon
 */
export default function TextField({
  label,
  value,
  onChange,
  helperText = '',
  error = false,
  icon,
  type = 'text',
  placeholder = '',
  disabled = false,
  className = '',
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const hasValue = value && value.toString().length > 0;

  const wrapperClass = `md3-text-field 
    ${focused ? 'md3-text-field--focused' : ''} 
    ${hasValue ? 'md3-text-field--has-value' : ''} 
    ${error ? 'md3-text-field--error' : ''} 
    ${icon ? 'md3-text-field--with-icon' : ''} 
    ${disabled ? 'md3-text-field--disabled' : ''} 
    ${className}`;

  return (
    <div className={wrapperClass}>
      <div className="md3-text-field__input-container">
        {icon && <span className="md3-text-field__icon">{icon}</span>}
        
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={focused ? placeholder : ''}
          disabled={disabled}
          className="md3-text-field__input"
          {...rest}
        />
        
        {label && (
          <label className="md3-text-field__label">
            {label}
          </label>
        )}
      </div>
      
      {helperText && (
        <span className="md3-text-field__helper-text">{helperText}</span>
      )}
    </div>
  );
}
