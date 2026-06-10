/**
 * Redisstore  fixed-window counter using INCR + EXPIRE.
 *
 * Implements the `store` contract expected by createRateLimiter:
 *   increment(key, windowMs) -> { totalHits, resetTime }
 *   decrement(key)           -> void   (used by skipFailedRequests/skipSuccessfulRequests)
 *   resetKey(key)            -> void
 *
 */

function createRedisStore(client) {
  return {
    async increment(key, windowMs) {
      const ttlSeconds = Math.max(Math.ceil(windowMs / 1000), 1);
      const totalHits = await client.incr(key);

      if (totalHits === 1) {
        await client.expire(key, ttlSeconds);
      }

      const ttl = await client.ttl(key);
      const resetTime = Date.now() + Math.max(ttl, 0) * 1000;

      return { totalHits, resetTime };
    },

    async decrement(key) {
      await client.decr(key);
    },

    async resetKey(key) {
      await client.del(key);
    },
  };
}

module.exports = { createRedisStore };
