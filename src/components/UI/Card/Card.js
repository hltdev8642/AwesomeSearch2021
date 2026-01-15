/**
 * Card - Reusable card component
 */
import React from 'react';
import classes from './Card.module.css';

const Card = ({
  children,
  title,
  subtitle,
  actions,
  color,
  onClick,
  className = '',
  hoverable = false,
  selected = false,
}) => {
  const cardClasses = [
    classes.Card,
    hoverable ? classes.hoverable : '',
    selected ? classes.selected : '',
    onClick ? classes.clickable : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={cardClasses} 
      onClick={onClick}
      style={color ? { borderTop: `4px solid ${color}` } : {}}
    >
      {(title || actions) && (
        <div className={classes.CardHeader}>
          <div className={classes.CardTitles}>
            {title && <h3 className={classes.CardTitle}>{title}</h3>}
            {subtitle && <p className={classes.CardSubtitle}>{subtitle}</p>}
          </div>
          {actions && <div className={classes.CardActions}>{actions}</div>}
        </div>
      )}
      <div className={classes.CardBody}>
        {children}
      </div>
    </div>
  );
};

export default Card;
