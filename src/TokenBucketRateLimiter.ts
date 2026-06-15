import { Request, Response, NextFunction } from 'express';
import { RateLimitOptions, BucketState } from './types';
import { DEFAULT_HEADERS, getIP } from './utils/helpers';

export class TokenBucketRateLimiter {
    private options: RateLimitOptions;

    constructor(options: RateLimitOptions) {
        this.options = {
            includeHeaders: true,
            headers: DEFAULT_HEADERS,
            keyGenerator: (req) => getIP(req),
            onLimitReached: (req, res) => {
                res.status(429).json({ error: 'Too many requests, please try again later.' });
            },
            ...options,
        };
    }

    createRouteLimit(overrides: Partial<RateLimitOptions>) {
        const routeLimiter = new TokenBucketRateLimiter({
            ...this.options,
            ...overrides,
        });
        return routeLimiter.middleware();
    }

    middleware() {
        return async (req: Request, res: Response, next: NextFunction) => {
            if (this.options.skip && this.options.skip(req)) {
                return next();
            }

            const key = this.options.keyGenerator!(req);
            const now = Date.now();
            const { capacity, refillRate, refillInterval, storage, includeHeaders, headers } = this.options;

            try {
                let state = await storage.get(key);

                if (!state) {
                    state = {
                        tokens: capacity,
                        lastRefill: now,
                    };
                } else {
                    // Refill logic
                    const timePassed = now - state.lastRefill;
                    const tokensToAdd = timePassed * (refillRate / refillInterval);
                    state.tokens = Math.min(capacity, state.tokens + tokensToAdd);
                    state.lastRefill = now;
                }

                const canConsume = state.tokens >= 1;

                if (includeHeaders && headers) {
                    res.setHeader(headers.limit, capacity);
                    res.setHeader(headers.remaining, Math.floor(canConsume ? state.tokens - 1 : state.tokens));

                    // Estimate reset time: how long until bucket is full or tokens are available
                    const tokensNeeded = 1 - state.tokens;
                    const timeUntilToken = tokensNeeded > 0 ? (tokensNeeded * refillInterval) / refillRate : 0;
                    res.setHeader(headers.reset, Math.ceil((now + timeUntilToken) / 1000));
                }

                if (canConsume) {
                    state.tokens -= 1;
                    await storage.set(key, state);
                    return next();
                } else {
                    await storage.set(key, state);
                    return this.options.onLimitReached!(req, res);
                }
            } catch (error) {
                // Fail open or closed? Usually fail open for rate limiting in production.
                console.error('Rate limiter error:', error);
                return next();
            }
        };
    }
}

export function createRateLimiter(options: RateLimitOptions) {
    const limiter = new TokenBucketRateLimiter(options);
    return limiter.middleware();
}
