import { EventBus as IEventBus } from '../execution/ExecutionContext';

export class EventBus implements IEventBus {
  private listeners = new Map<string, Function[]>();

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
  on(event: string, callback: Function): () => void {
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
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    
    if (callbacks) {
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
  once(event: string, callback: Function): () => void {
    const onceCallback = (data: any) => {
      callback(data);
      this.off(event, onceCallback);
    };
    
    return this.on(event, onceCallback);
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