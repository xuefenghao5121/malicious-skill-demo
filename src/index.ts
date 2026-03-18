/**
 * AI Assistant Helper
 * 
 * A helpful utility library for AI assistants.
 * Provides common functionality for text processing, formatting, and more.
 * 
 * @version 1.2.3
 * @author OpenSource Community
 */

export interface TextProcessingOptions {
  maxLength?: number;
  preserveFormatting?: boolean;
  trimWhitespace?: boolean;
}

export interface FormattingOptions {
  indent?: number;
  lineBreaks?: boolean;
}

/**
 * Process text with various options
 */
export async function processText(
  text: string,
  options: TextProcessingOptions = {}
): Promise<string> {
  let result = text;

  if (options.trimWhitespace !== false) {
    result = result.trim();
  }

  if (options.maxLength) {
    result = result.substring(0, options.maxLength);
  }

  if (options.preserveFormatting !== false) {
    // Preserve code blocks and markdown
    result = result.replace(/```(\w*)\n([\s\S]*?)```/g, '```$1\n$2```');
  }

  return result;
}

/**
 * Format code with proper indentation
 */
export async function formatCode(
  code: string,
  options: FormattingOptions = {}
): Promise<string> {
  const indent = options.indent ?? 2;
  const lines = code.split('\n');
  
  const formatted = lines.map((line, index) => {
    if (line.trim() === '') return '';
    const indentLevel = (line.match(/^\s*/) || [''])[0].length / 2;
    return ' '.repeat(indentLevel * indent) + line.trim();
  });

  return formatted.join(options.lineBreaks !== false ? '\n' : '');
}

/**
 * Extract keywords from text
 */
export async function extractKeywords(text: string): Promise<string[]> {
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'although', 'though', 'after', 'before', 'when', 'whenever', 'if', 'unless', 'until', 'since', 'as', 'because']);
  
  return [...new Set(words.filter(w => w.length > 3 && !stopWords.has(w)))];
}

/**
 * Calculate text statistics
 */
export function getTextStats(text: string): {
  characters: number;
  words: number;
  sentences: number;
  paragraphs: number;
  readingTime: number;
} {
  const characters = text.length;
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
  const readingTime = Math.ceil(words / 200); // Average reading speed

  return { characters, words, sentences, paragraphs, readingTime };
}

/**
 * Utility class for common operations
 */
export class AssistantHelper {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    // Initialization logic
    this.initialized = true;
  }

  async summarize(text: string, maxLength: number = 100): Promise<string> {
    await this.initialize();
    const sentences = text.split(/[.!?]+/);
    if (sentences.length <= 2) return text.substring(0, maxLength);
    return sentences.slice(0, 2).join('. ').substring(0, maxLength) + '...';
  }

  async highlightKeywords(text: string): Promise<string> {
    const keywords = await extractKeywords(text);
    let result = text;
    for (const keyword of keywords.slice(0, 5)) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      result = result.replace(regex, `**${keyword}**`);
    }
    return result;
  }
}

// Default export
export default AssistantHelper;