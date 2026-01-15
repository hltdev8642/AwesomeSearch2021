/**
 * AIRecommendations - Display AI-generated recommendations
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import aiService from '../../services/aiService';
import storageService from '../../services/storageService';
import { Button } from '../UI';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, 
  faLightbulb, 
  faExternalLinkAlt,
  faPlus,
  faSpinner 
} from '@fortawesome/free-solid-svg-icons';
import classes from './AIRecommendations.module.css';

const AIRecommendations = ({ query, subjectsArray = [], onAddToCollection }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const aiSettings = storageService.getAISettings();
  const isAIConfigured = aiSettings.enabled && aiSettings.apiKey;

  const getRecommendations = async () => {
    if (!query.trim()) {
      setError('Please enter a search query first');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      let results;
      if (isAIConfigured) {
        results = await aiService.getRecommendations(query, subjectsArray);
      } else {
        // Use local fallback
        results = aiService.getLocalRecommendations(query, subjectsArray);
      }
      setRecommendations(results);
    } catch (err) {
      console.error('AI Recommendation error:', err);
      // Fall back to local recommendations
      const localResults = aiService.getLocalRecommendations(query, subjectsArray);
      setRecommendations(localResults);
      if (localResults.length === 0) {
        setError('No recommendations found. Try a different search term.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.AIRecommendations}>
      <div className={classes.Header}>
        <div className={classes.Title}>
          <FontAwesomeIcon icon={faRobot} className={classes.Icon} />
          <h3>AI Recommendations</h3>
        </div>
        <Button
          variant="ghost"
          size="small"
          onClick={getRecommendations}
          loading={loading}
          disabled={!query.trim()}
        >
          <FontAwesomeIcon icon={faLightbulb} />
          {hasSearched ? 'Refresh' : 'Get Suggestions'}
        </Button>
      </div>

      {!isAIConfigured && (
        <div className={classes.Notice}>
          <FontAwesomeIcon icon={faRobot} />
          Using local search. Configure AI in settings for smarter recommendations.
        </div>
      )}

      {loading && (
        <div className={classes.Loading}>
          <FontAwesomeIcon icon={faSpinner} spin />
          Finding relevant lists...
        </div>
      )}

      {error && (
        <div className={classes.Error}>
          {error}
        </div>
      )}

      {!loading && recommendations.length > 0 && (
        <div className={classes.Results}>
          {recommendations.map((rec, idx) => (
            <div key={rec.repo || idx} className={classes.Recommendation}>
              <div className={classes.RecInfo}>
                <Link to={`/${rec.repo}`} className={classes.RecName}>
                  {rec.name}
                </Link>
                {rec.reason && (
                  <p className={classes.RecReason}>{rec.reason}</p>
                )}
              </div>
              <div className={classes.RecActions}>
                <a
                  href={`https://github.com/${rec.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes.ExternalLink}
                  title="View on GitHub"
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} />
                </a>
                {onAddToCollection && (
                  <button
                    className={classes.AddButton}
                    onClick={() => onAddToCollection(rec)}
                    title="Add to collection"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasSearched && !loading && recommendations.length === 0 && !error && (
        <div className={classes.NoResults}>
          No recommendations found for "{query}".
        </div>
      )}
    </div>
  );
};

export default AIRecommendations;
