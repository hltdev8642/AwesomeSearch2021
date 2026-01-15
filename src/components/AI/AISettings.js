/**
 * AISettings - Configure AI provider settings
 */
import React, { useState, useEffect } from 'react';
import storageService from '../../services/storageService';
import { Button, Toggle, Modal } from '../UI';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, 
  faKey, 
  faSave,
  faEye,
  faEyeSlash,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import classes from './AISettings.module.css';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', placeholder: 'sk-...' },
  { id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...' },
  { id: 'local', name: 'Local (Fuse.js)', placeholder: 'No API key needed' }
];

const AISettings = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    enabled: false,
    provider: 'local',
    apiKey: '',
    model: ''
  });
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentSettings = storageService.getAISettings();
      setSettings(currentSettings);
    }
  }, [isOpen]);

  const handleProviderChange = (provider) => {
    setSettings(prev => ({
      ...prev,
      provider,
      apiKey: provider === 'local' ? '' : prev.apiKey
    }));
  };

  const handleSave = () => {
    storageService.saveAISettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectedProvider = PROVIDERS.find(p => p.id === settings.provider);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Settings"
      size="medium"
    >
      <div className={classes.AISettings}>
        <div className={classes.Section}>
          <div className={classes.SectionHeader}>
            <FontAwesomeIcon icon={faRobot} />
            <h4>AI Recommendations</h4>
          </div>
          <Toggle
            checked={settings.enabled}
            onChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
            label="Enable AI-powered recommendations"
          />
        </div>

        <div className={classes.Section}>
          <label className={classes.Label}>Provider</label>
          <div className={classes.ProviderGrid}>
            {PROVIDERS.map(provider => (
              <button
                key={provider.id}
                className={`${classes.ProviderButton} ${settings.provider === provider.id ? classes.Active : ''}`}
                onClick={() => handleProviderChange(provider.id)}
              >
                {provider.name}
              </button>
            ))}
          </div>
        </div>

        {settings.provider !== 'local' && (
          <div className={classes.Section}>
            <label className={classes.Label}>
              <FontAwesomeIcon icon={faKey} />
              API Key
            </label>
            <div className={classes.KeyInput}>
              <input
                type={showKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder={selectedProvider?.placeholder}
                className={classes.Input}
              />
              <button
                type="button"
                className={classes.ToggleKey}
                onClick={() => setShowKey(!showKey)}
              >
                <FontAwesomeIcon icon={showKey ? faEyeSlash : faEye} />
              </button>
            </div>
            <p className={classes.Help}>
              <FontAwesomeIcon icon={faInfoCircle} />
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>
        )}

        {settings.provider === 'local' && (
          <div className={classes.Notice}>
            <FontAwesomeIcon icon={faInfoCircle} />
            Local mode uses Fuse.js for fuzzy search matching. No API key required.
          </div>
        )}

        <div className={classes.Actions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <FontAwesomeIcon icon={faSave} />
            {saved ? 'Saved!' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AISettings;
