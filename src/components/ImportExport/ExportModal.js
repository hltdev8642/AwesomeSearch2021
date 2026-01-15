/**
 * ExportModal - Modal for exporting collections in various formats
 */
import React, { useState } from 'react';
import { Modal, Button } from '../UI';
import exportService from '../../services/exportService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileCode, 
  faFileAlt, 
  faFileExport,
  faTable,
  faDownload,
  faDatabase
} from '@fortawesome/free-solid-svg-icons';
import classes from './ExportModal.module.css';

const FORMATS = [
  { id: 'json', name: 'JSON', icon: faFileCode, description: 'Structured data format, best for backup/import' },
  { id: 'markdown', name: 'Markdown', icon: faFileAlt, description: 'Readable documentation format' },
  { id: 'html', name: 'HTML', icon: faFileExport, description: 'Web-ready format with styling' },
  { id: 'csv', name: 'CSV', icon: faTable, description: 'Spreadsheet-compatible format' },
];

const ExportModal = ({ isOpen, onClose, collection, allCollections }) => {
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [exporting, setExporting] = useState(false);

  const isExportingAll = !collection && allCollections;
  const isSingleCollection = collection && !allCollections;

  const handleExport = async () => {
    setExporting(true);
    try {
      if (isSingleCollection) {
        exportService.downloadCollection(collection, selectedFormat);
      } else if (isExportingAll) {
        exportService.downloadAllCollections(allCollections, selectedFormat);
      }
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportAllData = () => {
    setExporting(true);
    try {
      exportService.downloadAllData();
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Limit formats for multiple collections
  const availableFormats = isExportingAll
    ? FORMATS.filter(f => ['json', 'markdown'].includes(f.id))
    : FORMATS;

  // For single collection HTML/CSV, otherwise only JSON/MD
  const title = isSingleCollection 
    ? `Export "${collection.name}"` 
    : 'Export Collections';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="medium"
    >
      <div className={classes.ExportModal}>
        <p className={classes.Description}>
          {isSingleCollection 
            ? `Export this collection with ${collection.lists.length} lists.`
            : `Export all ${allCollections?.length || 0} collections.`
          }
        </p>

        <div className={classes.FormatSection}>
          <h3>Select Format</h3>
          <div className={classes.FormatGrid}>
            {availableFormats.map(format => (
              <button
                key={format.id}
                className={`${classes.FormatOption} ${selectedFormat === format.id ? classes.selected : ''}`}
                onClick={() => setSelectedFormat(format.id)}
              >
                <FontAwesomeIcon icon={format.icon} className={classes.FormatIcon} />
                <span className={classes.FormatName}>{format.name}</span>
                <span className={classes.FormatDesc}>{format.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={classes.Actions}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={<FontAwesomeIcon icon={faDownload} />}
            onClick={handleExport}
            loading={exporting}
          >
            Download {selectedFormat.toUpperCase()}
          </Button>
        </div>

        {isExportingAll && (
          <div className={classes.FullBackupSection}>
            <hr />
            <h4>Full Backup</h4>
            <p className={classes.BackupDescription}>
              Export all data including collections, preferences, and settings.
            </p>
            <Button
              variant="ghost"
              icon={<FontAwesomeIcon icon={faDatabase} />}
              onClick={handleExportAllData}
              loading={exporting}
            >
              Download Full Backup
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ExportModal;
