/**
 * Collection Model - Data structure for user collections
 */
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new collection object
 */
export const createCollection = ({ name, description = '', lists = [], color = '#3498db' }) => {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    name: name.trim(),
    description: description.trim(),
    lists: lists, // Array of { repo, name, cate, addedAt }
    color: color,
    createdAt: now,
    updatedAt: now,
    isDefault: false,
  };
};

/**
 * Create a list item for a collection
 */
export const createListItem = ({ repo, name, cate }) => {
  return {
    repo,
    name,
    cate,
    addedAt: new Date().toISOString(),
  };
};

/**
 * Validate collection data
 */
export const validateCollection = (collection) => {
  const errors = [];
  
  if (!collection.name || collection.name.trim().length === 0) {
    errors.push('Collection name is required');
  }
  
  if (collection.name && collection.name.length > 100) {
    errors.push('Collection name must be less than 100 characters');
  }
  
  if (collection.description && collection.description.length > 500) {
    errors.push('Description must be less than 500 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Default collection colors
 */
export const COLLECTION_COLORS = [
  '#3498db', // Blue
  '#2ecc71', // Green
  '#e74c3c', // Red
  '#9b59b6', // Purple
  '#f39c12', // Orange
  '#1abc9c', // Teal
  '#e91e63', // Pink
  '#607d8b', // Blue Grey
];

/**
 * Get a random collection color
 */
export const getRandomColor = () => {
  return COLLECTION_COLORS[Math.floor(Math.random() * COLLECTION_COLORS.length)];
};
