/**
 * Import Service - Handles importing data from various formats
 * Supports JSON, Markdown, and CSV
 */
import { createCollection, createListItem } from '../models/Collection';
import storageService from './storageService';

class ImportService {
  /**
   * Parse JSON import
   */
  parseJSON(content) {
    try {
      const data = JSON.parse(content);
      return { success: true, data, format: 'json' };
    } catch (error) {
      return { success: false, error: `Invalid JSON: ${error.message}` };
    }
  }

  /**
   * Parse CSV import
   */
  parseCSV(content) {
    try {
      const lines = content.trim().split('\n');
      if (lines.length < 2) {
        return { success: false, error: 'CSV must have header and at least one data row' };
      }

      const headers = this.parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }

      return { success: true, data, format: 'csv', headers };
    } catch (error) {
      return { success: false, error: `CSV parsing error: ${error.message}` };
    }
  }

  /**
   * Parse a single CSV line handling quotes
   */
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return values;
  }

  /**
   * Parse Markdown import (basic parsing)
   */
  parseMarkdown(content) {
    try {
      const lists = [];
      const lines = content.split('\n');
      
      // Extract title from first heading
      let title = 'Imported Collection';
      let description = '';
      let currentCategory = '';

      for (const line of lines) {
        // Match main title
        if (line.match(/^# /)) {
          title = line.replace(/^# /, '').trim();
        }
        // Match category (h2 or h3)
        else if (line.match(/^#{2,3} /)) {
          currentCategory = line.replace(/^#{2,3} /, '').trim();
        }
        // Match list items with links
        else if (line.match(/^- \[.+\]\(.+\)/)) {
          const match = line.match(/^- \[(.+)\]\((.+)\)/);
          if (match) {
            const name = match[1];
            const url = match[2];
            // Extract repo from GitHub URL
            const repoMatch = url.match(/github\.com\/([^/]+\/[^/]+)/);
            if (repoMatch) {
              lists.push({
                name,
                repo: repoMatch[1],
                cate: currentCategory,
              });
            }
          }
        }
      }

      return {
        success: true,
        data: { title, description, lists },
        format: 'markdown',
      };
    } catch (error) {
      return { success: false, error: `Markdown parsing error: ${error.message}` };
    }
  }

  /**
   * Detect file format from content
   */
  detectFormat(content, filename = '') {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    if (ext === 'json' || content.trim().startsWith('{') || content.trim().startsWith('[')) {
      return 'json';
    }
    if (ext === 'csv' || (content.includes(',') && content.split('\n')[0].split(',').length > 1)) {
      return 'csv';
    }
    if (ext === 'md' || content.includes('# ') || content.includes('- [')) {
      return 'markdown';
    }
    
    return 'unknown';
  }

  /**
   * Parse content based on format
   */
  parse(content, format = null, filename = '') {
    const detectedFormat = format || this.detectFormat(content, filename);
    
    switch (detectedFormat) {
      case 'json':
        return this.parseJSON(content);
      case 'csv':
        return this.parseCSV(content);
      case 'markdown':
      case 'md':
        return this.parseMarkdown(content);
      default:
        return { success: false, error: `Unknown format: ${detectedFormat}` };
    }
  }

  /**
   * Validate imported collection data
   */
  validateCollectionData(data) {
    const errors = [];
    
    if (!data) {
      errors.push('No data provided');
      return { valid: false, errors };
    }

    // Check for single collection
    if (data.name && data.lists) {
      if (!data.name.trim()) errors.push('Collection name is required');
      if (!Array.isArray(data.lists)) errors.push('Lists must be an array');
      return { valid: errors.length === 0, errors, type: 'collection' };
    }

    // Check for multiple collections
    if (data.collections && Array.isArray(data.collections)) {
      data.collections.forEach((c, i) => {
        if (!c.name?.trim()) errors.push(`Collection ${i + 1}: name is required`);
        if (!Array.isArray(c.lists)) errors.push(`Collection ${i + 1}: lists must be an array`);
      });
      return { valid: errors.length === 0, errors, type: 'collections' };
    }

    // Check for full backup
    if (data.version && (data.collections || data.preferences)) {
      return { valid: true, errors: [], type: 'backup' };
    }

    errors.push('Unrecognized data structure');
    return { valid: false, errors };
  }

  /**
   * Convert CSV data to collection
   */
  csvToCollection(csvData, name = 'Imported Collection') {
    const lists = csvData.map(row => ({
      name: row.name || row.title || row.repository || 'Unknown',
      repo: row.repository || row.repo || (row.url?.match(/github\.com\/([^/]+\/[^/]+)/) && row.url.match(/github\.com\/([^/]+\/[^/]+)/)[1]) || '',
      cate: row.category || row.cate || 'Imported',
      addedAt: new Date().toISOString(),
    })).filter(l => l.repo);

    return createCollection({ name, lists });
  }

  /**
   * Convert Markdown data to collection
   */
  markdownToCollection(mdData) {
    return createCollection({
      name: mdData.title,
      description: mdData.description,
      lists: mdData.lists.map(l => createListItem(l)),
    });
  }

  /**
   * Import collection from parsed data
   */
  importCollection(parsedData) {
    if (!parsedData.success) {
      return { success: false, error: parsedData.error };
    }

    const { data, format } = parsedData;

    try {
      let collection;

      switch (format) {
        case 'json':
          // Check if it's a collection or list of collections
          if (data.name && data.lists) {
            collection = {
              ...createCollection({ name: data.name, description: data.description }),
              ...data,
              id: data.id || createCollection({}).id,
            };
          } else if (data.collections) {
            // Multiple collections - return array
            return {
              success: true,
              collections: data.collections.map(c => ({
                ...createCollection({ name: c.name, description: c.description }),
                ...c,
              })),
            };
          } else {
            return { success: false, error: 'Invalid JSON structure for collection' };
          }
          break;

        case 'csv':
          collection = this.csvToCollection(data);
          break;

        case 'markdown':
          collection = this.markdownToCollection(data);
          break;

        default:
          return { success: false, error: `Cannot import from ${format} format` };
      }

      return { success: true, collection };
    } catch (error) {
      return { success: false, error: `Import error: ${error.message}` };
    }
  }

  /**
   * Import full backup
   */
  importBackup(content) {
    const parsed = this.parseJSON(content);
    if (!parsed.success) {
      return parsed;
    }

    const validation = this.validateCollectionData(parsed.data);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    if (validation.type !== 'backup') {
      return { success: false, error: 'Not a valid backup file' };
    }

    try {
      storageService.importAllData(parsed.data);
      return { success: true, message: 'Backup restored successfully' };
    } catch (error) {
      return { success: false, error: `Restore error: ${error.message}` };
    }
  }

  /**
   * Read file content
   */
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Import from file
   */
  async importFromFile(file) {
    try {
      const content = await this.readFile(file);
      const parsed = this.parse(content, null, file.name);
      return this.importCollection(parsed);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const importService = new ImportService();
export default importService;
