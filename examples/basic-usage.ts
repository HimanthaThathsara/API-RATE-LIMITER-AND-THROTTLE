import { createRateLimiter, InMemoryStorage } from '../src';
import express from 'express';

const app = express();
const storage = new InMemoryStorage();

// 10 requests per 10 seconds (1 per second average, with burst up to 10)
const limiter = createRateLimiter({
    capacity: 10,
    refillRate: 10,
    refillInterval: 10000,
    storage,
});

app.use(limiter);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Basic usage example listening on port ${PORT}`);
});
