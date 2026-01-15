/**
 * CollectionCard - Display individual collection with actions
 */
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faTrash, 
  faEye, 
  faFileExport,
  faList 
} from '@fortawesome/free-solid-svg-icons';
import { Card } from '../UI';
import classes from './CollectionCard.module.css';

const CollectionCard = ({ 
  collection, 
  onView, 
  onEdit, 
  onDelete, 
  onExport 
}) => {
  const { name, description, lists, color, createdAt, updatedAt } = collection;
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const actions = (
    <>
      <button 
        className={classes.ActionButton} 
        onClick={(e) => { e.stopPropagation(); onView(); }}
        title="View collection"
      >
        <FontAwesomeIcon icon={faEye} />
      </button>
      <button 
        className={classes.ActionButton} 
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        title="Edit collection"
      >
        <FontAwesomeIcon icon={faEdit} />
      </button>
      <button 
        className={classes.ActionButton} 
        onClick={(e) => { e.stopPropagation(); onExport(); }}
        title="Export collection"
      >
        <FontAwesomeIcon icon={faFileExport} />
      </button>
      <button 
        className={`${classes.ActionButton} ${classes.danger}`} 
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete collection"
      >
        <FontAwesomeIcon icon={faTrash} />
      </button>
    </>
  );

  return (
    <Card
      title={name}
      subtitle={description}
      actions={actions}
      color={color}
      hoverable
      onClick={onView}
      className={classes.CollectionCard}
    >
      <div className={classes.Stats}>
        <div className={classes.Stat}>
          <FontAwesomeIcon icon={faList} className={classes.StatIcon} />
          <span>{lists.length} {lists.length === 1 ? 'list' : 'lists'}</span>
        </div>
      </div>
      
      {lists.length > 0 && (
        <div className={classes.Preview}>
          {lists.slice(0, 3).map((list, idx) => (
            <span key={list.repo || idx} className={classes.PreviewItem}>
              {list.name}
            </span>
          ))}
          {lists.length > 3 && (
            <span className={classes.MoreItems}>
              +{lists.length - 3} more
            </span>
          )}
        </div>
      )}
      
      <div className={classes.Meta}>
        <span title={`Created: ${formatDate(createdAt)}`}>
          Created {formatDate(createdAt)}
        </span>
        {updatedAt !== createdAt && (
          <span title={`Updated: ${formatDate(updatedAt)}`}>
            • Updated {formatDate(updatedAt)}
          </span>
        )}
      </div>
    </Card>
  );
};

export default CollectionCard;
