/**
 * SettingsPanel - Main settings hub for the application
 */
import React, { useState } from 'react';
import storageService from '../../services/storageService';
import { Modal, Button, Toggle, Tabs } from '../UI';
import { AISettings } from '../AI';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCog,
  faRobot,
  faDatabase,
  faPalette,
  faTrash,
  faDownload,
  faUpload,
  faSave,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import classes from './SettingsPanel.module.css';

const SettingsPanel = ({ isOpen, onClose, onExport, onImport }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [showAISettings, setShowAISettings] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [preferences, setPreferences] = useState(() => storageService.getPreferences());
  const [saved, setSaved] = useState(false);

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'data', label: 'Data' },
    { id: 'about', label: 'About' }
  ];

  const stats = storageService.getStorageStats();

  const handleSavePreferences = () => {
    storageService.savePreferences(preferences);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearData = () => {
    storageService.clearAllData();
    setShowClearConfirm(false);
    window.location.reload();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Settings"
        size="large"
      >
        <div className={classes.SettingsPanel}>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className={classes.Content}>
            {activeTab === 'general' && (
              <div className={classes.TabContent}>
                <div className={classes.Section}>
                  <h4>
                    <FontAwesomeIcon icon={faPalette} />
                    Appearance
                  </h4>
                  <div className={classes.Option}>
                    <Toggle
                      checked={preferences.darkMode}
                      onChange={(checked) => setPreferences(p => ({ ...p, darkMode: checked }))}
                      label="Dark Mode"
                    />
                  </div>
                  <div className={classes.Option}>
                    <Toggle
                      checked={preferences.compactView}
                      onChange={(checked) => setPreferences(p => ({ ...p, compactView: checked }))}
                      label="Compact View"
                    />
                  </div>
                </div>

                <div className={classes.Section}>
                  <h4>
                    <FontAwesomeIcon icon={faRobot} />
                    AI Features
                  </h4>
                  <div className={classes.Option}>
                    <Toggle
                      checked={preferences.showAIRecommendations}
                      onChange={(checked) => setPreferences(p => ({ ...p, showAIRecommendations: checked }))}
                      label="Show AI Recommendations"
                    />
                  </div>
                  <Button 
                    variant="secondary" 
                    size="small"
                    onClick={() => setShowAISettings(true)}
                  >
                    <FontAwesomeIcon icon={faCog} />
                    Configure AI Provider
                  </Button>
                </div>

                <div className={classes.Actions}>
                  <Button onClick={handleSavePreferences}>
                    <FontAwesomeIcon icon={faSave} />
                    {saved ? 'Saved!' : 'Save Preferences'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className={classes.TabContent}>
                <div className={classes.Section}>
                  <h4>
                    <FontAwesomeIcon icon={faDatabase} />
                    Storage Usage
                  </h4>
                  <div className={classes.Stats}>
                    <div className={classes.Stat}>
                      <span className={classes.StatLabel}>Collections</span>
                      <span className={classes.StatValue}>{stats.collections}</span>
                    </div>
                    <div className={classes.Stat}>
                      <span className={classes.StatLabel}>Custom Lists</span>
                      <span className={classes.StatValue}>{stats.customLists}</span>
                    </div>
                    <div className={classes.Stat}>
                      <span className={classes.StatLabel}>Total Size</span>
                      <span className={classes.StatValue}>{formatBytes(stats.totalSize)}</span>
                    </div>
                  </div>
                </div>

                <div className={classes.Section}>
                  <h4>Import / Export</h4>
                  <p className={classes.Description}>
                    Export your collections and settings to backup or transfer to another device.
                  </p>
                  <div className={classes.ButtonGroup}>
                    <Button variant="secondary" onClick={onExport}>
                      <FontAwesomeIcon icon={faDownload} />
                      Export Data
                    </Button>
                    <Button variant="secondary" onClick={onImport}>
                      <FontAwesomeIcon icon={faUpload} />
                      Import Data
                    </Button>
                  </div>
                </div>

                <div className={classes.Section}>
                  <h4 className={classes.DangerHeader}>
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    Danger Zone
                  </h4>
                  <p className={classes.Description}>
                    Clear all local data including collections, settings, and cache.
                    This action cannot be undone.
                  </p>
                  <Button 
                    variant="danger" 
                    onClick={() => setShowClearConfirm(true)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    Clear All Data
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className={classes.TabContent}>
                <div className={classes.About}>
                  <h3>AwesomeSearch</h3>
                  <p className={classes.Version}>Version 2.0.0</p>
                  <p className={classes.Description}>
                    A comprehensive awesome-list management platform for discovering,
                    organizing, and curating the best resources from GitHub's
                    awesome-list ecosystem.
                  </p>
                  
                  <div className={classes.Features}>
                    <h4>Features</h4>
                    <ul>
                      <li>Search across 600+ awesome lists</li>
                      <li>Create custom collections</li>
                      <li>AI-powered recommendations</li>
                      <li>Import/Export support (JSON, Markdown, HTML, CSV)</li>
                      <li>Enable/disable lists dynamically</li>
                    </ul>
                  </div>

                  <div className={classes.Links}>
                    <a 
                      href="https://github.com/lockys/awesome-search" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      GitHub Repository
                    </a>
                    <span>•</span>
                    <a 
                      href="https://github.com/sindresorhus/awesome" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Awesome Lists
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* AI Settings Modal */}
      <AISettings 
        isOpen={showAISettings} 
        onClose={() => setShowAISettings(false)} 
      />

      {/* Clear Data Confirmation Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear All Data?"
        size="small"
      >
        <div className={classes.ConfirmDialog}>
          <p>
            <FontAwesomeIcon icon={faExclamationTriangle} className={classes.WarningIcon} />
            This will permanently delete all your collections, custom lists, and settings.
            This action cannot be undone.
          </p>
          <div className={classes.ConfirmActions}>
            <Button variant="secondary" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClearData}>
              <FontAwesomeIcon icon={faTrash} />
              Clear All Data
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SettingsPanel;
