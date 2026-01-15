/**
 * ListManager - Manage awesome-list sources with enable/disable toggles
 */
import React, { useState, useMemo } from 'react';
import { useListManagement } from '../../context/ListManagementContext';
import { Toggle, Button, Card, Tabs } from '../UI';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import githubService from '../../services/githubService';
import { 
  faList, 
  faStar,
  faPlus,
  faSearch,
  faSync,
  faCheck,
  faTimes,
  faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';
import classes from './ListManager.module.css';

const ListManager = ({ allLists = [], onRefresh }) => {
  const { 
    state, 
    toggleList, 
    addCustomList, 
    removeCustomList,
    toggleStar,
    enableAll,
    disableAll
  } = useListManagement();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newListUrl, setNewListUrl] = useState('');

  // Use safe fallbacks from context and memoize to keep stable references
  const disabled = React.useMemo(() => (state?.disabledLists || []), [state?.disabledLists]);
  const favorites = React.useMemo(() => (state?.favoritesList || []), [state?.favoritesList]);
  const customLists = React.useMemo(() => (state?.customLists || []), [state?.customLists]);
  const allListsSafe = React.useMemo(() => (Array.isArray(allLists) ? allLists : []), [allLists]);

  const enabledCount = allListsSafe.filter(l => {
    const id = l.repo || `${l.user}/${l.name}`;
    return !disabled.includes(id);
  }).length;

  const starredCount = favorites.length;
  const customCount = customLists.length;

  const tabs = [
    { id: 'all', label: 'All Lists', badge: allListsSafe.length },
    { id: 'enabled', label: 'Enabled', badge: enabledCount },
    { id: 'starred', label: 'Starred', badge: starredCount },
    { id: 'custom', label: 'Custom', badge: customCount }
  ];

  const filteredLists = useMemo(() => {
    // Map base lists and apply flags
    let lists = allListsSafe.map(list => {
      const id = list.repo || `${list.user}/${list.name}`;
      return {
        ...list,
        isEnabled: !disabled.includes(id),
        isStarred: favorites.includes(id),
        isCustom: false,
      };
    });

    // Filter by tab
    switch (activeTab) {
      case 'enabled':
        lists = lists.filter(l => l.isEnabled);
        break;
      case 'starred':
        lists = lists.filter(l => l.isStarred);
        break;
      case 'custom':
        // Normalize custom lists from context
        lists = customLists.map(l => ({
          ...l,
          isCustom: true,
          isEnabled: !disabled.includes(l.repo),
          isStarred: favorites.includes(l.repo),
        }));
        break;
      default:
        break;
    }

    // Filter by search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      lists = lists.filter(l => 
        (l.name && l.name.toLowerCase().includes(term)) ||
        (l.repo && l.repo.toLowerCase().includes(term)) ||
        (l.description && l.description.toLowerCase().includes(term))
      );
    }

    return lists;
  }, [allListsSafe, customLists, disabled, favorites, activeTab, searchTerm]);

  const handleAddCustomList = () => {
    if (!newListUrl.trim()) return;

    // Parse GitHub URL or owner/repo format
    let repo = newListUrl.trim();
    if (repo.includes('github.com')) {
      const match = repo.match(/github\.com\/([^/]+\/[^/]+)/);
      if (match) repo = match[1];
    }

    if (repo.includes('/')) {
      addCustomList({
        repo,
        name: repo.split('/')[1],
        user: repo.split('/')[0],
        isCustom: true
      });
      setNewListUrl('');
      setShowAddForm(false);
    }
  };

  const getListId = (list) => list.repo || `${list.user}/${list.name}`;

  // GitHub search state
  const [ghQuery, setGhQuery] = useState('');
  const [ghResults, setGhResults] = useState([]);
  const [ghLoading, setGhLoading] = useState(false);
  const [ghError, setGhError] = useState(null);
  const [ghPage, setGhPage] = useState(1);
  const [ghHasMore, setGhHasMore] = useState(false);

  // Debounced search effect
  React.useEffect(() => {
    if (!ghQuery.trim()) {
      setGhResults([]);
      setGhError(null);
      return;
    }
    const t = setTimeout(() => performGhSearch(ghPage), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ghQuery, ghPage]);

  const performGhSearch = async (page = 1) => {
    setGhLoading(true);
    setGhError(null);
    try {
      const res = await githubService.searchAwesomeLists(ghQuery, { page, perPage: 10 });
      setGhResults(res.items || []);
      setGhHasMore(res.hasMore || false);
      setGhPage(page);
    } catch (err) {
      setGhError('GitHub search failed. Try again later.');
    } finally {
      setGhLoading(false);
    }
  };

  const addGhAsCustom = (item) => {
    if (!item || !item.repo) return;
    const exists = (customLists || []).some(l => l.repo === item.repo);
    if (exists) {
      setGhError('Already added');
      setTimeout(() => setGhError(null), 1500);
      return;
    }
    addCustomList({ repo: item.repo, name: item.name, user: item.fullName.split('/')[0], description: item.description, isCustom: true });
  };

  return (
    <div className={classes.ListManager}>
      <div className={classes.Header}>
        <h2>
          <FontAwesomeIcon icon={faList} />
          List Manager
        </h2>
        <div className={classes.HeaderActions}>
          <Button variant="ghost" size="small" onClick={() => enableAll(allLists)}>
            <FontAwesomeIcon icon={faCheck} /> Enable All
          </Button>
          <Button variant="ghost" size="small" onClick={disableAll}>
            <FontAwesomeIcon icon={faTimes} /> Disable All
          </Button>
          {onRefresh && (
            <Button variant="ghost" size="small" onClick={onRefresh}>
              <FontAwesomeIcon icon={faSync} /> Refresh
            </Button>
          )}
        </div>
      </div>

      <div className={classes.Controls}>
        <div className={classes.SearchBox}>
          <FontAwesomeIcon icon={faSearch} className={classes.SearchIcon} />
          <input
            type="text"
            placeholder="Search lists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={classes.SearchInput}
          />
        </div>
        <Button size="small" onClick={() => setShowAddForm(!showAddForm)}>
          <FontAwesomeIcon icon={faPlus} /> Add Custom
        </Button>
      </div>

      {showAddForm && (
        <Card className={classes.AddForm}>
          <input
            type="text"
            placeholder="Enter GitHub URL or owner/repo"
            value={newListUrl}
            onChange={(e) => setNewListUrl(e.target.value)}
            className={classes.AddInput}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomList()}
          />
          <Button size="small" onClick={handleAddCustomList}>
            Add
          </Button>
        </Card>
      )}

      {/* GitHub topic search for awesome lists */}
      <div className={classes.GitHubSearch}>
        <div className={classes.GitHubHeader}>
          <h3>Find Awesome Lists on GitHub</h3>
          <div className={classes.GitHubControls}>
            <input
              type="text"
              placeholder="Search GitHub (topic:awesome)"
              value={ghQuery}
              onChange={(e) => { setGhQuery(e.target.value); setGhPage(1); }}
              className={classes.GitHubInput}
            />
            <Button size="small" onClick={() => performGhSearch(1)}>
              Search
            </Button>
          </div>
        </div>

        {ghLoading && <div className={classes.GhLoading}>Searching GitHub…</div>}
        {ghError && <div className={classes.GhError}>{ghError}</div>}

        {ghResults.length > 0 && (
          <div className={classes.GhResults}>
            {ghResults.map(item => (
              <div key={item.id} className={classes.GhRow}>
                <div className={classes.GhInfo}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">{item.fullName}</a>
                  <div className={classes.GhDesc}>{item.description}</div>
                </div>
                <div className={classes.GhActions}>
                  <Button size="small" variant="secondary" onClick={() => addGhAsCustom(item)}>
                    Add
                  </Button>
                </div>
              </div>
            ))}

            <div className={classes.GhPager}>
              <Button size="small" onClick={() => performGhSearch(Math.max(1, ghPage - 1))} disabled={ghPage === 1}>Prev</Button>
              <span>Page {ghPage}</span>
              <Button size="small" onClick={() => performGhSearch(ghPage + 1)} disabled={!ghHasMore}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className={classes.ListGrid}>
        {filteredLists.map((list) => {
          const listId = getListId(list);
          return (
            <div key={listId} className={classes.ListItem}>
              <div className={classes.ListInfo}>
                <div className={classes.ListName}>
                  {list.name || listId}
                  {list.isCustom && <span className={classes.CustomBadge}>Custom</span>}
                </div>
                {list.description && (
                  <p className={classes.ListDesc}>{list.description}</p>
                )}
              </div>
              <div className={classes.ListActions}>
                <button
                  className={`${classes.StarButton} ${list.isStarred ? classes.Starred : ''}`}
                  onClick={() => toggleStar(listId)}
                  title={list.isStarred ? 'Unstar' : 'Star'}
                >
                  <FontAwesomeIcon icon={faStar} />
                </button>
                <a
                  href={`https://github.com/${listId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes.ExternalLink}
                  title="View on GitHub"
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} />
                </a>
                <Toggle
                  checked={list.isEnabled}
                  onChange={() => toggleList(listId)}
                  size="small"
                />
                {list.isCustom && (
                  <button
                    className={classes.RemoveButton}
                    onClick={() => removeCustomList(listId)}
                    title="Remove"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredLists.length === 0 && (
        <div className={classes.Empty}>
          {searchTerm ? `No lists matching "${searchTerm}"` : 'No lists in this category'}
        </div>
      )}
    </div>
  );
};

export default ListManager;
