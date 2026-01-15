/**
 * Button - Reusable button component with variants
 */
import React from 'react';
import classes from './Button.module.css';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon = null,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const buttonClasses = [
    classes.Button,
    classes[variant],
    classes[size],
    fullWidth ? classes.fullWidth : '',
    loading ? classes.loading : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className={classes.Spinner}></span>}
      {icon && !loading && <span className={classes.Icon}>{icon}</span>}
      <span className={classes.Text}>{children}</span>
    </button>
  );
};

export default Button;
