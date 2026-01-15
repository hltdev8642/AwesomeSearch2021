/**
 * Toggle - Reusable toggle switch component
 */
import React from 'react';
import classes from './Toggle.module.css';

const Toggle = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'medium',
  id,
}) => {
  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`${classes.ToggleWrapper} ${disabled ? classes.disabled : ''}`}>
      <label className={classes.Toggle} htmlFor={toggleId}>
        <input
          type="checkbox"
          id={toggleId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={classes.Input}
        />
        <span className={`${classes.Slider} ${classes[size]}`}></span>
      </label>
      {label && (
        <span className={classes.Label} onClick={() => !disabled && onChange(!checked)}>
          {label}
        </span>
      )}
    </div>
  );
};

export default Toggle;
