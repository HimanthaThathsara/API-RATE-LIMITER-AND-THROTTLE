import express, { Request, Response } from 'express';
import { TokenBucketRateLimiter, RateLimitStorage, createRateLimiter } from './rate-limiter';

// ============================================
// Example 1: In-Memory Storage Implementation
// ============================================

class InMemoryStorage implements RateLimitStorage {
    private store: Map<string, { tokens: number; lastRefill: number; lastAccess: number }> = new Map();
    private cleanupInterval: NodeJS.Timeout;

    constructor(cleanupIntervalMs: number = 600000) {
        // Cleanup expired keys every 10 minutes
        this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
    }

    async get(key: string): Promise<{ tokens: number; lastRefill: number } | null> {
        const entry = this.store.get(key);
        if (!entry) return null;

        // Update last access time
        entry.lastAccess = Date.now();
        return { tokens: entry.tokens, lastRefill: entry.lastRefill };
    }

    async set(key: string, value: { tokens: number; lastRefill: number }): Promise<void> {
        this.store.set(key, { ...value, lastAccess: Date.now() });
    }

    async delete(key: string): Promise<void> {
        this.store.delete(key);
    }

    private cleanup(): void {
        const now = Date.now();
        const maxAge = 3600000; // 1 hour

        for (const [key, value] of this.store.entries()) {
            if (now - value.lastAccess > maxAge) {
                this.store.delete(key);
            }
        }
    }

    public stopCleanup(): void {
        clearInterval(this.cleanupInterval);
    }
}

// ============================================
// Example 2: Redis Storage Implementation
// ============================================

// Note: Requires 'redis' package: npm install redis
// import { createClient, RedisClientType } from 'redis';

class RedisStorage implements RateLimitStorage {
    private client: any; // RedisClientType in production
    private keyPrefix: string;

    constructor(redisClient: any, keyPrefix: string = 'ratelimit:') {
        this.client = redisClient;
        this.keyPrefix = keyPrefix;
    }

    async get(key: string): Promise<{ tokens: number; lastRefill: number } | null> {
        const data = await this.client.get(this.keyPrefix + key);
        if (!data) return null;

        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    async set(key: string, value: { tokens: number; lastRefill: number }): Promise<void> {
        const fullKey = this.keyPrefix + key;
        await this.client.set(fullKey, JSON.stringify(value), {
            EX: 3600, // Expire after 1 hour
        });
    }

    async delete(key: string): Promise<void> {
        await this.client.del(this.keyPrefix + key);
    }
}

// ============================================
// Example 3: Basic Usage with In-Memory Storage
// ============================================

const app = express();
const storage = new InMemoryStorage();

// Global rate limiter: 100 requests per minute
const globalLimiter = createRateLimiter({
    capacity: 100,
    refillRate: 100,
    refillInterval: 60000, // 60 seconds
    storage,
});

app.use(globalLimiter);

// ============================================
// Example 4: Per-Route Rate Limiting
// ============================================

const limiter = new TokenBucketRateLimiter({
    capacity: 100,
    refillRate: 100,
    refillInterval: 60000,
    storage,
});

// Strict limit for login endpoint: 5 requests per minute
app.post('/api/login', limiter.createRouteLimit({
    capacity: 5,
    refillRate: 5,
    refillInterval: 60000,
}), (req: Request, res: Response) => {
    res.json({ message: 'Login endpoint' });
});

// Generous limit for public data: 1000 requests per minute
app.get('/api/public', limiter.createRouteLimit({
    capacity: 1000,
    refillRate: 1000,
    refillInterval: 60000,
}), (req: Request, res: Response) => {
    res.json({ message: 'Public data' });
});

// ============================================
// Example 5: Custom Key Generator (by User ID)
// ============================================

const userBasedLimiter = createRateLimiter({
    capacity: 50,
    refillRate: 50,
    refillInterval: 60000,
    storage,
    keyGenerator: (req: Request) => {
        // Extract user ID from JWT token or session
        const userId = (req as any).user?.id || req.ip;
        return `user:${userId}`;
    },
});

app.use('/api/user', userBasedLimiter);

// ============================================
// Example 6: Custom Response Handler
// ============================================

const customResponseLimiter = createRateLimiter({
    capacity: 20,
    refillRate: 20,
    refillInterval: 60000,
    storage,
    onLimitReached: (req: Request, res: Response) => {
        res.status(429).json({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'You have exceeded the rate limit. Please slow down.',
            retryAfter: res.getHeader('X-RateLimit-Reset'),
        });
    },
});

app.use('/api/custom', customResponseLimiter);

// ============================================
// Example 7: Skip Rate Limiting for Certain Requests
// ============================================

const conditionalLimiter = createRateLimiter({
    capacity: 30,
    refillRate: 30,
    refillInterval: 60000,
    storage,
    skip: (req: Request) => {
        // Skip rate limiting for admin users
        return (req as any).user?.role === 'admin';
    },
});

app.use('/api/protected', conditionalLimiter);

// ============================================
// Example 8: Custom Headers
// ============================================

const customHeadersLimiter = createRateLimiter({
    capacity: 60,
    refillRate: 60,
    refillInterval: 60000,
    storage,
    includeHeaders: true,
    headers: {
        limit: 'X-Rate-Limit',
        remaining: 'X-Rate-Remaining',
        reset: 'X-Rate-Reset',
    },
});

app.use('/api/custom-headers', customHeadersLimiter);

// ============================================
// Example 9: Redis Implementation
// ============================================

/*
import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://localhost:6379'
});

await redisClient.connect();

const redisStorage = new RedisStorage(redisClient);

const redisLimiter = createRateLimiter({
  capacity: 100,
  refillRate: 100,
  refillInterval: 60000,
  storage: redisStorage,
});

app.use(redisLimiter);
*/

// ============================================
// Example 10: Different Limits for Different Methods
// ============================================

app.route('/api/resource')
    .get(limiter.createRouteLimit({
        capacity: 100,
        refillRate: 100,
        refillInterval: 60000,
    }), (req: Request, res: Response) => {
        res.json({ message: 'GET resource' });
    })
    .post(limiter.createRouteLimit({
        capacity: 10,
        refillRate: 10,
        refillInterval: 60000,
    }), (req: Request, res: Response) => {
        res.json({ message: 'POST resource' });
    });

// ============================================
// Example 11: Manually Reset Rate Limit
// ============================================

app.post('/api/reset-limit', async (req: Request, res: Response) => {
    await limiter.reset(req);
    res.json({ message: 'Rate limit reset for your IP' });
});

// ============================================
// Start Server
// ============================================

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Cleanup on shutdown
process.on('SIGINT', () => {
    storage.stopCleanup();
    limiter.stopCleanup();
    process.exit(0);
});