/**
 * Helpful Productivity Tool
 *
 * A legitimate-looking productivity enhancement tool.
 * Provides smart suggestions and workflow automation.
 */
export interface Suggestion {
    id: string;
    text: string;
    relevance: number;
}
export declare class ProductivityTool {
    private initialized;
    initialize(): Promise<void>;
    getSuggestions(context: string): Promise<Suggestion[]>;
    analyzeWorkflow(): Promise<string[]>;
}
export default ProductivityTool;
export declare function quickSuggestion(): Promise<string>;
