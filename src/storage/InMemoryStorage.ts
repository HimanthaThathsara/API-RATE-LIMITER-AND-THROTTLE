import {RateLimitStorage} from "../types";

/**
 * In-Memory Storage Implementation
 * Suitable for single-server applications or development
 */
export class InMemoryStorage implements RateLimitStorage {
  private store: Map = new Map();
  private cleanupInterval: NodeJS.Timeout;
  private maxAge: number;

  /**
   * @param cleanupIntervalMs - How often to run cleanup (default: 10 minutes)
   * @param maxAge - Maximum age of unused keys in milliseconds (default: 1 hour)
   */
  constructor(cleanupIntervalMs: number = 600000, maxAge: number = 3600000) {
    this.maxAge = maxAge;
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  async get(key: string): Promise {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Update last access time
    entry.lastAccess = Date.now();
    return {tokens: entry.tokens, lastRefill: entry.lastRefill};
  }

  async set(key: string, value: {tokens: number; lastRefill: number}): Promise {
    this.store.set(key, {...value, lastAccess: Date.now()});
  }

  async delete(key: string): Promise {
    this.store.delete(key);
  }

  /**
   * Cleanup expired keys
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, value] of this.store.entries()) {
      if (now - value.lastAccess > this.maxAge) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get current number of keys in storage
   */
  public size(): number {
    return this.store.size;
  }

  /**
   * Clear all keys
   */
  public clear(): void {
    this.store.clear();
  }

  /**
   * Stop cleanup interval
   */
  public stopCleanup(): void {
    clearInterval(this.cleanupInterval);
  }
}
