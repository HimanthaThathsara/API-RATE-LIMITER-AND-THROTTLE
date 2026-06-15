import express from "express";
import {createRateLimiter, InMemoryStorage} from "../src";

const app = express();
const storage = new InMemoryStorage();

// Global rate limiter: 100 requests per minute
const limiter = createRateLimiter({
  capacity: 100,
  refillRate: 100,
  refillInterval: 60000, // 60 seconds
  storage,
});

app.use(limiter);

app.get("/api/data", (req, res) => {
  res.json({message: "Success!", timestamp: Date.now()});
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
