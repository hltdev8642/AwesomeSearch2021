/**
 * CollectionDetail - Detail view for a collection showing all lists
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCollections } from '../../context/CollectionsContext';
import { Button } from '../UI';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrash, 
  faExternalLinkAlt, 
  faSearch,
  faPlus 
} from '@fortawesome/free-solid-svg-icons';
import classes from './CollectionDetail.module.css';

const CollectionDetail = ({ collection, subjectsArray = [], onClose }) => {
  const { removeListFromCollection, addListToCollection } = useCollections();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddLists, setShowAddLists] = useState(false);

  const handleRemoveList = (repo) => {
    if (window.confirm('Remove this list from the collection?')) {
      removeListFromCollection(collection.id, repo);
    }
  };

  const handleAddList = (list) => {
    addListToCollection(collection.id, {
      repo: list.repo,
      name: list.name,
      cate: list.cate,
    });
  };

  const isListInCollection = (repo) => {
    return collection.lists.some(l => l.repo === repo);
  };

  // Filter available lists for adding
  const availableLists = subjectsArray.filter(list => 
    !isListInCollection(list.repo) &&
    (list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     list.cate?.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 20);

  return (
    <div className={classes.CollectionDetail}>
      {collection.description && (
        <p className={classes.Description}>{collection.description}</p>
      )}

      <div className={classes.Stats}>
        <span>{collection.lists.length} lists in this collection</span>
      </div>

      <div className={classes.Section}>
        <div className={classes.SectionHeader}>
          <h3>Lists</h3>
          <Button
            variant="ghost"
            size="small"
            icon={<FontAwesomeIcon icon={faPlus} />}
            onClick={() => setShowAddLists(!showAddLists)}
          >
            {showAddLists ? 'Hide Add Lists' : 'Add Lists'}
          </Button>
        </div>

        {showAddLists && (
          <div className={classes.AddListsPanel}>
            <div className={classes.SearchBar}>
              <FontAwesomeIcon icon={faSearch} className={classes.SearchIcon} />
              <input
                type="text"
                placeholder="Search lists to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={classes.SearchInput}
                autoFocus
              />
            </div>
            
            <div className={classes.AvailableLists}>
              {availableLists.length === 0 ? (
                <div className={classes.NoResults}>
                  {searchQuery ? 'No matching lists found' : 'All lists already in collection'}
                </div>
              ) : (
                availableLists.map(list => (
                  <div key={list.repo} className={classes.AvailableListItem}>
                    <div className={classes.ListInfo}>
                      <span className={classes.ListName}>{list.name}</span>
                      <span className={classes.ListCategory}>{list.cate}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="small"
                      icon={<FontAwesomeIcon icon={faPlus} />}
                      onClick={() => handleAddList(list)}
                    >
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {collection.lists.length === 0 ? (
          <div className={classes.EmptyLists}>
            <p>No lists in this collection yet.</p>
            <p>Click "Add Lists" above to start adding awesome-lists!</p>
          </div>
        ) : (
          <div className={classes.ListsGrid}>
            {collection.lists.map(list => (
              <div key={list.repo} className={classes.ListItem}>
                <div className={classes.ListInfo}>
                  <Link 
                    to={`/${list.repo}`} 
                    className={classes.ListName}
                    onClick={onClose}
                  >
                    {list.name}
                  </Link>
                  <span className={classes.ListCategory}>{list.cate}</span>
                </div>
                <div className={classes.ListActions}>
                  <a
                    href={`https://github.com/${list.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={classes.ExternalLink}
                    title="View on GitHub"
                  >
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                  </a>
                  <button
                    className={classes.RemoveButton}
                    onClick={() => handleRemoveList(list.repo)}
                    title="Remove from collection"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionDetail;
