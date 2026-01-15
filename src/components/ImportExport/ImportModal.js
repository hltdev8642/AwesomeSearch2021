/**
 * ImportModal - Modal for importing collections from files
 */
import React, { useState, useRef } from 'react';
import { Modal, Button } from '../UI';
import { useCollections } from '../../context/CollectionsContext';
import importService from '../../services/importService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileUpload, 
  faCheckCircle, 
  faTimesCircle,
  faFileImport,
  faDatabase
} from '@fortawesome/free-solid-svg-icons';
import classes from './ImportModal.module.css';

const ImportModal = ({ isOpen, onClose }) => {
  const { addCollection } = useCollections();
  const fileInputRef = useRef(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile) => {
    setFile(selectedFile);
    setResult(null);
    
    try {
      const content = await importService.readFile(selectedFile);
      const parsed = importService.parse(content, null, selectedFile.name);
      
      if (parsed.success) {
        const importResult = importService.importCollection(parsed);
        setPreviewData(importResult);
      } else {
        setPreviewData({ success: false, error: parsed.error });
      }
    } catch (error) {
      setPreviewData({ success: false, error: error.message });
    }
  };

  const handleImport = async () => {
    if (!previewData || !previewData.success) return;
    
    setImporting(true);
    try {
      if (previewData.collection) {
        addCollection({
          name: previewData.collection.name,
          description: previewData.collection.description,
          lists: previewData.collection.lists,
          color: previewData.collection.color,
        });
        setResult({ success: true, message: 'Collection imported successfully!' });
      } else if (previewData.collections) {
        previewData.collections.forEach(c => {
          addCollection({
            name: c.name,
            description: c.description,
            lists: c.lists,
            color: c.color,
          });
        });
        setResult({ 
          success: true, 
          message: `${previewData.collections.length} collections imported successfully!` 
        });
      }
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setImporting(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!file) return;
    
    setImporting(true);
    try {
      const content = await importService.readFile(file);
      const result = importService.importBackup(content);
      setResult(result);
      if (result.success) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreviewData(null);
    setResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Collections"
      size="medium"
    >
      <div className={classes.ImportModal}>
        {result ? (
          <div className={`${classes.Result} ${result.success ? classes.success : classes.error}`}>
            <FontAwesomeIcon 
              icon={result.success ? faCheckCircle : faTimesCircle} 
              className={classes.ResultIcon}
            />
            <p>{result.success ? result.message : result.error}</p>
            <Button variant="outline" onClick={resetState}>
              Import Another
            </Button>
          </div>
        ) : (
          <>
            <div
              className={`${classes.DropZone} ${dragActive ? classes.active : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <FontAwesomeIcon icon={faFileUpload} className={classes.UploadIcon} />
              <p>Drag and drop a file here, or click to browse</p>
              <span className={classes.FileTypes}>
                Supported: JSON, Markdown, CSV
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.md,.csv,.txt"
                onChange={handleFileSelect}
                className={classes.HiddenInput}
              />
            </div>

            {file && (
              <div className={classes.FileInfo}>
                <span className={classes.FileName}>{file.name}</span>
                <span className={classes.FileSize}>
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
                <button className={classes.RemoveFile} onClick={resetState}>
                  Remove
                </button>
              </div>
            )}

            {previewData && (
              <div className={classes.Preview}>
                {previewData.success ? (
                  <>
                    <h4>Preview</h4>
                    {previewData.collection && (
                      <div className={classes.PreviewItem}>
                        <strong>{previewData.collection.name}</strong>
                        <span>{previewData.collection.lists?.length || 0} lists</span>
                      </div>
                    )}
                    {previewData.collections && (
                      <div className={classes.PreviewList}>
                        {previewData.collections.slice(0, 5).map((c, i) => (
                          <div key={i} className={classes.PreviewItem}>
                            <strong>{c.name}</strong>
                            <span>{c.lists?.length || 0} lists</span>
                          </div>
                        ))}
                        {previewData.collections.length > 5 && (
                          <div className={classes.PreviewMore}>
                            +{previewData.collections.length - 5} more collections
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className={classes.PreviewError}>
                    <FontAwesomeIcon icon={faTimesCircle} />
                    <span>{previewData.error}</span>
                  </div>
                )}
              </div>
            )}

            <div className={classes.Actions}>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {previewData?.success && (
                <Button
                  variant="primary"
                  icon={<FontAwesomeIcon icon={faFileImport} />}
                  onClick={handleImport}
                  loading={importing}
                >
                  Import
                </Button>
              )}
            </div>

            {file && file.name.includes('backup') && (
              <div className={classes.BackupSection}>
                <hr />
                <p>This looks like a backup file. Restore all data?</p>
                <Button
                  variant="warning"
                  icon={<FontAwesomeIcon icon={faDatabase} />}
                  onClick={handleRestoreBackup}
                  loading={importing}
                >
                  Restore Full Backup
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default ImportModal;
