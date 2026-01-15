/**
 * Export Service - Handles exporting data in multiple formats
 * Supports JSON, Markdown, HTML, and CSV
 */
import { saveAs } from 'file-saver';
import storageService from './storageService';

class ExportService {
  /**
   * Export collection to JSON
   */
  collectionToJSON(collection) {
    return JSON.stringify(collection, null, 2);
  }

  /**
   * Export collection to Markdown
   */
  collectionToMarkdown(collection) {
    let md = `# ${collection.name}\n\n`;
    
    if (collection.description) {
      md += `${collection.description}\n\n`;
    }
    
    md += `> Created: ${new Date(collection.createdAt).toLocaleDateString()}\n`;
    md += `> Last Updated: ${new Date(collection.updatedAt).toLocaleDateString()}\n\n`;
    
    md += `## Lists (${collection.lists.length})\n\n`;
    
    // Group by category
    const byCategory = {};
    collection.lists.forEach(list => {
      const cate = list.cate || 'Uncategorized';
      if (!byCategory[cate]) byCategory[cate] = [];
      byCategory[cate].push(list);
    });
    
    Object.entries(byCategory).forEach(([category, lists]) => {
      md += `### ${category}\n\n`;
      lists.forEach(list => {
        md += `- [${list.name}](https://github.com/${list.repo})\n`;
      });
      md += '\n';
    });
    
    return md;
  }

  /**
   * Export collection to HTML
   */
  collectionToHTML(collection) {
    const listItems = collection.lists.map(list => 
      `<li><a href="https://github.com/${list.repo}" target="_blank">${list.name}</a> <small>(${list.cate || 'Uncategorized'})</small></li>`
    ).join('\n        ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${collection.name} - Awesome Collection</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .collection {
            background: white;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        .description {
            color: #666;
            font-style: italic;
            margin-bottom: 20px;
        }
        .meta {
            color: #999;
            font-size: 0.9em;
            margin-bottom: 20px;
        }
        ul {
            list-style-type: none;
            padding: 0;
        }
        li {
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        li:hover {
            background: #f9f9f9;
        }
        a {
            color: #3498db;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        small {
            color: #999;
        }
    </style>
</head>
<body>
    <div class="collection">
        <h1>${collection.name}</h1>
        ${collection.description ? `<p class="description">${collection.description}</p>` : ''}
        <p class="meta">
            Created: ${new Date(collection.createdAt).toLocaleDateString()} | 
            Updated: ${new Date(collection.updatedAt).toLocaleDateString()} |
            ${collection.lists.length} lists
        </p>
        <h2>Lists</h2>
        <ul>
        ${listItems}
        </ul>
    </div>
</body>
</html>`;
  }

  /**
   * Export collection to CSV
   */
  collectionToCSV(collection) {
    const headers = ['Name', 'Repository', 'Category', 'GitHub URL', 'Added At'];
    const rows = collection.lists.map(list => [
      `"${list.name.replace(/"/g, '""')}"`,
      `"${list.repo}"`,
      `"${list.cate || ''}"`,
      `"https://github.com/${list.repo}"`,
      `"${list.addedAt || ''}"`,
    ]);
    
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Export multiple collections
   */
  collectionsToJSON(collections) {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      count: collections.length,
      collections,
    }, null, 2);
  }

  /**
   * Export multiple collections to Markdown
   */
  collectionsToMarkdown(collections) {
    let md = `# My Awesome Collections\n\n`;
    md += `> Exported: ${new Date().toLocaleDateString()}\n`;
    md += `> Total Collections: ${collections.length}\n\n`;
    md += `---\n\n`;
    
    collections.forEach((collection, index) => {
      if (index > 0) md += '\n---\n\n';
      md += this.collectionToMarkdown(collection);
    });
    
    return md;
  }

  /**
   * Export all user data
   */
  exportAllData() {
    return JSON.stringify(storageService.exportAllData(), null, 2);
  }

  /**
   * Export preferences only
   */
  exportPreferences() {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      preferences: storageService.getPreferences(),
      listConfig: storageService.getListConfig(),
      aiSettings: { ...storageService.getAISettings(), apiKey: '' }, // Remove API key for security
    }, null, 2);
  }

  /**
   * Download file with given content
   */
  downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    saveAs(blob, filename);
  }

  /**
   * Export and download collection
   */
  downloadCollection(collection, format = 'json') {
    const safeName = collection.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    
    switch (format.toLowerCase()) {
      case 'json':
        this.downloadFile(
          this.collectionToJSON(collection),
          `${safeName}.json`,
          'application/json'
        );
        break;
      case 'markdown':
      case 'md':
        this.downloadFile(
          this.collectionToMarkdown(collection),
          `${safeName}.md`,
          'text/markdown'
        );
        break;
      case 'html':
        this.downloadFile(
          this.collectionToHTML(collection),
          `${safeName}.html`,
          'text/html'
        );
        break;
      case 'csv':
        this.downloadFile(
          this.collectionToCSV(collection),
          `${safeName}.csv`,
          'text/csv'
        );
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Export and download all collections
   */
  downloadAllCollections(collections, format = 'json') {
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (format.toLowerCase()) {
      case 'json':
        this.downloadFile(
          this.collectionsToJSON(collections),
          `awesome-collections-${timestamp}.json`,
          'application/json'
        );
        break;
      case 'markdown':
      case 'md':
        this.downloadFile(
          this.collectionsToMarkdown(collections),
          `awesome-collections-${timestamp}.md`,
          'text/markdown'
        );
        break;
      default:
        throw new Error(`Unsupported format for multiple collections: ${format}`);
    }
  }

  /**
   * Export and download all user data
   */
  downloadAllData() {
    const timestamp = new Date().toISOString().split('T')[0];
    this.downloadFile(
      this.exportAllData(),
      `awesome-search-backup-${timestamp}.json`,
      'application/json'
    );
  }
}

// Export singleton instance
const exportService = new ExportService();
export default exportService;
