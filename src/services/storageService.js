/**
 * StorageService - Robust localStorage management with versioning and error handling
 * Provides persistent storage for collections, preferences, and user data
 */

const STORAGE_VERSION = '1.0.0';
const STORAGE_KEYS = {
  COLLECTIONS: 'awesome_collections',
  PREFERENCES: 'awesome_preferences',
  LIST_CONFIG: 'awesome_list_config',
  AI_SETTINGS: 'awesome_ai_settings',
  CUSTOM_LISTS: 'awesome_custom_lists',
  VERSION: 'awesome_storage_version',
};

class StorageService {
  constructor() {
    this.checkVersion();
  }

  /**
   * Check and migrate storage version if needed
   */
  checkVersion() {
    const storedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (storedVersion !== STORAGE_VERSION) {
      this.migrateStorage(storedVersion);
      localStorage.setItem(STORAGE_KEYS.VERSION, STORAGE_VERSION);
    }
  }

  /**
   * Handle storage migrations between versions
   */
  migrateStorage(fromVersion) {
    // Future migration logic can be added here
    console.log(`Migrating storage from ${fromVersion || 'none'} to ${STORAGE_VERSION}`);
  }

  /**
   * Safely get item from localStorage with JSON parsing
   */
  getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  /**
   * Safely set item in localStorage with JSON stringification
   */
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded();
      }
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      return false;
    }
  }

  /**
   * Handle storage quota exceeded
   */
  handleQuotaExceeded() {
    console.warn('Storage quota exceeded. Consider clearing old data.');
  }

  // ========== COLLECTIONS ==========

  /**
   * Get all collections
   */
  getCollections() {
    return this.getItem(STORAGE_KEYS.COLLECTIONS, []);
  }

  /**
   * Save all collections
   */
  saveCollections(collections) {
    return this.setItem(STORAGE_KEYS.COLLECTIONS, collections);
  }

  /**
   * Add a new collection
   */
  addCollection(collection) {
    const collections = this.getCollections();
    collections.push(collection);
    return this.saveCollections(collections);
  }

  /**
   * Update an existing collection
   */
  updateCollection(id, updates) {
    const collections = this.getCollections();
    const index = collections.findIndex(c => c.id === id);
    if (index !== -1) {
      collections[index] = { ...collections[index], ...updates, updatedAt: new Date().toISOString() };
      return this.saveCollections(collections);
    }
    return false;
  }

  /**
   * Delete a collection
   */
  deleteCollection(id) {
    const collections = this.getCollections();
    const filtered = collections.filter(c => c.id !== id);
    return this.saveCollections(filtered);
  }

  /**
   * Get a single collection by ID
   */
  getCollectionById(id) {
    const collections = this.getCollections();
    return collections.find(c => c.id === id) || null;
  }

  // ========== PREFERENCES ==========

  /**
   * Get user preferences
   */
  getPreferences() {
    return this.getItem(STORAGE_KEYS.PREFERENCES, {
      theme: 'light',
      defaultView: 'grid',
      showAIRecommendations: true,
      autoSaveEnabled: true,
      searchHistory: [],
    });
  }

  /**
   * Save user preferences
   */
  savePreferences(preferences) {
    return this.setItem(STORAGE_KEYS.PREFERENCES, preferences);
  }

  /**
   * Update specific preference
   */
  updatePreference(key, value) {
    const preferences = this.getPreferences();
    preferences[key] = value;
    return this.savePreferences(preferences);
  }

  // ========== LIST CONFIGURATION ==========

  /**
   * Get list configuration (enabled/disabled lists)
   */
  getListConfig() {
    return this.getItem(STORAGE_KEYS.LIST_CONFIG, {
      disabledLists: [],
      favoritesList: [],
    });
  }

  /**
   * Save list configuration
   */
  saveListConfig(config) {
    return this.setItem(STORAGE_KEYS.LIST_CONFIG, config);
  }

  /**
   * Toggle list enabled/disabled status
   */
  toggleListEnabled(listRepo) {
    const config = this.getListConfig();
    const index = config.disabledLists.indexOf(listRepo);
    if (index !== -1) {
      config.disabledLists.splice(index, 1);
    } else {
      config.disabledLists.push(listRepo);
    }
    return this.saveListConfig(config);
  }

  /**
   * Check if list is enabled
   */
  isListEnabled(listRepo) {
    const config = this.getListConfig();
    return !config.disabledLists.includes(listRepo);
  }

  // ========== CUSTOM LISTS ==========

  /**
   * Get custom (user-added) lists
   */
  getCustomLists() {
    return this.getItem(STORAGE_KEYS.CUSTOM_LISTS, []);
  }

  /**
   * Save custom lists
   */
  saveCustomLists(lists) {
    return this.setItem(STORAGE_KEYS.CUSTOM_LISTS, lists);
  }

  /**
   * Add a custom list
   */
  addCustomList(list) {
    const lists = this.getCustomLists();
    if (!lists.find(l => l.repo === list.repo)) {
      lists.push(list);
      return this.saveCustomLists(lists);
    }
    return false;
  }

  /**
   * Remove a custom list
   */
  removeCustomList(repo) {
    const lists = this.getCustomLists();
    const filtered = lists.filter(l => l.repo !== repo);
    return this.saveCustomLists(filtered);
  }

  // ========== AI SETTINGS ==========

  /**
   * Get AI settings
   */
  getAISettings() {
    return this.getItem(STORAGE_KEYS.AI_SETTINGS, {
      provider: 'openai',
      apiKey: '',
      model: 'gpt-3.5-turbo',
      enabled: false,
      maxTokens: 1000,
    });
  }

  /**
   * Save AI settings
   */
  saveAISettings(settings) {
    return this.setItem(STORAGE_KEYS.AI_SETTINGS, settings);
  }

  // ========== EXPORT/IMPORT ==========

  /**
   * Export all user data
   */
  exportAllData() {
    return {
      version: STORAGE_VERSION,
      exportedAt: new Date().toISOString(),
      collections: this.getCollections(),
      preferences: this.getPreferences(),
      listConfig: this.getListConfig(),
      customLists: this.getCustomLists(),
      aiSettings: this.getAISettings(),
    };
  }

  /**
   * Import user data
   */
  importAllData(data) {
    try {
      if (data.collections) this.saveCollections(data.collections);
      if (data.preferences) this.savePreferences(data.preferences);
      if (data.listConfig) this.saveListConfig(data.listConfig);
      if (data.customLists) this.saveCustomLists(data.customLists);
      if (data.aiSettings) this.saveAISettings(data.aiSettings);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Clear all stored data
   */
  clearAllData() {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.removeItem(key);
    });
  }

  /**
   * Get storage statistics
   */
  getStorageStats() {
    const collections = this.getCollections();
    const customLists = this.getCustomLists();
    
    // Calculate total size
    let totalSize = 0;
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length * 2; // UTF-16 uses 2 bytes per character
      }
    });

    return {
      collections: collections.length,
      customLists: customLists.length,
      totalSize: totalSize,
    };
  }
}

// Export singleton instance
const storageService = new StorageService();
export default storageService;
export { STORAGE_KEYS };
