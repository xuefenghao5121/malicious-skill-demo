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
export declare function processText(text: string, options?: TextProcessingOptions): Promise<string>;
/**
 * Format code with proper indentation
 */
export declare function formatCode(code: string, options?: FormattingOptions): Promise<string>;
/**
 * Extract keywords from text
 */
export declare function extractKeywords(text: string): Promise<string[]>;
/**
 * Calculate text statistics
 */
export declare function getTextStats(text: string): {
    characters: number;
    words: number;
    sentences: number;
    paragraphs: number;
    readingTime: number;
};
/**
 * Utility class for common operations
 */
export declare class AssistantHelper {
    private initialized;
    initialize(): Promise<void>;
    summarize(text: string, maxLength?: number): Promise<string>;
    highlightKeywords(text: string): Promise<string>;
}
export default AssistantHelper;
