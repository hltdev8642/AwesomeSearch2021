/**
 * ListManagementContext - React Context for managing list enable/disable and custom lists
 */
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import storageService from '../services/storageService';

// Action types
const ACTIONS = {
  LOAD_CONFIG: 'LOAD_CONFIG',
  TOGGLE_LIST: 'TOGGLE_LIST',
  ENABLE_ALL: 'ENABLE_ALL',
  DISABLE_ALL: 'DISABLE_ALL',
  ADD_CUSTOM_LIST: 'ADD_CUSTOM_LIST',
  REMOVE_CUSTOM_LIST: 'REMOVE_CUSTOM_LIST',
  ADD_TO_FAVORITES: 'ADD_TO_FAVORITES',
  REMOVE_FROM_FAVORITES: 'REMOVE_FROM_FAVORITES',
  SET_LOADING: 'SET_LOADING',
};

// Initial state
const initialState = {
  disabledLists: [],
  favoritesList: [],
  customLists: [],
  loading: true,
};

// Reducer
function listManagementReducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOAD_CONFIG:
      return {
        ...state,
        ...action.payload,
        loading: false,
      };
    
    case ACTIONS.TOGGLE_LIST: {
      const repo = action.payload;
      const isDisabled = state.disabledLists.includes(repo);
      return {
        ...state,
        disabledLists: isDisabled
          ? state.disabledLists.filter(r => r !== repo)
          : [...state.disabledLists, repo],
      };
    }
    
    case ACTIONS.ENABLE_ALL:
      return {
        ...state,
        disabledLists: [],
      };
    
    case ACTIONS.DISABLE_ALL:
      return {
        ...state,
        disabledLists: action.payload,
      };
    
    case ACTIONS.ADD_CUSTOM_LIST: {
      const list = action.payload;
      if (state.customLists.some(l => l.repo === list.repo)) {
        return state;
      }
      return {
        ...state,
        customLists: [...state.customLists, list],
      };
    }
    
    case ACTIONS.REMOVE_CUSTOM_LIST:
      return {
        ...state,
        customLists: state.customLists.filter(l => l.repo !== action.payload),
      };
    
    case ACTIONS.ADD_TO_FAVORITES: {
      const repo = action.payload;
      if (state.favoritesList.includes(repo)) return state;
      return {
        ...state,
        favoritesList: [...state.favoritesList, repo],
      };
    }
    
    case ACTIONS.REMOVE_FROM_FAVORITES:
      return {
        ...state,
        favoritesList: state.favoritesList.filter(r => r !== action.payload),
      };
    
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    
    default:
      return state;
  }
}

// Context
const ListManagementContext = createContext(null);

// Provider component
export function ListManagementProvider({ children }) {
  const [state, dispatch] = useReducer(listManagementReducer, initialState);

  // Load config from storage on mount
  useEffect(() => {
    const listConfig = storageService.getListConfig();
    const customLists = storageService.getCustomLists();
    dispatch({
      type: ACTIONS.LOAD_CONFIG,
      payload: {
        disabledLists: listConfig.disabledLists || [],
        favoritesList: listConfig.favoritesList || [],
        customLists: customLists || [],
      },
    });
  }, []);

  // Persist config to storage when it changes
  useEffect(() => {
    if (!state.loading) {
      storageService.saveListConfig({
        disabledLists: state.disabledLists,
        favoritesList: state.favoritesList,
      });
      storageService.saveCustomLists(state.customLists);
    }
  }, [state.disabledLists, state.favoritesList, state.customLists, state.loading]);

  // Action creators
  const actions = {
    toggleList: (repo) => {
      dispatch({ type: ACTIONS.TOGGLE_LIST, payload: repo });
      try { window.dispatchEvent(new CustomEvent('listConfigUpdated', { detail: { action: 'toggle', repo } })); } catch (e) {}
    },

    enableAll: () => {
      dispatch({ type: ACTIONS.ENABLE_ALL });
      try { window.dispatchEvent(new CustomEvent('listConfigUpdated', { detail: { action: 'enableAll' } })); } catch (e) {}
    },

    disableAll: (allRepos) => {
      dispatch({ type: ACTIONS.DISABLE_ALL, payload: allRepos });
      try { window.dispatchEvent(new CustomEvent('listConfigUpdated', { detail: { action: 'disableAll' } })); } catch (e) {}
    },

    isListEnabled: (repo) => {
      return !state.disabledLists.includes(repo);
    },

    addCustomList: (list) => {
      dispatch({ type: ACTIONS.ADD_CUSTOM_LIST, payload: list });
      // Notify app that custom lists changed
      try { window.dispatchEvent(new CustomEvent('customListsUpdated', { detail: list })); } catch (e) {}
    },

    removeCustomList: (repo) => {
      dispatch({ type: ACTIONS.REMOVE_CUSTOM_LIST, payload: repo });
    },

    isCustomList: (repo) => {
      return state.customLists.some(l => l.repo === repo);
    },

    addToFavorites: (repo) => {
      dispatch({ type: ACTIONS.ADD_TO_FAVORITES, payload: repo });
    },

    removeFromFavorites: (repo) => {
      dispatch({ type: ACTIONS.REMOVE_FROM_FAVORITES, payload: repo });
    },

    isFavorite: (repo) => {
      return state.favoritesList.includes(repo);
    },

    toggleFavorite: (repo) => {
      if (state.favoritesList.includes(repo)) {
        dispatch({ type: ACTIONS.REMOVE_FROM_FAVORITES, payload: repo });
      } else {
        dispatch({ type: ACTIONS.ADD_TO_FAVORITES, payload: repo });
      }
    },

    getStats: () => ({
      totalDisabled: state.disabledLists.length,
      totalCustom: state.customLists.length,
      totalFavorites: state.favoritesList.length,
    }),
  };

  return (
    <ListManagementContext.Provider value={{ state, ...actions }}>
      {children}
    </ListManagementContext.Provider>
  );
}

// Custom hook for using list management context
export function useListManagement() {
  const context = useContext(ListManagementContext);
  if (!context) {
    throw new Error('useListManagement must be used within a ListManagementProvider');
  }
  return context;
}

export default ListManagementContext;
