/**
 * Configurable rate-limiting middleware factory.
 *
 * This is the "library" half of the package: it knows nothing about Redis, messages, or routes  every behavior is driven by `options`.
 * storage is delegated to a pluggable `store` redisStore.js.
 *
 */

// The main export: a factory function that takes options and returns middleware.
function createRateLimiter(options = {}) {
  const {
    windowMs = 60_000,
    max = 100,
    store,
    keyGenerator = (req) => req.ip,
    message = 'Too many requests, please try again later.',
    statusCode = 429,
    handler,
    standardHeaders = true,
    legacyHeaders = false,
    skip = () => false,
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
    requestWasSuccessful = (_req, res) => res.statusCode < 400,
    passOnStoreError = true,
    onLimitReached,
  } = options;

  if (!store) {
    throw new Error('createRateLimiter: a `store` is required redisStore.js)');
  }

  return async function rateLimiterMiddleware(req, res, next) {
    if (skip(req, res)) return next();

    const key = keyGenerator(req);

    let hit;
    try {
      hit = await store.increment(key, windowMs);
    } catch (err) {
      console.error('rate limiter: store error ', err.message);
      // passOnStoreError: fail-open (let the request through) vs fail-closed (block it).
      // Fail-open by default so a Redis hiccup doesn't take the whole API down.
      return passOnStoreError ? next() : res.status(503).send('Rate limiter unavailable');
    }

    const { totalHits, resetTime } = hit;
    const remaining = Math.max(max - totalHits, 0);
    const resetSeconds = Math.max(Math.ceil((resetTime - Date.now()) / 1000), 0);

    if (standardHeaders) {
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', remaining);
      res.setHeader('RateLimit-Reset', resetSeconds);
    }
    if (legacyHeaders) {
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
    }

    if (totalHits > max) {
      res.setHeader('Retry-After', resetSeconds);
      if (onLimitReached) onLimitReached(req, res, options);
      if (handler) return handler(req, res, next, options);

      const body = typeof message === 'function' ? message(req, res) : message;
      return res.status(statusCode).send(body);
    }

    if ((skipFailedRequests || skipSuccessfulRequests) && store.decrement) {
      res.on('finish', () => {
        const wasSuccessful = requestWasSuccessful(req, res);
        const shouldUndo =
          (skipFailedRequests && !wasSuccessful) || (skipSuccessfulRequests && wasSuccessful);
        if (shouldUndo) store.decrement(key);
      });
    }

    next();
  };
}

module.exports = { createRateLimiter };
