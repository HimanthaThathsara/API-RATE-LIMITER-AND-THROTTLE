import { BucketState, RateLimitStorage } from '../types';

export class InMemoryStorage implements RateLimitStorage {
    private storage: Map<string, BucketState> = new Map();
    private cleanupInterval?: NodeJS.Timeout;

    constructor(cleanupIntervalMs: number = 60000) {
        if (cleanupIntervalMs > 0) {
            this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
        }
    }

    async get(key: string): Promise<BucketState | null> {
        return this.storage.get(key) || null;
    }

    async set(key: string, value: BucketState): Promise<void> {
        this.storage.set(key, value);
    }

    async delete(key: string): Promise<void> {
        this.storage.delete(key);
    }

    private cleanup(): void {
        // Basic cleanup: in a real token bucket, we might want to track TTL.
        // For in-memory, we can just clear if it's getting too big, 
        // or implement a proper TTL if we store expiration.
        // Simplifying for now: only clear if explicitly told or if it exceeds a threshold.
        if (this.storage.size > 10000) {
            this.storage.clear();
        }
    }

    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}
