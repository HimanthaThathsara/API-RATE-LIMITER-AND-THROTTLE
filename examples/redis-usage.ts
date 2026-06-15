import express from "express";
import {createClient} from "redis";
import {createRateLimiter, RedisStorage} from "../src";

async function startServer() {
  const app = express();

  // Connect to Redis
  const redisClient = createClient({
    url: "redis://localhost:6379",
  });

  await redisClient.connect();
  console.log("Connected to Redis");

  const storage = new RedisStorage(redisClient);

  // Rate limiter with Redis storage
  const limiter = createRateLimiter({
    capacity: 100,
    refillRate: 100,
    refillInterval: 60000,
    storage,
  });

  app.use(limiter);

  app.get("/api/data", (req, res) => {
    res.json({message: "Success with Redis!", timestamp: Date.now()});
  });

  app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });
}

startServer().catch(console.error);
