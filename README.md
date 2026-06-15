# Token Bucket Rate Limiter

A high-performance, TypeScript-based token bucket rate limiter with support for in-memory and Redis storage backends.

## Features

- ✅ **Token Bucket Algorithm**: Industry-standard rate limiting implementation
- ✅ **Flexible Storage**: In-memory and Redis adapters included
- ✅ **Type-Safe**: Full TypeScript support with comprehensive type definitions
- ✅ **Distributed**: Redis support for multi-process/multi-server setups
- ✅ **Customizable**: Configurable capacity, refill rate, and refill intervals
- ✅ **Well-Tested**: Comprehensive test suite with Jest
- ✅ **Zero Dependencies**: Core library has no runtime dependencies

## Installation

```bash
npm install token-bucket-rate-limiter
```

## Quick Start

```typescript
import {TokenBucketRateLimiter, InMemoryStorage} from "token-bucket-rate-limiter";

// Create storage adapter
const storage = new InMemoryStorage();

// Initialize rate limiter
// Allows 10 requests per second
const limiter = new TokenBucketRateLimiter({
  capacity: 10,
  refillRate: 10,
  refillInterval: 1000,
  storage,
});

// Check rate limit
const result = await limiter.checkLimit("user-123");

if (result.allowed) {
  console.log("Request allowed!");
  console.log(`Tokens remaining: ${result.tokensRemaining}`);
} else {
  console.log(`Rate limited. Retry after: ${result.retryAfter}ms`);
}
```

## Configuration

### TokenBucketConfig

- **capacity**: Maximum number of tokens in the bucket
- **refillRate**: Number of tokens to add per refill interval
- **refillInterval**: Time interval (in milliseconds) for refilling tokens
- **storage**: Storage adapter implementation (InMemoryStorage or RedisStorage)

## Storage Adapters

### InMemoryStorage

Best for single-process applications:

```typescript
import {TokenBucketRateLimiter, InMemoryStorage} from "token-bucket-rate-limiter";

const storage = new InMemoryStorage();
const limiter = new TokenBucketRateLimiter({
  capacity: 100,
  refillRate: 10,
  refillInterval: 1000,
  storage,
});
```

### RedisStorage

Best for distributed systems:

```typescript
import {TokenBucketRateLimiter, RedisStorage} from "token-bucket-rate-limiter";
import redis from "redis";

const redisClient = redis.createClient();
const storage = new RedisStorage(redisClient);

const limiter = new TokenBucketRateLimiter({
  capacity: 100,
  refillRate: 10,
  refillInterval: 1000,
  storage,
});
```

## API Reference

### checkLimit(key: string, tokensRequired?: number): Promise<RateLimitResult>

Checks if a request is allowed and consumes tokens if applicable.

**Parameters:**

- `key`: Unique identifier for the rate limit bucket
- `tokensRequired`: Number of tokens to consume (default: 1)

**Returns:** RateLimitResult

- `allowed`: Whether the request is allowed
- `tokensRemaining`: Number of tokens remaining
- `retryAfter`: Time in milliseconds until the next token is available (if blocked)

### getTokenCount(key: string): Promise<number>

Get the current token count without consuming tokens.

### reset(key: string): Promise<void>

Reset the token bucket to capacity.

### destroy(): void

Cleanup resources and stop refill timers.

## Examples

See the [examples](./examples/) directory for more detailed usage examples:

- [basic-usage.ts](./examples/basic-usage.ts) - Basic rate limiting
- [advanced-usage.ts](./examples/advanced-usage.ts) - Multiple endpoints and dynamic consumption
- [redis-usage.ts](./examples/redis-usage.ts) - Distributed rate limiting with Redis

## Testing

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Development

```bash
npm run build
npm run build:watch
npm run lint
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
