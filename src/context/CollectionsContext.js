/**
 * CollectionsContext - React Context for managing collections state
 */
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import storageService from '../services/storageService';
import { createCollection, createListItem } from '../models/Collection';

// Action types
const ACTIONS = {
  LOAD_COLLECTIONS: 'LOAD_COLLECTIONS',
  ADD_COLLECTION: 'ADD_COLLECTION',
  UPDATE_COLLECTION: 'UPDATE_COLLECTION',
  DELETE_COLLECTION: 'DELETE_COLLECTION',
  ADD_LIST_TO_COLLECTION: 'ADD_LIST_TO_COLLECTION',
  REMOVE_LIST_FROM_COLLECTION: 'REMOVE_LIST_FROM_COLLECTION',
  REORDER_COLLECTIONS: 'REORDER_COLLECTIONS',
  SET_ACTIVE_COLLECTION: 'SET_ACTIVE_COLLECTION',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
  collections: [],
  activeCollectionId: null,
  loading: true,
  error: null,
};

// Reducer
function collectionsReducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOAD_COLLECTIONS:
      return {
        ...state,
        collections: action.payload,
        loading: false,
      };
    
    case ACTIONS.ADD_COLLECTION:
      return {
        ...state,
        collections: [...state.collections, action.payload],
      };
    
    case ACTIONS.UPDATE_COLLECTION:
      return {
        ...state,
        collections: state.collections.map(c =>
          c.id === action.payload.id
            ? { ...c, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : c
        ),
      };
    
    case ACTIONS.DELETE_COLLECTION:
      return {
        ...state,
        collections: state.collections.filter(c => c.id !== action.payload),
        activeCollectionId: state.activeCollectionId === action.payload
          ? null
          : state.activeCollectionId,
      };
    
    case ACTIONS.ADD_LIST_TO_COLLECTION: {
      const { collectionId, list } = action.payload;
      return {
        ...state,
        collections: state.collections.map(c => {
          if (c.id !== collectionId) return c;
          // Check if list already exists
          if (c.lists.some(l => l.repo === list.repo)) return c;
          return {
            ...c,
            lists: [...c.lists, list],
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    }
    
    case ACTIONS.REMOVE_LIST_FROM_COLLECTION: {
      const { collectionId, repo } = action.payload;
      return {
        ...state,
        collections: state.collections.map(c => {
          if (c.id !== collectionId) return c;
          return {
            ...c,
            lists: c.lists.filter(l => l.repo !== repo),
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    }
    
    case ACTIONS.REORDER_COLLECTIONS:
      return {
        ...state,
        collections: action.payload,
      };
    
    case ACTIONS.SET_ACTIVE_COLLECTION:
      return {
        ...state,
        activeCollectionId: action.payload,
      };
    
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };
    
    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
}

// Context
const CollectionsContext = createContext(null);

// Provider component
export function CollectionsProvider({ children }) {
  const [state, dispatch] = useReducer(collectionsReducer, initialState);

  // Load collections from storage on mount
  useEffect(() => {
    const collections = storageService.getCollections();
    dispatch({ type: ACTIONS.LOAD_COLLECTIONS, payload: collections });
  }, []);

  // Persist collections to storage when they change
  useEffect(() => {
    if (!state.loading) {
      storageService.saveCollections(state.collections);
    }
  }, [state.collections, state.loading]);

  // Action creators
  const actions = {
    addCollection: (collectionData) => {
      const collection = createCollection(collectionData);
      dispatch({ type: ACTIONS.ADD_COLLECTION, payload: collection });
      return collection;
    },

    updateCollection: (id, updates) => {
      dispatch({ type: ACTIONS.UPDATE_COLLECTION, payload: { id, updates } });
    },

    deleteCollection: (id) => {
      dispatch({ type: ACTIONS.DELETE_COLLECTION, payload: id });
    },

    addListToCollection: (collectionId, listData) => {
      const list = createListItem(listData);
      dispatch({
        type: ACTIONS.ADD_LIST_TO_COLLECTION,
        payload: { collectionId, list },
      });
    },

    removeListFromCollection: (collectionId, repo) => {
      dispatch({
        type: ACTIONS.REMOVE_LIST_FROM_COLLECTION,
        payload: { collectionId, repo },
      });
    },

    setActiveCollection: (id) => {
      dispatch({ type: ACTIONS.SET_ACTIVE_COLLECTION, payload: id });
    },

    reorderCollections: (collections) => {
      dispatch({ type: ACTIONS.REORDER_COLLECTIONS, payload: collections });
    },

    getCollectionById: (id) => {
      return state.collections.find(c => c.id === id) || null;
    },

    isListInCollection: (collectionId, repo) => {
      const collection = state.collections.find(c => c.id === collectionId);
      return collection ? collection.lists.some(l => l.repo === repo) : false;
    },

    isListInAnyCollection: (repo) => {
      return state.collections.some(c => c.lists.some(l => l.repo === repo));
    },

    getCollectionsForList: (repo) => {
      return state.collections.filter(c => c.lists.some(l => l.repo === repo));
    },

    setError: (error) => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error });
    },

    clearError: () => {
      dispatch({ type: ACTIONS.CLEAR_ERROR });
    },
  };

  return (
    <CollectionsContext.Provider value={{ state, ...actions }}>
      {children}
    </CollectionsContext.Provider>
  );
}

// Custom hook for using collections context
export function useCollections() {
  const context = useContext(CollectionsContext);
  if (!context) {
    throw new Error('useCollections must be used within a CollectionsProvider');
  }
  return context;
}

export default CollectionsContext;
