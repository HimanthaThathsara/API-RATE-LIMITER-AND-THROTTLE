import express from "express";
import {TokenBucketRateLimiter, InMemoryStorage} from "../src";

const app = express();
const storage = new InMemoryStorage();

const limiter = new TokenBucketRateLimiter({
  capacity: 100,
  refillRate: 100,
  refillInterval: 60000,
  storage,
});

// Strict limit for login: 5 requests per minute
app.post(
  "/api/login",
  limiter.createRouteLimit({
    capacity: 5,
    refillRate: 5,
    refillInterval: 60000,
  }),
  (req, res) => {
    res.json({message: "Login endpoint"});
  }
);

// User-based rate limiting
const userLimiter = new TokenBucketRateLimiter({
  capacity: 50,
  refillRate: 50,
  refillInterval: 60000,
  storage,
  keyGenerator: (req) => {
    // Extract user ID from JWT or session
    const userId = (req as any).user?.id || req.ip;
    return `user:${userId}`;
  },
});

app.use("/api/user", userLimiter.middleware);

// Custom response handler
const customLimiter = new TokenBucketRateLimiter({
  capacity: 20,
  refillRate: 20,
  refillInterval: 60000,
  storage,
  onLimitReached: (req, res) => {
    res.status(429).json({
      success: false,
      error: "RATE_LIMIT_EXCEEDED",
      message: "Slow down! You are making too many requests.",
      retryAfter: res.getHeader("X-RateLimit-Reset"),
    });
  },
});

app.use("/api/custom", customLimiter.middleware);

// Skip rate limiting for admins
const skipLimiter = new TokenBucketRateLimiter({
  capacity: 30,
  refillRate: 30,
  refillInterval: 60000,
  storage,
  skip: (req) => {
    return (req as any).user?.role === "admin";
  },
});

app.use("/api/protected", skipLimiter.middleware);

app.listen(3000, () => {
  console.log("Server with advanced rate limiting on http://localhost:3000");
});
