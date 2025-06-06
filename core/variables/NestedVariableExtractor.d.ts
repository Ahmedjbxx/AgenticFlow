import { VariableDefinition } from './VariableRegistry';
export interface DynamicVariableDefinition extends VariableDefinition {
    path: string;
    fullPath: string;
    actualValue: any;
    isNested: true;
    sourceNodeId: string;
    parentPath?: string;
    depth: number;
    extractedAt: number;
}
export interface ExtractionOptions {
    maxDepth?: number;
    maxArrayItems?: number;
    maxPropertiesPerLevel?: number;
    maxValueSize?: number;
    maxTotalVariables?: number;
}
export declare class NestedVariableExtractor {
    private static readonly DEFAULT_OPTIONS;
    private options;
    private extractedCount;
    private visited;
    constructor(options?: ExtractionOptions);
    /**
     * Extract all nested variables from an object
     */
    extractVariables(obj: any, nodeId: string, prefix?: string): DynamicVariableDefinition[];
    /**
     * Core object flattening with dot notation paths
     */
    private flattenObject;
    /**
     * Handle array indexing with [0], [1], etc.
     */
    private handleArray;
    /**
     * Handle object properties with dot notation
     */
    private handleObject;
    /**
     * Create a property path handling special characters
     */
    private createPropertyPath;
    /**
     * Check if key needs bracket notation
     */
    private needsBracketNotation;
    /**
     * Sanitize key for safe path usage
     */
    private sanitizeKey;
    /**
     * Create a variable definition
     */
    private createVariable;
    /**
     * Infer TypeScript type from value
     */
    private inferType;
    /**
     * Get a preview value for display (truncated if large)
     */
    private getPreviewValue;
    /**
     * Check if value should be extracted
     */
    private shouldExtract;
    /**
     * Detect circular references
     */
    private detectCircularReference;
    /**
     * Sanitize a complete path for safety
     */
    sanitizePath(path: string): string;
    /**
     * Create a safe path from segments
     */
    createSafePath(segments: string[]): string;
    /**
     * Get extraction statistics
     */
    getStats(): {
        extractedCount: number;
        visitedObjects: number;
        options: Required<ExtractionOptions>;
    };
}
//# sourceMappingURL=NestedVariableExtractor.d.ts.map