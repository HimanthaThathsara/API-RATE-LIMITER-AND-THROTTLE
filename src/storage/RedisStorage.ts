import {RateLimitStorage} from "../types";

// Type for Redis client (works with node-redis v4+)
type RedisClient = {
  get(key: string): Promise;
  set(key: string, value: string, options?: {EX?: number}): Promise;
  del(key: string): Promise;
};

/**
 * Redis Storage Implementation
 * Suitable for distributed/multi-server applications
 * Requires: npm install redis
 */
export class RedisStorage implements RateLimitStorage {
  private client: RedisClient;
  private keyPrefix: string;
  private ttl: number;

  /**
   * @param redisClient - Connected Redis client instance
   * @param keyPrefix - Prefix for all keys (default: 'ratelimit:')
   * @param ttl - Time to live for keys in seconds (default: 3600 = 1 hour)
   */
  constructor(redisClient: RedisClient, keyPrefix: string = "ratelimit:", ttl: number = 3600) {
    this.client = redisClient;
    this.keyPrefix = keyPrefix;
    this.ttl = ttl;
  }

  async get(key: string): Promise {
    const data = await this.client.get(this.keyPrefix + key);
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async set(key: string, value: {tokens: number; lastRefill: number}): Promise {
    const fullKey = this.keyPrefix + key;
    await this.client.set(fullKey, JSON.stringify(value), {
      EX: this.ttl,
    });
  }

  async delete(key: string): Promise {
    await this.client.del(this.keyPrefix + key);
  }
}
