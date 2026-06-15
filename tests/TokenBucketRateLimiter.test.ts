import { TokenBucketRateLimiter } from '../src/TokenBucketRateLimiter';
import { InMemoryStorage } from '../src/storage/InMemoryStorage';
import { Request, Response } from 'express';

describe('TokenBucketRateLimiter', () => {
    let storage: InMemoryStorage;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        storage = new InMemoryStorage(0); // Disable cleanup for tests
        req = {
            ip: '127.0.0.1',
            headers: {},
            connection: {} as any,
        };
        res = {
            setHeader: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });

    it('should allow requests when tokens are available', async () => {
        const limiter = new TokenBucketRateLimiter({
            capacity: 5,
            refillRate: 5,
            refillInterval: 1000,
            storage,
        });

        const middleware = limiter.middleware();
        await middleware(req as any, res as any, next);

        expect(next).toHaveBeenCalled();
        expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 4);
    });

    it('should block requests when bucket is empty', async () => {
        const limiter = new TokenBucketRateLimiter({
            capacity: 1,
            refillRate: 1,
            refillInterval: 10000,
            storage,
        });

        const middleware = limiter.middleware();

        // First request - ok
        await middleware(req as any, res as any, next);
        expect(next).toHaveBeenCalledTimes(1);

        // Second request - blocked
        await middleware(req as any, res as any, next);
        expect(res.status).toHaveBeenCalledWith(429);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('should refill tokens over time', async () => {
        const limiter = new TokenBucketRateLimiter({
            capacity: 1,
            refillRate: 1,
            refillInterval: 100, // Refill 1 token every 100ms
            storage,
        });

        const middleware = limiter.middleware();

        // Consume the only token
        await middleware(req as any, res as any, next);
        expect(next).toHaveBeenCalledTimes(1);

        // Immediate second request - blocked
        await middleware(req as any, res as any, next);
        expect(res.status).toHaveBeenCalledWith(429);

        // Wait for refill
        await new Promise(resolve => setTimeout(resolve, 150));

        // Third request - ok
        await middleware(req as any, res as any, next);
        expect(next).toHaveBeenCalledTimes(2);
    });
});
