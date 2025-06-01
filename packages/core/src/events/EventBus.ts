export interface IEventBus {
  emit(_event: string, _data?: any): void;
  on(_event: string, _callback: (...args: any[]) => void): () => void;
  off(_event: string, _callback?: (...args: any[]) => void): void;
  removeAllListeners(_event: string): void;
  listenerCount(_event: string): number;
  eventNames(): string[];
  hasListeners(_event: string): boolean;
  once(_event: string, _callback: (...args: any[]) => void): () => void;
  waitFor(_event: string, _timeout?: number): Promise<any>;
}

export class EventBus implements IEventBus {
  private listeners = new Map<string, ((...args: any[]) => void)[]>();

  /**
   * Emit an event to all registered listeners
   */
  emit<T>(event: string, data: T): void {
    const callbacks = this.listeners.get(event) || [];
    
    // Execute callbacks asynchronously to prevent blocking
    Promise.resolve().then(() => {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error);
        }
      });
    });
  }

  /**
   * Register an event listener
   * Returns an unsubscribe function
   */
  on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    const callbacks = this.listeners.get(event)!;
    callbacks.push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Remove an event listener
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    const callbacks = this.listeners.get(event);
    
    if (callbacks && callback) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      // Clean up empty arrays
      if (callbacks.length === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount(event: string): number {
    const callbacks = this.listeners.get(event);
    return callbacks ? callbacks.length : 0;
  }

  /**
   * Get all registered event names
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Check if an event has any listeners
   */
  hasListeners(event: string): boolean {
    return this.listenerCount(event) > 0;
  }

  /**
   * Register a one-time listener that automatically unsubscribes after first event
   */
  once(event: string, callback: (...args: any[]) => void): () => void {
    const unsubscribe = this.on(event, callback);
    return unsubscribe;
  }

  /**
   * Wait for an event to be emitted (Promise-based)
   */
  waitFor<T>(event: string, timeout?: number): Promise<T> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;
      
      const unsubscribe = this.once(event, (data: T) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        resolve(data);
      });
      
      if (timeout) {
        timeoutId = setTimeout(() => {
          unsubscribe();
          reject(new Error(`Event '${event}' timed out after ${timeout}ms`));
        }, timeout);
      }
    });
  }
} 