/**
 * GitHub Service - API integration for searching and fetching awesome-lists from GitHub
 */
import axios from 'axios';

const GITHUB_API_BASE = 'https://api.github.com';

class GitHubService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get cached data if still valid
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cache data
   */
  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Search for awesome-lists on GitHub using the awesome topic
   */
  async searchAwesomeLists(query = '', options = {}) {
    const {
      page = 1,
      perPage = 30,
      sort = 'stars',
      order = 'desc',
    } = options;

    // Build search query
    let searchQuery = 'topic:awesome';
    if (query) {
      searchQuery += ` ${query}`;
    }

    const cacheKey = `search:${searchQuery}:${page}:${perPage}:${sort}:${order}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${GITHUB_API_BASE}/search/repositories`, {
        params: {
          q: searchQuery,
          sort,
          order,
          page,
          per_page: perPage,
        },
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      const result = {
        items: response.data.items.map(this.transformRepoData),
        totalCount: response.data.total_count,
        hasMore: response.data.total_count > page * perPage,
        page,
        perPage,
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Get repository details
   */
  async getRepoDetails(owner, repo) {
    const cacheKey = `repo:${owner}/${repo}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      const result = this.transformRepoData(response.data);
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Get repository README content
   */
  async getReadme(owner, repo) {
    const cacheKey = `readme:${owner}/${repo}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`, {
        headers: {
          'Accept': 'application/vnd.github.v3.html+json',
        },
      });

      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Get trending awesome-lists
   */
  async getTrendingLists(options = {}) {
    const { page = 1, perPage = 20 } = options;
    
    // Get recently updated awesome lists with high stars
    return this.searchAwesomeLists('', {
      page,
      perPage,
      sort: 'updated',
      order: 'desc',
    });
  }

  /**
   * Get popular awesome-lists by stars
   */
  async getPopularLists(options = {}) {
    const { page = 1, perPage = 20 } = options;
    
    return this.searchAwesomeLists('', {
      page,
      perPage,
      sort: 'stars',
      order: 'desc',
    });
  }

  /**
   * Search for specific awesome-list by name
   */
  async findAwesomeList(name) {
    return this.searchAwesomeLists(`awesome-${name} in:name`, {
      perPage: 10,
      sort: 'stars',
    });
  }

  /**
   * Check if a repository is a valid awesome-list
   */
  async validateAwesomeList(owner, repo) {
    try {
      const repoDetails = await this.getRepoDetails(owner, repo);
      
      // Check if it has the awesome topic
      const hasAwesomeTopic = repoDetails.topics?.includes('awesome') ||
                              repoDetails.name.toLowerCase().includes('awesome');
      
      // Check if it has a README
      const hasReadme = repoDetails.hasReadme;
      
      return {
        isValid: hasAwesomeTopic && hasReadme,
        hasAwesomeTopic,
        hasReadme,
        repo: repoDetails,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Transform raw GitHub repo data to our format
   */
  transformRepoData(repo) {
    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      repo: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.watchers_count,
      language: repo.language,
      topics: repo.topics || [],
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      owner: {
        login: repo.owner.login,
        avatarUrl: repo.owner.avatar_url,
        url: repo.owner.html_url,
      },
      hasReadme: true, // Assume true, actual check requires separate API call
    };
  }

  /**
   * Handle API errors
   */
  handleApiError(error) {
    if (error.response) {
      switch (error.response.status) {
        case 403:
          console.error('GitHub API rate limit exceeded');
          break;
        case 404:
          console.error('Repository not found');
          break;
        case 422:
          console.error('Validation failed');
          break;
        default:
          console.error(`GitHub API error: ${error.response.status}`);
      }
    } else if (error.request) {
      console.error('Network error - no response received');
    } else {
      console.error('Error setting up request:', error.message);
    }
  }

  /**
   * Get rate limit status
   */
  async getRateLimit() {
    try {
      const response = await axios.get(`${GITHUB_API_BASE}/rate_limit`);
      return {
        limit: response.data.resources.core.limit,
        remaining: response.data.resources.core.remaining,
        reset: new Date(response.data.resources.core.reset * 1000),
      };
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
const githubService = new GitHubService();
export default githubService;
