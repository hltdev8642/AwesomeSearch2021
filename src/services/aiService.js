/**
 * AI Service - Abstraction layer for AI-powered recommendations and insights
 * Supports multiple providers (OpenAI, Anthropic, local fallback)
 */
import storageService from './storageService';

class AIService {
  constructor() {
    this.settings = storageService.getAISettings();
  }

  /**
   * Reload settings from storage
   */
  reloadSettings() {
    this.settings = storageService.getAISettings();
  }

  /**
   * Check if AI is properly configured
   */
  isConfigured() {
    return this.settings.enabled && this.settings.apiKey;
  }

  /**
   * Make API call to OpenAI
   */
  async callOpenAI(messages, options = {}) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.settings.apiKey}`,
      },
      body: JSON.stringify({
        model: this.settings.model || 'gpt-3.5-turbo',
        messages,
        max_tokens: options.maxTokens || this.settings.maxTokens || 1000,
        temperature: options.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Make API call to Anthropic
   */
  async callAnthropic(messages, options = {}) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.settings.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.settings.model || 'claude-3-haiku-20240307',
        max_tokens: options.maxTokens || this.settings.maxTokens || 1000,
        messages: messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        system: messages.find(m => m.role === 'system')?.content || '',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API error');
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }

  /**
   * Unified API call method
   */
  async chat(messages, options = {}) {
    this.reloadSettings();
    
    if (!this.isConfigured()) {
      throw new Error('AI is not configured. Please add your API key in settings.');
    }

    switch (this.settings.provider) {
      case 'openai':
        return this.callOpenAI(messages, options);
      case 'anthropic':
        return this.callAnthropic(messages, options);
      default:
        throw new Error(`Unknown AI provider: ${this.settings.provider}`);
    }
  }

  /**
   * Generate list recommendations based on user query
   */
  async getRecommendations(query, availableLists, options = {}) {
    const systemPrompt = `You are an expert curator of awesome-lists on GitHub. Your job is to recommend the most relevant awesome-lists based on user queries.

Available lists (JSON format):
${JSON.stringify(availableLists.slice(0, 100).map(l => ({ name: l.name, repo: l.repo, cate: l.cate })), null, 2)}

Respond with a JSON array of recommended lists with reasoning. Format:
[
  {
    "repo": "user/repo-name",
    "name": "List Name",
    "reason": "Brief explanation of why this is relevant"
  }
]

Only recommend lists that are in the provided list. Return 3-7 recommendations.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Find awesome-lists related to: ${query}` },
    ];

    try {
      const response = await this.chat(messages, options);
      // Parse JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('AI Recommendation error:', error);
      throw error;
    }
  }

  /**
   * Generate a collection based on user interests
   */
  async generateCollection(interests, availableLists, options = {}) {
    const systemPrompt = `You are an expert curator creating personalized collections of awesome-lists.

Available lists (JSON format):
${JSON.stringify(availableLists.slice(0, 100).map(l => ({ name: l.name, repo: l.repo, cate: l.cate })), null, 2)}

Based on the user's interests, create a themed collection. Respond with JSON:
{
  "name": "Collection name (creative and descriptive)",
  "description": "Brief description of the collection theme",
  "lists": [
    { "repo": "user/repo", "name": "List Name", "cate": "Category" }
  ]
}

Select 5-10 highly relevant lists.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Create a collection for someone interested in: ${interests}` },
    ];

    try {
      const response = await this.chat(messages, options);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.error('AI Collection generation error:', error);
      throw error;
    }
  }

  /**
   * Analyze relationships between lists
   */
  async analyzeListRelationships(lists, options = {}) {
    const systemPrompt = `You are an expert at analyzing awesome-lists and finding connections between them.

Given these lists:
${JSON.stringify(lists.map(l => ({ name: l.name, repo: l.repo, cate: l.cate })), null, 2)}

Analyze their relationships and provide insights. Respond with JSON:
{
  "insights": [
    { "type": "connection", "description": "Description of connection", "lists": ["repo1", "repo2"] },
    { "type": "theme", "description": "Common theme identified", "lists": ["repo1", "repo2", "repo3"] }
  ],
  "summary": "Overall summary of how these lists relate"
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Analyze the relationships between these lists.' },
    ];

    try {
      const response = await this.chat(messages, options);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.error('AI Analysis error:', error);
      throw error;
    }
  }

  /**
   * Enhance search query with semantic understanding
   */
  async enhanceSearch(query, options = {}) {
    const systemPrompt = `You are a search query enhancer. Given a user's search query, suggest related terms and synonyms that might help find relevant awesome-lists.

Respond with JSON:
{
  "originalQuery": "the input query",
  "enhancedTerms": ["term1", "term2", "term3"],
  "relatedTopics": ["topic1", "topic2"],
  "suggestion": "A refined search suggestion"
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Enhance this search: ${query}` },
    ];

    try {
      const response = await this.chat(messages, options);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { originalQuery: query, enhancedTerms: [], relatedTopics: [], suggestion: query };
    } catch (error) {
      console.error('AI Search enhancement error:', error);
      return { originalQuery: query, enhancedTerms: [], relatedTopics: [], suggestion: query };
    }
  }

  /**
   * Local fallback for basic recommendations (no API needed)
   */
  getLocalRecommendations(query, availableLists) {
    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/);
    
    // Score each list based on keyword matching
    const scored = availableLists.map(list => {
      let score = 0;
      const nameLower = list.name.toLowerCase();
      const cateLower = (list.cate || '').toLowerCase();
      
      words.forEach(word => {
        if (nameLower.includes(word)) score += 10;
        if (cateLower.includes(word)) score += 5;
      });
      
      return { ...list, score };
    });
    
    // Return top matches
    return scored
      .filter(l => l.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(l => ({
        repo: l.repo,
        name: l.name,
        reason: `Matches your search for "${query}"`,
      }));
  }
}

// Export singleton instance
const aiService = new AIService();
export default aiService;
