/**
 * CollectionForm - Form for creating/editing collections
 */
import React, { useState, useEffect } from 'react';
import { validateCollection, COLLECTION_COLORS, getRandomColor } from '../../models/Collection';
import { Button } from '../UI';
import classes from './CollectionForm.module.css';

const CollectionForm = ({ collection, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(getRandomColor());
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (collection) {
      setName(collection.name || '');
      setDescription(collection.description || '');
      setColor(collection.color || getRandomColor());
    }
  }, [collection]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = { name, description, color };
    const validation = validateCollection(data);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSubmit(data);
    
    // Reset form if creating new
    if (!collection) {
      setName('');
      setDescription('');
      setColor(getRandomColor());
    }
    setErrors([]);
  };

  return (
    <form className={classes.CollectionForm} onSubmit={handleSubmit}>
      {errors.length > 0 && (
        <div className={classes.Errors}>
          {errors.map((error, idx) => (
            <div key={idx} className={classes.Error}>{error}</div>
          ))}
        </div>
      )}

      <div className={classes.FormGroup}>
        <label htmlFor="name" className={classes.Label}>
          Collection Name *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter collection name"
          className={classes.Input}
          autoFocus
        />
      </div>

      <div className={classes.FormGroup}>
        <label htmlFor="description" className={classes.Label}>
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this collection is for..."
          className={classes.Textarea}
          rows={3}
        />
      </div>

      <div className={classes.FormGroup}>
        <label className={classes.Label}>Color</label>
        <div className={classes.ColorPicker}>
          {COLLECTION_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`${classes.ColorOption} ${color === c ? classes.selected : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>
      </div>

      <div className={classes.FormActions}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {collection ? 'Save Changes' : 'Create Collection'}
        </Button>
      </div>
    </form>
  );
};

export default CollectionForm;
