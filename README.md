```markdown
# Token Bucket Rate Limiter

A lightweight, efficient, and customizable Token Bucket rate limiter for Express.js and Node.js applications.

## ✨ Features

- 🚀 **Token Bucket Algorithm** - Natural burst handling with configurable capacity
- 💾 **Flexible Storage** - Simple interface for Redis, In-Memory, or custom storage
- ⚡ **Minimal Setup** - Easier than express-rate-limit
- 🎯 **Per-Route Limits** - Different limits for different endpoints
- 🔧 **Fully Configurable** - Custom key generation, headers, and responses
- 📊 **Rate Limit Headers** - Built-in support for debugging
- 🧹 **Auto Cleanup** - Automatic removal of expired keys
- 💪 **TypeScript** - Full type safety out of the box

## 📦 Installation

```bash
npm install token-bucket-ratelimit
```

For Redis support (optional):
```bash
npm install token-bucket-ratelimit redis
```

## 🚀 Quick Start

### Basic Usage (In-Memory)

```typescript
import express from 'express';
import { createRateLimiter, InMemoryStorage } from 'token-bucket-ratelimit';

const app = express();
const storage = new InMemoryStorage();

// 100 requests per minute
const limiter = createRateLimiter({
  capacity: 100,
  refillRate: 100,
  refillInterval: 60000, // 60 seconds
  storage,
});

app.use(limiter);

app.get('/api/data', (req, res) => {
  res.json({ message: 'Success!' });
});

app.listen(3000);
```

### Redis Storage

```typescript
import { createClient } from 'redis';
import { createRateLimiter, RedisStorage } from 'token-bucket-ratelimit';

const redisClient = createClient();
await redisClient.connect();

const storage = new RedisStorage(redisClient);

const limiter = createRateLimiter({
  capacity: 100,
  refillRate: 100,
  refillInterval: 60000,
  storage,
});

app.use(limiter);
```

### Per-Route Limits

```typescript
import { TokenBucketRateLimiter, InMemoryStorage } from 'token-bucket-ratelimit';

const storage = new InMemoryStorage();
const limiter = new TokenBucketRateLimiter({
  capacity: 100,
  refillRate: 100,
  refillInterval: 60000,
  storage,
});

// Strict limit for login
app.post('/api/login', limiter.createRouteLimit({
  capacity: 5,
  refillRate: 5,
  refillInterval: 60000,
}), (req, res) => {
  // Login logic
});

// Generous limit for public API
app.get('/api/public', limiter.createRouteLimit({
  capacity: 1000,
  refillRate: 1000,
  refillInterval: 60000,
}), (req, res) => {
  // Public data
});
```

### Custom Key Generator (By User ID)

```typescript
const limiter = createRateLimiter({
  capacity: 50,
  refillRate: 50,
  refillInterval: 60000,
  storage,
  keyGenerator: (req) => {
    const userId = req.user?.id || req.ip;
    return `user:${userId}`;
  },
});
```

### Custom Response

```typescript
const limiter = createRateLimiter({
  capacity: 20,
  refillRate: 20,
  refillInterval: 60000,
  storage,
  onLimitReached: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: res.getHeader('X-RateLimit-Reset'),
    });
  },
});
```

## 📖 API Documentation

### `createRateLimiter(options)`

Factory function to create a rate limiter middleware.

#### Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `capacity` | `number` | ✅ | - | Maximum tokens in bucket |
| `refillRate` | `number` | ✅ | - | Tokens added per interval |
| `refillInterval` | `number` | ✅ | - | Refill interval in milliseconds |
| `storage` | `RateLimitStorage` | ✅ | - | Storage adapter |
| `keyGenerator` | `(req) => string` | ❌ | IP address | Custom key extraction |
| `onLimitReached` | `(req, res) => void` | ❌ | 429 response | Custom response handler |
| `includeHeaders` | `boolean` | ❌ | `true` | Include rate limit headers |
| `headers` | `object` | ❌ | Standard headers | Custom header names |
| `skip` | `(req) => boolean` | ❌ | - | Skip rate limiting condition |

### Storage Interface

Implement this interface for custom storage:

```typescript
interface RateLimitStorage {
  get(key: string): Promise;
  set(key: string, value: { tokens: number; lastRefill: number }): Promise;
  delete?(key: string): Promise;
}
```

### Built-in Storage Adapters

#### `InMemoryStorage`
```typescript
const storage = new InMemoryStorage(cleanupIntervalMs?: number);
```

#### `RedisStorage`
```typescript
const storage = new RedisStorage(redisClient, keyPrefix?: string);
```

## 🔧 Advanced Usage

See [examples](./examples) directory for more advanced use cases.

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📧 Support

For issues and questions: [GitHub Issues](https://github.com/yourusername/token-bucket-ratelimit/issues)
```

## 📄 src/index.ts (Main Entry Point)

```typescript
// Core
export { TokenBucketRateLimiter, createRateLimiter } from './TokenBucketRateLimiter';

// Types
export type { RateLimitStorage, RateLimitOptions } from './types';

// Storage adapters
export { InMemoryStorage } from './storage/InMemoryStorage';
export { RedisStorage } from './storage/RedisStorage';
```

## 🚀 Publishing Steps

1. **Setup project:**
```bash
npm init
npm install
```

2. **Build TypeScript:**
```bash
npm run build
```

3. **Test locally:**
```bash
npm link
# In another project:
npm link token-bucket-ratelimit
```

4. **Publish to NPM:**
```bash
npm login
npm publish
```

5. **Install in user projects:**
```bash
npm install token-bucket-ratelimit
```

## 📦 Usage After Publishing

Users can then use it like this:

```typescript
// CommonJS
const { createRateLimiter, InMemoryStorage } = require('token-bucket-ratelimit');

// ES6
import { createRateLimiter, InMemoryStorage } from 'token-bucket-ratelimit';

// With Redis
import { RedisStorage } from 'token-bucket-ratelimit';
```

## 🎯 Package Benefits

✅ **Easy to install**: `npm install token-bucket-ratelimit`  
✅ **TypeScript support**: Full type definitions included  
✅ **Tree-shakeable**: Import only what you need  
✅ **Zero dependencies**: Core package has no runtime dependencies  
✅ **Optional Redis**: Redis is an optional dependency  
✅ **Well documented**: Comprehensive README and examples  
✅ **Production ready**: Built, tested, and optimized  