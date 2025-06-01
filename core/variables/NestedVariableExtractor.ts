import { VariableDefinition } from './VariableRegistry';

export interface DynamicVariableDefinition extends VariableDefinition {
  path: string;              // 'responseData.user.name'
  fullPath: string;          // 'node-123.responseData.user.name'  
  actualValue: any;          // 'John Doe'
  isNested: true;            // distinguishes from static
  sourceNodeId: string;      // 'node-123'
  parentPath?: string;       // 'responseData.user'
  depth: number;             // 2 (for user.name)
  extractedAt: number;       // timestamp
}

export interface ExtractionOptions {
  maxDepth?: number;         // Default: 6
  maxArrayItems?: number;    // Default: 10
  maxPropertiesPerLevel?: number; // Default: 50
  maxValueSize?: number;     // Default: 1MB
  maxTotalVariables?: number; // Default: 500
}

export class NestedVariableExtractor {
  private static readonly DEFAULT_OPTIONS: Required<ExtractionOptions> = {
    maxDepth: 6,
    maxArrayItems: 10,
    maxPropertiesPerLevel: 50,
    maxValueSize: 1024 * 1024, // 1MB
    maxTotalVariables: 500,
  };

  private options: Required<ExtractionOptions>;
  private extractedCount: number = 0;
  private visited: Set<any> = new Set();

  constructor(options: ExtractionOptions = {}) {
    this.options = { ...NestedVariableExtractor.DEFAULT_OPTIONS, ...options };
  }

  /**
   * Extract all nested variables from an object
   */
  extractVariables(
    obj: any, 
    nodeId: string, 
    prefix: string = ''
  ): DynamicVariableDefinition[] {
    this.extractedCount = 0;
    this.visited.clear();

    if (!this.shouldExtract(obj, 0)) {
      return [];
    }

    const variables: DynamicVariableDefinition[] = [];
    const timestamp = Date.now();

    try {
      this.flattenObject(obj, prefix, 0, nodeId, timestamp, variables);
    } catch (error) {
      console.warn('Variable extraction failed:', error);
    }

    return variables;
  }

  /**
   * Core object flattening with dot notation paths
   */
  private flattenObject(
    obj: any,
    prefix: string,
    depth: number,
    nodeId: string,
    timestamp: number,
    variables: DynamicVariableDefinition[]
  ): void {
    // Safety checks
    if (depth >= this.options.maxDepth) return;
    if (this.extractedCount >= this.options.maxTotalVariables) return;
    if (this.detectCircularReference(obj)) return;

    this.visited.add(obj);

    if (Array.isArray(obj)) {
      this.handleArray(obj, prefix, depth, nodeId, timestamp, variables);
    } else if (obj && typeof obj === 'object' && obj.constructor === Object) {
      this.handleObject(obj, prefix, depth, nodeId, timestamp, variables);
    } else {
      // Primitive value - create variable
      this.createVariable(prefix, obj, nodeId, timestamp, variables, depth);
    }

    this.visited.delete(obj);
  }

  /**
   * Handle array indexing with [0], [1], etc.
   */
  private handleArray(
    arr: any[],
    path: string,
    depth: number,
    nodeId: string,
    timestamp: number,
    variables: DynamicVariableDefinition[]
  ): void {
    // Create variable for the array itself
    this.createVariable(path, arr, nodeId, timestamp, variables, depth);

    // Add array length
    if (path) {
      this.createVariable(`${path}.length`, arr.length, nodeId, timestamp, variables, depth + 1);
    }

    // Extract array items (limited)
    const itemsToExtract = Math.min(arr.length, this.options.maxArrayItems);
    
    for (let i = 0; i < itemsToExtract; i++) {
      if (this.extractedCount >= this.options.maxTotalVariables) break;

      const itemPath = path ? `${path}[${i}]` : `[${i}]`;
      const item = arr[i];

      if (this.shouldExtract(item, depth + 1)) {
        this.flattenObject(item, itemPath, depth + 1, nodeId, timestamp, variables);
      }
    }
  }

  /**
   * Handle object properties with dot notation
   */
  private handleObject(
    obj: Record<string, any>,
    path: string,
    depth: number,
    nodeId: string,
    timestamp: number,
    variables: DynamicVariableDefinition[]
  ): void {
    // Create variable for the object itself
    this.createVariable(path, obj, nodeId, timestamp, variables, depth);

    // Extract object properties (limited)
    const keys = Object.keys(obj);
    const keysToExtract = keys.slice(0, this.options.maxPropertiesPerLevel);

    for (const key of keysToExtract) {
      if (this.extractedCount >= this.options.maxTotalVariables) break;

      const value = obj[key];
      const propertyPath = this.createPropertyPath(path, key);

      if (this.shouldExtract(value, depth + 1)) {
        this.flattenObject(value, propertyPath, depth + 1, nodeId, timestamp, variables);
      }
    }
  }

  /**
   * Create a property path handling special characters
   */
  private createPropertyPath(basePath: string, key: string): string {
    const sanitizedKey = this.sanitizeKey(key);
    
    // Use bracket notation for special keys
    if (this.needsBracketNotation(key)) {
      return basePath ? `${basePath}["${key}"]` : `["${key}"]`;
    }
    
    // Use dot notation for normal keys
    return basePath ? `${basePath}.${sanitizedKey}` : sanitizedKey;
  }

  /**
   * Check if key needs bracket notation
   */
  private needsBracketNotation(key: string): boolean {
    // Keys with spaces, hyphens, or special characters
    return !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
  }

  /**
   * Sanitize key for safe path usage
   */
  private sanitizeKey(key: string): string {
    // Keep alphanumeric, underscore, and dollar sign
    return key.replace(/[^a-zA-Z0-9_$]/g, '_');
  }

  /**
   * Create a variable definition
   */
  private createVariable(
    path: string,
    value: any,
    nodeId: string,
    timestamp: number,
    variables: DynamicVariableDefinition[],
    depth: number,
    parentPath?: string
  ): void {
    if (!path) return; // Skip empty paths

    this.extractedCount++;

    const fullPath = `${nodeId}.${path}`;
    const type = this.inferType(value);
    
    // Get a preview value (truncated if needed)
    const previewValue = this.getPreviewValue(value);

    variables.push({
      name: path,
      path: path,
      fullPath: fullPath,
      type: type,
      description: `Dynamic variable extracted from ${nodeId}`,
      example: previewValue,
      actualValue: value,
      isNested: true,
      sourceNodeId: nodeId,
      parentPath: parentPath,
      depth: depth,
      extractedAt: timestamp,
    });
  }

  /**
   * Infer TypeScript type from value
   */
  private inferType(value: any): 'string' | 'number' | 'boolean' | 'object' | 'array' {
    if (value === null || value === undefined) return 'object';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';
    return 'object';
  }

  /**
   * Get a preview value for display (truncated if large)
   */
  private getPreviewValue(value: any): any {
    if (value === null || value === undefined) return value;

    // For strings, truncate if too long
    if (typeof value === 'string') {
      return value.length > 100 ? value.substring(0, 100) + '...' : value;
    }

    // For arrays, show first few items
    if (Array.isArray(value)) {
      if (value.length <= 3) return value;
      return [...value.slice(0, 3), '...'];
    }

    // For objects, show structure but not full content
    if (typeof value === 'object') {
      try {
        const json = JSON.stringify(value);
        if (json.length > 200) {
          return `{${Object.keys(value).slice(0, 3).join(', ')}${Object.keys(value).length > 3 ? ', ...' : ''}}`;
        }
        return value;
      } catch {
        return '[Object]';
      }
    }

    return value;
  }

  /**
   * Check if value should be extracted
   */
  private shouldExtract(value: any, depth: number): boolean {
    // Depth limit
    if (depth >= this.options.maxDepth) return false;

    // Total variable limit
    if (this.extractedCount >= this.options.maxTotalVariables) return false;

    // Skip null/undefined
    if (value === null || value === undefined) return false;

    // Skip functions and symbols
    if (typeof value === 'function' || typeof value === 'symbol') return false;

    // Size limit for objects/arrays
    if (typeof value === 'object') {
      try {
        const size = JSON.stringify(value).length;
        if (size > this.options.maxValueSize) return false;
      } catch {
        return false; // Can't stringify, skip
      }
    }

    return true;
  }

  /**
   * Detect circular references
   */
  private detectCircularReference(obj: any): boolean {
    if (typeof obj !== 'object' || obj === null) return false;
    return this.visited.has(obj);
  }

  /**
   * Sanitize a complete path for safety
   */
  sanitizePath(path: string): string {
    // Remove any potentially dangerous characters
    return path.replace(/[<>:"\\|?*]/g, '_');
  }

  /**
   * Create a safe path from segments
   */
  createSafePath(segments: string[]): string {
    return segments
      .filter(segment => segment && segment.trim())
      .map(segment => this.sanitizeKey(segment))
      .join('.');
  }

  /**
   * Get extraction statistics
   */
  getStats(): {
    extractedCount: number;
    visitedObjects: number;
    options: Required<ExtractionOptions>;
  } {
    return {
      extractedCount: this.extractedCount,
      visitedObjects: this.visited.size,
      options: this.options,
    };
  }
} 