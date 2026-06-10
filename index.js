/**
 * fixed-window using Redis.
 * value is not hardcoded, developer can configure it.
 *
 * can creates & passes their own client
 * rate limit max
 * window Ms size
 * keyGenerator
 * message
 * route handler
 * standardHeaders or legacyHeaders
 * passOnStoreError
 */
const express = require('express');
const Redis = require('ioredis');
const { createRateLimiter } = require('./rateLimiter');
const { createRedisStore } = require('./redisStore');

const app = express();
const port = process.env.PORT || 3000;

// Redis client.
// we can configure this with env vars.
// Link the client to the store, and the store to the limiter.
const redisClient = new Redis({
  port: process.env.REDIS_PORT || 6379,
  host: process.env.REDIS_HOST || 'localhost',
});
redisClient.on('connect', () => console.log('connected to redis'));


const limiter = createRateLimiter({
  windowMs: 10_000,
  max: 10,
  store: createRedisStore(redisClient),
  keyGenerator: (req) => req.ip,
  message: { error: 'Too many requests - try again later' },
  standardHeaders: true,
  onLimitReached: (req) => console.warn(`rate limit hit by ${req.ip}`),
});

app.get('/', (req, res) => res.send('Hello World!'));

// Apply the limiter to the route that needs protecting,  
// it's just middleware.
app.post('/', limiter, (req, res) => {
  res.send('Accessed precious resources!');
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
