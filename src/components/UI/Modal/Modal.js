/**
 * Modal - Reusable modal component
 */
import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import classes from './Modal.module.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  showCloseButton = true,
  closeOnBackdrop = true,
  footer = null,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={classes.ModalBackdrop} onClick={handleBackdropClick}>
      <div className={`${classes.Modal} ${classes[size]}`}>
        <div className={classes.ModalHeader}>
          <h2 className={classes.ModalTitle}>{title}</h2>
          {showCloseButton && (
            <button className={classes.CloseButton} onClick={onClose} aria-label="Close">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
        <div className={classes.ModalBody}>
          {children}
        </div>
        {footer && (
          <div className={classes.ModalFooter}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
