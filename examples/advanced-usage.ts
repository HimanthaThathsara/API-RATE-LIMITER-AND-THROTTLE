import { TokenBucketRateLimiter, InMemoryStorage } from '../src';
import express from 'express';

const app = express();
const storage = new InMemoryStorage();

const limiter = new TokenBucketRateLimiter({
    capacity: 100,
    refillRate: 100,
    refillInterval: 60000,
    storage,
});

// Strict limit for login: 3 attempts per minute
app.post('/login', limiter.createRouteLimit({
    capacity: 3,
    refillRate: 3,
    refillInterval: 60000,
}), (req, res) => {
    res.json({ message: 'Login attempt successful' });
});

// Generous limit for public data
app.get('/data', limiter.createRouteLimit({
    capacity: 1000,
    refillRate: 1000,
    refillInterval: 60000,
}), (req, res) => {
    res.json({ data: 'Public information' });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Advanced usage example listening on port ${PORT}`);
});
