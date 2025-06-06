import { EventBus as IEventBus } from '../execution/ExecutionContext';
export declare class EventBus implements IEventBus {
    private listeners;
    /**
     * Emit an event to all registered listeners
     */
    emit<T>(event: string, data: T): void;
    /**
     * Register an event listener
     * Returns an unsubscribe function
     */
    on(event: string, callback: Function): () => void;
    /**
     * Remove an event listener
     */
    off(event: string, callback: Function): void;
    /**
     * Remove all listeners for an event
     */
    removeAllListeners(event?: string): void;
    /**
     * Get the number of listeners for an event
     */
    listenerCount(event: string): number;
    /**
     * Get all registered event names
     */
    eventNames(): string[];
    /**
     * Check if an event has any listeners
     */
    hasListeners(event: string): boolean;
    /**
     * Register a one-time listener that automatically unsubscribes after first event
     */
    once(event: string, callback: Function): () => void;
    /**
     * Wait for an event to be emitted (Promise-based)
     */
    waitFor<T>(event: string, timeout?: number): Promise<T>;
}
//# sourceMappingURL=EventBus.d.ts.map