import { Request, Response, NextFunction } from 'express';

/**
 * Storage interface - users must implement this for their chosen storage (Redis, In-Memory, etc.)
 */
export interface RateLimitStorage {
    /**
     * Get the current state for a key
     * @returns { tokens: number, lastRefill: number } or null if key doesn't exist
     */
    get(key: string): Promise<{ tokens: number; lastRefill: number } | null>;

    /**
     * Set the state for a key
     */
    set(key: string, value: { tokens: number; lastRefill: number }): Promise<void>;

    /**
     * Delete a key (optional - for cleanup)
     */
    delete?(key: string): Promise<void>;
}

/**
 * Configuration options for the rate limiter
 */
export interface RateLimitOptions {
    /**
     * Maximum number of tokens in the bucket
     */
    capacity: number;

    /**
     * Number of tokens to refill per interval
     */
    refillRate: number;

    /**
     * Refill interval in milliseconds
     */
    refillInterval: number;

    /**
     * Storage adapter implementation
     */
    storage: RateLimitStorage;

    /**
     * Key generation strategy (default: IP address)
     */
    keyGenerator?: (req: Request) => string;

    /**
     * Custom response handler when rate limit is exceeded
     */
    onLimitReached?: (req: Request, res: Response) => void;

    /**
     * Include rate limit headers in response (default: true)
     */
    includeHeaders?: boolean;

    /**
     * Custom header names
     */
    headers?: {
        limit?: string;
        remaining?: string;
        reset?: string;
    };

    /**
     * Skip rate limiting based on condition
     */
    skip?: (req: Request) => boolean;
}

/**
 * Token Bucket state
 */
interface BucketState {
    tokens: number;
    lastRefill: number;
}

/**
 * Token Bucket Rate Limiter Class
 */
export class TokenBucketRateLimiter {
    private capacity: number;
    private refillRate: number;
    private refillInterval: number;
    private storage: RateLimitStorage;
    private keyGenerator: (req: Request) => string;
    private onLimitReached?: (req: Request, res: Response) => void;
    private includeHeaders: boolean;
    private headerNames: {
        limit: string;
        remaining: string;
        reset: string;
    };
    private skip?: (req: Request) => boolean;
    private cleanupInterval?: NodeJS.Timeout;

    constructor(options: RateLimitOptions) {
        this.capacity = options.capacity;
        this.refillRate = options.refillRate;
        this.refillInterval = options.refillInterval;
        this.storage = options.storage;
        this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
        this.onLimitReached = options.onLimitReached;
        this.includeHeaders = options.includeHeaders !== false;
        this.skip = options.skip;

        this.headerNames = {
            limit: options.headers?.limit || 'X-RateLimit-Limit',
            remaining: options.headers?.remaining || 'X-RateLimit-Remaining',
            reset: options.headers?.reset || 'X-RateLimit-Reset',
        };

        // Start cleanup process for expired keys (runs every hour)
        this.startCleanup();
    }

    /**
     * Default key generator - uses IP address
     */
    private defaultKeyGenerator(req: Request): string {
        return req.ip || req.socket.remoteAddress || 'unknown';
    }

    /**
     * Calculate tokens to add based on time elapsed
     */
    private calculateRefill(lastRefill: number, now: number): number {
        const elapsed = now - lastRefill;
        const intervals = Math.floor(elapsed / this.refillInterval);
        return intervals * this.refillRate;
    }

    /**
     * Get or initialize bucket state for a key
     */
    private async getBucketState(key: string): Promise<BucketState> {
        const state = await this.storage.get(key);

        if (!state) {
            // New key - initialize with full capacity
            return {
                tokens: this.capacity,
                lastRefill: Date.now(),
            };
        }

        const now = Date.now();
        const tokensToAdd = this.calculateRefill(state.lastRefill, now);

        if (tokensToAdd > 0) {
            // Refill tokens (cap at capacity)
            const newTokens = Math.min(state.tokens + tokensToAdd, this.capacity);
            const lastRefillUpdate = state.lastRefill + Math.floor((now - state.lastRefill) / this.refillInterval) * this.refillInterval;

            return {
                tokens: newTokens,
                lastRefill: lastRefillUpdate,
            };
        }

        return state;
    }

    /**
     * Calculate reset time (when next token will be available)
     */
    private calculateResetTime(bucketState: BucketState): number {
        if (bucketState.tokens >= 1) {
            return 0; // Tokens available
        }

        const nextRefill = bucketState.lastRefill + this.refillInterval;
        return Math.ceil((nextRefill - Date.now()) / 1000); // seconds
    }

    /**
     * Middleware function
     */
    public middleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Skip if condition is met
            if (this.skip && this.skip(req)) {
                return next();
            }

            const key = this.keyGenerator(req);
            const bucketState = await this.getBucketState(key);

            // Check if request can be allowed
            if (bucketState.tokens >= 1) {
                // Consume one token
                bucketState.tokens -= 1;
                await this.storage.set(key, bucketState);

                // Add headers
                if (this.includeHeaders) {
                    res.setHeader(this.headerNames.limit, this.capacity.toString());
                    res.setHeader(this.headerNames.remaining, Math.floor(bucketState.tokens).toString());
                    res.setHeader(this.headerNames.reset, this.calculateResetTime(bucketState).toString());
                }

                return next();
            }

            // Rate limit exceeded
            if (this.includeHeaders) {
                res.setHeader(this.headerNames.limit, this.capacity.toString());
                res.setHeader(this.headerNames.remaining, '0');
                res.setHeader(this.headerNames.reset, this.calculateResetTime(bucketState).toString());
            }

            if (this.onLimitReached) {
                return this.onLimitReached(req, res);
            }

            // Default response
            res.status(429).json({
                error: 'Too Many Requests',
                message: 'Rate limit exceeded. Please try again later.',
                retryAfter: this.calculateResetTime(bucketState),
            });
        } catch (error) {
            // On error, allow request to pass through (fail open)
            console.error('Rate limiter error:', error);
            next();
        }
    };

    /**
     * Create per-route rate limiter with different limits
     */
    public createRouteLimit(routeOptions: Partial<RateLimitOptions>): (req: Request, res: Response, next: NextFunction) => Promise<void> {
        const routeLimiter = new TokenBucketRateLimiter({
            capacity: routeOptions.capacity || this.capacity,
            refillRate: routeOptions.refillRate || this.refillRate,
            refillInterval: routeOptions.refillInterval || this.refillInterval,
            storage: routeOptions.storage || this.storage,
            keyGenerator: routeOptions.keyGenerator || this.keyGenerator,
            onLimitReached: routeOptions.onLimitReached || this.onLimitReached,
            includeHeaders: routeOptions.includeHeaders !== undefined ? routeOptions.includeHeaders : this.includeHeaders,
            headers: routeOptions.headers || this.headerNames,
            skip: routeOptions.skip || this.skip,
        });

        return routeLimiter.middleware;
    }

    /**
     * Cleanup old keys (if storage supports delete)
     */
    private startCleanup(): void {
        // This is a basic implementation - users might want to implement custom cleanup in their storage adapter
        if (this.storage.delete) {
            this.cleanupInterval = setInterval(() => {
                // Cleanup logic would be storage-specific
                // Users can implement this in their storage adapter
            }, 3600000); // Run every hour
        }
    }

    /**
     * Stop cleanup interval
     */
    public stopCleanup(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }

    /**
     * Reset rate limit for a specific key
     */
    public async reset(req: Request): Promise<void> {
        const key = this.keyGenerator(req);
        if (this.storage.delete) {
            await this.storage.delete(key);
        }
    }
}

/**
 * Factory function for creating rate limiter
 */
export function createRateLimiter(options: RateLimitOptions) {
    const limiter = new TokenBucketRateLimiter(options);
    return limiter.middleware;
}