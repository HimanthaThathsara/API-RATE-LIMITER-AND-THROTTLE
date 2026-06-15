import { BucketState, RateLimitStorage } from '../types';

export class RedisStorage implements RateLimitStorage {
    constructor(
        private redisClient: any,
        private keyPrefix: string = 'rl:'
    ) { }

    async get(key: string): Promise<BucketState | null> {
        const data = await this.redisClient.get(`${this.keyPrefix}${key}`);
        return data ? JSON.parse(data) : null;
    }

    async set(key: string, value: BucketState): Promise<void> {
        // Set with a TTL equal to some reasonable maximum, e.g., 24 hours
        // to avoid leaking memory in Redis.
        await this.redisClient.set(
            `${this.keyPrefix}${key}`,
            JSON.stringify(value),
            { EX: 86400 }
        );
    }

    async delete(key: string): Promise<void> {
        await this.redisClient.del(`${this.keyPrefix}${key}`);
    }
}
