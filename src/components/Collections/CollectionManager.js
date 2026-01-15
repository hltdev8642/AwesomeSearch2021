/**
 * CollectionManager - Main component for managing user collections
 */
import React, { useState } from 'react';
import { useCollections } from '../../context/CollectionsContext';
import CollectionCard from './CollectionCard';
import CollectionForm from './CollectionForm';
import CollectionDetail from './CollectionDetail';
import { Modal, Button } from '../UI';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFileExport, faFileImport, faSearch } from '@fortawesome/free-solid-svg-icons';
import ExportModal from '../ImportExport/ExportModal';
import ImportModal from '../ImportExport/ImportModal';
import classes from './CollectionManager.module.css';

const CollectionManager = ({ subjectsArray = [] }) => {
  const { state, addCollection, updateCollection, deleteCollection } = useCollections();
  const { collections, loading } = state;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateCollection = (data) => {
    addCollection(data);
    setShowCreateModal(false);
  };

  const handleEditCollection = (data) => {
    if (selectedCollection) {
      updateCollection(selectedCollection.id, data);
      setShowEditModal(false);
      setSelectedCollection(null);
    }
  };

  const handleDeleteCollection = (id) => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      deleteCollection(id);
    }
  };

  const handleViewCollection = (collection) => {
    setSelectedCollection(collection);
    setShowDetailModal(true);
  };

  const handleEditClick = (collection) => {
    setSelectedCollection(collection);
    setShowEditModal(true);
  };

  const handleExportCollection = (collection) => {
    setSelectedCollection(collection);
    setShowExportModal(true);
  };

  const filteredCollections = collections.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className={classes.Loading}>Loading collections...</div>;
  }

  return (
    <div className={classes.CollectionManager}>
      <div className={classes.Header}>
        <h1 className={classes.Title}>My Collections</h1>
        <div className={classes.Actions}>
          <Button
            variant="ghost"
            size="small"
            icon={<FontAwesomeIcon icon={faFileImport} />}
            onClick={() => setShowImportModal(true)}
          >
            Import
          </Button>
          <Button
            variant="ghost"
            size="small"
            icon={<FontAwesomeIcon icon={faFileExport} />}
            onClick={() => {
              setSelectedCollection(null);
              setShowExportModal(true);
            }}
            disabled={collections.length === 0}
          >
            Export All
          </Button>
          <Button
            variant="primary"
            icon={<FontAwesomeIcon icon={faPlus} />}
            onClick={() => setShowCreateModal(true)}
          >
            New Collection
          </Button>
        </div>
      </div>

      {collections.length > 0 && (
        <div className={classes.SearchBar}>
          <FontAwesomeIcon icon={faSearch} className={classes.SearchIcon} />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={classes.SearchInput}
          />
        </div>
      )}

      {collections.length === 0 ? (
        <div className={classes.EmptyState}>
          <div className={classes.EmptyIcon}>📚</div>
          <h2>No Collections Yet</h2>
          <p>Create your first collection to organize your favorite awesome-lists!</p>
          <Button
            variant="primary"
            icon={<FontAwesomeIcon icon={faPlus} />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Collection
          </Button>
        </div>
      ) : (
        <div className={classes.CollectionsGrid}>
          {filteredCollections.map(collection => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onView={() => handleViewCollection(collection)}
              onEdit={() => handleEditClick(collection)}
              onDelete={() => handleDeleteCollection(collection.id)}
              onExport={() => handleExportCollection(collection)}
            />
          ))}
        </div>
      )}

      {filteredCollections.length === 0 && collections.length > 0 && (
        <div className={classes.NoResults}>
          No collections match your search.
        </div>
      )}

      {/* Create Collection Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Collection"
        size="medium"
      >
        <CollectionForm
          onSubmit={handleCreateCollection}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Collection Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCollection(null);
        }}
        title="Edit Collection"
        size="medium"
      >
        <CollectionForm
          collection={selectedCollection}
          onSubmit={handleEditCollection}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedCollection(null);
          }}
        />
      </Modal>

      {/* Collection Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedCollection(null);
        }}
        title={selectedCollection?.name || 'Collection'}
        size="large"
      >
        {selectedCollection && (
          <CollectionDetail
            collection={selectedCollection}
            subjectsArray={subjectsArray}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedCollection(null);
            }}
          />
        )}
      </Modal>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => {
          setShowExportModal(false);
          setSelectedCollection(null);
        }}
        collection={selectedCollection}
        allCollections={selectedCollection ? null : collections}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
};

export default CollectionManager;
